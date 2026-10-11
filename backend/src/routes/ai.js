const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// POST /api/ai/chat - Tanya Groq AI dengan Konteks Keuangan
router.post('/chat', auth, async (req, res) => {
  const { message, context } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Pesan tidak boleh kosong.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return res.status(503).json({
      message: 'GROQ_API_KEY belum dikonfigurasi di server backend.',
      useFallback: true
    });
  }

  try {
    // Format ringkasan keuangan untuk System Prompt
    const financialSummary = context ? `
=== DATA KEUANGAN RIIL PENGGUNA SAAT INI ===
- Total Saldo: Rp ${Number(context.totalBalance || 0).toLocaleString('id-ID')}
- Pemasukan Bulan Ini: Rp ${Number(context.totalIncome || 0).toLocaleString('id-ID')}
- Pengeluaran Bulan Ini: Rp ${Number(context.totalExpense || 0).toLocaleString('id-ID')}
- Jumlah Dompet Aktif: ${context.wallets?.length || 0} dompet (${(context.wallets || []).map(w => `${w.name}: Rp ${Number(w.balance).toLocaleString('id-ID')}`).join(', ')})
- Budget Alergen / Kritis: ${(context.budgetAlerts || []).map(b => `${b.categoryName} (${b.percentage}% limit terpakai)`).join(', ') || 'Semua budget masih di bawah 80%'}
- Transaksi Pengeluaran Terbesar: ${context.largestExpense ? `${context.largestExpense.categoryName} (Rp ${Number(context.largestExpense.amount).toLocaleString('id-ID')})` : 'Belum ada'}
` : 'Data keuangan tidak tersedia.';

    const systemPrompt = `Kamu adalah "Dompetku AI", Asisten Finansial Pribadi Pintar yang ramah, solutif, empatik, dan berbahasa Indonesia yang alami (cocok untuk anak kost, mahasiswa, dan pekerja muda).

Tugas utamamu:
1. Menjawab pertanyaan keuangan pengguna berdasarkan data keuangan riil mereka di bawah ini.
2. Memberikan analisa rasional saat pengguna menanyakan skenario belanja (misal: "apakah saldo saya cukup untuk beli HP 2 juta?").
3. Memberikan tips penghematan yang praktis dan realistis.
4. Gunakan format Markdown (seperti bold **teks**, list/bullet, emoji) agar jawaban mudah dibaca.
5. Jawab secara ringkas, to the point, dan informatif (maksimal 3-4 paragraf).

${financialSummary}`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      })
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API Error response:', groqResponse.status, errText);

      // Try fallback to lighter model llama-3.1-8b-instant if 70b failed
      const fallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        })
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Groq API returned HTTP ${groqResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      const reply = fallbackData.choices?.[0]?.message?.content;
      return res.json({
        reply,
        provider: 'Groq AI (Llama 3.1 8B)'
      });
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content;

    res.json({
      reply,
      provider: 'Groq AI (Llama 3.3 70B)'
    });

  } catch (error) {
    console.error('🔥 AI Route Error:', error.message);
    res.status(500).json({
      message: 'Gagal terhubung ke service Groq AI.',
      error: error.message,
      useFallback: true
    });
  }
});

module.exports = router;
