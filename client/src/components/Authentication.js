import '../styles/auth.css';
import React, { useState } from 'react';
import axios from 'axios';
import Signup from './Signup';
import OtpVerification from './OtpVerification';
import Login from './Login';

const Authentication = ({
        setShowAuth
    }) => {
    const [view, setView] = useState('signup'); 

    return (
        <div className="auth-popup">
            <div className="auth-popup-body">
                <div className="auth-left">
                    <h1>Welcome Back</h1>
                </div>
                <div className="auth-right">

                    <button className="close-btn" onClick={() => setShowAuth(false)}>X</button>

                    <nav style={{ marginBottom: 20 }}>
                        <button onClick={() => setView('signup')}>Sign Up</button>{' '}
                        <button onClick={() => setView('otp')}>Verify OTP</button>{' '}
                        <button onClick={() => setView('login')}>Login</button>
                    </nav>

                    {view === 'signup' && <Signup />}
                    {view === 'otp' && <OtpVerification />}
                    {view === 'login' && <Login />}
                </div>
            </div>
        </div>
    );
};

export default Authentication;