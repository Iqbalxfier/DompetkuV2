const nodemailer = require('nodemailer');

async function sendResetOTPEmail(toEmail, resetToken) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_USER, EMAIL_PASS } = process.env;

  const user = EMAIL_USER || SMTP_USER;
  const pass = EMAIL_PASS || SMTP_PASS;

  // Jika kredensial email dikonfigurasi di .env, kirim email fisik
  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST || 'smtp.gmail.com',
        port: Number(SMTP_PORT) || 465,
        secure: (Number(SMTP_PORT) || 465) === 465, // true for 465, false for other ports
        auth: { user, pass }
      });

      const mailOptions = {
        from: `"Dompetku Finance" <${user}>`,
        to: toEmail,
        subject: '🔐 Kode OTP Reset Password — Dompetku',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #6366f1; margin: 0;">Dompetku V2</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Asisten Keuangan Pribadi</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
              <p style="color: #334155; font-size: 14px; margin-bottom: 12px;">Halo, Anda menerima email ini karena ada permintaan reset password akun <strong>${toEmail}</strong>.</p>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 6px;">Kode OTP Reset Password Anda:</p>
              <div style="font-size: 32px; font-weight: 800; color: #6366f1; letter-spacing: 6px; margin: 10px 0;">${resetToken}</div>
              <p style="color: #ef4444; font-size: 11px; margin-top: 8px;">⏰ Kode ini berlaku selama 15 menit. Jangan bagikan kode ini kepada siapapun.</p>
            </div>
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Jika Anda tidak merasa meminta reset password, silakan abaikan email ini.</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL SUCCESS] Kode OTP telah dikirim ke ${toEmail} (ID: ${info.messageId})`);
      return { success: true, mode: 'smtp' };
    } catch (err) {
      console.error('❌ [EMAIL ERROR] Gagal mengirim email via SMTP:', err.message);
      // Fallback log ke console jika SMTP error
    }
  }

  // Fallback Simulator di Terminal (jika .env belum dikonfigurasi)
  console.log(`\n==================================================`);
  console.log(`✉️  [SIMULASI EMAIL TERMINAL]`);
  console.log(`Kepada: ${toEmail}`);
  console.log(`Subjek: Kode OTP Reset Password Dompetku`);
  console.log(`Kode OTP: ${resetToken} (Berlaku 15 menit)`);
  console.log(`==================================================\n`);
  return { success: true, mode: 'simulator' };
}

module.exports = { sendResetOTPEmail };
