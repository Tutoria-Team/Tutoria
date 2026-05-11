import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/findtutor.css';

import SessionCalendar from '../components/find-tutor/SessionCalendar';
import HourlyAvailabilityGrid from '../components/find-tutor/HourlyAvailabilityGrid';

const FindATutor = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Booking State
  const [bookingMode, setBookingMode] = useState('session'); 
  const [availableTimesForDate, setAvailableTimesForDate] = useState([]); 
  const [selectedDisplayDate, setSelectedDisplayDate] = useState(null); 
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

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
  
  const closeModal = () => {
    setSelectedCourse(null);
    setBookingMode('session'); 
    setAvailableTimesForDate([]); 
    setSelectedDisplayDate(null); 
    setSelectedTimeSlot(null); 
  };

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
                    <strong>⭐ {course.overall_rating ? `${Number(course.overall_rating)}/5` : 'New'}</strong>
                    <small>{course.reviews ? course.reviews.length : 0} Reviews</small>
                  </div>
                  <div className="course-price">
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
          <div className="custom-modal-content split-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>✕</button>
            
            <div className="modal-left">
              <div className="modal-header">
                <h2>{selectedCourse.course_name}</h2>
                <p className="text-muted">Taught by {selectedCourse.first_name} {selectedCourse.last_name}</p>
              </div>

              <div className="custom-modal-section about-section">
                <h3>About this Course</h3>
                <p style={{ color: '#475569', lineHeight: '1.6' }}>
                  {selectedCourse.description || "Join this course to master the fundamentals and level up your skills with personalized 1-on-1 guidance. We will tailor the sessions specifically to what you need help with the most."}
                </p>
              </div>

              <div className="custom-modal-section reviews-section">
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
            </div>

            <div className="modal-right">
              {/* Toggle Switch (Only for 'both') */}
              {selectedCourse.rate_type === 'both' && (
                <div className="booking-toggle">
                  <button 
                    className={`toggle-btn ${bookingMode === 'session' ? 'active' : ''}`}
                    onClick={() => setBookingMode('session')}
                  >
                    📅 Join a Session
                  </button>
                  <button 
                    className={`toggle-btn ${bookingMode === 'hourly' ? 'active' : ''}`}
                    onClick={() => setBookingMode('hourly')}
                  >
                    ⏱ Request Hourly
                  </button>
                </div>
              )}

              {/* Session Booking Tab */}
              {(bookingMode === 'session' || selectedCourse.rate_type === 'session') && selectedCourse.rate_type !== 'hourly' && (
                <div className="calendar-container fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h3>Select a Date</h3>
                  
                  {/* ── Extracted Calendar Component ── */}
                  <SessionCalendar 
                    sessions={selectedCourse.sessions || []} 
                    onSelectDate={(times, date) => {
                      setAvailableTimesForDate(times);
                      setSelectedDisplayDate(date);
                      setSelectedTimeSlot(null); 
                    }}
                  />
                  
                  <div className="available-times-section" style={{ flexGrow: 1 }}>
                    {selectedDisplayDate ? (
                      <>
                        <h4>Available on {selectedDisplayDate.toLocaleDateString()}</h4>
                        <div className="available-times">
                          {availableTimesForDate.map(session => {
                            const isSelected = selectedTimeSlot?.session_id === session.session_id;
                            return (
                              <button 
                                key={session.session_id} 
                                className="time-slot" 
                                style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  backgroundColor: isSelected ? '#0056b3' : 'white',
                                  color: isSelected ? 'white' : '#0056b3',
                                  borderColor: '#0056b3'
                                }}
                                onClick={() => setSelectedTimeSlot(session)}
                              >
                                <strong>{new Date(session.session_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                                <span style={{ fontSize: '0.8rem', color: isSelected ? '#EBF4FA' : '#64748B' }}>Fixed Session • ${session.cost}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted" style={{ marginTop: '15px' }}>
                        {selectedCourse.sessions && selectedCourse.sessions.length > 0 
                          ? "Select a highlighted date to see available times." 
                          : "No pre-scheduled sessions available."}
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: '15px', borderTop: '1px solid #E2E8F0', paddingTop: '15px' }}>
                    <button 
                      className="book-button request-btn" 
                      disabled={!selectedTimeSlot}
                      onClick={() => alert(`Booking session for $${selectedTimeSlot.cost}!`)}
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              )}

              {/* Hourly Booking Tab */}
              {(bookingMode === 'hourly' || selectedCourse.rate_type === 'hourly') && selectedCourse.rate_type !== 'session' && (
                <div className="hourly-container fade-in">
                  <h3>Select Available Times</h3>
                  
                  {/* ── Extracted Grid Component ── */}
                  <HourlyAvailabilityGrid hourlyRate={selectedCourse.hourly_rate} />
                  
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindATutor;