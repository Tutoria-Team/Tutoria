import '../styles/header.css';
import React, { useState } from 'react';
import axios from 'axios';
import Authentication from './Authentication';

const Header = ({ user, setUser }) => {
    const [showAuth, setShowAuth] = useState(false);

    return (
        <>
            <div className="header">
                <div className="header-left">
                    <a href="#default" className="logo">
                        <img className="logoImage" src="/LogoVersions/Logo.png" alt="Tutoria Logo"/>
                    </a>
                    <a href="#default" className="logoName">Tutoria</a>
                    <a href="#default" className="headerItem">Find a Tutor</a>
                    <a href="#default" className="headerItem">Become a Tutor</a>
                </div>

                <div className="header-right">
                    {!user ? (
                        <button onClick={() => setShowAuth(true)} title="auth">Login</button>
                    ) : (
                        <>
                            <button title="Messages" onClick={() => window.location.href = '/messages'}>📩</button>
                            <button title="Notifications" onClick={() => window.location.href = '/notifications'}>🔔</button>
                            {window.location.pathname === '/profile' ? (
                                <button title="Logout" onClick={() => {
                                    localStorage.removeItem('token');
                                    setUser(null);
                                    window.location.href = '/';
                                }}>
                                    Logout
                                </button>
                            ) : (
                                <button title="Profile" onClick={() => window.location.href = '/profile'}>
                                    <img
                                        src={user.profile_photo_url || '/LogoVersions/Logo.png'}
                                        alt="Profile"
                                        className="profileButton"
                                    />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showAuth && (
                <Authentication setShowAuth={setShowAuth} setUser={setUser} />
            )}
        </>
    );
};


export default Header;