import '../styles/auth.css';
import React, { useState } from 'react';
import Signup from './Signup';
import OtpVerification from './OtpVerification';
import Login from './Login';

const Authentication = ({ setShowAuth, setUser }) => {
    const [view, setView] = useState('login'); 
    const [signupData, setSignupData] = useState({});

    const handleSignupSuccess = (data) => {
        setSignupData(data); // contains email and mobile_number
        setView('otp');
    };
    
    return (
        <div className="auth-popup">
            <div className="auth-popup-body">
                <div className="auth-left">
                    <h1>{view === 'login' ? 'Welcome Back!' : 'Welcome!'}</h1>
                </div>
                <div className="auth-right">

                    <button className="close-btn" onClick={() => setShowAuth(false)}>X</button>

                    {view === 'login' && (
                        <>
                            <Login setUser={setUser} setShowAuth={setShowAuth} />
                            <div className="auth-footer">
                                <button className="link-btn">Forgot password?</button>
                                <p>Don't have an account? <span className="link-text" onClick={() => setView('signup')}>Sign up</span></p>
                            </div>
                        </>
                    )}

                    {view === 'signup' && (
                        <>
                            <Signup onSuccess={handleSignupSuccess} />
                            <div className="auth-footer">
                                <p>Already have an account? <span className="link-text" onClick={() => setView('login')}>Login</span></p>
                            </div>
                        </>
                    )}

                    {view === 'otp' && (
                        <OtpVerification 
                            email={signupData.email} 
                            mobile_number={signupData.mobile_number} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Authentication;
