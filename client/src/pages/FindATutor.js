import '../styles/findtutor.css';
import axios from 'axios';
import React, { useState, useEffect } from 'react';

const FindATutor = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTutorCourses = async () => {
      try {
        const response = await axios.get('/api/courses/all-tutor-courses');
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutorCourses();
  }, []);

  const openModal = (course) => setSelectedCourse(course);
  const closeModal = () => setSelectedCourse(null);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="title-container">
        <h1 className="page-title">Find a Tutor!</h1>
      </div>

      <div className="page-layout">
        <div className="filter-container">
          <h2>Filters</h2>
          {/* Add your filter elements here */}
        </div>

        <div className="courses-container">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div 
                key={course.tcid} 
                className="course-card" 
                onClick={() => openModal(course)}
              >
                <h4>{course.course_name}</h4>

                <div className="tutor-details">
                  <div className="tutor-avatar">
                    {course.profile_photo_url ? (
                      <img src={course.profile_photo_url} alt="tutor" />
                    ) : (
                      <div className="avatar-placeholder"></div>
                    )}
                  </div>
                  <span className="tutor-name">
                    {course.first_name} {course.last_name}
                  </span>
                </div>

                <div className="course-details">
                  <div className="course-rating">
                    {/* Added the star emoji and removed the "Overall Rating" text */}
                    <strong>⭐ {course.overall_rating ? `${Number(course.overall_rating)}/5` : 'New'}</strong>
                    <small>{course.reviews ? course.reviews.length : 0} Reviews</small>
                  </div>
                  <div className="course-price">
                    {/* Grouped prices tightly without the "OR" text */}
                    {course.hourly_rate && <strong>${course.hourly_rate}/hr</strong>}
                    {course.session_rate && <strong>${course.session_rate}/sess</strong>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No tutors available at the moment.</p>
          )}
        </div>
      </div>

      {/* Modal Overlay and Content */}
      {selectedCourse && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>✕</button>
            
            <div className="modal-header">
              <h2>{selectedCourse.course_name}</h2>
              <p className="text-muted">Taught by {selectedCourse.first_name} {selectedCourse.last_name}</p>
            </div>
            
            <div className="custom-modal-section">
              <h3>Available Sessions</h3>
              {selectedCourse.sessions && selectedCourse.sessions.length > 0 ? (
                <div className="modal-card-grid">
                  {selectedCourse.sessions.map((session) => (
                    <div key={session.session_id} className="modal-info-card">
                      <span className="card-icon">🗓</span>
                      <strong>{new Date(session.session_timestamp).toLocaleDateString()}</strong>
                      <p className="time">
                        {new Date(session.session_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="cost">${session.cost}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No available sessions right now.</p>
              )}
            </div>

            <div className="custom-modal-section">
              <h3>Recent Reviews</h3>
              {selectedCourse.reviews && selectedCourse.reviews.length > 0 ? (
                <div className="modal-card-grid">
                  {selectedCourse.reviews.map((review) => (
                    <div key={review.review_id} className="modal-info-card review-card">
                      <div className="review-header">
                        <span className="card-icon">⭐</span>
                        <strong>{review.user_rating}/5</strong>
                      </div>
                      <p className="review-text">"{review.user_comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No reviews yet.</p>
              )}
            </div>
            
            <button className="book-button">Request Session</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindATutor;
