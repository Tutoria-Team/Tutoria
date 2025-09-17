import '../styles/header.css';
import React, { useState } from 'react';
import axios from 'axios';
//import Accounts from './HandleAccounts';

const Header = () => {
    const [accountPopup, setAccountPopup] = useState(false);

    const handleAccountPopupToggle = () => {
        setAccountPopup(!accountPopup)
    }

    return (

        <div className="header">
            <a href="#default" className="logo">Tutoria</a>
            <div className="header-right">
                <button onClick={handleAccountPopupToggle}>Login</button>
            </div>

            <h1 style={{ fontFamily: "'Gowun Batang', serif" }}>
              Test font
            </h1>
        </div>
    );
};

export default Header;