import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { CheckCircle, ArrowLeft, Plus, Search, ChevronDown } from 'lucide-react';
import Icon from '../components/ui/Icon';

export default function AddTransaction() {
  const { categories, wallets, addTransaction, addCategory, isLoading } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category_id: '',
    wallet_id: wallets[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Custom Category State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCat, setNewCat] = useState({ name: '' });

  // Searchable category dropdown
  const [catSearch, setCatSearch] = useState('');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    }
    if (catDropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [catDropdownOpen]);

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    try {
      await addCategory({
        name: newCat.name,
        type: form.type,
        icon: 'Tag',
        color: '#6366f1',
        is_default: false
      });
      setShowCatModal(false);
      setNewCat({ name: '' });
    } catch (err) {
      console.error("Gagal menambahkan kategori:", err);
    }
  }

  const filteredCategories = categories.filter(c => c.type === form.type || c.type === 'both');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'type') {
      setForm(prev => ({ ...prev, type: value, category_id: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { setError('Nominal harus lebih dari 0'); return; }
    if (!form.category_id) { setError('Pilih kategori'); return; }
    if (!form.wallet_id) { setError('Pilih dompet'); return; }
    setError('');
    setSubmitting(true);
    try {
      await addTransaction({
        type: form.type,
        amount: Number(form.amount),
        category_id: Number(form.category_id),
        wallet_id: Number(form.wallet_id),
        date: form.date,
        note: form.note,
      });
      setSuccess(true);
      setTimeout(() => navigate('/transactions'), 1500);
    } catch (err) {
      setError('Gagal menyimpan transaksi');
    }
    setSubmitting(false);
  }

  const presetAmounts = [10000, 15000, 20000, 25000, 50000, 100000];

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={40} color="#10b981" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Transaksi Tersimpan!</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Mengarahkan ke riwayat transaksi...</p>
      </div>
    );
  }

  const selectedCategory = filteredCategories.find(c => c.id === form.category_id);
  const searchedCategories = catSearch
    ? filteredCategories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
    : filteredCategories;

  return (
    <>
    <div className="stagger-children" style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 500, padding: 0, alignSelf: 'flex-start',
      }}>
        <ArrowLeft size={16} /> Kembali
      </button>

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
          {['expense', 'income'].map(t => (
            <button key={t} type="button"
              onClick={() => setForm(p => ({ ...p, type: t, category_id: '' }))}
              style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                background: form.type === t ? (t === 'expense' ? 'linear-gradient(135deg,#f43f5e,#e11d48)' : 'linear-gradient(135deg,#10b981,#059669)') : 'transparent',
                color: form.type === t ? 'white' : 'var(--color-text-muted)',
              }}>
              {t === 'expense' ? '− Pengeluaran' : '+ Pemasukan'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
            Nominal (Rp)
          </label>
          <input
            className="input-field"
            type="number"
            name="amount"
            placeholder="0"
            value={form.amount}
            onChange={handleChange}
            style={{
              fontSize: 24, fontWeight: 800, textAlign: 'center',
              color: form.type === 'expense' ? '#f43f5e' : '#10b981',
              padding: '16px',
            }}
          />
          {/* Quick presets */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {presetAmounts.map(a => (
              <button key={a} type="button"
                onClick={() => setForm(p => ({ ...p, amount: a }))}
                className="chip-tab"
                style={{ fontSize: 11 }}>
                {formatCurrency(a)}
              </button>
            ))}
          </div>
        </div>

        {/* Category - Searchable Select */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Kategori
            </label>
            <button type="button" onClick={() => setShowCatModal(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent, #6366f1)',
              fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, padding: 0,
            }}>
              <Plus size={12} /> Baru
            </button>
          </div>
          <div ref={catRef} style={{ position: 'relative' }}>
            {/* Select trigger */}
            <button
              type="button"
              onClick={() => setCatDropdownOpen(prev => !prev)}
              className="input-field"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', textAlign: 'left', padding: '10px 14px',
                color: selectedCategory ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
            >
              <span>{selectedCategory ? selectedCategory.name : 'Pilih kategori...'}</span>
              <ChevronDown size={14} style={{
                transform: catDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s', color: 'var(--color-text-muted)',
              }} />
            </button>

            {/* Dropdown */}
            {catDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                borderRadius: 12, overflow: 'hidden', zIndex: 20,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                maxHeight: 260, display: 'flex', flexDirection: 'column',
              }}>
                {/* Search input */}
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                    background: 'var(--color-bg-primary)', borderRadius: 8 }}>
                    <Search size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Cari kategori..."
                      value={catSearch}
                      onChange={e => setCatSearch(e.target.value)}
                      autoFocus
                      style={{
                        border: 'none', background: 'none', outline: 'none', width: '100%',
                        fontSize: 13, color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                </div>
                {/* Options */}
                <div style={{ overflowY: 'auto', maxHeight: 200 }}>
                  {searchedCategories.length === 0 ? (
                    <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                      Tidak ada kategori ditemukan
                    </div>
                  ) : (
                    searchedCategories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setForm(p => ({ ...p, category_id: c.id }));
                          setCatDropdownOpen(false);
                          setCatSearch('');
                        }}
                        style={{
                          width: '100%', padding: '10px 16px', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500,
                          background: form.category_id === c.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                          color: form.category_id === c.id ? '#6366f1' : 'var(--color-text-primary)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (form.category_id !== c.id) e.currentTarget.style.background = 'var(--color-bg-hover, rgba(99,102,241,0.05))'; }}
                        onMouseLeave={e => { if (form.category_id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {c.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wallet */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
            Dari Dompet
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {wallets.map(w => (
              <button key={w.id} type="button"
                onClick={() => setForm(p => ({ ...p, wallet_id: w.id }))}
                style={{
                  padding: '8px 14px', borderRadius: 10, border: '1px solid',
                  borderColor: form.wallet_id === w.id ? w.color : 'var(--color-border)',
                  background: form.wallet_id === w.id ? w.color + '22' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.2s', fontSize: 12, fontWeight: 600,
                  color: form.wallet_id === w.id ? w.color : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <Icon name={w.icon} size={14} /> {w.name}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>Tanggal</label>
          <input className="input-field" type="date" name="date" value={form.date} onChange={handleChange} />
        </div>

        {/* Note */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>Catatan (opsional)</label>
          <input className="input-field" type="text" name="note" placeholder="Tambahkan catatan..." value={form.note} onChange={handleChange} />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, fontSize: 13, color: '#f43f5e' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ width: '100%', marginTop: 4 }}>
          {submitting ? 'Menyimpan...' : `Simpan ${form.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}`}
        </button>
      </form>
    </div>

    {/* Add Category Modal — simplified, name only */}
    {showCatModal && (
      <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
        <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Kategori Baru</h3>
          <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Nama Kategori</label>
              <input className="input-field" placeholder="Contoh: Laundry, Gym, Bensin..." value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} required autoFocus />
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '4px 0' }}>
              Tipe kategori otomatis: <strong>{form.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCatModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
