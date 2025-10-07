import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setUser, setShowAuth }) => {
    const [email_or_mobile, setEmailOrMobile] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/login', {
                email_or_mobile,
                password
            });

            const userData = response.data.user;

            // Save token if needed
            localStorage.setItem('token', response.data.token);

            // Update global user state
            console.log('Logged in user:', userData);
            setUser(userData);

            // Close the auth modal
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
                value={email_or_mobile}
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
