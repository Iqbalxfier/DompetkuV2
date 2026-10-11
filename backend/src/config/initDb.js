const { pool } = require('./db');

const createTablesSql = `
  -- 1. Tabel Users
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. Tabel Categories
  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'both')),
    icon VARCHAR(50) DEFAULT 'Tag',
    color VARCHAR(20) DEFAULT '#6366f1',
    is_default BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 3. Tabel Wallets
  CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    color VARCHAR(20) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. Tabel Transactions
  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id INTEGER REFERENCES wallets(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. Tabel Budgets
  CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    limit_amount NUMERIC(15, 2) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const seedCategoriesSql = `
  INSERT INTO categories (name, type, icon, color, is_default)
  VALUES 
    ('Makanan & Minuman', 'expense', 'UtensilsCrossed', '#ef4444', true),
    ('Transportasi', 'expense', 'Car', '#3b82f6', true),
    ('Belanja', 'expense', 'ShoppingBag', '#ec4899', true),
    ('Hiburan', 'expense', 'Gamepad', '#8b5cf6', true),
    ('Gaji', 'income', 'Briefcase', '#10b981', true),
    ('Investasi', 'income', 'TrendingUp', '#06b6d4', true),
    ('Lain-lain', 'both', 'Box', '#6b7280', true)
  ON CONFLICT DO NOTHING;
`;

async function initDb() {
  console.log('⚡ Memulai inisialisasi skema database PostgreSQL...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Buat tabel-tabel
    await client.query(createTablesSql);
    console.log('✅ Skema tabel berhasil dibuat / divalidasi.');

    // Cek apakah kategori default sudah ada
    const countRes = await client.query("SELECT COUNT(*) FROM categories WHERE is_default = true");
    if (parseInt(countRes.rows[0].count) === 0) {
      await client.query(seedCategoriesSql);
      console.log('✅ Seeding kategori bawaan sukses.');
    } else {
      console.log('ℹ️ Kategori bawaan sudah ada, melewati seeding.');
    }

    await client.query('COMMIT');
    console.log('🎉 Inisialisasi database selesai dengan sukses!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Gagal menginisialisasi database:', error.message);
  } finally {
    client.release();
    process.exit();
  }
}

initDb();
