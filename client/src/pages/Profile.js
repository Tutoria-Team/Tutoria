// Profile.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = ({ user }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return <div>Loading ...</div>;

  return (
    <div className="profile-page" style={{ padding: '2rem' }}>
      <h1>👤 Your Profile</h1>
      <p><strong>Name:</strong> {user.name || 'N/A'}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Mobile:</strong> {user.mobile_number}</p>
      {/* Add more fields as needed */}
    </div>
  );
};

export default Profile;
