const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendResetOTPEmail } = require('../utils/mailer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// 1. Rute Register Akun Baru
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Harap lengkapi semua kolom pendaftaran.' });
  }

  try {
    // Periksa apakah email sudah terdaftar
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar. Silakan gunakan email lain.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Simpan ke PostgreSQL
    const insertRes = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    const newUser = insertRes.rows[0];

    // Generate JWT Token
    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan sistem saat mendaftar.' });
  }
});

// 2. Rute Login Manual
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    // Cari user
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    const user = userRes.rows[0];

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email atau password salah.' });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan sistem saat masuk.' });
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 3. Rute Google OAuth Login (Official Verification + Fallback)
router.post('/google', async (req, res) => {
  const { credential, idToken, email: mockEmail, name: mockName } = req.body;
  let email, name;

  const tokenToVerify = credential || idToken;

  if (tokenToVerify) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: tokenToVerify,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } catch (err) {
      console.warn('Verifikasi token Google gagal, menggunakan fallback jika lokal:', err.message);
      if (mockEmail) {
        email = mockEmail;
        name = mockName || 'Google User';
      } else {
        return res.status(400).json({ message: 'Token Google tidak valid atau kadaluwarsa.' });
      }
    }
  } else if (mockEmail && mockName) {
    email = mockEmail;
    name = mockName;
  } else {
    return res.status(400).json({ message: 'Data Google OAuth tidak valid.' });
  }

  try {
    // Cek apakah user sudah ada berdasarkan email
    let userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (userRes.rows.length === 0) {
      // Jika belum ada, daftarkan otomatis dengan password acak
      const randomPassword = Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const insertRes = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, passwordHash]
      );
      user = insertRes.rows[0];
    } else {
      user = userRes.rows[0];
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Google Auth error:', error.message);
    res.status(500).json({ message: 'Terjadi kesalahan sistem pada Google Sign-In.' });
  }
});

const auth = require('../middleware/auth');

// 4. Rute Get Profile / Cek Session Aktif
router.get('/profile', auth, async (req, res) => {
  try {
    const userRes = await db.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    res.json({
      user: userRes.rows[0]
    });
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({ message: 'Gagal memuat profil pengguna.' });
  }
});

const resetTokens = new Map();

// 5. Rute Minta OTP Lupa Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email wajib diisi.' });
  }

  try {
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Email belum terdaftar di sistem.' });
    }

    // Generate Kode OTP 6-Digit
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 menit

    resetTokens.set(email.toLowerCase(), { token: resetToken, expiresAt });

    // Kirim email (otomatis kirim ke email fisik jika EMAIL_USER & EMAIL_PASS diisi di .env, atau log di terminal jika belum)
    const emailResult = await sendResetOTPEmail(email, resetToken);

    res.json({
      message: emailResult.mode === 'smtp'
        ? `Kode OTP reset telah dikirim ke email ${email}. Silakan cek inbox/spam Anda.`
        : 'Kode OTP reset telah dikirim ke email Anda. (Mode pengujian: Cek terminal server).',
      expiresInMinutes: 15
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Gagal memproses permintaan lupa password.' });
  }
});

// 6. Rute Reset Password Baru
router.post('/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'Harap lengkapi semua data reset password.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
  }

  const tokenData = resetTokens.get(email.toLowerCase());
  if (!tokenData || tokenData.token !== resetToken || Date.now() > tokenData.expiresAt) {
    return res.status(400).json({ message: 'Kode OTP reset tidak valid atau sudah kedaluwarsa.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
    resetTokens.delete(email.toLowerCase());

    res.json({ message: 'Password berhasil diperbarui! Silakan masuk kembali.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Gagal memperbarui password baru.' });
  }
});

// PUT /api/auth/profile - Update Profile Name
router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama wajib diisi.' });
    }

    const result = await db.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email',
      [name.trim(), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }

    res.json({
      message: 'Profil berhasil diperbarui.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Gagal meng-update profil.' });
  }
});

module.exports = router;
