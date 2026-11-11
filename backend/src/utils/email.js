import nodemailer from 'nodemailer';

const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'zahmedasim@gmail.com';
const APP_PASSWORD = process.env.SMTP_APP_PASSWORD || 'qcpnnwjiywqrfzrt';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: FROM_EMAIL,
    pass: APP_PASSWORD,
  },
});

/**
 * Send 6-digit OTP email.
 * @param {'forgot' | 'change'} context
 */
export async function sendEventEmail(toEmail, subject, bodyHtml, bodyText) {
  try {
    await transporter.sendMail({
      from: `"101 Cyber Div" <${FROM_EMAIL}>`,
      to: toEmail,
      subject,
      text: bodyText || subject,
      html: bodyHtml,
    });
  } catch (_) { /* fail silently for event emails */ }
}

export async function sendOtpEmail(toEmail, otp, context = 'forgot') {
  const isForgot = context === 'forgot';

  const subject = isForgot
    ? 'Password Recovery \u2014 101 Cyber Div'
    : 'Password Change Verification \u2014 101 Cyber Div';

  const heading = isForgot
    ? 'Forgot Password \u2013 OTP Verification'
    : 'Password Change \u2013 OTP Verification';

  const intro = isForgot
    ? 'We received a request to recover your account password. Use the code below to reset your password.'
    : 'You initiated a password change from within the 101 Cyber Div HR Management portal. Use the code below to verify this action.';

  const textBody = [
    `${heading}`,
    '',
    intro,
    '',
    `Your one-time password (OTP): ${otp}`,
    '',
    'This code is valid for 5 minutes. Do not share it with anyone.',
    'If you did not request this, please ignore this email or contact your unit administrator.',
    '',
    '\u2014 101 Cyber Div \u00b7 HR Management Command',
  ].join('\n');

  const htmlBody = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;border-radius:16px;border:1px solid #1e293b;">
      <div style="text-align:center;margin-bottom:20px;">
        <p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#e8edd8;margin:0;">101 Cyber Div</p>
        <h2 style="color:#f1f5f9;margin:8px 0 0;font-size:20px;">${heading}</h2>
      </div>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;">${intro}</p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px 32px;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#e8edd8;">${otp}</span>
        </div>
      </div>
      <p style="color:#64748b;font-size:13px;">This code is valid for <strong style="color:#94a3b8;">5 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#475569;font-size:12px;margin-top:16px;">If you did not request this, please ignore this email or contact your unit administrator.</p>
      <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0;" />
      <p style="color:#475569;font-size:11px;text-align:center;margin:0;">101 Cyber Div &middot; HR Management Command</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"101 Cyber Div" <${FROM_EMAIL}>`,
    to: toEmail,
    subject,
    text: textBody,
    html: htmlBody,
  });
}
