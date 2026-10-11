import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../lib/utils';
import { Plus, Edit2, Trash2, Check, X, ArrowLeftRight } from 'lucide-react';
import { WALLET_TYPES, WALLET_COLORS } from '../lib/utils';
import Icon from '../components/ui/Icon';

export default function Wallets() {
  const { wallets, addWallet, updateWallet, deleteWallet, transferBalance } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [form, setForm] = useState({ name: '', type: 'cash', balance: '', color: '#6366f1', icon: 'Wallet' });
  const [transferForm, setTransferForm] = useState({
    from_wallet_id: wallets[0]?.id || '',
    to_wallet_id: wallets[1]?.id || '',
    amount: '',
    note: ''
  });
  const [transferError, setTransferError] = useState('');

  const ICONS = ['Wallet', 'Smartphone', 'Landmark', 'PiggyBank', 'CreditCard', 'Coins', 'TrendingUp', 'Sparkles'];

  function openAddModal() {
    setEditId(null);
    setForm({ name: '', type: 'cash', balance: '', color: '#6366f1', icon: 'Wallet' });
    setShowForm(true);
  }

  function openEditModal(wallet) {
    setEditId(wallet.id);
    setForm({
      name: wallet.name,
      type: wallet.type || 'cash',
      balance: wallet.balance,
      color: wallet.color || '#6366f1',
      icon: wallet.icon || 'Wallet',
    });
    setShowForm(true);
  }

  function openTransferModal() {
    if (wallets.length < 2) {
      alert('Anda membutuhkan minimal 2 dompet untuk melakukan transfer.');
      return;
    }
    setTransferError('');
    setTransferForm({
      from_wallet_id: wallets[0]?.id || '',
      to_wallet_id: wallets[1]?.id || '',
      amount: '',
      note: ''
    });
    setShowTransferForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editId) {
      await updateWallet(editId, { ...form, balance: Number(form.balance) });
    } else {
      await addWallet({ ...form, balance: Number(form.balance) });
    }
    setShowForm(false);
    setEditId(null);
    setForm({ name: '', type: 'cash', balance: '', color: '#6366f1', icon: 'Wallet' });
  }

  async function handleTransferSubmit(e) {
    e.preventDefault();
    setTransferError('');
    const fromId = Number(transferForm.from_wallet_id);
    const toId = Number(transferForm.to_wallet_id);
    const amount = Number(transferForm.amount);

    if (fromId === toId) {
      setTransferError('Dompet asal dan tujuan tidak boleh sama.');
      return;
    }
    const fromWallet = wallets.find(w => w.id === fromId);
    if (fromWallet && fromWallet.balance < amount) {
      setTransferError(`Saldo ${fromWallet.name} tidak mencukupi (${formatCurrency(fromWallet.balance)}).`);
      return;
    }

    await transferBalance(fromId, toId, amount, transferForm.note);
    setShowTransferForm(false);
  }

  async function handleDelete(id) {
    await deleteWallet(id);
    setDeleteConfirm(null);
  }

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <>
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Total */}
      <div className="glass-card gradient-primary" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>Total Saldo Semua Dompet</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{formatCurrency(totalBalance)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{wallets.length} dompet aktif</div>
        </div>
        <div style={{ position: 'absolute', top: -40, right: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>Dompet & Rekening</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={openTransferModal} style={{ gap: 6 }}>
            <ArrowLeftRight size={14} /> Transfer
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}><Plus size={14} /> Tambah</button>
        </div>
      </div>

      {/* Wallet grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {wallets.map(w => (
          <div key={w.id} className="wallet-card" style={{
            background: `linear-gradient(135deg, ${w.color}, ${w.color}aa)`,
            padding: 20, cursor: 'default', position: 'relative',
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ color: 'white' }}>
                  <Icon name={w.icon || 'Wallet'} size={24} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.2)',
                    fontSize: 10, color: 'white', fontWeight: 600, textTransform: 'uppercase',
                  }}>{w.type}</span>
                  <button
                    onClick={() => openEditModal(w)}
                    style={{
                      background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                      width: 26, height: 26, color: 'white', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                    }}
                    title="Edit Dompet"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>{w.name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{formatCurrency(w.balance)}</div>
            </div>
          </div>
        ))}

        {/* Add card */}
        <button onClick={openAddModal} style={{
          minHeight: 140, borderRadius: 20, border: '2px dashed var(--color-border)',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <Plus size={24} />
          Tambah Dompet
        </button>
      </div>

      {/* Breakdown table */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Rincian Dompet</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {wallets.map((w, i) => {
            const pct = totalBalance > 0 ? (w.balance / totalBalance) * 100 : 0;
            return (
              <div key={w.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderBottom: i < wallets.length - 1 ? '1px solid var(--color-border)' : 'none',
                minWidth: 0,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: w.color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: w.color,
                  flexShrink: 0,
                }}>
                  <Icon name={w.icon || 'Wallet'} size={16} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {w.name}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                      {formatCurrency(w.balance)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ height: 4, flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: w.color }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 2 }}>
                  <button
                    onClick={() => openEditModal(w)}
                    style={{
                      width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Edit"
                  >
                    <Edit2 size={12} />
                  </button>
                  {deleteConfirm === w.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleDelete(w.id)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Konfirmasi hapus"
                      ><Check size={12} /></button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--color-bg-card-hover)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Batal"
                      ><X size={12} /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(w.id)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(244,63,94,0.1)', color: '#f43f5e',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>

      {/* Form Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {editId ? 'Edit Dompet' : 'Tambah Dompet Baru'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Nama Dompet</label>
                <input className="input-field" placeholder="GoPay, BCA, Cash..." value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Jenis</label>
                <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {WALLET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Saldo (Rp)</label>
                <input className="input-field" type="number" placeholder="0" value={form.balance} onChange={e => setForm(p => ({ ...p, balance: e.target.value }))} min="0" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Ikon</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm(p => ({ ...p, icon: ic }))}
                      style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${form.icon === ic ? '#6366f1' : 'var(--color-border)'}`, background: form.icon === ic ? 'rgba(99,102,241,0.15)' : 'transparent', color: form.icon === ic ? '#6366f1' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Icon name={ic} size={20} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Warna</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {WALLET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                      style={{ width: 32, height: 32, borderRadius: 8, background: c, border: `3px solid ${form.color === c ? 'white' : 'transparent'}`, cursor: 'pointer', transition: 'transform 0.1s' }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editId ? 'Simpan Perubahan' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferForm && (
        <div className="modal-overlay" onClick={() => setShowTransferForm(false)}>
          <div className="modal-content" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeftRight size={18} color="#6366f1" /> Transfer Saldo Antar Dompet
            </h3>

            {transferError && (
              <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, fontSize: 12, color: '#f43f5e', marginBottom: 14 }}>
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Dari Dompet (Asal)</label>
                <select className="input-field" value={transferForm.from_wallet_id} onChange={e => setTransferForm(p => ({ ...p, from_wallet_id: e.target.value }))} required>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Ke Dompet (Tujuan)</label>
                <select className="input-field" value={transferForm.to_wallet_id} onChange={e => setTransferForm(p => ({ ...p, to_wallet_id: e.target.value }))} required>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Nominal Transfer (Rp)</label>
                <input className="input-field" type="number" placeholder="contoh: 100000" value={transferForm.amount} onChange={e => setTransferForm(p => ({ ...p, amount: e.target.value }))} required min="1" />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Catatan (Opsional)</label>
                <input className="input-field" placeholder="contoh: Tarik tunai, Top up GoPay..." value={transferForm.note} onChange={e => setTransferForm(p => ({ ...p, note: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowTransferForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Proses Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
