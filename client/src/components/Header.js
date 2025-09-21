import '../styles/header.css';
import React, { useState } from 'react';
import axios from 'axios';
//import Accounts from './HandleAccounts';

const Header = ({
    setShowLogin,
    setShowSignUp
}) => {        
    return (
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
                <button onClick={() => setShowLogin(true)} title="Login">Login</button>
                <button onClick={() => setShowSignUp(true)} title="Sign Up">Sign Up</button>
            </div>
        </div>
    );
};

export default Header;