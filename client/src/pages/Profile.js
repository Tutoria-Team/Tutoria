import '../styles/profile.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = ({ user }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/'); // Redirect to home if not logged in
    }
  }, [user, navigate]);

  // Fetch tutor's courses if user is a tutor
  useEffect(() => {
    if (!user) return;
    if (user.is_tutor) {
      axios.get(`/api/courses?tutor_email=${user.email}`)
        .then(res => setCourses(res.data))
        .catch(err => console.error('Error fetching courses:', err))
        .finally(() => setLoadingCourses(false));
    } else {
      setLoadingCourses(false);
    }
  }, [user]);

  // Fetch user's upcoming sessions
  useEffect(() => {
    if (!user) return;
    axios.get(`/api/sessions?user_email=${user.email}`)
      .then(res => setSessions(res.data))
      .catch(err => console.error('Error fetching sessions:', err))
      .finally(() => setLoadingSessions(false));
  }, [user]);

  if (!user) {
    return (
      <div className="profile-page" style={{ padding: '2rem' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name Provided';
  const userEmail = user.email || 'No Email Provided';
  const profilePhoto = user.profile_photo_url || '/Icons/Default_Profile_Picture.png';

  return (
    <div className="profile-page">
      <div className="profile-content-left">
        <div className="profile-info">
          <img src={profilePhoto} alt="Profile" className="profile-photo" />
          <h3><strong>{userName}</strong></h3>
          <p>{userEmail}</p>
          <a href="#" className="update-profile-link">Update Profile</a>
        </div>

        {/* Always show the Student button */}
        <div className="role-buttons">
          <button className={`role-button ${!user.is_tutor ? 'active' : ''}`}>Student</button>

          {/* Show the Tutor button only if the user is a tutor */}
          {user.is_tutor && (
            <button className={`role-button ${user.is_tutor ? 'active' : ''}`}>Tutor</button>
          )}
        </div>
      </div>

      <div className="profile-content-right">
        <div className="profile-section">
          <h2>Upcoming Sessions</h2>
          {loadingSessions ? (
            <p>Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <p>No upcoming sessions</p>
          ) : (
            sessions.map(session => (
              <div key={session.session_id} className="upcoming-session-card">
                <div className="session-header">
                  <h4>{session.course_name} with {session.tutor_name}</h4>
                  <span>{new Date(session.session_timestamp).toLocaleString()}</span>
                </div>
                <div className="session-body">
                  <p>Cost: ${session.cost.toFixed(2)}</p>
                  {session.feedback && <p>Feedback: {session.feedback}</p>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Show Courses Taught only if the user is a tutor */}
        {user.is_tutor && (
          <div className="profile-section">
            <h2>Courses Taught</h2>
            {loadingCourses ? (
              <p>Loading courses...</p>
            ) : courses.length === 0 ? (
              <p>No courses created yet</p>
            ) : (
              <div className="courses-taught-container">
                {courses.map(course => (
                  <div key={course.tcid} className="course-card">
                    <h4>{course.course_name}</h4>
                    <div className="course-details">
                      <div className="course-rating">
                        <p>Overall Rating</p>
                        <strong>{course.overall_rating?.toFixed(1) || 'N/A'}/5</strong>
                        <small>{course.review_count || 0} Reviews</small>
                      </div>
                      <div className="course-price">
                        <strong>${course.cost_per_hour || 50}/hr</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show Availability section only if user is a tutor */}
        {user.is_tutor && (
          <div className="profile-section">
            <h2>Availability</h2>
            <p>Your availability calendar will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
