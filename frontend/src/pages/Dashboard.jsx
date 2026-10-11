import React, { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { formatCurrency, formatDateShort, getCategoryById, getWalletById, getMonthName, getDaysUntil } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js';
import {
  TrendingUp, TrendingDown, Wallet, Plus, ArrowRight,
  AlertTriangle, Target, Bell, Users, Eye, EyeOff, PlusCircle, CreditCard, History
} from 'lucide-react';
import Icon from '../components/ui/Icon';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

export default function Dashboard() {
  const { wallets, transactions, budgets, bills, categories, totalBalance, totalIncome, totalExpense, currentMonth, currentYear, isLoading } = useApp();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  // Spending by category this month
  const thisMonthTx = useMemo(() => {
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const spendingByCategory = useMemo(() => {
    const map = {};
    thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.category_id] = (map[t.category_id] || 0) + t.amount;
    });
    return Object.entries(map).map(([catId, amount]) => {
      const cat = getCategoryById(categories, Number(catId));
      return { ...cat, amount };
    }).filter(Boolean).sort((a, b) => b.amount - a.amount);
  }, [thisMonthTx, categories]);

  // Last 7 days trend
  const trendData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();
      const targetDay = d.getDate();

      const dayTx = transactions.filter(t => {
        if (t.type !== 'expense' || !t.date) return false;
        const td = new Date(t.date);
        return td.getFullYear() === targetYear &&
               td.getMonth() === targetMonth &&
               td.getDate() === targetDay;
      });

      const dateLabelStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      days.push({
        date: formatDateShort(dateLabelStr),
        total: dayTx.reduce((s, t) => s + t.amount, 0)
      });
    }
    return days;
  }, [transactions]);

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    return budgets.map(b => {
      const spent = thisMonthTx.filter(t => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((s, t) => s + t.amount, 0);
      const pct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
      const cat = getCategoryById(categories, b.category_id);
      return { ...b, spent, pct, cat };
    }).filter(b => b.pct >= 70).sort((a, b) => b.pct - a.pct);
  }, [budgets, thisMonthTx, categories]);

  // Urgent Bill reminders
  const urgentBills = useMemo(() => {
    const now = new Date();
    return bills.filter(b => b.is_active).map(b => {
      const target = new Date(now.getFullYear(), now.getMonth(), b.due_day);
      if (target < now) target.setMonth(target.getMonth() + 1);
      const dateStr = target.toISOString().split('T')[0];
      const daysLeft = getDaysUntil(dateStr);
      return { ...b, daysLeft };
    }).filter(b => b.daysLeft !== null && b.daysLeft <= 3);
  }, [bills]);

  const recentTx = transactions.slice(0, 5);

  const doughnutData = {
    labels: spendingByCategory.slice(0, 6).map(c => c.name),
    datasets: [{
      data: spendingByCategory.slice(0, 6).map(c => c.amount),
      backgroundColor: spendingByCategory.slice(0, 6).map(c => c.color || '#6366f1'),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const lineData = {
    labels: trendData.map(d => d.date),
    datasets: [{
      label: 'Pengeluaran',
      data: trendData.map(d => d.total),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 12, left: 4, top: 8, bottom: 4 } },
    plugins: { legend: { display: false }, tooltip: {
      callbacks: { label: ctx => ' Pengeluaran: ' + formatCurrency(ctx.parsed?.y ?? ctx.raw ?? 0) },
    }},
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => 'Rp' + (v/1000) + 'k' } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` } },
    },
    cutout: '70%',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Alert Notifications */}
      {budgetAlerts.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 500, flex: 1 }}>
            {budgetAlerts.length} budget mendekati/melebihi limit
          </span>
          <button onClick={() => navigate('/budget')} style={{
            fontSize: 12, color: '#f59e0b', background: 'none', border: 'none',
            cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          }}>Lihat <ArrowRight size={12} /></button>
        </div>
      )}

      {urgentBills.length > 0 && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Bell size={18} color="#f43f5e" />
          <span style={{ fontSize: 13, color: '#f43f5e', fontWeight: 500, flex: 1 }}>
            {urgentBills.length} tagihan rutin jatuh tempo!
          </span>
          <button onClick={() => navigate('/bills')} style={{
            fontSize: 12, color: '#f43f5e', background: 'none', border: 'none',
            cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          }}>Bayar <ArrowRight size={12} /></button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MOBILE SPECIFIC UI SECTION */}
      {/* ======================================================== */}
      <div className="mobile-only-flex" style={{ flexDirection: 'column', gap: 18 }}>
        {/* Mobile Hero Balance Card */}
        <div className="mobile-hero-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.5px' }}>
              TOTAL SALDO SAYA
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 20,
                padding: '4px 10px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
              {showBalance ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>

          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.5px' }}>
            {showBalance ? formatCurrency(totalBalance) : '••••••••••••'}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="#4ade80" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>
                +{showBalance ? formatCurrency(totalIncome) : '•••'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingDown size={14} color="#f87171" />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>
                -{showBalance ? formatCurrency(totalExpense) : '•••'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action App Launcher Grid */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Aksi Cepat
          </div>
          <div className="quick-actions-grid">
            <div onClick={() => navigate('/transactions/add')} className="quick-action-item">
              <div className="quick-action-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                <PlusCircle size={22} />
              </div>
              <span className="quick-action-label">Catat Tx</span>
            </div>
            <div onClick={() => navigate('/bills')} className="quick-action-item">
              <div className="quick-action-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Bell size={22} />
              </div>
              <span className="quick-action-label">Tagihan</span>
            </div>
            <div onClick={() => navigate('/debts')} className="quick-action-item">
              <div className="quick-action-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <Users size={22} />
              </div>
              <span className="quick-action-label">Utang</span>
            </div>
            <div onClick={() => navigate('/wallets')} className="quick-action-item">
              <div className="quick-action-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
                <CreditCard size={22} />
              </div>
              <span className="quick-action-label">Dompet</span>
            </div>
          </div>
        </div>

        {/* Horizontal Dompet Cards Slider for Mobile */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Dompet Aktif</span>
            <button onClick={() => navigate('/wallets')} style={{ fontSize: 11, color: 'var(--color-accent)', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Lihat Semua
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {wallets.map(w => (
              <div key={w.id} className="wallet-card" style={{
                minWidth: 140, padding: 14, background: w.color,
                backgroundImage: `linear-gradient(135deg, ${w.color}, ${w.color}cc)`,
              }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ marginBottom: 6, color: 'white' }}>
                    <Icon name={w.icon} size={20} />
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{w.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginTop: 2 }}>
                    {showBalance ? formatCurrency(w.balance) : '••••••'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Pengeluaran per Kategori */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Pengeluaran per Kategori</h3>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{getMonthName(currentMonth, currentYear)}</span>
          </div>
          {spendingByCategory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 120, height: 120 }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {spendingByCategory.slice(0, 5).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatCurrency(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, padding: '24px 0' }}>Belum ada pengeluaran bulan ini</div>
          )}
        </div>

        {/* Mobile Tren 7 Hari Terakhir */}
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>Tren 7 Hari Terakhir</h3>
          <div style={{ height: 150 }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DESKTOP SPECIFIC UI SECTION */}
      {/* ======================================================== */}
      <div className="desktop-only-flex" style={{ flexDirection: 'column', gap: 24 }}>
        {/* Desktop Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          <SummaryCard
            label="Total Saldo"
            value={formatCurrency(totalBalance)}
            icon={<Wallet size={20} />}
            gradient="gradient-primary"
            sub={`${wallets.length} dompet aktif`}
          />
          <SummaryCard
            label="Pemasukan Bulan Ini"
            value={formatCurrency(totalIncome)}
            icon={<TrendingUp size={20} />}
            gradient="gradient-success"
            sub={getMonthName(currentMonth, currentYear)}
          />
          <SummaryCard
            label="Pengeluaran Bulan Ini"
            value={formatCurrency(totalExpense)}
            icon={<TrendingDown size={20} />}
            gradient="gradient-danger"
            sub={`Sisa: ${formatCurrency(totalIncome - totalExpense)}`}
          />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {/* Doughnut */}
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Pengeluaran per Kategori</h3>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{getMonthName(currentMonth, currentYear)}</span>
            </div>
            {spendingByCategory.length > 0 ? (
              <div className="category-chart-container">
                <div style={{ width: 140, height: 140, flexShrink: 0, margin: '0 auto' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
                  {spendingByCategory.slice(0, 5).map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, padding: '30px 0' }}>Belum ada pengeluaran bulan ini</div>
            )}
          </div>

          {/* Line chart */}
          <div className="glass-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Tren 7 Hari Terakhir</h3>
            </div>
            <div style={{ height: 180 }}>
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Wallets quick view */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Dompet Saya</h3>
            <button onClick={() => navigate('/wallets')} style={{
              fontSize: 12, color: 'var(--color-accent)', background: 'none', border: 'none',
              cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            }}>Kelola <ArrowRight size={12} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {wallets.map(w => (
              <div key={w.id} className="wallet-card" style={{
                background: w.color,
                backgroundImage: `linear-gradient(135deg, ${w.color}, ${w.color}cc)`,
              }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ marginBottom: 10, color: 'white' }}>
                    <Icon name={w.icon} size={24} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>{w.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{formatCurrency(w.balance)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', marginTop: 6 }}>{w.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SHARED RECENT TRANSACTIONS SECTION */}
      {/* ======================================================== */}
      <div className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Transaksi Terbaru</h3>
          <button onClick={() => navigate('/transactions')} style={{
            fontSize: 12, color: 'var(--color-accent)', background: 'none', border: 'none',
            cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          }}>Lihat Semua <ArrowRight size={12} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {recentTx.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, padding: '20px 0' }}>
              Belum ada transaksi
            </div>
          )}
          {recentTx.map((tx, i) => {
            const cat = getCategoryById(categories, tx.category_id);
            return (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: i < recentTx.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div className="category-icon" style={{ background: (cat?.color || '#6366f1') + '22', color: cat?.color || '#6366f1' }}>
                  <Icon name={cat?.icon || 'Box'} size={18} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.note || cat?.name || 'Transaksi'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{cat?.name} · {formatDateShort(tx.date)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  {tx.sync_status === 'pending_sync' && (
                    <span className="badge badge-warning" style={{ fontSize: 9 }}>⏳ pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, gradient, sub }) {
  return (
    <div className={`${gradient} wallet-card`} style={{ padding: '18px 20px', minWidth: 0 }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', flexShrink: 0,
          }}>{icon}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2, fontWeight: 500 }}>{label}</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
    </div>
  );
}
