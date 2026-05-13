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
    console.warn(`Email não enviado para ${to}: SMTP não configurado.`);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  const sendWithConfig = async (smtp) => {
    const transporter = nodemailer.creatéTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth,
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 15000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000)
    });

    await transporter.sendMail({
      from: smtp.from,
      to,
      subject,
      html,
      text
    });
  };

  try {
    await sendWithConfig(config);
    return { sent: true };
  } catch (err) {
    const timedOut = ['ETIMEDOUT', 'ESOCKET'].includes(err?.code) || /timeout/i.test(err?.message || '');
    if (config.port === 465 && timedOut) {
      console.warn('SMTP 465 falhou por timeout. A tentar porta 587 com STARTTLS...');
      await sendWithConfig({ ...config, port: 587, secure: false });
      return { sent: true, fallback: '587' };
    }
    throw err;
  }
}

module.exports = {
  emailStatus,
  isEmailConfigured,
  sendTransactionalEmail
};
