import React, { useState } from 'react';
import api from '../../api/axios';

const Signup = ({ onSuccess }) => {
    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile_number, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/signup', {
                first_name, last_name, email, mobile_number, password
            });
            alert('Signup successful! Check your email for the OTP.');
            if (onSuccess) {
                onSuccess({ email, mobile_number });
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Error during signup');
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <div className="name-row">
                <input type="text" placeholder="First Name" value={first_name} onChange={(e) => setFirstName(e.target.value)} required />
                <input type="text" placeholder="Last Name" value={last_name} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="text" placeholder="Mobile Number" value={mobile_number} onChange={(e) => setMobileNumber(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Sign Up</button>
        </form>
    );
};

export default Signup;