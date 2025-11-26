import './App.css';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FindATutor from './pages/FindATutor';
import BecomeATutor from './pages/BecomeATutor';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // Track auth check

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
        })
        .finally(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  }, []);

  if (checkingAuth) {
    // Optional: could show a spinner here instead of null
    return null;
  }

  return (
    <Router>
      <Header user={user} setUser={setUser} />
      <div>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<FindATutor />} />
          <Route path="/find-a-tutor" element={<FindATutor />} />
          <Route path="/become-a-tutor" element={<BecomeATutor />} />

          {/* Protected Route */}
          <Route 
            path="/profile" 
            element={
              <PrivateRoute user={user} checkingAuth={checkingAuth}>
                <Profile user={user} />
              </PrivateRoute>
            } 
          />

        </Routes>
      </div>
    </Router>
  );
};

export default App;