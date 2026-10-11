export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function getMonthName(month, year) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getCategoryById(categories, id) {
  return categories.find(c => c.id === id);
}

export function getWalletById(wallets, id) {
  return wallets.find(w => w.id === id);
}

export const WALLET_TYPES = [
  { value: 'cash', label: 'Tunai', icon: '💵' },
  { value: 'e-wallet', label: 'E-Wallet', icon: '💜' },
  { value: 'bank', label: 'Rekening Bank', icon: '🏦' },
  { value: 'savings', label: 'Tabungan', icon: '🐷' },
];

export const WALLET_COLORS = [
  '#6366f1', '#10b981', '#f43f5e', '#f59e0b',
  '#06b6d4', '#8b5cf6', '#ec4899', '#f97316',
];
