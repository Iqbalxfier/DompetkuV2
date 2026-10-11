import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate, getCategoryById, getWalletById } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Trash2, Edit2, Plus, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Download, X, SlidersHorizontal } from 'lucide-react';
import Icon from '../components/ui/Icon';
import BottomSheet from '../components/ui/BottomSheet';

export default function Transactions() {
  const { transactions, categories, wallets, deleteTransaction, updateTransaction, isLoading } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Mobile Filter Sheet State
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTxId, setEditTxId] = useState(null);
  const [editForm, setEditForm] = useState({
    type: 'expense',
    amount: '',
    category_id: '',
    wallet_id: '',
    date: '',
    note: ''
  });

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (filterCategory !== 'all') list = list.filter(t => t.category_id === Number(filterCategory));
    
    // Time filter
    if (filterDay) {
      const [fYear, fMonth, fDay] = filterDay.split('-').map(Number);
      list = list.filter(t => {
        if (!t.date) return false;
        const td = new Date(t.date);
        return td.getFullYear() === fYear &&
               td.getMonth() + 1 === fMonth &&
               td.getDate() === fDay;
      });
    }
    if (filterMonth !== 'all') {
      list = list.filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getMonth() + 1 === Number(filterMonth);
      });
    }
    if (filterYear !== 'all') {
      list = list.filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getFullYear() === Number(filterYear);
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => {
        const cat = getCategoryById(categories, t.category_id);
        return (t.note || '').toLowerCase().includes(q) || (cat?.name || '').toLowerCase().includes(q);
      });
    }
    if (sortBy === 'date_desc') list.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === 'date_asc') list.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sortBy === 'amount_desc') list.sort((a, b) => b.amount - a.amount);
    else if (sortBy === 'amount_asc') list.sort((a, b) => a.amount - b.amount);
    return list;
  }, [transactions, filterType, filterCategory, filterDay, filterMonth, filterYear, search, sortBy, categories]);

  const totalFiltered = {
    income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  };

  const largestSpending = useMemo(() => {
    const expenses = filtered.filter(t => t.type === 'expense');
    if (expenses.length === 0) return null;
    const sorted = [...expenses].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const cat = getCategoryById(categories, top.category_id);
    return { ...top, cat };
  }, [filtered, categories]);

  async function handleDelete(id) {
    await deleteTransaction(id);
    setDeleteConfirm(null);
  }

  const [modalOpenedTime, setModalOpenedTime] = useState(0);

  function openEditModal(e, tx) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditTxId(tx.id);
    setEditForm({
      type: tx.type || 'expense',
      amount: tx.amount || '',
      category_id: tx.category_id || categories[0]?.id || '',
      wallet_id: tx.wallet_id || wallets[0]?.id || '',
      date: tx.date || new Date().toISOString().split('T')[0],
      note: tx.note || ''
    });
    setModalOpenedTime(Date.now());
    setShowEditModal(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    await updateTransaction(editTxId, {
      type: editForm.type,
      amount: Number(editForm.amount),
      category_id: Number(editForm.category_id),
      wallet_id: Number(editForm.wallet_id),
      date: editForm.date,
      note: editForm.note
    });
    setShowEditModal(false);
    setEditTxId(null);
  }

  function exportToCSV() {
    if (filtered.length === 0) {
      alert('Tidak ada transaksi untuk diekspor.');
      return;
    }
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Nominal (Rp)', 'Catatan', 'Status Sync'];
    const rows = filtered.map(t => {
      const cat = getCategoryById(categories, t.category_id);
      const wallet = getWalletById(wallets, t.wallet_id);
      return [
        `"${t.date}"`,
        `"${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
        `"${cat?.name || 'Lainnya'}"`,
        `"${wallet?.name || '-'}"`,
        t.amount,
        `"${(t.note || '').replace(/"/g, '""')}"`,
        `"${t.sync_status || 'synced'}"`
      ].join(',');
    });
    const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Transaksi_Dompetku_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* MOBILE SPECIFIC SEARCH & FILTER TRIGGER */}
      <div className="mobile-only">
        <div className="glass-card" style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: 36, fontSize: 13, height: 38 }}
              placeholder="Cari transaksi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowMobileFilter(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <SlidersHorizontal size={16} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Filter</span>
          </button>
        </div>

        {/* Quick Type Tabs on Mobile */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {['all','income','expense'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`chip-tab ${filterType === t ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: 11, whiteSpace: 'nowrap', borderRadius: 20 }}>
              {t === 'all' ? 'Semua' : t === 'income' ? '+ Pemasukan' : '- Pengeluaran'}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP SPECIFIC FILTER BAR */}
      <div className="glass-card desktop-only" style={{ padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all','income','expense'].map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`chip-tab ${filterType === t ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: 12 }}>
                  {t === 'all' ? 'Semua' : t === 'income' ? '+ Pemasukan' : '- Pengeluaran'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={exportToCSV} style={{ gap: 6 }}>
                <Download size={14} /> Export CSV
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/transactions/add')} style={{ gap: 6 }}>
                <Plus size={14} /> Tambah Transaksi
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '2 1 200px' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input className="input-field" style={{ paddingLeft: 36 }}
                placeholder="Cari transaksi..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input-field" style={{ flex: '1 1 140px' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input-field" style={{ flex: '1 1 140px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date_desc">Terbaru</option>
              <option value="date_asc">Terlama</option>
              <option value="amount_desc">Nominal Terbesar</option>
              <option value="amount_asc">Nominal Terkecil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ArrowUpCircle size={20} color="#10b981" />
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Pemasukan</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{formatCurrency(totalFiltered.income)}</div>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ArrowDownCircle size={20} color="#f43f5e" />
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Pengeluaran</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f43f5e' }}>{formatCurrency(totalFiltered.expense)}</div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{filtered.length} Transaksi Ditemukan</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Search size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: 14 }}>Tidak ada transaksi ditemukan</div>
          </div>
        ) : (
          <div>
            {filtered.map((tx, i) => {
              const cat = getCategoryById(categories, tx.category_id);
              const wallet = getWalletById(wallets, tx.wallet_id);
              return (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="category-icon" style={{ background: (cat?.color || '#6366f1') + '22', color: cat?.color || '#6366f1' }}>
                    <Icon name={cat?.icon || 'Box'} size={18} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.note || cat?.name || 'Transaksi'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                      <span>{cat?.name}</span>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name={wallet?.icon} size={12} /> {wallet?.name}
                      </span>
                      <span>·</span>
                      <span>{formatDate(tx.date)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === 'income' ? '#10b981' : '#f43f5e' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button onClick={(e) => openEditModal(e, tx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 6 }}
                        title="Edit Transaksi"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => setDeleteConfirm(tx.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 6 }}
                        title="Hapus Transaksi"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MOBILE FILTER BOTTOM SHEET */}
      <BottomSheet isOpen={showMobileFilter} onClose={() => setShowMobileFilter(false)} title="Filter Transaksi">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Kategori</label>
            <select className="input-field" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Urutkan Berdasarkan</label>
            <select className="input-field" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date_desc">Tanggal Terbaru</option>
              <option value="date_asc">Tanggal Terlama</option>
              <option value="amount_desc">Nominal Terbesar</option>
              <option value="amount_asc">Nominal Terkecil</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setShowMobileFilter(false)}>
            Terapkan Filter
          </button>
        </div>
      </BottomSheet>

      {/* Edit Modal (Universal) */}
      {showEditModal && createPortal(
        <div className="modal-overlay" onClick={e => {
          if (e.target === e.currentTarget && Date.now() - modalOpenedTime > 250) {
            setShowEditModal(false);
          }
        }}>
          <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit2 size={18} color="#6366f1" /> Edit Transaksi
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Jenis Transaksi</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['expense','Pengeluaran'],['income','Pemasukan']].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setEditForm(p => ({ ...p, type: val }))}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 9, border: '1px solid',
                        borderColor: editForm.type === val ? '#6366f1' : 'var(--color-border)',
                        background: editForm.type === val ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: editForm.type === val ? '#6366f1' : 'var(--color-text-muted)',
                        fontWeight: 600, fontSize: 12, cursor: 'pointer'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Nominal (Rp)</label>
                <input className="input-field" type="number" placeholder="0" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} required min="1" />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Dompet</label>
                <select className="input-field" value={editForm.wallet_id} onChange={e => setEditForm(p => ({ ...p, wallet_id: e.target.value }))} required>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Kategori</label>
                <select className="input-field" value={editForm.category_id} onChange={e => setEditForm(p => ({ ...p, category_id: e.target.value }))} required>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Tanggal</label>
                <input className="input-field" type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} required />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Catatan (Opsional)</label>
                <input className="input-field" placeholder="Catatan transaksi..." value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
          <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: '#f43f5e', textAlign: 'center', marginBottom: 14 }}>
              <AlertTriangle size={44} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ textAlign: 'center', marginBottom: 8, fontSize: 16 }}>Hapus Transaksi?</h3>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
              Saldo dompet akan dikembalikan. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteConfirm)}>Hapus</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
