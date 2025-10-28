import '../styles/profile.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user');  // Default active tab is 'user'

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return <div>Loading ...</div>;

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="profile-page">

      <img className="profile-defaultPictureIcon" src="/Icons/Default_Profile_Picture.png" alt="DefaultPicture"/>
      <h3><strong>{user.name || 'N/A'}</strong></h3>

      <div className="profile-tab">
        <button
          className={`profile-tablink ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => handleTabClick('user')}
        >
          Student Profile
        </button>
        <button
          className={`profile-tablink ${activeTab === 'tutor' ? 'active' : ''}`}
          onClick={() => handleTabClick('tutor')}
        >
          Tutor Profile
        </button>
      </div>

      <div className="profile-tabcontent" style={{ display: activeTab === 'user' ? 'block' : 'none' }}>
        <div className="profile-info">
          <p>Student</p>
          <p><strong>{user.email}</strong></p>
          <p>Date Joined:{user.created_at}</p>
        </div>
        <div className="profile-item">
          <h3>Upcoming Sessions</h3>
          <div className="profile-session">
            <div className="profile-session-left">
              <h4>Data Mining</h4>
              <p>with Prof. Emily Rodriguez</p>
            </div>
            <div className="profile-session-right">
              <p>Tomorrow</p>
              <p>3:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-tabcontent" style={{ display: activeTab === 'tutor' ? 'block' : 'none' }}>
        <div className="profile-info">
          <p>Tutor</p>
          <p><strong>{user.email}</strong></p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
