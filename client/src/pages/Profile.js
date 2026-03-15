import '../styles/profile.css';
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META = {
  pending:   { label: 'Pending',   className: 'prof-status--pending'   },
  confirmed: { label: 'Confirmed', className: 'prof-status--confirmed' },
  cancelled: { label: 'Cancelled', className: 'prof-status--cancelled' },
  completed: { label: 'Completed', className: 'prof-status--completed' },
};

const formatDateTime = (ts) =>
  new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

const fmtMins = (m) => {
  if (!m)           return '';
  if (m < 60)       return `${m} min`;
  if (m % 60 === 0) return `${m / 60} hr`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();

  // ── Data ──────────────────────────────────────────────────
  const [sessions,       setSessions]       = useState([]);
  const [tutorSummary,   setTutorSummary]   = useState(null); // { courseCount, avgRating }
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionFilter,  setSessionFilter]  = useState('all'); // 'all' | status string

  // ── Edit form ─────────────────────────────────────────────
  const [editing,     setEditing]     = useState(false);
  const [draft,       setDraft]       = useState({});
  const [saveError,   setSaveError]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Guard ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  // ── Fetch ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Student sessions
    api.get('/sessions')
      .then(res => setSessions(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));

    // Tutor summary (course count + avg rating)
    if (user.is_tutor) {
      api.get('/courses')
        .then(res => {
          const courses = Array.isArray(res.data) ? res.data : [];
          const rated   = courses.filter(c => c.overall_rating != null);
          const avg     = rated.length > 0
            ? (rated.reduce((s, c) => s + parseFloat(c.overall_rating), 0) / rated.length).toFixed(1)
            : null;
          setTutorSummary({ courseCount: courses.length, avgRating: avg });
        })
        .catch(() => setTutorSummary({ courseCount: 0, avgRating: null }));
    }
  }, [user]);

  if (!user) return null;

  // ── Derived ───────────────────────────────────────────────
  const displayName  = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name Set';
  const profilePhoto = user.profile_photo_url || '/Icons/Default_Profile_Picture.png';

  const filteredSessions = sessionFilter === 'all'
    ? sessions
    : sessions.filter(s => s.status === sessionFilter);

  // Count per status for filter tabs
  const statusCounts = sessions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  // ── Edit handlers ─────────────────────────────────────────
  const startEditing = () => {
    setDraft({
      first_name:        user.first_name        || '',
      last_name:         user.last_name         || '',
      mobile_number:     user.mobile_number     || '',
      profile_photo_url: user.profile_photo_url || '',
    });
    setSaveError('');
    setSaveSuccess(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveError('');
  };

  const saveProfile = async () => {
    if (!draft.first_name.trim() || !draft.last_name.trim()) {
      setSaveError('First and last name are required.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await api.patch('/users/me', {
        first_name:        draft.first_name.trim(),
        last_name:         draft.last_name.trim(),
        mobile_number:     draft.mobile_number.trim()     || null,
        profile_photo_url: draft.profile_photo_url.trim() || null,
      });
      setUser(res.data.user);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Profile save error:', err.response?.data || err.message);
      setSaveError(err.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="profile-page">

      {/* ══════════════════════════════════════════════════
          LEFT COLUMN
          ══════════════════════════════════════════════════ */}
      <div className="profile-content-left">

        {/* ── Identity card ── */}
        <div className="profile-info">
          <div className="profile-photo-wrap">
            <img
              src={editing && draft.profile_photo_url ? draft.profile_photo_url : profilePhoto}
              alt="Profile"
              className="profile-photo"
              onError={e => { e.target.src = '/Icons/Default_Profile_Picture.png'; }}
            />
          </div>

          {!editing ? (
            <>
              <h3 className="profile-name">{displayName}</h3>
              <p className="profile-email">{user.email}</p>
              <p className="profile-mobile">
                📱 {user.mobile_number
                  ? user.mobile_number.replace(/(\d{3})\d{4}(\d{3,4})/, '$1****$2')
                  : <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No phone number set</span>
                }
              </p>
              {saveSuccess && (
                <p className="profile-save-success">✓ Profile updated</p>
              )}
              <button className="profile-edit-btn" onClick={startEditing}>
                Edit Profile
              </button>
            </>
          ) : (
            /* ── Inline edit form ── */
            <div className="profile-edit-form">
              <div className="profile-field-row">
                <div className="profile-field">
                  <label className="profile-field-label">First Name</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={draft.first_name}
                    onChange={e => setDraft(p => ({ ...p, first_name: e.target.value }))}
                  />
                </div>
                <div className="profile-field">
                  <label className="profile-field-label">Last Name</label>
                  <input
                    className="profile-input"
                    type="text"
                    value={draft.last_name}
                    onChange={e => setDraft(p => ({ ...p, last_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="profile-field">
                <label className="profile-field-label">Email</label>
                <input
                  className="profile-input profile-input--readonly"
                  type="email"
                  value={user.email}
                  readOnly
                  title="Email cannot be changed"
                />
                <span className="profile-field-hint">Email cannot be changed</span>
              </div>

              <div className="profile-field">
                <label className="profile-field-label">Mobile Number</label>
                <input
                  className="profile-input"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={draft.mobile_number}
                  onChange={e => setDraft(p => ({ ...p, mobile_number: e.target.value }))}
                />
              </div>

              <div className="profile-field">
                <label className="profile-field-label">Profile Photo URL</label>
                <input
                  className="profile-input"
                  type="url"
                  placeholder="https://..."
                  value={draft.profile_photo_url}
                  onChange={e => setDraft(p => ({ ...p, profile_photo_url: e.target.value }))}
                />
                <span className="profile-field-hint">
                  Paste a direct image URL (jpg, png, etc.)
                </span>
              </div>

              {saveError && <p className="profile-error">{saveError}</p>}

              <div className="profile-edit-actions">
                <button className="profile-cancel-btn" onClick={cancelEditing}>Cancel</button>
                <button className="profile-save-btn" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Role badges ── */}
        <div className="role-badges">
          <span className="role-badge">Student</span>
          {user.is_tutor && <span className="role-badge role-badge--tutor">Tutor</span>}
        </div>

        {/* ── Tutor summary card ── */}
        {user.is_tutor && tutorSummary && (
          <div className="profile-tutor-card">
            <h4 className="profile-tutor-card-title">🎓 Tutor Profile</h4>
            <div className="profile-tutor-stats">
              <div className="profile-tutor-stat">
                <span className="profile-tutor-stat-num">{tutorSummary.courseCount}</span>
                <span className="profile-tutor-stat-label">Courses</span>
              </div>
              <div className="profile-tutor-stat">
                <span className="profile-tutor-stat-num">
                  {tutorSummary.avgRating ?? 'N/A'}
                </span>
                <span className="profile-tutor-stat-label">Avg Rating</span>
              </div>
            </div>
            <Link to="/become-a-tutor" className="profile-tutor-dash-link">
              Go to Tutor Dashboard →
            </Link>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════
          RIGHT COLUMN — Student session history
          ══════════════════════════════════════════════════ */}
      <div className="profile-content-right">
        <div className="profile-section">

          <div className="profile-section-header">
            <h2>My Sessions</h2>
            <span className="profile-session-count">{sessions.length} total</span>
          </div>

          {/* Status filter tabs */}
          {sessions.length > 0 && (
            <div className="prof-filter-tabs">
              {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => {
                const count = f === 'all' ? sessions.length : (statusCounts[f] || 0);
                if (f !== 'all' && count === 0) return null;
                return (
                  <button
                    key={f}
                    className={`prof-filter-tab${sessionFilter === f ? ' active' : ''}`}
                    onClick={() => setSessionFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className="prof-filter-count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {loadingSessions ? (
            <p className="profile-loading">Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <div className="profile-empty-state">
              <p className="profile-empty">You haven't booked any sessions yet.</p>
              <Link to="/find-a-tutor" className="profile-cta-link">Find a Tutor →</Link>
            </div>
          ) : filteredSessions.length === 0 ? (
            <p className="profile-empty">No {sessionFilter} sessions.</p>
          ) : (
            <div className="prof-session-list">
              {filteredSessions.map(session => {
                const meta   = STATUS_META[session.status] || STATUS_META.pending;
                const isPast = new Date(session.session_timestamp) < new Date();
                return (
                  <div
                    key={session.session_id}
                    className={`prof-session-card${isPast && session.status === 'confirmed' ? ' prof-session-card--past' : ''}`}
                  >
                    <div className="prof-session-top">
                      <div className="prof-session-main">
                        <span className="prof-session-course">
                          {session.course_name || 'Session'}
                        </span>
                        <span className="prof-session-tutor">
                          with {session.tutor_first_name} {session.tutor_last_name}
                        </span>
                      </div>
                      <span className={`prof-status-badge ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="prof-session-details">
                      <span className="prof-session-detail">
                        🕐 {formatDateTime(session.session_timestamp)}
                      </span>
                      {session.duration_minutes && (
                        <span className="prof-session-detail">
                          ⏱ {fmtMins(session.duration_minutes)}
                        </span>
                      )}
                      <span className="prof-session-detail">
                        💰 ${parseFloat(session.cost).toFixed(2)}
                      </span>
                    </div>

                    {session.feedback && (
                      <p className="prof-session-feedback">"{session.feedback}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Profile;