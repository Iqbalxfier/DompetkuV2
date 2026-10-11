import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../lib/utils';
import { Sun, Moon, User, Mail, Shield, Wifi, WifiOff, ChevronRight, Smartphone, Info, Tag, Users, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateProfile, theme, toggleTheme, totalBalance, transactions, isOnline, logout } = useApp();
  const navigate = useNavigate();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user.name);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const totalTx = transactions.length;
  const pendingSync = transactions.filter(t => t.sync_status === 'pending_sync').length;

  async function handleSaveName() {
    if (!name.trim()) return;
    await updateProfile({ name: name.trim() });
    setEditName(false);
  }

  return (
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>

      {/* Profile card */}
      <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: 28,
          margin: '0 auto 14px',
        }}>{user.name[0]}</div>
        {editName ? (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
            <input
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
              style={{ maxWidth: 200, textAlign: 'center' }}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveName}>Simpan</button>
          </div>
        ) : (
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{user.name}</div>
        )}
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>{user.email}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
          <StatItem label="Total Saldo" value={formatCurrency(totalBalance)} />
          <StatItem label="Transaksi" value={totalTx} />
          <StatItem label="Pending Sync" value={pendingSync} />
        </div>
      </div>

      {/* Financial Features Menu (Mobile Friendly) */}
      <div className="glass-card" style={{ padding: 8 }}>
        <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Fitur Keuangan
        </div>
        <SettingItem
          icon={<Users size={16} color="#6366f1" />}
          label="Utang-Piutang"
          sub="Catat pinjaman & tagihan utang teman/keluarga"
          onClick={() => navigate('/debts')}
        />
        <div className="divider" style={{ margin: '0 16px' }} />
        <SettingItem
          icon={<Bell size={16} color="#f59e0b" />}
          label="Reminder Tagihan"
          sub="Pengingat pembayaran tagihan bulanan"
          onClick={() => navigate('/bills')}
        />
        <div className="divider" style={{ margin: '0 16px' }} />
        <SettingItem
          icon={<Tag size={16} color="#10b981" />}
          label="Kelola Kategori"
          sub="Tambah, edit, dan hapus kategori transaksi"
          onClick={() => navigate('/categories')}
        />
      </div>

      {/* Pengaturan Akun & Tampilan */}
      <div className="glass-card" style={{ padding: 8 }}>
        <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Pengaturan Aplikasi
        </div>
        <SettingItem
          icon={<User size={16} />}
          label="Edit Nama Akun"
          onClick={() => setEditName(true)}
        />
        <div className="divider" style={{ margin: '0 16px' }} />

        {/* Dark mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6366f1' }}>
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Tampilan aplikasi</div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="divider" style={{ margin: '0 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isOnline ? <Wifi size={16} color="#10b981" /> : <WifiOff size={16} color="#f43f5e" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Status Koneksi</div>
            <div style={{ fontSize: 11, color: isOnline ? '#10b981' : '#f43f5e' }}>{isOnline ? 'Online' : 'Offline'}</div>
          </div>
          {pendingSync > 0 && (
            <span className="badge badge-warning">{pendingSync} pending</span>
          )}
        </div>
      </div>

      {/* App info & Logout */}
      <div className="glass-card" style={{ padding: 8 }}>
        <SettingItem icon={<Smartphone size={16} />} label="Install sebagai App (PWA)" sub="Tambahkan ke layar utama" />
        <div className="divider" style={{ margin: '0 16px' }} />
        <SettingItem icon={<Shield size={16} />} label="Keamanan Data" sub="Data tersimpan lokal + enkripsi" />
        <div className="divider" style={{ margin: '0 16px' }} />
        <SettingItem icon={<Info size={16} />} label="Tentang Dompetku" sub="v1.0.0 — Personal Finance PWA" />
        <div className="divider" style={{ margin: '0 16px' }} />
        
        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 10,
            color: '#f43f5e', fontWeight: 600, fontSize: 13,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f43f5e' }}>
            <LogOut size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div>Keluar dari Akun</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>Keluar dari akun {user.name}</div>
          </div>
          <ChevronRight size={15} color="#f43f5e" />
        </button>
      </div>

      {/* Offline info box */}
      <div style={{
        padding: '14px 16px',
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 12,
        fontSize: 12,
        color: 'var(--color-text-secondary)',
        lineHeight: 1.6,
      }}>
        <strong style={{ color: '#6366f1' }}>🔒 Mode Offline</strong><br />
        Semua data transaksi tersimpan di perangkat kamu via IndexedDB. Saat koneksi kembali, data akan otomatis disinkronisasi ke server.
        {pendingSync > 0 && <><br /><br /><strong style={{ color: '#f59e0b' }}>⏳ {pendingSync} transaksi menunggu sinkronisasi.</strong></>}
      </div>

      {/* Logout Modal Confirm */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}>
          <div className="modal-content" style={{ padding: 24, textAlign: 'center', maxWidth: 360 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(244,63,94,0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogOut size={24} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Keluar dari Akun?</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
              Apakah Anda yakin ingin keluar dari akun Dompetku?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Batal</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={async () => { setShowLogoutConfirm(false); await logout(); }}>Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ padding: '10px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, textAlign: 'center', minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

function SettingItem({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', width: '100%',
      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: 10,
      transition: 'background 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6366f1' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sub}</div>}
      </div>
      {onClick && <ChevronRight size={15} color="var(--color-text-muted)" />}
    </button>
  );
}
