import './App.css';
import axios from 'axios';
import React, {useState, useEffect} from 'react';
import Signup from './components/Signup';
import OtpVerification from './components/OtpVerification';
import Login from './components/Login';
import 'bootstrap/dist/css/bootstrap.min.css'

const App = () => {
  const [view, setView] = useState('signup'); // control which component shows

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h1>PERN Auth</h1>

      <nav style={{ marginBottom: 20 }}>
        <button onClick={() => setView('signup')}>Sign Up</button>{' '}
        <button onClick={() => setView('otp')}>Verify OTP</button>{' '}
        <button onClick={() => setView('login')}>Login</button>
      </nav>

      {view === 'signup' && <Signup />}
      {view === 'otp' && <OtpVerification />}
      {view === 'login' && <Login />}
    </div>
  );
};

export default App;
