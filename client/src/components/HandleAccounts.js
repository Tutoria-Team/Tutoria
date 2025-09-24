import '../styles/login.css';
import React, { useState } from 'react';
import axios from 'axios';
import Signup from './Signup';
import OtpVerification from './OtpVerification';
import Login from './Login';

const HandleAccounts = ({
        setShowLogin,
        setShowSignUp
    }) => {
    const [view, setView] = useState('signup'); 

    return (
        <div className="login-popup">
            <div className="login-popup-header">
                <button className="exit-button" onClick={() => setShowLogin(false)}>X</button>
            </div>

            <h1>Welcome Back</h1>

            <nav style={{ marginBottom: 20 }}>
            <button onClick={() => setView('signup')}>Sign Up</button>{' '}
            <button onClick={() => setView('otp')}>Verify OTP</button>{' '}
            <button onClick={() => setView('login')}>Login</button>
            </nav>

            {view === 'signup' && <Signup />}
            {view === 'otp' && <OtpVerification />}
            {view === 'login' && <Login />}
        </div>
    );
};

export default HandleAccounts;