import React from 'react';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import AiChatWidget from '../ui/AiChatWidget';
import { useApp } from '../../contexts/AppContext';
import { WifiOff, Plus } from 'lucide-react';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/transactions': 'Riwayat Transaksi',
  '/transactions/add': 'Tambah Transaksi',
  '/budget': 'Budget Bulanan',
  '/wallets': 'Dompet Saya',
  '/debts': 'Utang-Piutang',
  '/bills': 'Reminder Tagihan',
  '/profile': 'Profil & Pengaturan',
  '/categories': 'Kelola Kategori',
};

export default function AppLayout() {
  const { isOnline, user, isLoading } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname] || 'Dompetku';
  const showFab = ['/transactions', '/'].includes(location.pathname);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--color-bg-primary)',
        color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 600
      }}>
        Memuat data keuangan Anda...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner" style={{
          background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
          color: 'white',
        }}>
          <WifiOff size={14} />
          Mode Offline — Data akan disinkronisasi saat online kembali
        </div>
      )}

      {/* Sidebar (desktop only) */}
      <aside className="sidebar-desktop">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header (mobile only) */}
        <MobileHeader />

        <main className={`main-content ${!isOnline ? 'has-offline-banner' : ''}`}>
          {/* Desktop Sticky Header (desktop only) */}
          <header className="page-header desktop-only">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h1 className="page-title">{title}</h1>
              {location.pathname !== '/transactions/add' && (
                <button
                  className="btn btn-primary btn-sm desktop-add-tx-btn"
                  onClick={() => navigate('/transactions/add')}
                  style={{
                    display: 'none',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Plus size={15} /> Tambah Transaksi
                </button>
              )}
            </div>
          </header>

          <div className="page-body">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Nav (mobile only) */}
      <BottomNav />

      {/* FAB — mobile only, above bottom nav */}
      {showFab && (
        <button
          className="fab-mobile"
          onClick={() => navigate('/transactions/add')}
          title="Tambah Transaksi"
        >
          <Plus size={22} />
        </button>
      )}

      {/* Floating AI Chat */}
      <AiChatWidget />
    </div>
  );
}
