import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, ChartPie, Wallet,
  Users, Bell, LogOut, Wifi, WifiOff, User, ChevronUp, Plus,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
  { to: '/budget', icon: ChartPie, label: 'Budget' },
  { to: '/wallets', icon: Wallet, label: 'Dompet' },
  { to: '/debts', icon: Users, label: 'Utang-Piutang' },
  { to: '/bills', icon: Bell, label: 'Tagihan' },
];

export default function Sidebar() {
  const { user, isOnline, logout } = useApp();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--color-bg-secondary)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}><Wallet size={18} color="white" /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--color-text-primary)' }}>Dompetku</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>Personal Finance</div>
          </div>
        </div>
      </div>

      {/* Primary Action Button (Desktop) */}
      <button
        onClick={() => navigate('/transactions/add')}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: 'white',
          border: 'none',
          fontWeight: 600,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          cursor: 'pointer',
          marginBottom: 20,
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
          transition: 'all 0.2s ease',
        }}
        className="sidebar-add-btn"
      >
        <Plus size={16} /> Tambah Transaksi
      </button>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Account footer with dropdown */}
      <div ref={menuRef} style={{ position: 'relative', marginTop: 8 }}>
        {/* Dropdown menu (appears above) */}
        {showMenu && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            marginBottom: 6,
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            animation: 'fadeInUp 0.15s ease',
          }}>
            <button
              onClick={() => { navigate('/profile'); setShowMenu(false); }}
              style={{
                width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover, rgba(99,102,241,0.08))'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <User size={16} /> Profil
            </button>
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <button
              onClick={async () => { await logout(); setShowMenu(false); }}
              style={{
                width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: 600, color: '#f43f5e',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        )}

        {/* Account button */}
        <button
          onClick={() => setShowMenu(prev => !prev)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.2s',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>{user.name[0]}</div>

          {/* Name & status */}
          <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{user.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isOnline
                ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /><span style={{ fontSize: 10, color: '#10b981' }}>Online</span></>
                : <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} /><span style={{ fontSize: 10, color: '#f43f5e' }}>Offline</span></>
              }
            </div>
          </div>

          {/* Chevron */}
          <ChevronUp size={14} style={{
            color: 'var(--color-text-muted)',
            transform: showMenu ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s',
          }} />
        </button>
      </div>
    </aside>
  );
}
