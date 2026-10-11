const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
  // Ambil token dari header Authorization
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak disediakan.' });
  }

  // Format: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Format token tidak valid. Harus menggunakan skema Bearer.' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Pasang user ID terverifikasi ke object request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token tidak valid atau telah kadaluarsa.' });
  }
};
