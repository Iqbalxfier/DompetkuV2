import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Bell, User, ArrowLeft } from 'lucide-react';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/transactions': 'Transaksi',
  '/transactions/add': 'Catat Transaksi',
  '/budget': 'Budget Bulanan',
  '/wallets': 'Dompet Saya',
  '/debts': 'Utang-Piutang',
  '/bills': 'Tagihan Rutin',
  '/profile': 'Profil Saya',
  '/categories': 'Kelola Kategori',
};

export default function MobileHeader() {
  const { user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/';
  const title = PAGE_TITLES[location.pathname] || 'Dompetku';

  return (
    <header className="mobile-only" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border)',
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {isDashboard ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => navigate('/profile')}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
              cursor: 'pointer'
            }}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                user?.name?.charAt(0).toUpperCase() || <User size={18} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                Selamat Datang 👋
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {user?.name || 'Pengguna'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {title}
            </h1>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
            }}
          >
            <Bell size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
