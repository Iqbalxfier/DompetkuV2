import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate, getDaysUntil } from '../lib/utils';
import { Plus, CheckCircle, Clock, ArrowUpRight, ArrowDownLeft, Users } from 'lucide-react';

export default function Debts() {
  const { debts, addDebt, updateDebtStatus } = useApp();
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ party_name: '', amount: '', type: 'payable', due_date: '', note: '' });

  const filtered = debts.filter(d => {
    if (tab === 'all') return true;
    if (tab === 'pending') return d.status === 'pending';
    if (tab === 'paid') return d.status === 'paid';
    if (tab === 'payable') return d.type === 'payable';
    if (tab === 'receivable') return d.type === 'receivable';
    return true;
  });

  const totalOwed = debts.filter(d => d.type === 'payable' && d.status === 'pending').reduce((s, d) => s + d.amount, 0);
  const totalReceivable = debts.filter(d => d.type === 'receivable' && d.status === 'pending').reduce((s, d) => s + d.amount, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    await addDebt({ ...form, amount: Number(form.amount), status: 'pending' });
    setShowForm(false);
    setForm({ party_name: '', amount: '', type: 'payable', due_date: '', note: '' });
  }

  return (
    <>
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ArrowDownLeft size={16} color="#f43f5e" />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Harus Bayar</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f43f5e' }}>{formatCurrency(totalOwed)}</div>
        </div>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ArrowUpRight size={16} color="#10b981" />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Mau Diterima</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{formatCurrency(totalReceivable)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Semua' },
          { key: 'pending', label: 'Belum Lunas' },
          { key: 'payable', label: 'Utang Saya' },
          { key: 'receivable', label: 'Piutang' },
          { key: 'paid', label: 'Lunas' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`chip-tab ${tab === t.key ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(true)}>
          <Plus size={14} /> Catat
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <Users size={48} style={{ margin: '0 auto 12px', color: 'var(--color-text-muted)' }} />
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Tidak ada data utang-piutang</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(d => {
            const daysLeft = getDaysUntil(d.due_date);
            const isOverdue = daysLeft !== null && daysLeft < 0 && d.status === 'pending';
            return (
              <div key={d.id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: d.type === 'payable' ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {d.type === 'payable'
                      ? <ArrowDownLeft size={18} color="#f43f5e" />
                      : <ArrowUpRight size={18} color="#10b981" />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ minWidth: 120, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{d.party_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {d.type === 'payable' ? 'Utang ke' : 'Piutang dari'} · {d.note}
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: d.type === 'payable' ? '#f43f5e' : '#10b981' }}>
                          {formatCurrency(d.amount)}
                        </div>
                        <span className={`badge ${d.status === 'paid' ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                          {d.status === 'paid' ? 'Lunas' : isOverdue ? 'Overdue!' : 'Belum lunas'}
                        </span>
                      </div>
                    </div>
                    {d.due_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11 }}>
                        <Clock size={11} color={isOverdue ? '#f43f5e' : 'var(--color-text-muted)'} />
                        <span style={{ color: isOverdue ? '#f43f5e' : 'var(--color-text-muted)' }}>
                          Jatuh tempo: {formatDate(d.due_date)}
                          {daysLeft !== null && d.status === 'pending' && (
                            <> · {daysLeft >= 0 ? `${daysLeft} hari lagi` : `${Math.abs(daysLeft)} hari lewat`}</>
                          )}
                        </span>
                      </div>
                    )}
                    {d.status === 'pending' && (
                      <button onClick={() => updateDebtStatus(d.id, 'paid')}
                        className="btn btn-secondary btn-sm" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={12} /> Tandai Lunas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Catat Utang / Piutang</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
                {['payable', 'receivable'].map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      background: form.type === t ? (t === 'payable' ? 'linear-gradient(135deg,#f43f5e,#e11d48)' : 'linear-gradient(135deg,#10b981,#059669)') : 'transparent',
                      color: form.type === t ? 'white' : 'var(--color-text-muted)',
                      transition: 'all 0.2s',
                    }}>
                    {t === 'payable' ? 'Utang Saya' : 'Piutang'}
                  </button>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  {form.type === 'payable' ? 'Utang ke siapa?' : 'Piutang dari siapa?'}
                </label>
                <input className="input-field" placeholder="Nama teman..." value={form.party_name} onChange={e => setForm(p => ({ ...p, party_name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Jumlah (Rp)</label>
                <input className="input-field" type="number" placeholder="50000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min="1000" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Jatuh Tempo (opsional)</label>
                <input className="input-field" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Keterangan</label>
                <input className="input-field" placeholder="Patungan makan, pinjam uang, ..." value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
