import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Wallet, KeyRound, CheckCircle, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, forgotPassword, resetPassword, user, isLoading } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State Modal Lupa Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  // Jika sudah login, langsung arahkan ke dashboard
  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan sistem, silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      const email = form.email || 'iqbal.firdaus@gmail.com';
      const name = form.name || 'Iqbal Firdaus';
      await loginWithGoogle(name, email);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Gagal login via Google.');
    } finally {
      setLoading(false);
    }
  }

  function openForgotModal() {
    setForgotStep(1);
    setForgotEmail(form.email || '');
    setResetTokenInput('');
    setNewPassword('');
    setForgotMsg('');
    setForgotErr('');
    setGeneratedToken('');
    setShowForgotModal(true);
  }

  async function handleRequestOTP(e) {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');
    setLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setResetTokenInput('');
      setForgotMsg(res.message || 'Kode OTP telah dikirim. Silakan cek terminal server / email.');
      setForgotStep(2);
    } catch (err) {
      setForgotErr(err.message || 'Gagal memproses email.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset(e) {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');
    setLoading(true);
    try {
      const res = await resetPassword(forgotEmail, resetTokenInput, newPassword);
      setForgotMsg(res.message);
      setTimeout(() => {
        setShowForgotModal(false);
        setForm(p => ({ ...p, email: forgotEmail }));
        setIsLogin(true);
      }, 1500);
    } catch (err) {
      setForgotErr(err.message || 'Gagal memperbarui password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: -200, left: -200, width: 500, height: 500, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -200, width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.10)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1, animation: 'fadeInUp 0.5s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 12px 40px rgba(99,102,241,0.4)',
          }}><Wallet size={32} color="white" /></div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dompetku</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Kelola keuangan kost jadi lebih mudah</p>
        </div>

        <div className="glass-card" style={{ padding: 28 }}>
          {/* Tab */}
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {['Masuk', 'Daftar'].map((t, i) => (
              <button key={t} type="button" onClick={() => setIsLogin(i === 0)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  background: (isLogin && i === 0) || (!isLogin && i === 1) ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: (isLogin && i === 0) || (!isLogin && i === 1) ? 'white' : 'var(--color-text-muted)',
                  transition: 'all 0.2s',
                }}>
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!isLogin && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Nama Lengkap</label>
                <input className="input-field" placeholder="Username" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required={!isLogin} />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="input-field" style={{ paddingLeft: 42 }} type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Password</label>
                {isLogin && (
                  <button type="button" onClick={openForgotModal} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Lupa Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="input-field" style={{ paddingLeft: 42, paddingRight: 42 }} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex',
                }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, fontSize: 13, color: '#f43f5e', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Buat Akun'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>atau</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <button onClick={handleGoogleLogin} className="btn btn-secondary" style={{ width: '100%', gap: 10 }} disabled={loading}>
            <div style={{ width: 20, height: 20, background: 'white', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#333', fontWeight: 'bold' }}>G</div>
            Masuk dengan Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 18 }}>
            {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button onClick={() => setIsLogin(p => !p)} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
            </button>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 16 }}>
          🔒 Data kamu tersimpan aman & terenkripsi
        </p>
      </div>

      {/* Modal Lupa Password */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-content" style={{ padding: 24, maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={18} color="#6366f1" /> Lupa Password
              </h3>
              <button onClick={() => setShowForgotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {forgotErr && (
              <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, fontSize: 12, color: '#f43f5e', marginBottom: 14 }}>
                {forgotErr}
              </div>
            )}

            {forgotMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, fontSize: 12, color: '#10b981', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} /> {forgotMsg}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  Masukkan email akun Anda yang terdaftar untuk menerima Kode OTP Reset Password.
                </p>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Email Terdaftar</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: 42 }} type="email" placeholder="email@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForgotModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Kirim...' : 'Minta OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Kode OTP Reset (6-Digit)</label>
                  <input className="input-field" placeholder="123456" value={resetTokenInput} onChange={e => setResetTokenInput(e.target.value)} required />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Password Baru</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: 42 }} type="password" placeholder="Minimal 6 karakter" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setForgotStep(1)}>Kembali</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Simpan...' : 'Simpan Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
