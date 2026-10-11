import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/db';
import api from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('dompetku-theme') || 'dark');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [debts, setDebts] = useState([]);
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Theme management
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('dompetku-theme', theme);
  }, [theme]);

  // Load session & initial data
  useEffect(() => {
    async function initSession() {
      setIsLoading(true);
      const token = localStorage.getItem('dompetku_token');
      
      if (token) {
        try {
          // Dapatkan detail profile / verifikasi token JWT
          const profile = await api.get('/auth/profile');
          setUser(profile.user);
          await refreshAll(profile.user.id);
          // Jalankan sinkronisasi background jika online
          if (navigator.onLine) {
            syncDataWithServer(profile.user.id);
          }
        } catch (err) {
          // Token kedaluwarsa atau server offline, load data lokal jika data user tersimpan
          console.warn('Gagal memuat profile dari server. Menggunakan offline session.');
          const localUser = JSON.parse(localStorage.getItem('dompetku_user'));
          if (localUser) {
            setUser(localUser);
            await refreshAll(localUser.id);
          }
        }
      } else {
        // Tidak ada token — arahkan ke login (AppLayout akan redirect)
        // Tidak perlu load data apapun
      }
      setIsLoading(false);
    }
    initSession();
  }, []);

  // Trigger auto sync when back online
  useEffect(() => {
    if (isOnline && user) {
      syncDataWithServer(user.id);
    }
  }, [isOnline, user]);

  async function refreshAll(userId = user?.id || 1) {
    const [w, c, t, bu, de, bi] = await Promise.all([
      db.wallets.where('user_id').equals(userId).toArray(),
      db.categories.toArray(),
      db.transactions.where('user_id').equals(userId).reverse().sortBy('date'),
      db.budgets.where('user_id').equals(userId).toArray(),
      db.debts.where('user_id').equals(userId).toArray(),
      db.bills.where('user_id').equals(userId).toArray(),
    ]);
    setWallets(w);
    setCategories(c);
    setTransactions(t);
    setBudgets(bu);
    setDebts(de);
    setBills(bi);
  }

  // 1. REGISTER
  async function register(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('dompetku_token', data.token);
    localStorage.setItem('dompetku_user', JSON.stringify(data.user));
    setUser(data.user);

    // Bersihkan data demo lokal
    await Promise.all([
      db.transactions.clear(),
      db.wallets.clear(),
      db.budgets.clear(),
      db.categories.clear(),
      db.debts.clear(),
      db.bills.clear()
    ]);

    await refreshAll(data.user.id);
    return data.user;
  }

  // 2. LOGIN
  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('dompetku_token', data.token);
    localStorage.setItem('dompetku_user', JSON.stringify(data.user));
    setUser(data.user);

    // Bersihkan data demo
    await Promise.all([
      db.transactions.clear(),
      db.wallets.clear(),
      db.budgets.clear(),
      db.categories.clear(),
      db.debts.clear(),
      db.bills.clear()
    ]);

    // Jalankan sinkronisasi awal
    await syncDataWithServer(data.user.id);
    return data.user;
  }

  // 3. GOOGLE SIGN-IN
  async function loginWithGoogle(name, email) {
    const data = await api.post('/auth/google', { name, email });
    localStorage.setItem('dompetku_token', data.token);
    localStorage.setItem('dompetku_user', JSON.stringify(data.user));
    setUser(data.user);

    await Promise.all([
      db.transactions.clear(),
      db.wallets.clear(),
      db.budgets.clear(),
      db.categories.clear(),
      db.debts.clear(),
      db.bills.clear()
    ]);

    await syncDataWithServer(data.user.id);
    return data.user;
  }

  // 4. LOGOUT (Pendekatan A)
  async function logout() {
    await Promise.all([
      db.transactions.clear(),
      db.wallets.clear(),
      db.budgets.clear(),
      db.categories.clear(),
      db.debts.clear(),
      db.bills.clear()
    ]);
    localStorage.removeItem('dompetku_token');
    localStorage.removeItem('dompetku_user');
    localStorage.removeItem(`last_sync_${user?.id}`);
    setUser(null);
    // AppLayout akan otomatis redirect ke /login karena user = null
  }

  // 5. UPDATE PROFILE
  async function updateProfile({ name }) {
    if (!user || !name) return;
    const updatedUser = { ...user, name: name.trim() };
    setUser(updatedUser);
    localStorage.setItem('dompetku_user', JSON.stringify(updatedUser));

    if (navigator.onLine) {
      await api.put('/auth/profile', { name: name.trim() }).catch(() => {});
    }
  }

  // SINKRONISASI DUA ARAH OFFLINE-FIRST
  async function syncDataWithServer(userId = user?.id) {
    if (!userId || !navigator.onLine) return;

    try {
      // Ambil data pending dengan filter yang benar (Dexie tidak support multi-field where object)
      const pendingTx = await db.transactions
        .where('user_id').equals(userId)
        .filter(t => t.sync_status === 'pending_sync')
        .toArray();
      const pendingWallets = await db.wallets
        .where('user_id').equals(userId)
        .filter(w => w.sync_status === 'pending_sync')
        .toArray();
      const pendingBudgets = await db.budgets
        .where('user_id').equals(userId)
        .filter(b => b.sync_status === 'pending_sync')
        .toArray();
      const pendingCategories = await db.categories
        .filter(c => c.sync_status === 'pending_sync')
        .toArray();

      const catSyncPayload = pendingCategories.map(c => ({
        id: c.id, server_id: c.server_id, name: c.name,
        type: c.type, icon: c.icon, color: c.color
      }));

      const walletSyncPayload = pendingWallets.map(w => ({
        id: w.id, server_id: w.server_id, name: w.name,
        type: w.type, balance: w.balance, color: w.color, icon: w.icon
      }));

      const budgetSyncPayload = [];
      for (const b of pendingBudgets) {
        const cat = await db.categories.get(b.category_id);
        budgetSyncPayload.push({
          id: b.id, server_id: b.server_id,
          limit_amount: b.limit_amount, month: b.month, year: b.year,
          cat: cat ? { id: cat.id, server_id: cat.server_id, name: cat.name, is_default: cat.is_default } : null
        });
      }

      const txSyncPayload = [];
      for (const t of pendingTx) {
        const cat = await db.categories.get(t.category_id);
        const wallet = await db.wallets.get(t.wallet_id);
        txSyncPayload.push({
          id: t.id, server_id: t.server_id,
          type: t.type, amount: t.amount, date: t.date, note: t.note,
          category: cat ? { id: cat.id, server_id: cat.server_id, name: cat.name, is_default: cat.is_default } : null,
          wallet: wallet ? { id: wallet.id, server_id: wallet.server_id, name: wallet.name } : null
        });
      }

      const lastSync = localStorage.getItem(`last_sync_${userId}`);

      const response = await api.post('/sync', {
        wallets: walletSyncPayload,
        categories: catSyncPayload,
        budgets: budgetSyncPayload,
        transactions: txSyncPayload,
        lastSyncTime: lastSync
      });

      const { syncMetadata, serverData, serverTime } = response;

      // 1. Update server_id & status di IndexedDB lokal
      if (syncMetadata) {
        for (const item of syncMetadata.categories) {
          await db.categories.update(item.localId, { server_id: item.serverId, sync_status: 'synced' });
        }
        for (const item of syncMetadata.wallets) {
          await db.wallets.update(item.localId, { server_id: item.serverId, sync_status: 'synced' });
        }
        for (const item of syncMetadata.budgets) {
          await db.budgets.update(item.localId, { server_id: item.serverId, sync_status: 'synced' });
        }
        for (const item of syncMetadata.transactions) {
          await db.transactions.update(item.localId, { server_id: item.serverId, sync_status: 'synced' });
        }
      }

      // 2. Merge data dari server ke IndexedDB lokal
      if (serverData) {
        for (const sc of serverData.categories) {
          // Cari berdasarkan server_id dengan filter
          const existing = await db.categories.filter(c => c.server_id === sc.server_id).first();
          if (existing) {
            if (existing.sync_status !== 'pending_sync') {
              await db.categories.update(existing.id, { name: sc.name, type: sc.type, icon: sc.icon, color: sc.color, is_default: sc.is_default });
            }
          } else {
            await db.categories.add({ user_id: sc.is_default ? 1 : userId, server_id: sc.server_id, name: sc.name, type: sc.type, icon: sc.icon, color: sc.color, is_default: sc.is_default, sync_status: 'synced' });
          }
        }

        for (const sw of serverData.wallets) {
          const existing = await db.wallets.filter(w => w.server_id === sw.server_id).first();
          if (existing) {
            await db.wallets.update(existing.id, { name: sw.name, type: sw.type, balance: parseFloat(sw.balance), color: sw.color, icon: sw.icon });
          } else {
            await db.wallets.add({ user_id: userId, server_id: sw.server_id, name: sw.name, type: sw.type, balance: parseFloat(sw.balance), color: sw.color, icon: sw.icon, sync_status: 'synced', created_at: new Date() });
          }
        }

        for (const sb of serverData.budgets) {
          const existing = await db.budgets.filter(b => b.server_id === sb.server_id).first();
          const cat = await db.categories.filter(c => c.server_id === sb.category_id).first();
          if (cat) {
            if (existing) {
              await db.budgets.update(existing.id, { category_id: cat.id, limit_amount: parseFloat(sb.limit_amount), month: sb.month, year: sb.year });
            } else {
              await db.budgets.add({ user_id: userId, server_id: sb.server_id, category_id: cat.id, limit_amount: parseFloat(sb.limit_amount), month: sb.month, year: sb.year, sync_status: 'synced' });
            }
          }
        }

        for (const stx of serverData.transactions) {
          const existing = await db.transactions.filter(t => t.server_id === stx.server_id).first();
          const cat = await db.categories.filter(c => c.server_id === stx.category_id).first();
          const wallet = await db.wallets.filter(w => w.server_id === stx.wallet_id).first();

          if (wallet && cat) {
            if (existing) {
              await db.transactions.update(existing.id, { wallet_id: wallet.id, category_id: cat.id, type: stx.type, amount: parseFloat(stx.amount), date: stx.date, note: stx.note });
            } else {
              await db.transactions.add({ user_id: userId, server_id: stx.server_id, wallet_id: wallet.id, category_id: cat.id, type: stx.type, amount: parseFloat(stx.amount), date: stx.date, note: stx.note, sync_status: 'synced', created_at: new Date() });
            }
          }
        }
      }

      localStorage.setItem(`last_sync_${userId}`, serverTime);
      await refreshAll(userId);
    } catch (err) {
      console.warn('Sync failed:', err.message);
    }
  }



  // TRANSAKSI
  async function addTransaction(data) {
    const currentUserId = user?.id || 1;
    const id = await db.transactions.add({
      ...data,
      user_id: currentUserId,
      sync_status: 'pending_sync',
      created_at: new Date(),
    });
    
    const wallet = await db.wallets.get(data.wallet_id);
    if (wallet) {
      const newBalance = data.type === 'income'
        ? wallet.balance + data.amount
        : wallet.balance - data.amount;
      await db.wallets.update(data.wallet_id, { balance: newBalance, sync_status: 'pending_sync' });
    }
    await refreshAll(currentUserId);
    if (navigator.onLine && user) syncDataWithServer(currentUserId);
    return id;
  }

  async function deleteTransaction(id) {
    const currentUserId = user?.id || 1;
    const tx = await db.transactions.get(id);
    if (tx) {
      const wallet = await db.wallets.get(tx.wallet_id);
      if (wallet) {
        const newBalance = tx.type === 'income'
          ? wallet.balance - tx.amount
          : wallet.balance + tx.amount;
        await db.wallets.update(tx.wallet_id, { balance: newBalance, sync_status: 'pending_sync' });
      }
      
      if (tx.server_id) {
        // Jika sudah ada di server, tandai hapus di sync mendatang atau panggil delete API
        await api.delete(`/sync/transactions/${tx.server_id}`).catch(() => {});
      }
      await db.transactions.delete(id);
    }
    await refreshAll(currentUserId);
  }

  async function updateTransaction(id, data) {
    const currentUserId = user?.id || 1;
    const oldTx = await db.transactions.get(id);
    if (!oldTx) return;

    // 1. Revert saldo transaksi lama
    const oldWallet = await db.wallets.get(oldTx.wallet_id);
    if (oldWallet) {
      const revertedBalance = oldTx.type === 'income'
        ? oldWallet.balance - oldTx.amount
        : oldWallet.balance + oldTx.amount;
      await db.wallets.update(oldTx.wallet_id, { balance: revertedBalance, sync_status: 'pending_sync' });
    }

    // 2. Terapkan saldo transaksi baru
    const targetWalletId = Number(data.wallet_id);
    const newWallet = await db.wallets.get(targetWalletId);
    if (newWallet) {
      const baseBalance = (targetWalletId === oldTx.wallet_id && oldWallet)
        ? (oldTx.type === 'income' ? oldWallet.balance - oldTx.amount : oldWallet.balance + oldTx.amount)
        : newWallet.balance;

      const updatedBalance = data.type === 'income'
        ? baseBalance + Number(data.amount)
        : baseBalance - Number(data.amount);

      await db.wallets.update(targetWalletId, { balance: updatedBalance, sync_status: 'pending_sync' });
    }

    // 3. Update record transaksi
    await db.transactions.update(id, {
      ...data,
      wallet_id: targetWalletId,
      category_id: Number(data.category_id),
      amount: Number(data.amount),
      sync_status: 'pending_sync'
    });

    await refreshAll(currentUserId);
    if (navigator.onLine && user) syncDataWithServer(currentUserId);
  }

  // WALLETS
  async function addWallet(data) {
    const currentUserId = user?.id || 1;
    await db.wallets.add({ 
      ...data, 
      user_id: currentUserId, 
      sync_status: 'pending_sync', 
      created_at: new Date() 
    });
    await refreshAll(currentUserId);
    if (navigator.onLine && user) syncDataWithServer(currentUserId);
  }

  async function updateWallet(id, data) {
    const currentUserId = user?.id || 1;
    await db.wallets.update(id, { ...data, sync_status: 'pending_sync' });
    await refreshAll(currentUserId);
    if (navigator.onLine && user) syncDataWithServer(currentUserId);
  }

  async function deleteWallet(id) {
    const currentUserId = user?.id || 1;
    const wallet = await db.wallets.get(id);
    if (wallet?.server_id) {
      await api.delete(`/sync/wallets/${wallet.server_id}`).catch(() => {});
    }
    await db.wallets.delete(id);
    await refreshAll(currentUserId);
  }

  // TRANSFER BALANCES
  async function transferBalance(fromWalletId, toWalletId, amount, note = '', date = new Date().toISOString().split('T')[0]) {
    const currentUserId = user?.id || 1;
    const fromW = await db.wallets.get(fromWalletId);
    const toW = await db.wallets.get(toWalletId);
    if (!fromW || !toW || amount <= 0) return;

    // Cari atau gunakan kategori 'Lainnya' atau buat kategori khusus
    let cat = await db.categories.where('name').equals('Lainnya').first();
    const catId = cat ? cat.id : 1;

    // Kurangi saldo dompet asal
    await db.wallets.update(fromWalletId, { balance: fromW.balance - amount, sync_status: 'pending_sync' });
    // Tambah saldo dompet tujuan
    await db.wallets.update(toWalletId, { balance: toW.balance + amount, sync_status: 'pending_sync' });

    // Tambah catatan transaksi
    const noteText = note ? ` (${note})` : '';
    await db.transactions.add({
      user_id: currentUserId,
      wallet_id: fromWalletId,
      category_id: catId,
      type: 'expense',
      amount,
      date,
      note: `Transfer ke ${toW.name}${noteText}`,
      sync_status: 'pending_sync',
      created_at: new Date()
    });

    await db.transactions.add({
      user_id: currentUserId,
      wallet_id: toWalletId,
      category_id: catId,
      type: 'income',
      amount,
      date,
      note: `Transfer dari ${fromW.name}${noteText}`,
      sync_status: 'pending_sync',
      created_at: new Date()
    });

    await refreshAll(currentUserId);
    if (navigator.onLine && user) syncDataWithServer(currentUserId);
  }

  // CATEGORY
  async function addCategory(data) {
    const currentUserId = user?.id || 1;
    await db.categories.add({ 
      ...data, 
      user_id: currentUserId,
      sync_status: 'pending_sync'
    });
    await refreshAll(currentUserId);
    if (navigator.onLine && user) syncDataWithServer(currentUserId);
  }

  async function updateCategory(id, data) {
    const currentUserId = user?.id || 1;
    await db.categories.update(id, { ...data, sync_status: 'pending_sync' });
    await refreshAll(currentUserId);
    if (navigator.onLine && user) syncDataWithServer(currentUserId);
  }

  async function deleteCategory(id) {
    const currentUserId = user?.id || 1;
    const cat = await db.categories.get(id);
    if (!cat) return;
    if (cat.name === 'Lainnya') return; // Lindungi kategori cadangan utama

    // Cari kategori cadangan 'Lainnya' atau kategori pertama lain yang tersisa
    let fallbackCat = await db.categories.where('name').equals('Lainnya').first();
    if (!fallbackCat) {
      fallbackCat = await db.categories.filter(c => c.id !== id).first();
    }

    if (fallbackCat) {
      // Alihkan semua transaksi yang menggunakan kategori ini ke kategori cadangan
      const affectedTx = await db.transactions.where('category_id').equals(id).toArray();
      for (const t of affectedTx) {
        await db.transactions.update(t.id, { category_id: fallbackCat.id, sync_status: 'pending_sync' });
      }
    }

    if (cat.server_id) {
      await api.delete(`/sync/categories/${cat.server_id}`).catch(() => {});
    }
    await db.categories.delete(id);
    await refreshAll(currentUserId);
  }

  // BUDGET
  async function addBudget(data) {
    const currentUserId = user?.id || 1;
    const existing = await db.budgets
      .where({ user_id: currentUserId, category_id: data.category_id, month: data.month, year: data.year })
      .first();
    if (existing) {
      await db.budgets.update(existing.id, { limit_amount: data.limit_amount, sync_status: 'pending_sync' });
    } else {
      await db.budgets.add({ 
        ...data, 
        user_id: currentUserId,
        sync_status: 'pending_sync'
      });
    }
    await refreshAll(currentUserId);
    if (navigator.onLine && user) syncDataWithServer(currentUserId);
  }

  // DEBTS
  async function addDebt(data) {
    const currentUserId = user?.id || 1;
    await db.debts.add({ ...data, user_id: currentUserId, created_at: new Date() });
    await refreshAll(currentUserId);
  }

  async function updateDebtStatus(id, status) {
    const currentUserId = user?.id || 1;
    await db.debts.update(id, { status });
    await refreshAll(currentUserId);
  }

  // BILLS
  async function addBill(data) {
    const currentUserId = user?.id || 1;
    await db.bills.add({ ...data, user_id: currentUserId });
    await refreshAll(currentUserId);
  }

  async function updateBill(id, data) {
    const currentUserId = user?.id || 1;
    await db.bills.update(id, data);
    await refreshAll(currentUserId);
  }

  // PAY BILL (Bayar Tagihan)
  async function payBill(billId, walletId, amount, date = new Date().toISOString().split('T')[0]) {
    const currentUserId = user?.id || 1;
    const bill = await db.bills.get(billId);
    const wallet = await db.wallets.get(walletId);
    if (!bill || !wallet) return;

    // Cari kategori yang cocok dengan nama kategori bill
    let cat = await db.categories.where('name').equals(bill.category).first();
    if (!cat) {
      cat = await db.categories.where('name').equals('Lainnya').first();
    }
    const catId = cat ? cat.id : 1;

    // Tambah transaksi pengeluaran
    await addTransaction({
      wallet_id: walletId,
      category_id: catId,
      type: 'expense',
      amount: amount || bill.amount,
      date,
      note: `Bayar Tagihan: ${bill.bill_name}`
    });

    // Update last_paid pada tagihan
    await db.bills.update(billId, { last_paid: date });
    await refreshAll(currentUserId);
  }

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const thisMonthTx = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  function toggleTheme() {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }

  async function forgotPassword(email) {
    return await api.post('/auth/forgot-password', { email });
  }

  async function resetPassword(email, resetToken, newPassword) {
    return await api.post('/auth/reset-password', { email, resetToken, newPassword });
  }

  return (
    <AppContext.Provider value={{
      theme, toggleTheme, isOnline, user, setUser,
      wallets, categories, transactions, budgets, debts, bills,
      totalBalance, totalIncome, totalExpense,
      isLoading, refreshAll,
      register, login, loginWithGoogle, logout, updateProfile,
      forgotPassword, resetPassword,
      addTransaction, updateTransaction, deleteTransaction,
      addWallet, updateWallet, deleteWallet, transferBalance,
      addCategory, updateCategory, deleteCategory, addBudget,
      addDebt, updateDebtStatus,
      addBill, updateBill, payBill,
      currentMonth, currentYear,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
