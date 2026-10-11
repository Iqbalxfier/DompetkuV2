const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const syncRoutes = require('./src/routes/sync');
const aiRoutes = require('./src/routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/ai', aiRoutes);

// Root Landing Route
app.get('/', (req, res) => {
  res.json({
    name: 'Dompetku V2 API Server',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      auth: '/api/auth',
      sync: '/api/sync',
      ai: '/api/ai',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dompetku V2 backend server berjalan dengan baik.' });
});

// Handling 404 Route
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint API tidak ditemukan.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server backend.' });
});

// Menyalakan server
app.listen(PORT, () => {
  console.log(`🚀 Server Backend berjalan di http://localhost:${PORT}`);
});
