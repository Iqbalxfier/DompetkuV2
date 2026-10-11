const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/sync - Endpoint Sinkronisasi Dua Arah Offline-First
router.post('/', auth, async (req, res) => {
  const userId = req.user.id;
  const { wallets, categories, budgets, transactions, lastSyncTime } = req.body;

  const responseData = {
    wallets: [],
    categories: [],
    budgets: [],
    transactions: [],
    serverTime: new Date().toISOString()
  };

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. SINKRONISASI CATEGORIES (Kategori Kustom buatan User)
    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        let result;
        if (cat.server_id) {
          // Update data jika sudah ada server_id
          result = await client.query(
            `UPDATE categories 
             SET name = $1, type = $2, icon = $3, color = $4, updated_at = NOW() 
             WHERE id = $5 AND (user_id = $6 OR is_default = TRUE) RETURNING id`,
            [cat.name, cat.type, cat.icon, cat.color, cat.server_id, userId]
          );
        } else {
          // Insert data baru jika belum ada server_id
          result = await client.query(
            `INSERT INTO categories (user_id, name, type, icon, color, is_default) 
             VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING id`,
            [userId, cat.name, cat.type, cat.icon, cat.color]
          );
        }
        if (result.rows.length > 0) {
          responseData.categories.push({ localId: cat.id, serverId: result.rows[0].id });
        }
      }
    }

    // 2. SINKRONISASI WALLETS
    if (wallets && Array.isArray(wallets)) {
      for (const w of wallets) {
        let result;
        if (w.server_id) {
          result = await client.query(
            `UPDATE wallets 
             SET name = $1, type = $2, balance = $3, color = $4, icon = $5, updated_at = NOW() 
             WHERE id = $6 AND user_id = $7 RETURNING id`,
            [w.name, w.type, w.balance, w.color, w.icon, w.server_id, userId]
          );
        } else {
          result = await client.query(
            `INSERT INTO wallets (user_id, name, type, balance, color, icon) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [userId, w.name, w.type, w.balance, w.color, w.icon]
          );
        }
        if (result.rows.length > 0) {
          responseData.wallets.push({ localId: w.id, serverId: result.rows[0].id });
        }
      }
    }

    // Ambil daftar lengkap categories & wallets dari DB server untuk mapping transaksi di bawah
    const serverCats = await client.query("SELECT id, name FROM categories WHERE user_id = $1 OR is_default = TRUE", [userId]);
    const serverWallets = await client.query("SELECT id, name FROM wallets WHERE user_id = $1", [userId]);

    // Helper untuk mencari server_id kategori & dompet dari localId/nama
    const getCatServerId = (localCat) => {
      if (!localCat) return null;
      // Cari jika kategori default
      if (localCat.is_default) {
        const found = serverCats.rows.find(c => c.name === localCat.name);
        return found ? found.id : null;
      }
      // Jika kategori kustom baru disinkronkan, cari di responseData
      const mapped = responseData.categories.find(item => item.localId === localCat.id);
      if (mapped) return mapped.serverId;
      return localCat.server_id || null;
    };

    const getWalletServerId = (localW) => {
      if (!localW) return null;
      const mapped = responseData.wallets.find(item => item.localId === localW.id);
      if (mapped) return mapped.serverId;
      return localW.server_id || null;
    };

    // 3. SINKRONISASI BUDGETS
    if (budgets && Array.isArray(budgets)) {
      for (const b of budgets) {
        const catServerId = getCatServerId(b.cat);
        if (!catServerId) continue;

        let result;
        if (b.server_id) {
          result = await client.query(
            `UPDATE budgets 
             SET category_id = $1, limit_amount = $2, month = $3, year = $4, updated_at = NOW() 
             WHERE id = $5 AND user_id = $6 RETURNING id`,
            [catServerId, b.limit_amount, b.month, b.year, b.server_id, userId]
          );
        } else {
          result = await client.query(
            `INSERT INTO budgets (user_id, category_id, limit_amount, month, year) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [userId, catServerId, b.limit_amount, b.month, b.year]
          );
        }
        if (result.rows.length > 0) {
          responseData.budgets.push({ localId: b.id, serverId: result.rows[0].id });
        }
      }
    }

    // 4. SINKRONISASI TRANSACTIONS
    if (transactions && Array.isArray(transactions)) {
      for (const tx of transactions) {
        const walletServerId = getWalletServerId(tx.wallet);
        const catServerId = getCatServerId(tx.category);

        let result;
        if (tx.server_id) {
          result = await client.query(
            `UPDATE transactions 
             SET wallet_id = $1, category_id = $2, type = $3, amount = $4, date = $5, note = $6, updated_at = NOW() 
             WHERE id = $7 AND user_id = $8 RETURNING id`,
            [walletServerId, catServerId, tx.type, tx.amount, tx.date, tx.note, tx.server_id, userId]
          );
        } else {
          result = await client.query(
            `INSERT INTO transactions (user_id, wallet_id, category_id, type, amount, date, note) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [userId, walletServerId, catServerId, tx.type, tx.amount, tx.date, tx.note]
          );
        }
        if (result.rows.length > 0) {
          responseData.transactions.push({ localId: tx.id, serverId: result.rows[0].id });
        }
      }
    }

    // 5. PULL DATA TERBARU DARI SERVER
    // Jika lastSyncTime ada, ambil hanya yang diperbarui sejak itu
    // Jika tidak ada (login pertama / setelah logout), ambil SEMUA data
    const now = new Date().toISOString();

    let walletRows, categoryRows, budgetRows, transactionRows;

    if (lastSyncTime) {
      walletRows = await client.query(
        `SELECT id as server_id, name, type, balance, color, icon FROM wallets WHERE user_id = $1 AND updated_at > $2`,
        [userId, lastSyncTime]
      );
      categoryRows = await client.query(
        `SELECT id as server_id, name, type, icon, color, is_default FROM categories WHERE (user_id = $1 OR is_default = TRUE) AND updated_at > $2`,
        [userId, lastSyncTime]
      );
      budgetRows = await client.query(
        `SELECT id as server_id, category_id, limit_amount, month, year FROM budgets WHERE user_id = $1 AND updated_at > $2`,
        [userId, lastSyncTime]
      );
      transactionRows = await client.query(
        `SELECT id as server_id, wallet_id, category_id, type, amount, date, note FROM transactions WHERE user_id = $1 AND updated_at > $2`,
        [userId, lastSyncTime]
      );
    } else {
      // Ambil SEMUA data (login pertama / setelah logout)
      walletRows = await client.query(
        `SELECT id as server_id, name, type, balance, color, icon FROM wallets WHERE user_id = $1`,
        [userId]
      );
      categoryRows = await client.query(
        `SELECT id as server_id, name, type, icon, color, is_default FROM categories WHERE user_id = $1 OR is_default = TRUE`,
        [userId]
      );
      budgetRows = await client.query(
        `SELECT id as server_id, category_id, limit_amount, month, year FROM budgets WHERE user_id = $1`,
        [userId]
      );
      transactionRows = await client.query(
        `SELECT id as server_id, wallet_id, category_id, type, amount, date, note FROM transactions WHERE user_id = $1`,
        [userId]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      syncMetadata: responseData,
      serverTime: now,
      serverData: {
        wallets: walletRows.rows,
        categories: categoryRows.rows,
        budgets: budgetRows.rows,
        transactions: transactionRows.rows,
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Sync error:', error.message);
    res.status(500).json({ message: 'Gagal melakukan sinkronisasi data dengan server cloud.' });
  } finally {
    client.release();
  }
});

module.exports = router;
