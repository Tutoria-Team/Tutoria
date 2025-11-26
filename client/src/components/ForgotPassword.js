import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = request OTP, 2 = reset password

  const requestOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/request-password-reset', { email });
      setStep(2);
      alert('OTP sent to your email');
    } catch (err) {
      alert(err.response?.data?.error || 'Error sending OTP');
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reset-password', { email, otp, newPassword });
      alert('Password reset successful!');
      setView('login'); // return to login form in popup
    } catch (err) {
      alert(err.response?.data?.error || 'Error resetting password');
    }
  };

  return (
    <form className="auth-form" onSubmit={step === 1 ? requestOtp : resetPassword}>
      {step === 1 && (
        <>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Send OTP</button>
        </>
      )}
      {step === 2 && (
        <>
          <input
            type="text"
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </>
      )}
      <div className="auth-footer">
        <span
          className="link-text"
          style={{ cursor: 'pointer' }}
          onClick={() => setView('login')}
        >
          Back to Login
        </span>
      </div>
    </form>
  );
};

export default ForgotPassword;
