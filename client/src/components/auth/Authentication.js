import '../../styles/auth.css';
import React, { useState } from 'react';
import Signup from './Signup';
import OtpVerification from './OtpVerification';
import Login from './Login';
import ForgotPassword from './ForgotPassword';

const Authentication = ({ setShowAuth, setUser, initialView = 'login', setAuthView }) => {
  const [view, setView] = useState(initialView);
  const [signupData, setSignupData] = useState({});

  const handleViewChange = (newView) => {
    setView(newView);
    if (setAuthView) setAuthView(newView);
  };

  const handleSignupSuccess = (data) => {
    setSignupData(data);
    setView('otp');
  };

  return (
    <div className="auth-popup">
      <div className="auth-popup-body">
        <div className="auth-left">
          <h1>
            {view === 'login'
              ? 'Welcome Back!'
              : view === 'signup'
              ? 'Welcome!'
              : view === 'otp'
              ? 'Verify Your Account'
              : 'Reset Password'}
          </h1>
        </div>
        <div className="auth-right">
          <button className="close-btn" onClick={() => setShowAuth(false)}>×</button>

          {view === 'login' && (
            <>
              <Login setUser={setUser} setShowAuth={setShowAuth} />
              <div className="auth-footer">
                <button className="link-btn" onClick={() => handleViewChange('forgot')}>
                  Forgot password?
                </button>
                <p>
                  Don't have an account?{' '}
                  <span className="link-text" onClick={() => handleViewChange('signup')}>
                    Sign up
                  </span>
                </p>
              </div>
            </>
          )}

          {view === 'signup' && (
            <>
              <Signup onSuccess={handleSignupSuccess} />
              <div className="auth-footer">
                <p>
                  Already have an account?{' '}
                  <span className="link-text" onClick={() => handleViewChange('login')}>
                    Login
                  </span>
                </p>
              </div>
            </>
          )}

          {view === 'otp' && (
            <OtpVerification
              email={signupData.email}
              mobile_number={signupData.mobile_number}
              onSuccess={() => handleViewChange('login')}
            />
          )}

          {view === 'forgot' && <ForgotPassword setView={handleViewChange} />}
        </div>
      </div>
    </div>
  );
};

export default Authentication;