// App.js
import './App.css';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Profile from './pages/Profile';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      axios.get('/api/me')
        .then(res => setUser(res.data.user))
        .catch(err => {
          console.error('Token invalid:', err);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        });
    }
  }, []);

  return (
    <Router>
      <Header user={user} setUser={setUser} />
      <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
        <Routes>
          <Route path="/profile" element={<Profile user={user} />} />
          {/* You can add more routes here */}
          <Route path="/" element={<div>Welcome to Tutoria</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
