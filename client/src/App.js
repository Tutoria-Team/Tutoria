// App.js
import './App.css';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FindATutor from './pages/FindATutor';
import BecomeATutor from './pages/BecomeATutor';
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
      <div>
        <Routes>
          <Route path="/" element={<FindATutor />} />
          <Route path="/find-a-tutor" element={<FindATutor />} />
          <Route path="/become-a-tutor" element={<BecomeATutor />} />
          <Route path="/profile" element={<Profile user={user} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
