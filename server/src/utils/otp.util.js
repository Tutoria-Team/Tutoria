const crypto = require('crypto');
const createTransporter = require('./mailer.util');

/**
 * Generates a 6-digit OTP and its expiry timestamp (10 minutes from now).
 */
const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  return { otp, otpExpiry };
};

/**
 * Sends an OTP to the given email address.
 * In development, logs the OTP to the console instead of sending a real email.
 */
const sendOtp = async (email, otp) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📬 OTP for ${email}: ${otp}`);
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Your Tutoria OTP Code',
    text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
    html: `
      <p>Your Tutoria verification code is:</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });

  console.log(`📬 OTP sent to ${email}`);
};

module.exports = { generateOtp, sendOtp };