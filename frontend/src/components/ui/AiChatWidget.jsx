import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../lib/utils';
import { MessageSquare, X, Send, Sparkles, Bot, User } from 'lucide-react';

export default function AiChatWidget() {
  const { wallets, transactions, budgets, categories, totalBalance, totalIncome, totalExpense } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Halo! Saya asisten AI keuangan pribadi Anda. 🌟 Ada yang bisa saya bantu analisis hari ini?',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Berapa total saldo saya?',
        'Pengeluaran terbesar bulan ini?',
        'Apakah budget saya aman?',
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Fungsi mem-parsing teks untuk ekstraksi angka/nominal budget
  function parseAmount(text) {
    const cleanText = text.toLowerCase();

    // Regex mencari angka dengan imbuhan 'ribu', 'rb', 'juta', 'jt', dll.
    const match = cleanText.match(/(\d+(?:[.,]\d+)?)\s*(ribu|rb|juta|jt|ratus|000)?/);
    if (!match) return null;

    let value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2];

    if (unit === 'ribu' || unit === 'rb') {
      value *= 1000;
    } else if (unit === 'juta' || unit === 'jt') {
      value *= 1000000;
    } else if (unit === 'ratus') {
      value *= 100;
    } else if (value < 1000 && !unit) {
      // Asumsi jika input '700' di konteks percakapan biasa berarti 700 ribu
      value *= 1000;
    }

    return value;
  }

  // AI Response generator berbasis Heuristik Lokal
  function generateLocalResponse(query) {
    const q = query.toLowerCase();

    // 1. SKENARIO BUDGET SIMULASI (Contoh: "jika saya naik gunung dengan budget 700 ribu apakah cukup")
    const isScenario = q.includes('cukup') || q.includes('bisa gak') || q.includes('aman gak') || q.includes('beli') || q.includes('biaya');
    const targetAmount = parseAmount(q);

    if (isScenario && targetAmount) {
      // Ekstrak nama rencana/aktivitas
      let activity = 'rencana belanja/kegiatan Anda';
      if (q.includes('naik gunung')) activity = 'rencana naik gunung';
      else if (q.includes('beli sepatu')) activity = 'pembelian sepatu';
      else if (q.includes('beli hp')) activity = 'pembelian HP';
      else if (q.includes('liburan') || q.includes('jalan')) activity = 'rencana liburan/jalan-jalan';
      else if (q.includes('beli')) {
        const words = q.split(' ');
        const beliIdx = words.findIndex(w => w.includes('beli'));
        if (beliIdx !== -1 && words[beliIdx + 1]) {
          activity = `pembelian ${words[beliIdx + 1]}`;
        }
      }

      if (totalBalance < targetAmount) {
        const selisih = targetAmount - totalBalance;
        return `⚠️ **Skenario Finansial:**\n\nUntuk **${activity}** dengan budget **${formatCurrency(targetAmount)}**, saldo dompet Anda saat ini (**${formatCurrency(totalBalance)}**) **TIDAK CUKUP**.\n\nAnda masih kekurangan sebesar **${formatCurrency(selisih)}**. Sebaiknya tunda rencana ini, menabung lebih giat lagi, atau cari opsi alternatif yang lebih hemat! 📉`;
      } else {
        const sisa = totalBalance - targetAmount;
        // Tips tambahan berdasarkan sisa uang
        let tips = 'Pastikan untuk selalu mencatat pengeluaran kecil selama kegiatan agar budget tidak bocor!';
        if (sisa < totalBalance * 0.2) {
          tips = 'Peringatan: saldo sisa Anda akan menipis (kurang dari 20% total saldo saat ini). Lakukan penghematan ekstra!';
        } else {
          tips = 'Kondisi kas Anda aman! Sisa saldo masih di atas batas aman tabungan cadangan Anda.';
        }
        return `✅ **Skenario Finansial:**\n\nSaldo Anda saat ini (**${formatCurrency(totalBalance)}**) **CUKUP** untuk membiayai **${activity}** sebesar **${formatCurrency(targetAmount)}**.\n\nSetelah pengeluaran ini, sisa saldo Anda akan menjadi **${formatCurrency(sisa)}**.\n\n💡 *Tips:* ${tips}`;
      }
    }

    // 2. TANYA SALDO / KEUANGAN UMUM
    if (q.includes('saldo') || q.includes('uang') || q.includes('dompet') || q.includes('duit')) {
      const activeWalletsInfo = wallets.map(w => `- **${w.name}**: ${formatCurrency(w.balance)}`).join('\n');
      return `Total saldo Anda di semua dompet saat ini adalah **${formatCurrency(totalBalance)}** dari **${wallets.length}** dompet aktif.\n\nRincian saldo:\n${activeWalletsInfo}\n\nAda transaksi baru yang ingin dicatat? 💳`;
    }

    // 3. TANYA BOROS / PENGELUARAN TERBESAR
    if (q.includes('boros') || q.includes('pengeluaran terbesar') || q.includes('paling banyak') || q.includes('kategori')) {
      if (transactions.length === 0) {
        return 'Belum ada transaksi pengeluaran yang tercatat di database.';
      }

      const expenses = transactions.filter(t => t.type === 'expense');
      if (expenses.length === 0) {
        return 'Tidak ada riwayat pengeluaran bulan ini.';
      }

      const catMap = {};
      expenses.forEach(t => {
        catMap[t.category_id] = (catMap[t.category_id] || 0) + t.amount;
      });

      const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
      const largestCatId = Number(sorted[0][0]);
      const totalAmount = sorted[0][1];

      const matchedCat = categories.find(c => c.id === largestCatId);

      return `Pengeluaran terbesar Anda bulan ini adalah di kategori **${matchedCat?.name || 'Lainnya'}** dengan total nominal **${formatCurrency(totalAmount)}**.\n\n💡 *Rekomendasi:* Cobalah untuk memperketat budget pada kategori ini di halaman target budget agar pengeluaran Anda lebih terkendali!`;
    }

    // 4. TANYA BUDGET / LIMIT
    if (q.includes('budget') || q.includes('limit') || q.includes('target')) {
      if (budgets.length === 0) {
        return 'Anda belum menetapkan target budget bulanan. Yuk buat di halaman **Budget** agar keuangan Anda lebih terencana! 🎯';
      }

      // Hitung budget yang hampir habis (>80%)
      const alerts = [];
      budgets.forEach(b => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category_id === b.category_id)
          .reduce((s, t) => s + t.amount, 0);
        const pct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
        const cat = categories.find(c => c.id === b.category_id);

        if (pct >= 80) {
          alerts.push(`- Kategori **${cat?.name}** terpakai **${pct.toFixed(0)}%** (${formatCurrency(spent)} dari ${formatCurrency(b.limit_amount)})`);
        }
      });

      if (alerts.length > 0) {
        return `⚠️ **Status Budget Kritis:**\n\nBeberapa target budget Anda hampir atau sudah terlampaui:\n${alerts.join('\n')}\n\nHarap kurangi pengeluaran di kategori tersebut!`;
      } else {
        return `✅ Semua target budget bulanan Anda masih di bawah batas aman (terpakai kurang dari 80%). Kerja bagus dalam menjaga pengeluaran! 📈`;
      }
    }

    // 5. TIPS MENGHEMAT / REKOMENDASI
    if (q.includes('tips') || q.includes('hemat') || q.includes('saran') || q.includes('tabung')) {
      const rasio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 100;
      let advice = 'Rasio pengeluaran Anda cukup stabil. Pertahankan gaya hidup saat ini!';
      if (rasio > 80) {
        advice = 'Awas! Pengeluaran Anda hampir menghabiskan seluruh pemasukan bulan ini. Prioritaskan kebutuhan pokok dan tunda belanja barang sekunder.';
      } else if (rasio < 50 && totalIncome > 0) {
        advice = 'Luar biasa! Anda menghemat lebih dari 50% pemasukan. Sangat disarankan untuk menginvestasikan sebagian tabungan ke produk reksa dana atau emas.';
      }

      return `💡 **Tips Finansial untuk Anda:**\n\n1. **Prinsip 50/30/20**: Alokasikan 50% untuk kebutuhan, 30% keinginan, dan 20% untuk tabungan/investasi.\n2. **Evaluasi Rutin**: ${advice}\n3. **Dana Darurat**: Usahakan memiliki dana darurat minimal sebesar 3-6 kali pengeluaran bulanan Anda.`;
    }

    // 6. SAPAAN / DEFAULT FALLBACK
    return `Saya memahami pertanyaan Anda. Sebagai asisten AI, Anda bisa meminta saya menganalisis beberapa hal:
    
- 💰 *"Berapa total saldo uang saya saat ini?"*
- 🛍️ *"Kategori pengeluaran apa yang paling boros?"*
- 📊 *"Apakah limit budget bulanan saya masih aman?"*
- ⛰️ *"Jika saya naik gunung dengan budget 700 ribu apakah cukup?"* (Tanyakan kecukupan budget/skenario belanja)
- 💡 *"Berikan tips menghemat uang"*`;
  }

  const handleSend = async (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    const token = localStorage.getItem('token');
    let aiReply = null;

    if (navigator.onLine && token) {
      try {
        const res = await fetch('http://localhost:5000/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: textToSend,
            context: {
              totalBalance,
              totalIncome,
              totalExpense,
              wallets,
              budgets: budgets.map(b => {
                const cat = categories.find(c => c.id === b.category_id);
                const spent = transactions.filter(t => t.type === 'expense' && t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0);
                const percentage = b.limit_amount > 0 ? ((spent / b.limit_amount) * 100).toFixed(0) : 0;
                return { categoryName: cat?.name || 'Kategori', limit: b.limit_amount, spent, percentage };
              }),
              categories
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.reply) {
            aiReply = data.reply;
          }
        }
      } catch (err) {
        console.warn('Groq AI API error, beralih ke Smart Engine lokal:', err.message);
      }
    }

    // Graceful fallback jika offline / Groq gagal
    if (!aiReply) {
      aiReply = generateLocalResponse(textToSend);
    }

    setMessages(prev => [...prev, {
      id: prev.length + 1,
      sender: 'ai',
      text: aiReply,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ai-chat-trigger"
        title="Tanya AI Asisten"
      >
        {isOpen ? <X size={22} /> : <Bot size={22} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={16} color="#c7d2fe" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                Tanya Asisten AI <span style={{ fontSize: 10, background: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Groq ⚡</span>
              </div>
              <div style={{ fontSize: 10, color: '#c7d2fe' }}>Llama-3.3-70B • Smart Financial Advisor</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                opacity: 0.8,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user' ? 'var(--color-accent, #6366f1)' : 'var(--color-bg-primary)',
                  color: msg.sender === 'user' ? 'white' : 'var(--color-text-primary)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: msg.sender === 'user' ? 'none' : '1px solid var(--color-border)',
                  whiteSpace: 'pre-line',
                }}>
                  {msg.text.split('**').map((part, index) =>
                    index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                  )}
                </div>
                <div style={{
                  fontSize: 9,
                  color: 'var(--color-text-muted)',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  padding: '0 4px',
                }}>
                  {msg.time}
                </div>

                {/* Suggestions / Rekomendasi tombol pintas */}
                {msg.suggestions && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginTop: 8,
                  }}>
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(sug)}
                        style={{
                          background: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: '#6366f1',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 11,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                        }}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 6, alignItems: 'center', background: 'var(--color-bg-primary)', padding: '10px 16px', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--color-border)' }}>
                <span className="dot-blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
                <span className="dot-blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animationDelay: '0.2s' }} />
                <span className="dot-blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: 'var(--color-bg-primary)',
            }}
          >
            <input
              type="text"
              placeholder="Tanya asisten finansial..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                borderRadius: 12,
                padding: '8px 14px',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: inputText.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--color-border)',
                color: 'white',
                border: 'none',
                cursor: inputText.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
