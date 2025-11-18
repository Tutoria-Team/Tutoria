import '../styles/profile.css';
import React from 'react';

// We can pass in a 'user' prop to make the component dynamic
const Profile = ({ user }) => {

  // If the user data isn't loaded yet, show a loading message
  if (!user) {
    return (
      <div className="profile-page" style={{ padding: '2rem' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Get user data from props, provide generic fallbacks if fields are empty
  const userName = user.name || 'No Name Provided';
  const userEmail = user.email || 'No Email Provided';

  return (
    <div className="profile-page">
      {/* --- LEFT COLUMN --- */}
      <div className="profile-content-left">
{/* ... existing code ... */ }
        <a href="#" className="update-profile-link">Update Profile</a>
        
        <div className="profile-info">
          <h3><strong>{userName}</strong></h3>
          <p>{userEmail}</p>
        </div>        

        <div className="role-buttons">
          <button className="role-button active">Student</button>
          <button className="role-button">Tutor</button>
        </div>
      </div>

      {/* --- RIGHT COLUMN --- */}
      <div className="profile-content-right">
        {/* --- UPCOMING SESSIONS --- */}
        <div className="profile-section">
          <h2>Upcoming Sessions</h2>
          <div className="upcoming-session-card">
            <div className="session-header">
              <h4>Data Structures with ___</h4>
              <span>11/12/25 at 3:00 PM</span>
            </div>
            <div className="session-body">
              {/* This is the large blue area from the mockup */}
            </div>
          </div>
        </div>

        {/* --- COURSES TAUGHT --- */}
        <div className="profile-section">
          <h2>Courses Taught</h2>
          <div className="courses-taught-container">
            {/* Mockup Course Card 1 */}
            <div className="course-card">
              <h4>Data Structures</h4>
              <div className="course-details">
                <div className="course-rating">
                  <p>Overall Rating</p>
                  <strong>4.5/5</strong>
                  <small>10 Reviews</small>
                </div>
                <div className="course-price">
                  <strong>$50/hr</strong>
                </div>
              </div>
            </div>
            {/* Mockup Course Card 2 */}
            <div className="course-card">
              <h4>Programming Languages</h4>
              <div className="course-details">
                <div className="course-rating">
                  <p>Overall Rating</p>
                  <strong>4.5/5</strong>
                  <small>10 Reviews</small>
                </div>
                <div className="course-price">
                  <strong>$50/hr</strong>
                </div>
              </div>
            </div>
            {/* Add more cards as needed */}
          </div>
        </div>

        {/* --- AVAILABILITY --- */}
        <div className="profile-section">
          <h2>Availability</h2>
          {/* You can add your availability component or info here */}
          <p>Your availability calendar will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;