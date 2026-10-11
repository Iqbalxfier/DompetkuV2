import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDate, getDaysUntil } from '../lib/utils';
import { Plus, Bell, CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';

const BILL_CATEGORIES = ['Kost & Sewa', 'Listrik & WiFi', 'Hiburan', 'Transportasi', 'Cicilan', 'Lainnya'];

export default function Bills() {
  const { bills, addBill, updateBill, wallets, payBill } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
  const [form, setForm] = useState({ bill_name: '', amount: '', due_day: '', category: 'Lainnya', note: '' });

  function getDueDate(dueDay) {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), dueDay);
    if (target < now) target.setMonth(target.getMonth() + 1);
    return target.toISOString().split('T')[0];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await addBill({ ...form, amount: Number(form.amount), due_day: Number(form.due_day), is_active: true });
    setShowForm(false);
    setForm({ bill_name: '', amount: '', due_day: '', category: 'Lainnya', note: '' });
  }

  function openPayModal(bill) {
    setSelectedBill(bill);
    setSelectedWalletId(wallets[0]?.id || '');
    setShowPayModal(true);
  }

  async function handleConfirmPay(e) {
    e.preventDefault();
    if (!selectedBill || !selectedWalletId) return;
    await payBill(selectedBill.id, Number(selectedWalletId), selectedBill.amount);
    setShowPayModal(false);
    setSelectedBill(null);
  }

  async function markPaidOnly(id) {
    await updateBill(id, { last_paid: new Date().toISOString().split('T')[0] });
  }

  const totalMonthly = bills.filter(b => b.is_active).reduce((s, b) => s + b.amount, 0);

  return (
    <>
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary card */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Total Tagihan Bulanan</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(totalMonthly)}</div>
          </div>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={24} color="#f59e0b" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Tagihan Rutin</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Tambah</button>
      </div>

      {/* Bill cards */}
      {bills.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <Bell size={48} style={{ margin: '0 auto 12px', color: 'var(--color-text-muted)', opacity: 0.6 }} />
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Belum ada tagihan rutin</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bills.map(bill => {
            const dueDate = getDueDate(bill.due_day);
            const daysLeft = getDaysUntil(dueDate);
            const isUrgent = daysLeft !== null && daysLeft <= 3;
            const isOverdue = daysLeft !== null && daysLeft < 0;

            return (
              <div key={bill.id} className="glass-card" style={{
                padding: 16,
                borderLeft: `3px solid ${isOverdue ? '#f43f5e' : isUrgent ? '#f59e0b' : '#10b981'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: isOverdue ? 'rgba(244,63,94,0.15)' : isUrgent ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isOverdue ? <AlertTriangle size={20} color="#f43f5e" /> : isUrgent ? <Clock size={20} color="#f59e0b" /> : <Bell size={20} color="#10b981" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ minWidth: 120, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{bill.bill_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{bill.category}</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{formatCurrency(bill.amount)}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>per bulan</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: 12, color: isOverdue ? '#f43f5e' : isUrgent ? '#f59e0b' : 'var(--color-text-muted)', fontWeight: 500 }}>
                        <Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {isOverdue
                          ? `Overdue ${Math.abs(daysLeft)} hari`
                          : daysLeft === 0
                            ? 'Jatuh tempo hari ini!'
                            : `${daysLeft} hari lagi (tgl ${bill.due_day})`
                        }
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openPayModal(bill)}
                          className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                          <CreditCard size={12} /> Bayar Sekarang
                        </button>
                        <button onClick={() => markPaidOnly(bill.id)}
                          className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }} title="Tandai sudah bayar tanpa memotong saldo">
                          <CheckCircle size={12} /> Tandai
                        </button>
                      </div>
                    </div>
                    {bill.last_paid && (
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        Terakhir bayar: {formatDate(bill.last_paid)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>

      {/* Add Bill Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Tambah Tagihan Rutin</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Nama Tagihan</label>
                <input className="input-field" placeholder="Sewa kost, WiFi, Listrik..." value={form.bill_name} onChange={e => setForm(p => ({ ...p, bill_name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Nominal (Rp)</label>
                <input className="input-field" type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min="0" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Tanggal Jatuh Tempo (setiap bulan)</label>
                <input className="input-field" type="number" placeholder="1-31" value={form.due_day} onChange={e => setForm(p => ({ ...p, due_day: e.target.value }))} required min="1" max="31" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Kategori</label>
                <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {BILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Catatan (opsional)</label>
                <input className="input-field" placeholder="Kost Pak Haji lantai 2..." value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {showPayModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="#6366f1" /> Bayar Tagihan
            </h3>
            <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedBill.bill_name}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#6366f1', marginTop: 4 }}>
                {formatCurrency(selectedBill.amount)}
              </div>
            </div>

            <form onSubmit={handleConfirmPay} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Pilih Dompet Pembayaran</label>
                <select className="input-field" value={selectedWalletId} onChange={e => setSelectedWalletId(e.target.value)} required>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPayModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Konfirmasi Bayar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
