import Dexie from 'dexie';

export const db = new Dexie('DompetkuDB');

db.version(2).stores({
  wallets:      '++id, user_id, name, type, balance, color, icon, sync_status, server_id, created_at',
  categories:   '++id, user_id, name, type, icon, color, is_default, sync_status, server_id',
  transactions: '++id, user_id, wallet_id, category_id, amount, type, date, note, is_recurring, sync_status, server_id, created_at',
  budgets:      '++id, user_id, category_id, limit_amount, month, year, sync_status, server_id',
  debts:        '++id, user_id, party_name, amount, type, status, due_date, note, created_at',
  bills:        '++id, user_id, bill_name, amount, due_day, category, is_active, last_paid, note',
  users:        '++id, name, email, avatar, theme',
});

// Versi 3: Perbaikan nama icon yang salah di data kategori lokal
db.version(3).stores({
  wallets:      '++id, user_id, name, type, balance, color, icon, sync_status, server_id, created_at',
  categories:   '++id, user_id, name, type, icon, color, is_default, sync_status, server_id',
  transactions: '++id, user_id, wallet_id, category_id, amount, type, date, note, is_recurring, sync_status, server_id, created_at',
  budgets:      '++id, user_id, category_id, limit_amount, month, year, sync_status, server_id',
  debts:        '++id, user_id, party_name, amount, type, status, due_date, note, created_at',
  bills:        '++id, user_id, bill_name, amount, due_day, category, is_active, last_paid, note',
  users:        '++id, name, email, avatar, theme',
}).upgrade(tx => {
  // Hapus kategori lama yang punya nama icon yang salah, lalu biarkan seedDatabase mengisi ulang
  return tx.table('categories').clear();
});

