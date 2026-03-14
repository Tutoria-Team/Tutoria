const nodemailer = require('nodemailer');

/**
 * Returns a configured nodemailer transporter.
 * In development, uses Ethereal (fake SMTP) so no real emails are sent.
 * In production, reads SMTP credentials from environment variables.
 */
const createTransporter = () => {
  if (process.env.NODE_ENV !== 'production') {
    // Ethereal catches all outgoing mail — check console for preview URL
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal_user',
        pass: process.env.ETHEREAL_PASS || 'ethereal_pass',
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

module.exports = createTransporter;