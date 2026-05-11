const nodemailer = require('nodemailer');

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!host || !user || !pass || !from) return null;

  return {
    host,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    auth: { user, pass },
    from
  };
}

function isEmailConfigured() {
  return !!smtpConfig();
}

function emailStatus() {
  const config = smtpConfig();
  return {
    configured: !!config,
    host: config?.host || null,
    port: config?.port || null,
    from: config?.from || null
  };
}

async function sendTransactionalEmail({ to, subject, html, text }) {
  const config = smtpConfig();
  if (!config) {
    console.warn(`Email nao enviado para ${to}: SMTP nao configurado.`);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
    text
  });

  return { sent: true };
}

module.exports = {
  emailStatus,
  isEmailConfigured,
  sendTransactionalEmail
};
