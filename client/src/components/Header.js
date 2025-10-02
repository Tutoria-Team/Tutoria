import '../styles/header.css';
import React, { useState } from 'react';
import axios from 'axios';
import Authentication from './Authentication';

const Header = () => { 
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
                <button onClick={() => setShowAuth(true)} title="auth">Login</button>
            </div>
        </div>

        {showAuth && (
                <Authentication
                    setShowAuth={setShowAuth}
                />
            )}
        </>
    );
};

export default Header;