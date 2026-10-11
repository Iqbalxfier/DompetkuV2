import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../contexts/AppContext';
import { Plus, Edit2, Trash2, Check, X, Tag, Shield } from 'lucide-react';
import Icon from '../components/ui/Icon';

const ICON_OPTIONS = [
  'UtensilsCrossed','Car','Home','Zap','Gamepad','ShoppingBag','HeartPulse',
  'CircleDollarSign','Briefcase','Box','Tag','Coffee','Book','Dumbbell',
  'Plane','Gift','Laptop','Music','Shirt','Baby','PawPrint','Flower2',
  'Building2','Wrench','GraduationCap','Tv','Phone','Camera','Bike',
];

const COLOR_OPTIONS = [
  '#f97316','#06b6d4','#8b5cf6','#f59e0b','#ec4899','#f43f5e',
  '#10b981','#6366f1','#64748b','#3b82f6','#84cc16','#ef4444',
  '#14b8a6','#a855f7','#f97316','#0ea5e9',
];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [activeTab, setActiveTab] = useState('expense');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'Tag', color: '#6366f1', type: 'expense' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');

  const filteredCats = useMemo(() =>
    categories.filter(c => c.type === activeTab || c.type === 'both'),
    [categories, activeTab]
  );

  function openAdd() {
    setEditId(null);
    setForm({ name: '', icon: 'Tag', color: '#6366f1', type: activeTab });
    setError('');
    setShowForm(true);
  }

  function openEdit(cat) {
    setEditId(cat.id);
    setForm({ name: cat.name, icon: cat.icon || 'Tag', color: cat.color || '#6366f1', type: cat.type });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nama kategori wajib diisi.'); return; }
    if (editId) {
      await updateCategory(editId, { name: form.name, icon: form.icon, color: form.color, type: form.type });
    } else {
      await addCategory({ name: form.name, icon: form.icon, color: form.color, type: form.type, is_default: false });
    }
    setShowForm(false);
    setEditId(null);
  }

  async function handleDelete(id) {
    await deleteCategory(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{categories.length} kategori total</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <Plus size={14} /> Tambah Kategori
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
        {[['expense','Pengeluaran'],['income','Pemasukan']].map(([val, label]) => (
          <button key={val} onClick={() => setActiveTab(val)} style={{
            flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13,
            background: activeTab === val ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
            color: activeTab === val ? 'white' : 'var(--color-text-muted)',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Category List */}
      <div className="glass-card" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {filteredCats.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            Belum ada kategori {activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'}
          </div>
        )}
        {filteredCats.map((cat, i) => (
          <div key={cat.id}>
            {i > 0 && <div style={{ height: 1, background: 'var(--color-border)', margin: '0 16px' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: (cat.color || '#6366f1') + '22',
                color: cat.color || '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={cat.icon || 'Tag'} size={20} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {cat.name}
                  {cat.is_default && (
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
                      DEFAULT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {cat.type === 'expense' ? 'Pengeluaran' : cat.type === 'income' ? 'Pemasukan' : 'Keduanya'}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(cat)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  title="Edit"
                >
                  <Edit2 size={13} />
                </button>
                {cat.name !== 'Lainnya' && (
                  deleteConfirm === cat.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Konfirmasi hapus"
                      ><Check size={13} /></button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Batal"
                      ><X size={13} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(244,63,94,0.08)', color: '#f43f5e',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                      title="Hapus Kategori"
                    >
                      <Trash2 size={13} />
                    </button>
                  )
                )}
                {cat.name === 'Lainnya' && (
                  <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', opacity: 0.4 }} title="Kategori utama 'Lainnya' tidak bisa dihapus">
                    <Shield size={13} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Shield size={11} /> Kategori utama 'Lainnya' dilindungi sebagai cadangan transaksi
      </div>

      {/* Modal Form */}
      {showForm && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: 16,
        }} onClick={() => setShowForm(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              animation: 'fadeInUp 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>{editId ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nama */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Nama Kategori</label>
                <input
                  className="input-field"
                  placeholder="contoh: Nongkrong, Olahraga..."
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
                {error && <div style={{ fontSize: 11, color: '#f43f5e', marginTop: 4 }}>{error}</div>}
              </div>

              {/* Tipe */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Tipe</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['expense','Pengeluaran'],['income','Pemasukan']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setForm(p => ({ ...p, type: val }))} style={{
                      flex: 1, padding: '8px', borderRadius: 9, border: '1px solid',
                      borderColor: form.type === val ? '#6366f1' : 'var(--color-border)',
                      cursor: 'pointer', fontWeight: 600, fontSize: 12,
                      background: form.type === val ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: form.type === val ? '#6366f1' : 'var(--color-text-muted)',
                      transition: 'all 0.2s',
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Warna */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>Warna</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {COLOR_OPTIONS.map(color => (
                    <button key={color} type="button" onClick={() => setForm(p => ({ ...p, color }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer',
                        outline: form.color === color ? `3px solid ${color}` : 'none',
                        outlineOffset: 2, transition: 'outline 0.15s', transform: form.color === color ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Ikon */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>Ikon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ICON_OPTIONS.map(iconName => (
                    <button key={iconName} type="button" onClick={() => setForm(p => ({ ...p, icon: iconName }))}
                      style={{
                        width: 40, height: 40, borderRadius: 10, border: '1px solid',
                        borderColor: form.icon === iconName ? form.color : 'var(--color-border)',
                        background: form.icon === iconName ? form.color + '22' : 'transparent',
                        color: form.icon === iconName ? form.color : 'var(--color-text-muted)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon name={iconName} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: form.color + '22', color: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={form.icon} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{form.name || 'Nama Kategori'}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Preview</div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editId ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
