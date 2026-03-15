import '../styles/becometutor.css';
import React from 'react';
import BecomeTutorForm from '../components/tutor/BecomeTutorForm';
import TutorDashboard from '../components/tutor/TutorDashboard';

const BecomeATutor = ({ user, setUser, onShowLogin, onShowSignup }) => {

  // ── Not logged in ──────────────────────────────────────
  if (!user) {
    return (
      <div className="bat-page">
        <div className="bat-hero">
          <h1 className="bat-hero-title">Become a Tutor</h1>
          <p className="bat-hero-sub">
            Share your knowledge, set your schedule, and earn money helping students succeed.
          </p>
          <div className="bat-hero-actions">
            <button className="bat-hero-btn bat-hero-btn--primary" onClick={onShowSignup}>
              Get Started
            </button>
            <button className="bat-hero-btn bat-hero-btn--secondary" onClick={onShowLogin}>
              Log In
            </button>
          </div>
        </div>

        <div className="bat-perks">
          <div className="bat-perk">
            <span className="bat-perk-icon">📚</span>
            <strong>List your courses</strong>
            <p>Showcase exactly what you teach</p>
          </div>
          <div className="bat-perk">
            <span className="bat-perk-icon">🗓</span>
            <strong>Set your schedule</strong>
            <p>Choose when you're available</p>
          </div>
          <div className="bat-perk">
            <span className="bat-perk-icon">⭐</span>
            <strong>Build your reputation</strong>
            <p>Earn reviews from real students</p>
          </div>
          <div className="bat-perk">
            <span className="bat-perk-icon">💰</span>
            <strong>Set your rates</strong>
            <p>Charge hourly, per session, or both</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Already a tutor ────────────────────────────────────
  if (user.is_tutor) {
    return (
      <div className="bat-page">
        <TutorDashboard user={user} />
      </div>
    );
  }

  // ── Logged-in student ──────────────────────────────────
  return (
    <div className="bat-page">
      <div className="bat-hero bat-hero--form">
        <h1 className="bat-hero-title">Become a Tutor</h1>
        <p className="bat-hero-sub">
          Set up your tutor profile in just a few steps, {user.first_name}.
        </p>
      </div>
      <BecomeTutorForm onSuccess={(updatedUser) => setUser(updatedUser)} />
    </div>
  );
};

export default BecomeATutor;