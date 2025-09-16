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
        
        <div class="header">
            <a href="#default" class="logo">Tutoria</a>
            <div class="header-right">
                <button onClick={handleAccountPopupToggle}>Login</button>
            </div>
        </div>
    );
};

export default Header;