export async function seedDatabase() {
  const walletCount = await db.wallets.count();
  if (walletCount > 0) return; // Already seeded

  // Seed wallets
  await db.wallets.bulkAdd([
    { user_id: 1, name: 'Dompet Cash', type: 'cash', balance: 150000, color: '#10b981', icon: 'Wallet', created_at: new Date() },
    { user_id: 1, name: 'GoPay', type: 'e-wallet', balance: 320000, color: '#6366f1', icon: 'Smartphone', created_at: new Date() },
    { user_id: 1, name: 'BRI Tabungan', type: 'bank', balance: 1850000, color: '#06b6d4', icon: 'Landmark', created_at: new Date() },
  ]);

  // Seed categories
  await db.categories.bulkAdd([
    { user_id: 1, name: 'Makan & Minum', type: 'expense', icon: 'UtensilsCrossed', color: '#f97316', is_default: true },
    { user_id: 1, name: 'Transportasi', type: 'expense', icon: 'Car', color: '#06b6d4', is_default: true },
    { user_id: 1, name: 'Kost & Sewa', type: 'expense', icon: 'Home', color: '#8b5cf6', is_default: true },
    { user_id: 1, name: 'Listrik & WiFi', type: 'expense', icon: 'Zap', color: '#f59e0b', is_default: true },
    { user_id: 1, name: 'Hiburan', type: 'expense', icon: 'Gamepad', color: '#ec4899', is_default: true },
    { user_id: 1, name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: '#f43f5e', is_default: true },
    { user_id: 1, name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: '#10b981', is_default: true },
    { user_id: 1, name: 'Kiriman Ortu', type: 'income', icon: 'CircleDollarSign', color: '#10b981', is_default: true },
    { user_id: 1, name: 'Gaji / Freelance', type: 'income', icon: 'Briefcase', color: '#6366f1', is_default: true },
    { user_id: 1, name: 'Lainnya', type: 'expense', icon: 'Box', color: '#64748b', is_default: true },
  ]);

  // Seed transactions (past 30 days)
  const now = new Date();
  const transactions = [
    { user_id: 1, wallet_id: 1, category_id: 1, amount: 25000, type: 'expense', date: daysAgo(now, 0), note: 'Nasi padang', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 2, amount: 15000, type: 'expense', date: daysAgo(now, 0), note: 'Ojek ke kampus', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 3, category_id: 8, amount: 1500000, type: 'income', date: daysAgo(now, 1), note: 'Kiriman bulan Agustus', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 1, category_id: 1, amount: 18000, type: 'expense', date: daysAgo(now, 1), note: 'Mie ayam + es teh', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 5, amount: 45000, type: 'expense', date: daysAgo(now, 2), note: 'Nonton bioskop', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 1, category_id: 1, amount: 32000, type: 'expense', date: daysAgo(now, 2), note: 'Makan siang + dinner', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 6, amount: 120000, type: 'expense', date: daysAgo(now, 3), note: 'Beli baju diskon', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 3, category_id: 3, amount: 800000, type: 'expense', date: daysAgo(now, 5), note: 'Bayar kost bulan ini', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 4, amount: 65000, type: 'expense', date: daysAgo(now, 5), note: 'Iuran WiFi patungan', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 1, category_id: 1, amount: 22000, type: 'expense', date: daysAgo(now, 6), note: 'Sarapan + kopi', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 9, amount: 350000, type: 'income', date: daysAgo(now, 7), note: 'Freelance desain logo', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 1, category_id: 2, amount: 20000, type: 'expense', date: daysAgo(now, 7), note: 'Bensin motor', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 7, amount: 55000, type: 'expense', date: daysAgo(now, 8), note: 'Beli obat masuk angin', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 1, category_id: 1, amount: 28000, type: 'expense', date: daysAgo(now, 9), note: 'Gofood nasi goreng', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 5, amount: 13000, type: 'expense', date: daysAgo(now, 10), note: 'Spotify Premium', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 1, category_id: 1, amount: 35000, type: 'expense', date: daysAgo(now, 12), note: 'Makan bareng teman', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 3, category_id: 9, amount: 500000, type: 'income', date: daysAgo(now, 14), note: 'Part-time kampus', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 2, amount: 25000, type: 'expense', date: daysAgo(now, 15), note: 'Ojek PP ke mall', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 1, category_id: 10, amount: 45000, type: 'expense', date: daysAgo(now, 17), note: 'Print + fotokopi', sync_status: 'synced', created_at: new Date() },
    { user_id: 1, wallet_id: 2, category_id: 1, amount: 60000, type: 'expense', date: daysAgo(now, 20), note: 'Makan dinner + boba', sync_status: 'pending_sync', created_at: new Date() },
  ];
  await db.transactions.bulkAdd(transactions);

  // Seed budgets (current month)
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  await db.budgets.bulkAdd([
    { user_id: 1, category_id: 1, limit_amount: 500000, month, year },
    { user_id: 1, category_id: 2, limit_amount: 150000, month, year },
    { user_id: 1, category_id: 3, limit_amount: 800000, month, year },
    { user_id: 1, category_id: 4, limit_amount: 100000, month, year },
    { user_id: 1, category_id: 5, limit_amount: 200000, month, year },
    { user_id: 1, category_id: 6, limit_amount: 300000, month, year },
  ]);

  // Seed debts
  await db.debts.bulkAdd([
    { user_id: 1, party_name: 'Budi', amount: 50000, type: 'receivable', status: 'pending', due_date: futureDays(now, 7), note: 'Patungan bensin kemarin', created_at: new Date() },
    { user_id: 1, party_name: 'Sari', amount: 120000, type: 'payable', status: 'pending', due_date: futureDays(now, 3), note: 'Pinjam buat makan', created_at: new Date() },
    { user_id: 1, party_name: 'Dani', amount: 75000, type: 'receivable', status: 'pending', due_date: futureDays(now, 14), note: 'Titip belanja minimarket', created_at: new Date() },
    { user_id: 1, party_name: 'Mama', amount: 200000, type: 'payable', status: 'paid', due_date: daysAgo(now, 5), note: 'Minta talangan', created_at: new Date() },
  ]);

  // Seed bills
  await db.bills.bulkAdd([
    { user_id: 1, bill_name: 'Sewa Kost', amount: 800000, due_day: 1, category: 'Kost & Sewa', is_active: true, last_paid: daysAgo(now, 20), note: 'Kost Pak Haji' },
    { user_id: 1, bill_name: 'Iuran WiFi', amount: 65000, due_day: 5, category: 'Listrik & WiFi', is_active: true, last_paid: daysAgo(now, 16), note: 'Indihome patungan' },
    { user_id: 1, bill_name: 'Listrik', amount: 45000, due_day: 10, category: 'Listrik & WiFi', is_active: true, last_paid: daysAgo(now, 11), note: 'Token listrik' },
    { user_id: 1, bill_name: 'Spotify', amount: 13000, due_day: 15, category: 'Hiburan', is_active: true, last_paid: daysAgo(now, 6), note: 'Premium individual' },
  ]);

  // Seed user
  await db.users.add({
    name: 'Iqbal Firdaus',
    email: 'iqbal@example.com',
    avatar: null,
    theme: 'dark',
  });
}

function daysAgo(now, days) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function futureDays(now, days) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default db;
