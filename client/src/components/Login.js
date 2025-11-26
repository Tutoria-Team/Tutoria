import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Login = ({ setUser, setShowAuth, prefillEmail = '' }) => {
    const [emailOrMobile, setEmailOrMobile] = useState(prefillEmail);
    const [password, setPassword] = useState('');

    useEffect(() => {
        setEmailOrMobile(prefillEmail);
    }, [prefillEmail]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/login', {
                email_or_mobile: emailOrMobile,
                password
            });

            const userData = response.data.user;
            localStorage.setItem('token', response.data.token);
            setUser(userData);
            setShowAuth(false);
        } catch (error) {
            alert('Error during login');
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form login-form">
            <input
                type="text"
                placeholder="Email or Mobile Number"
                value={emailOrMobile}
                onChange={(e) => setEmailOrMobile(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Login</button>
        </form>
    );
};

export default Login;
