import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, getMonthName, getCategoryById } from '../lib/utils';
import { Plus, Edit2, Target, Search, ChevronDown } from 'lucide-react';
import Icon from '../components/ui/Icon';

export default function Budget() {
  const { budgets, categories, transactions, currentMonth, currentYear, addBudget, isLoading } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [form, setForm] = useState({ category_id: '', limit_amount: '', month: currentMonth, year: currentYear });

  // Custom category search & dropdown state
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

  const thisMonthTx = useMemo(() => {
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear && tx.type === 'expense';
    });
  }, [transactions, currentMonth, currentYear]);

  const budgetData = useMemo(() => {
    return budgets
      .filter(b => b.month === currentMonth && b.year === currentYear)
      .map(b => {
        const spent = thisMonthTx.filter(t => t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0);
        const pct = b.limit_amount > 0 ? Math.min((spent / b.limit_amount) * 100, 100) : 0;
        const cat = getCategoryById(categories, b.category_id);
        return { ...b, spent, pct, remaining: b.limit_amount - spent, cat };
      });
  }, [budgets, thisMonthTx, categories, currentMonth, currentYear]);

  const totalBudget = budgetData.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const resetForm = () => {
    setShowForm(false);
    setEditBudget(null);
    setForm({ category_id: '', limit_amount: '', month: currentMonth, year: currentYear });
    setCatSearch('');
    setCatDropdownOpen(false);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category_id) return;
    await addBudget({
      category_id: Number(form.category_id),
      limit_amount: Number(form.limit_amount),
      month: Number(form.month),
      year: Number(form.year),
    });
    resetForm();
  }

  function getProgressColor(pct) {
    if (pct >= 100) return '#f43f5e';
    if (pct >= 80) return '#f59e0b';
    return '#10b981';
  }

  const usedCategoryIds = budgetData.map(b => b.category_id);
  const availableCategories = categories.filter(c => c.type === 'expense' && !usedCategoryIds.includes(c.id));

  return (
    <>
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Overall summary */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Total Budget — {getMonthName(currentMonth, currentYear)}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)' }}>{formatCurrency(totalBudget)}</div>
          </div>
          <div style={{ textAlign: 'left', minWidth: 120 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Terpakai</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: getProgressColor(overallPct) }}>{formatCurrency(totalSpent)}</div>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${overallPct}%`, background: getProgressColor(overallPct) }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span>{overallPct.toFixed(0)}% terpakai</span>
          <span>Sisa: {formatCurrency(Math.max(totalBudget - totalSpent, 0))}</span>
        </div>
      </div>

      {/* Budget cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Budget per Kategori</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Tambah Budget
        </button>
      </div>

      {budgetData.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <Target size={48} style={{ margin: '0 auto 12px', color: 'var(--color-text-muted)' }} />
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>Belum ada budget yang ditetapkan</div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Buat Budget Pertama</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgetData.map(b => (
            <div key={b.id} className="glass-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="category-icon" style={{ background: (b.cat?.color || '#6366f1') + '22', color: b.cat?.color || '#6366f1' }}>
                  <Icon name={b.cat?.icon || 'Box'} size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{b.cat?.name || 'Kategori'}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {formatCurrency(b.spent)} dari {formatCurrency(b.limit_amount)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: getProgressColor(b.pct) }}>
                    {b.pct.toFixed(0)}%
                  </div>
                  {b.pct >= 80 && (
                    <span className={`badge ${b.pct >= 100 ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 9 }}>
                      {b.pct >= 100 ? 'Melebihi!' : 'Hampir habis'}
                    </span>
                  )}
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${b.pct}%`, background: getProgressColor(b.pct) }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span>Sisa: <strong style={{ color: b.remaining >= 0 ? '#10b981' : '#f43f5e' }}>{formatCurrency(Math.abs(b.remaining))}{b.remaining < 0 ? ' (over)' : ''}</strong></span>
                <button onClick={() => { setEditBudget(b); setForm({ category_id: b.category_id, limit_amount: b.limit_amount, month: b.month, year: b.year }); setShowForm(true); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <Edit2 size={11} /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {/* Form modal */}
      {showForm && (() => {
        const modalCategories = editBudget
          ? categories.filter(c => c.type === 'expense')
          : availableCategories;

        const searchedModalCategories = catSearch
          ? modalCategories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
          : modalCategories;

        const selectedCategory = categories.find(c => c.id === Number(form.category_id));

        return (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                {editBudget ? 'Edit Budget' : 'Tambah Budget'}
              </h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Category - Searchable Select */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Kategori</label>
                  <div ref={catRef} style={{ position: 'relative' }}>
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

                    {catDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                        borderRadius: 12, overflow: 'hidden', zIndex: 20,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        maxHeight: 220, display: 'flex', flexDirection: 'column',
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
                        <div style={{ overflowY: 'auto', maxHeight: 160 }}>
                          {searchedModalCategories.length === 0 ? (
                            <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                              Tidak ada kategori ditemukan
                            </div>
                          ) : (
                            searchedModalCategories.map(c => (
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
                                  background: Number(form.category_id) === c.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                                  color: Number(form.category_id) === c.id ? '#6366f1' : 'var(--color-text-primary)',
                                  transition: 'background 0.15s',
                                  textAlign: 'left',
                                }}
                                onMouseEnter={e => { if (Number(form.category_id) !== c.id) e.currentTarget.style.background = 'var(--color-bg-hover, rgba(99,102,241,0.05))'; }}
                                onMouseLeave={e => { if (Number(form.category_id) !== c.id) e.currentTarget.style.background = 'transparent'; }}
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
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Limit Budget (Rp)</label>
                  <input className="input-field" type="number" placeholder="500000" value={form.limit_amount} onChange={e => setForm(p => ({ ...p, limit_amount: e.target.value }))} required min="1000" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Bulan</label>
                    <select className="input-field" value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{new Date(2024, m - 1, 1).toLocaleString('id-ID', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Tahun</label>
                    <input className="input-field" type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} min="2020" max="2030" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={resetForm}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </>
  );
}
