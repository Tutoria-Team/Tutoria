import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

// ─── Constants (mirrors BecomeTutorForm.js) ───────────────────────────────────
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DISPLAY_HOURS = [...Array.from({ length: 18 }, (_, i) => i + 6), 0, 1, 2];
const HOUR_IDX      = Object.fromEntries(DISPLAY_HOURS.map((h, i) => [h, i]));
const MIDNIGHT_IDX  = 17;

const COMMON_TIMEZONES = [
  { label: 'Pacific (US/CA)',  value: 'America/Los_Angeles' },
  { label: 'Mountain (US/CA)', value: 'America/Denver'      },
  { label: 'Central (US/CA)',  value: 'America/Chicago'     },
  { label: 'Eastern (US/CA)',  value: 'America/New_York'    },
  { label: 'Atlantic (CA)',    value: 'America/Halifax'      },
  { label: 'UTC',              value: 'UTC'                  },
  { label: 'London',           value: 'Europe/London'        },
  { label: 'Paris / Berlin',   value: 'Europe/Paris'         },
  { label: 'Moscow',           value: 'Europe/Moscow'        },
  { label: 'Dubai',            value: 'Asia/Dubai'           },
  { label: 'India (IST)',      value: 'Asia/Kolkata'         },
  { label: 'Singapore / KL',  value: 'Asia/Singapore'       },
  { label: 'Tokyo / Seoul',   value: 'Asia/Tokyo'            },
  { label: 'Sydney',           value: 'Australia/Sydney'     },
  { label: 'Auckland',         value: 'Pacific/Auckland'     },
];

const RATE_TYPE_LABELS = { hourly: '$/hr', session: '$/session', both: 'Both' };

const INCREMENT_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hr'   },
];
const BUFFER_OPTIONS = [
  { value: 0,  label: 'None'   },
  { value: 5,  label: '5 min'  },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
];
const ADVANCE_OPTIONS = [
  { value: 7,  label: '1 week'   },
  { value: 14, label: '2 weeks'  },
  { value: 30, label: '1 month'  },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
];
const CANCEL_OPTIONS = [
  { value: 0,  label: 'No minimum' },
  { value: 12, label: '12 hours'   },
  { value: 24, label: '24 hours'   },
  { value: 48, label: '48 hours'   },
  { value: 72, label: '72 hours'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toTimeStr  = (h) => `${String(h).padStart(2, '0')}:00`;
const todayStr   = ()  => new Date().toISOString().split('T')[0];

const formatHour = (h) => {
  if (h === 0)  return '12 AM';
  if (h < 12)   return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

const fmtMins = (m) => {
  if (m < 60)       return `${m} min`;
  if (m % 60 === 0) return `${m / 60} hr`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const formatRate = (course) => {
  if (!course.rate_type) return 'No rate set';
  if (course.rate_type === 'hourly')
    return `$${parseFloat(course.hourly_rate).toFixed(2)}/hr`;
  if (course.rate_type === 'session')
    return `$${parseFloat(course.session_rate).toFixed(2)}/session`;
  if (course.rate_type === 'both')
    return `$${parseFloat(course.hourly_rate).toFixed(2)}/hr · $${parseFloat(course.session_rate).toFixed(2)}/session`;
  return '';
};

const formatDateTime = (ts) =>
  new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

const fmtDate = (ds) =>
  new Date(String(ds).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

/**
 * expandSlotsToCells
 * Reverse of computeSlots — converts stored DB availability rows back into
 * the Set of "day-hour" cell keys so the grid can be pre-populated on edit.
 *
 * e.g. { day_of_week: 1, start_time: '09:00', end_time: '12:00' }
 *   → Set { '1-9', '1-10', '1-11' }
 */
const expandSlotsToCells = (slots) => {
  const cells = new Set();
  slots.forEach(slot => {
    const startH = parseInt(slot.start_time.split(':')[0]);
    const endStr = slot.end_time.slice(0, 5);
    // '23:59' means the last cell is hour 23 (stored that way to satisfy CHECK end > start)
    const endH   = endStr === '23:59' ? 24 : parseInt(slot.end_time.split(':')[0]);
    for (let h = startH; h < endH; h++) {
      cells.add(`${slot.day_of_week}-${h}`);
    }
  });
  return cells;
};

// ─── Component ────────────────────────────────────────────────────────────────
const TutorDashboard = ({ user }) => {

  // ── Data ──────────────────────────────────────────────────
  const [courses,         setCourses]         = useState([]);
  const [availability,    setAvailability]    = useState([]);
  const [blackoutDates,   setBlackoutDates]   = useState([]);
  const [tutorSessions,   setTutorSessions]   = useState([]);
  const [sessionSettings, setSessionSettings] = useState(null);
  const [loading,         setLoading]         = useState(true);

  // ── Course editing ─────────────────────────────────────────
  const [newCourse,   setNewCourse]   = useState('');
  const [newRateType, setNewRateType] = useState('hourly');
  const [newHourly,   setNewHourly]   = useState('');
  const [newSession,  setNewSession]  = useState('');
  const [courseError, setCourseError] = useState('');
  const [editing,     setEditing]     = useState({});

  // ── Availability grid editing ──────────────────────────────
  const detectedTz    = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [editingAvail, setEditingAvail] = useState(false);
  const [gridCells,    setGridCells]    = useState(new Set());
  const [timezone,     setTimezone]     = useState(detectedTz);
  const [isDragging,   setIsDragging]   = useState(false);
  const [dragMode,     setDragMode]     = useState('add');
  const [availError,   setAvailError]   = useState('');
  const [savingAvail,  setSavingAvail]  = useState(false);

  // ── Blackout dates ─────────────────────────────────────────
  const [blackoutDate,   setBlackoutDate]   = useState('');
  const [blackoutReason, setBlackoutReason] = useState('');
  const [blackoutError,  setBlackoutError]  = useState('');

  // ── Session settings editing ───────────────────────────────
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsDraft,   setSettingsDraft]   = useState(null);
  const [settingsError,   setSettingsError]   = useState('');
  const [savingSettings,  setSavingSettings]  = useState(false);

  // ── Session actions ────────────────────────────────────────
  const [sessionActionError, setSessionActionError] = useState('');

  // ── Fetch all ─────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [coursesRes, availRes, blackoutRes, sessionsRes, settingsRes] = await Promise.all([
          api.get('/courses').catch(()          => ({ data: [] })),
          api.get('/availability').catch(()     => ({ data: [] })),
          api.get('/availability/blackout-dates').catch(() => ({ data: [] })),
          api.get('/sessions/tutor').catch(()   => ({ data: [] })),
          api.get('/tutor-settings').catch(()   => ({ data: null })),
        ]);
        setCourses(coursesRes.data);
        setAvailability(availRes.data);
        setBlackoutDates(Array.isArray(blackoutRes.data) ? blackoutRes.data : []);
        setTutorSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
        if (settingsRes.data) {
          setSessionSettings(settingsRes.data);
          setSettingsDraft(settingsRes.data);
        }
        // Pre-set timezone from first stored slot
        if (availRes.data?.length > 0) {
          setTimezone(availRes.data[0].timezone || detectedTz);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();

    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [detectedTz]);

  // ── Derived values ─────────────────────────────────────────
  const pendingRequests  = tutorSessions.filter(s => s.status === 'pending');
  const upcomingSessions = tutorSessions.filter(
    s => s.status === 'confirmed' && new Date(s.session_timestamp) > new Date()
  );
  const avgRating = courses.length > 0
    ? (courses.reduce((s, c) => s + (parseFloat(c.overall_rating) || 0), 0) / courses.length).toFixed(1)
    : 'N/A';

  const tzList = COMMON_TIMEZONES.some(t => t.value === detectedTz)
    ? COMMON_TIMEZONES
    : [{ label: `${detectedTz} (detected)`, value: detectedTz }, ...COMMON_TIMEZONES];

  // ── Course handlers ────────────────────────────────────────
  const addCourse = async () => {
    const name = newCourse.trim();
    if (!name) return;
    if (newRateType === 'hourly'  && (!newHourly  || parseFloat(newHourly)  <= 0)) return setCourseError('Enter a valid hourly rate.');
    if (newRateType === 'session' && (!newSession || parseFloat(newSession) <= 0)) return setCourseError('Enter a valid session rate.');
    if (newRateType === 'both'   && (!newHourly  || !newSession))                 return setCourseError('Enter both rates.');
    setCourseError('');
    try {
      const res = await api.post('/courses', {
        course_name:  name,
        rate_type:    newRateType,
        hourly_rate:  newHourly  ? parseFloat(newHourly)  : null,
        session_rate: newSession ? parseFloat(newSession) : null,
      });
      setCourses(p => [...p, res.data]);
      setNewCourse(''); setNewHourly(''); setNewSession('');
    } catch (err) {
      setCourseError(err.response?.data?.error || 'Could not add course.');
    }
  };

  const deleteCourse = async (tcid) => {
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    try {
      await api.delete(`/courses/${tcid}`);
      setCourses(p => p.filter(c => c.tcid !== tcid));
      setEditing(e => { const n = { ...e }; delete n[tcid]; return n; });
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete course.');
    }
  };

  const openEdit  = (course) => setEditing(e => ({
    ...e,
    [course.tcid]: {
      open: true,
      rate_type:    course.rate_type    || 'hourly',
      hourly_rate:  course.hourly_rate  || '',
      session_rate: course.session_rate || '',
      saving: false, error: '',
    }
  }));

  const closeEdit = (tcid) => setEditing(e => { const n = { ...e }; delete n[tcid]; return n; });

  const saveRate = async (tcid) => {
    const e = editing[tcid];
    if (!e) return;
    if (e.rate_type === 'hourly'  && (!e.hourly_rate  || parseFloat(e.hourly_rate)  <= 0)) return setEditing(p => ({ ...p, [tcid]: { ...e, error: 'Enter a valid hourly rate.'  } }));
    if (e.rate_type === 'session' && (!e.session_rate || parseFloat(e.session_rate) <= 0)) return setEditing(p => ({ ...p, [tcid]: { ...e, error: 'Enter a valid session rate.' } }));
    if (e.rate_type === 'both' && (!e.hourly_rate || !e.session_rate)) return setEditing(p => ({ ...p, [tcid]: { ...e, error: 'Enter both rates.' } }));
    setEditing(p => ({ ...p, [tcid]: { ...e, saving: true, error: '' } }));
    try {
      const res = await api.patch(`/courses/${tcid}`, {
        rate_type:    e.rate_type,
        hourly_rate:  e.hourly_rate  ? parseFloat(e.hourly_rate)  : null,
        session_rate: e.session_rate ? parseFloat(e.session_rate) : null,
      });
      setCourses(p => p.map(c => c.tcid === tcid ? res.data : c));
      closeEdit(tcid);
    } catch (err) {
      setEditing(p => ({ ...p, [tcid]: { ...e, saving: false, error: err.response?.data?.error || 'Could not save.' } }));
    }
  };

  // ── Availability grid handlers ─────────────────────────────
  const ck = (day, hour) => `${day}-${hour}`;

  const startEditAvail = () => {
    setGridCells(expandSlotsToCells(availability));
    setAvailError('');
    setEditingAvail(true);
  };

  const handleCellMouseDown = (day, hour) => {
    const key  = ck(day, hour);
    const mode = gridCells.has(key) ? 'remove' : 'add';
    setDragMode(mode);
    setIsDragging(true);
    setGridCells(prev => {
      const next = new Set(prev);
      mode === 'add' ? next.add(key) : next.delete(key);
      return next;
    });
  };

  const handleCellMouseEnter = (day, hour) => {
    if (!isDragging) return;
    const key = ck(day, hour);
    setGridCells(prev => {
      const next = new Set(prev);
      dragMode === 'add' ? next.add(key) : next.delete(key);
      return next;
    });
  };

  const clearDayGrid = (day) =>
    setGridCells(prev => {
      const next = new Set(prev);
      DISPLAY_HOURS.forEach(h => next.delete(ck(day, h)));
      return next;
    });

  const computeGridSlots = () => {
    const byDay = {};
    gridCells.forEach(key => {
      const [day, hour] = key.split('-').map(Number);
      (byDay[day] ??= []).push(hour);
    });
    const result = [];
    Object.entries(byDay).forEach(([day, hours]) => {
      hours.sort((a, b) => HOUR_IDX[a] - HOUR_IDX[b]);
      let rangeStart = hours[0], prevHour = hours[0], prevIdx = HOUR_IDX[hours[0]];
      for (let i = 1; i <= hours.length; i++) {
        const isLast      = i === hours.length;
        const curr        = isLast ? null : hours[i];
        const currIdx     = isLast ? -1   : HOUR_IDX[curr];
        const consecutive = !isLast && currIdx === prevIdx + 1 && prevIdx !== MIDNIGHT_IDX;
        if (consecutive) { prevHour = curr; prevIdx = currIdx; }
        else {
          result.push({
            day:   String(day),
            start: toTimeStr(rangeStart),
            end:   prevHour === 23 ? '23:59' : toTimeStr((prevHour + 1) % 24),
          });
          if (!isLast) { rangeStart = curr; prevHour = curr; prevIdx = currIdx; }
        }
      }
    });
    return result.sort((a, b) => Number(a.day) - Number(b.day));
  };

  const saveAvailability = async () => {
    setSavingAvail(true);
    setAvailError('');
    const newSlots = computeGridSlots();
    try {
      // Delete all existing slots, then re-create from grid.
      // Safe pre-booking; add session-conflict protection here when booking goes live.
      for (const slot of availability) {
        await api.delete(`/availability/${slot.availability_id}`);
      }
      const saved = [];
      for (const slot of newSlots) {
        const res = await api.post('/availability', {
          day_of_week: parseInt(slot.day),
          start_time:  slot.start,
          end_time:    slot.end,
          timezone,
        });
        saved.push(res.data);
      }
      setAvailability(saved);
      setEditingAvail(false);
    } catch (err) {
      setAvailError(err.response?.data?.error || 'Could not save availability.');
    } finally {
      setSavingAvail(false);
    }
  };

  // ── Blackout date handlers ─────────────────────────────────
  const addBlackoutDate = async () => {
    if (!blackoutDate) return;
    setBlackoutError('');
    try {
      const res = await api.post('/availability/blackout-dates', {
        unavailable_date: blackoutDate,
        reason:           blackoutReason.trim() || null,
      });
      setBlackoutDates(p => [...p, res.data]);
      setBlackoutDate('');
      setBlackoutReason('');
    } catch (err) {
      setBlackoutError(err.response?.data?.error || 'Could not add date.');
    }
  };

  const removeBlackoutDate = async (id) => {
    try {
      await api.delete(`/availability/blackout-dates/${id}`);
      setBlackoutDates(p => p.filter(d => d.id !== id));
    } catch (err) {
      setBlackoutError(err.response?.data?.error || 'Could not remove date.');
    }
  };

  // ── Session action handlers ────────────────────────────────
  const updateSessionStatus = async (sessionId, status) => {
    setSessionActionError('');
    try {
      const res = await api.patch(`/sessions/${sessionId}/status`, { status });
      setTutorSessions(p => p.map(s => s.session_id === sessionId ? res.data : s));
    } catch (err) {
      setSessionActionError(err.response?.data?.error || 'Could not update session.');
    }
  };

  // ── Session settings handlers ──────────────────────────────
  const startEditSettings = () => {
    setSettingsDraft({ ...sessionSettings });
    setSettingsError('');
    setEditingSettings(true);
  };

  const updateDraft = (field, value) =>
    setSettingsDraft(p => ({ ...p, [field]: value }));

  const updateIncrement = (value) => {
    const valid = [];
    for (let d = value; d <= 240; d += value) valid.push(d);
    const snappedMin = valid.find(d => d >= settingsDraft.min_duration_minutes) ?? valid[0];
    const snappedMax = [...valid].reverse().find(d => d <= settingsDraft.max_duration_minutes) ?? valid[valid.length - 1];
    setSettingsDraft(p => ({
      ...p,
      duration_increment:   value,
      min_duration_minutes: snappedMin,
      max_duration_minutes: Math.max(snappedMin, snappedMax),
    }));
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsError('');
    try {
      const res = await api.patch('/tutor-settings', {
        min_duration_minutes: settingsDraft.min_duration_minutes,
        max_duration_minutes: settingsDraft.max_duration_minutes,
        duration_increment:   settingsDraft.duration_increment,
        buffer_minutes:       settingsDraft.buffer_minutes,
        advance_booking_days: settingsDraft.advance_booking_days,
        cancellation_hours:   settingsDraft.cancellation_hours,
        auto_confirm:         settingsDraft.auto_confirm,
      });
      setSessionSettings(res.data);
      setSettingsDraft(res.data);
      setEditingSettings(false);
    } catch (err) {
      setSettingsError(err.response?.data?.error || 'Could not save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Pill group helper ──────────────────────────────────────
  const PillGroup = ({ options, value, onChange }) => (
    <div className="bat-pill-group">
      {options.map(opt => (
        <button key={opt.value} type="button"
          className={`bat-rate-type-btn bat-rate-type-btn--sm ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  // ── Pre-compute for render ─────────────────────────────────
  const availByDay = DAYS_FULL.map((day, i) => ({
    day,
    slots: availability.filter(s => s.day_of_week === i),
  })).filter(d => d.slots.length > 0);

  const computedGridSlots = editingAvail ? computeGridSlots() : [];

  const draftValidDurations = settingsDraft
    ? (() => { const d = []; for (let v = settingsDraft.duration_increment; v <= 240; v += settingsDraft.duration_increment) d.push(v); return d; })()
    : [];

  const draftBookable = draftValidDurations.filter(
    d => settingsDraft && d >= settingsDraft.min_duration_minutes && d <= settingsDraft.max_duration_minutes
  );

  const settingsBookable = sessionSettings
    ? (() => { const d = []; for (let v = sessionSettings.duration_increment; v <= 240; v += sessionSettings.duration_increment) { if (v >= sessionSettings.min_duration_minutes && v <= sessionSettings.max_duration_minutes) d.push(v); } return d; })()
    : [];

  // ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bat-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bat-dashboard">

      {/* ── Header ── */}
      <div className="bat-dashboard-header">
        <h1>Welcome back, {user.first_name}! 👋</h1>
        <p>Here's an overview of your tutoring activity.</p>
      </div>

      {/* ── Stats ── */}
      <div className="bat-stats-row">
        <div className="bat-stat-card">
          <span className="bat-stat-number">{courses.length}</span>
          <span className="bat-stat-label">Courses</span>
        </div>
        <div className={`bat-stat-card${pendingRequests.length > 0 ? ' bat-stat-card--alert' : ''}`}>
          <span className="bat-stat-number">
            {pendingRequests.length}
            {pendingRequests.length > 0 && <span className="bat-stat-alert-dot" />}
          </span>
          <span className="bat-stat-label">Pending</span>
        </div>
        <div className="bat-stat-card">
          <span className="bat-stat-number">{upcomingSessions.length}</span>
          <span className="bat-stat-label">Upcoming</span>
        </div>
        <div className="bat-stat-card">
          <span className="bat-stat-number">{avgRating}</span>
          <span className="bat-stat-label">Avg Rating</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          Pending Requests  (only rendered when count > 0)
          ══════════════════════════════════════════════════════ */}
      {pendingRequests.length > 0 && (
        <div className="bat-section bat-section--alert">
          <div className="bat-section-title-row">
            <h2>🔔 Booking Requests</h2>
            <span className="bat-pending-badge">{pendingRequests.length}</span>
          </div>
          {sessionActionError && <p className="bat-error">{sessionActionError}</p>}
          <div className="bat-session-list">
            {pendingRequests.map(s => (
              <div key={s.session_id} className="bat-session-card bat-session-card--pending">
                <div className="bat-session-card-body">
                  <div className="bat-session-info">
                    <span className="bat-session-course">{s.course_name}</span>
                    <span className="bat-session-student">
                      👤 {s.student_first_name} {s.student_last_name}
                    </span>
                    <span className="bat-session-time">🕐 {formatDateTime(s.session_timestamp)}</span>
                    <span className="bat-session-meta">
                      ⏱ {fmtMins(s.duration_minutes)} &nbsp;·&nbsp; ${parseFloat(s.cost).toFixed(2)}
                    </span>
                  </div>
                  <div className="bat-session-actions">
                    <button className="bat-btn-confirm-sm"
                      onClick={() => updateSessionStatus(s.session_id, 'confirmed')}>
                      ✓ Confirm
                    </button>
                    <button className="bat-btn-decline-sm"
                      onClick={() => updateSessionStatus(s.session_id, 'cancelled')}>
                      ✕ Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          Upcoming Sessions
          ══════════════════════════════════════════════════════ */}
      <div className="bat-section">
        <h2>📅 Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <p className="bat-empty">No upcoming sessions scheduled.</p>
        ) : (
          <div className="bat-session-list">
            {upcomingSessions.map(s => (
              <div key={s.session_id} className="bat-session-card">
                <div className="bat-session-card-body">
                  <div className="bat-session-info">
                    <span className="bat-session-course">{s.course_name}</span>
                    <span className="bat-session-student">
                      👤 {s.student_first_name} {s.student_last_name}
                    </span>
                    <span className="bat-session-time">🕐 {formatDateTime(s.session_timestamp)}</span>
                    <span className="bat-session-meta">
                      ⏱ {fmtMins(s.duration_minutes)} &nbsp;·&nbsp; ${parseFloat(s.cost).toFixed(2)}
                    </span>
                  </div>
                  <div className="bat-session-actions">
                    <span className="bat-session-status bat-session-status--confirmed">Confirmed</span>
                    <button className="bat-btn-decline-sm"
                      onClick={() => updateSessionStatus(s.session_id, 'cancelled')}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          Courses
          ══════════════════════════════════════════════════════ */}
      <div className="bat-section">
        <h2>📚 My Courses</h2>
        {courses.length === 0 ? (
          <p className="bat-empty">No courses yet. Add one below.</p>
        ) : (
          <div className="bat-course-grid">
            {courses.map(course => (
              <div key={course.tcid} className="bat-course-card">
                <div className="bat-course-main">
                  <div className="bat-course-info">
                    <h4>{course.course_name}</h4>
                    <div className="bat-course-meta">
                      <span className="bat-course-rating">
                        ⭐ {course.overall_rating ? parseFloat(course.overall_rating).toFixed(1) : 'No ratings yet'}
                      </span>
                      <span className="bat-course-rate-badge">{formatRate(course)}</span>
                    </div>
                  </div>
                  <div className="bat-course-card-actions">
                    {!editing[course.tcid]?.open && (
                      <button className="bat-btn-link" onClick={() => openEdit(course)}>Edit rate</button>
                    )}
                    <button className="bat-btn-delete" onClick={() => deleteCourse(course.tcid)} title="Delete course">🗑</button>
                  </div>
                </div>
                {editing[course.tcid]?.open && (
                  <div className="bat-inline-rate-editor">
                    <div className="bat-rate-type-row">
                      {['hourly', 'session', 'both'].map(type => (
                        <button key={type} type="button"
                          className={`bat-rate-type-btn bat-rate-type-btn--sm ${editing[course.tcid].rate_type === type ? 'active' : ''}`}
                          onClick={() => setEditing(p => ({ ...p, [course.tcid]: { ...p[course.tcid], rate_type: type } }))}>
                          {RATE_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                    <div className="bat-rate-inputs">
                      {(editing[course.tcid].rate_type === 'hourly' || editing[course.tcid].rate_type === 'both') && (
                        <div className="bat-rate-field">
                          <span className="bat-rate-prefix">$</span>
                          <input type="number" className="bat-input bat-rate-input" placeholder="0.00"
                            min="0" step="0.01" value={editing[course.tcid].hourly_rate}
                            onChange={e => setEditing(p => ({ ...p, [course.tcid]: { ...p[course.tcid], hourly_rate: e.target.value } }))} />
                          <span className="bat-rate-suffix">/hr</span>
                        </div>
                      )}
                      {(editing[course.tcid].rate_type === 'session' || editing[course.tcid].rate_type === 'both') && (
                        <div className="bat-rate-field">
                          <span className="bat-rate-prefix">$</span>
                          <input type="number" className="bat-input bat-rate-input" placeholder="0.00"
                            min="0" step="0.01" value={editing[course.tcid].session_rate}
                            onChange={e => setEditing(p => ({ ...p, [course.tcid]: { ...p[course.tcid], session_rate: e.target.value } }))} />
                          <span className="bat-rate-suffix">/session</span>
                        </div>
                      )}
                    </div>
                    {editing[course.tcid].error && (
                      <p className="bat-error" style={{ marginTop: '0.5rem' }}>{editing[course.tcid].error}</p>
                    )}
                    <div className="bat-inline-rate-actions">
                      <button className="bat-btn-secondary"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                        onClick={() => closeEdit(course.tcid)}>Cancel</button>
                      <button className="bat-btn-confirm"
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                        disabled={editing[course.tcid].saving}
                        onClick={() => saveRate(course.tcid)}>
                        {editing[course.tcid].saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {courseError && <p className="bat-error">{courseError}</p>}

        <div className="bat-add-course-form">
          <div className="bat-add-row">
            <input type="text" className="bat-input" placeholder="New course name"
              value={newCourse}
              onChange={e => setNewCourse(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCourse()} />
          </div>
          <div className="bat-rate-type-row" style={{ marginTop: '0.5rem' }}>
            {['hourly', 'session', 'both'].map(type => (
              <button key={type} type="button"
                className={`bat-rate-type-btn bat-rate-type-btn--sm ${newRateType === type ? 'active' : ''}`}
                onClick={() => setNewRateType(type)}>
                {RATE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <div className="bat-rate-inputs" style={{ marginTop: '0.5rem' }}>
            {(newRateType === 'hourly' || newRateType === 'both') && (
              <div className="bat-rate-field">
                <span className="bat-rate-prefix">$</span>
                <input type="number" className="bat-input bat-rate-input" placeholder="0.00"
                  min="0" step="0.01" value={newHourly} onChange={e => setNewHourly(e.target.value)} />
                <span className="bat-rate-suffix">/hr</span>
              </div>
            )}
            {(newRateType === 'session' || newRateType === 'both') && (
              <div className="bat-rate-field">
                <span className="bat-rate-prefix">$</span>
                <input type="number" className="bat-input bat-rate-input" placeholder="0.00"
                  min="0" step="0.01" value={newSession} onChange={e => setNewSession(e.target.value)} />
                <span className="bat-rate-suffix">/session</span>
              </div>
            )}
          </div>
          <button className="bat-btn-add" style={{ marginTop: '0.75rem' }} onClick={addCourse}>
            Add Course
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          Availability
          ══════════════════════════════════════════════════════ */}
      <div className="bat-section">
        <div className="bat-section-title-row">
          <h2>🗓 My Availability</h2>
          {!editingAvail && (
            <button className="bat-btn-secondary bat-btn-sm" onClick={startEditAvail}>Edit</button>
          )}
        </div>

        {!editingAvail ? (
          <>
            {availByDay.length === 0 ? (
              <p className="bat-empty">No availability set. Click Edit to add hours.</p>
            ) : (
              <div className="bat-avail-grid">
                {availByDay.map(({ day, slots }) => (
                  <div key={day} className="bat-avail-day">
                    <h5 className="bat-avail-day-name">{day}</h5>
                    {slots.map(slot => (
                      <div key={slot.availability_id} className="bat-avail-slot">
                        <span>
                          {slot.start_time.slice(0, 5)} – {slot.end_time === '23:59' ? 'midnight' : slot.end_time.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Blackout dates — always visible below the availability summary */}
            <div className="bat-blackout-section" style={{ marginTop: '1.5rem' }}>
              <h3 className="bat-blackout-title">
                🚫 Unavailable Dates
                <span className="bat-blackout-optional">optional</span>
              </h3>
              <p className="bat-subtitle" style={{ marginBottom: '0.85rem' }}>
                Specific dates you won't be available — exams, travel, etc.
              </p>
              {blackoutError && <p className="bat-error">{blackoutError}</p>}
              <div className="bat-blackout-input-row">
                <input type="date" className="bat-input" min={todayStr()}
                  value={blackoutDate} onChange={e => setBlackoutDate(e.target.value)} />
                <input type="text" className="bat-input" placeholder="Reason (optional)" maxLength={100}
                  value={blackoutReason}
                  onChange={e => setBlackoutReason(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addBlackoutDate()} />
                <button className="bat-btn-add" onClick={addBlackoutDate} disabled={!blackoutDate}>Add</button>
              </div>
              {blackoutDates.length > 0 && (
                <ul className="bat-blackout-list">
                  {[...blackoutDates]
                    .sort((a, b) => a.unavailable_date.localeCompare(b.unavailable_date))
                    .map(bd => (
                      <li key={bd.id} className="bat-blackout-item">
                        <span className="bat-blackout-date">{fmtDate(bd.unavailable_date)}</span>
                        {bd.reason && <span className="bat-blackout-reason">{bd.reason}</span>}
                        <button onClick={() => removeBlackoutDate(bd.id)} className="bat-tag-remove">×</button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          /* ── Grid edit mode ── */
          <>
            <p className="bat-subtitle">Click or drag to update your weekly hours. Changes only save when you click Save.</p>

            <div className="bat-avail-tz-row">
              <span className="bat-avail-tz-label">🌍 Timezone</span>
              <select className="bat-select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                {tzList.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>

            <div className="bat-avail-grid-wrap" onMouseLeave={() => setIsDragging(false)}>
              <table className="bat-avail-week-grid">
                <thead>
                  <tr>
                    <th className="bat-avail-time-col" />
                    {DAYS_SHORT.map((d, i) => (
                      <th key={d} className="bat-avail-day-col">
                        <div className="bat-avail-day-header">
                          <span>{d}</span>
                          {DISPLAY_HOURS.some(h => gridCells.has(ck(i, h))) && (
                            <button className="bat-avail-clear-btn" onClick={() => clearDayGrid(i)}
                              title={`Clear ${DAYS_FULL[i]}`}>×</button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DISPLAY_HOURS.map((hour, idx) => (
                    <React.Fragment key={`row-${hour}`}>
                      {idx === 18 && (
                        <tr className="bat-avail-midnight-sep">
                          <td colSpan={8}>── after midnight ──</td>
                        </tr>
                      )}
                      <tr>
                        <td className="bat-avail-time-label">{formatHour(hour)}</td>
                        {DAYS_SHORT.map((_, day) => {
                          const key = ck(day, hour);
                          return (
                            <td key={day}
                              className={`bat-avail-cell${gridCells.has(key) ? ' selected' : ''}`}
                              onMouseDown={()  => handleCellMouseDown(day, hour)}
                              onMouseEnter={() => handleCellMouseEnter(day, hour)}
                            />
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bat-avail-legend">
              <span className="bat-avail-legend-swatch selected" />
              <span>Available</span>
              <span className="bat-avail-legend-swatch" style={{ marginLeft: '1rem' }} />
              <span>Unavailable</span>
              {gridCells.size > 0 && (
                <span className="bat-avail-cell-count">
                  {computedGridSlots.length} block{computedGridSlots.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {availError && <p className="bat-error">{availError}</p>}

            <div className="bat-btn-row">
              <button className="bat-btn-secondary" onClick={() => setEditingAvail(false)}>Cancel</button>
              <button className="bat-btn-confirm" style={{ padding: '0.6rem 1.5rem' }}
                disabled={savingAvail} onClick={saveAvailability}>
                {savingAvail ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          Session Settings
          ══════════════════════════════════════════════════════ */}
      {sessionSettings && (
        <div className="bat-section">
          <div className="bat-section-title-row">
            <h2>⚙️ Session Settings</h2>
            {!editingSettings && (
              <button className="bat-btn-secondary bat-btn-sm" onClick={startEditSettings}>Edit</button>
            )}
          </div>

          {!editingSettings ? (
            <ul className="bat-review-settings-list">
              <li>
                <span className="bat-review-settings-key">Bookable durations</span>
                <span className="bat-review-settings-val">{settingsBookable.map(fmtMins).join(', ')}</span>
              </li>
              <li>
                <span className="bat-review-settings-key">Buffer between sessions</span>
                <span className="bat-review-settings-val">
                  {sessionSettings.buffer_minutes === 0 ? 'None' : `${sessionSettings.buffer_minutes} min`}
                </span>
              </li>
              <li>
                <span className="bat-review-settings-key">Advance booking window</span>
                <span className="bat-review-settings-val">
                  {ADVANCE_OPTIONS.find(o => o.value === sessionSettings.advance_booking_days)?.label
                    ?? `${sessionSettings.advance_booking_days} days`}
                </span>
              </li>
              <li>
                <span className="bat-review-settings-key">Cancellation window</span>
                <span className="bat-review-settings-val">
                  {CANCEL_OPTIONS.find(o => o.value === sessionSettings.cancellation_hours)?.label
                    ?? `${sessionSettings.cancellation_hours} hours`}
                </span>
              </li>
              <li>
                <span className="bat-review-settings-key">Auto-confirm bookings</span>
                <span className={`bat-review-settings-val ${sessionSettings.auto_confirm ? 'bat-review-settings-val--on' : ''}`}>
                  {sessionSettings.auto_confirm ? 'On — instant confirmation' : 'Off — manual review'}
                </span>
              </li>
            </ul>
          ) : (
            <div className="bat-settings-editor">
              {/* Duration */}
              <div className="bat-settings-card">
                <div className="bat-settings-card-header">
                  <span className="bat-settings-icon">⏱</span>
                  <div>
                    <h4 className="bat-settings-title">Session Length</h4>
                    <p className="bat-settings-desc">Increment and min/max duration.</p>
                  </div>
                </div>
                <label className="bat-settings-label">Increment</label>
                <PillGroup options={INCREMENT_OPTIONS} value={settingsDraft.duration_increment}
                  onChange={updateIncrement} />
                <div className="bat-duration-range-row">
                  <div className="bat-duration-field">
                    <label className="bat-settings-label">Minimum</label>
                    <select className="bat-select" value={settingsDraft.min_duration_minutes}
                      onChange={e => updateDraft('min_duration_minutes', Number(e.target.value))}>
                      {draftValidDurations.map(d => <option key={d} value={d}>{fmtMins(d)}</option>)}
                    </select>
                  </div>
                  <span className="bat-duration-to">to</span>
                  <div className="bat-duration-field">
                    <label className="bat-settings-label">Maximum</label>
                    <select className="bat-select" value={settingsDraft.max_duration_minutes}
                      onChange={e => updateDraft('max_duration_minutes', Number(e.target.value))}>
                      {draftValidDurations.filter(d => d >= settingsDraft.min_duration_minutes)
                        .map(d => <option key={d} value={d}>{fmtMins(d)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="bat-duration-preview">
                  <span className="bat-settings-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Students can book:</span>
                  <div className="bat-duration-chips">
                    {draftBookable.map(d => <span key={d} className="bat-duration-chip">{fmtMins(d)}</span>)}
                  </div>
                </div>
              </div>

              {/* Buffer */}
              <div className="bat-settings-card">
                <div className="bat-settings-card-header">
                  <span className="bat-settings-icon">☕</span>
                  <div>
                    <h4 className="bat-settings-title">Buffer Between Sessions</h4>
                    <p className="bat-settings-desc">Enforced gap after each session ends.</p>
                  </div>
                </div>
                <PillGroup options={BUFFER_OPTIONS} value={settingsDraft.buffer_minutes}
                  onChange={v => updateDraft('buffer_minutes', v)} />
              </div>

              {/* Advance booking */}
              <div className="bat-settings-card">
                <div className="bat-settings-card-header">
                  <span className="bat-settings-icon">📅</span>
                  <div>
                    <h4 className="bat-settings-title">Advance Booking Window</h4>
                    <p className="bat-settings-desc">How far ahead students can schedule.</p>
                  </div>
                </div>
                <PillGroup options={ADVANCE_OPTIONS} value={settingsDraft.advance_booking_days}
                  onChange={v => updateDraft('advance_booking_days', v)} />
              </div>

              {/* Cancellation */}
              <div className="bat-settings-card">
                <div className="bat-settings-card-header">
                  <span className="bat-settings-icon">🚪</span>
                  <div>
                    <h4 className="bat-settings-title">Cancellation Window</h4>
                    <p className="bat-settings-desc">Minimum notice a student must give to cancel.</p>
                  </div>
                </div>
                <PillGroup options={CANCEL_OPTIONS} value={settingsDraft.cancellation_hours}
                  onChange={v => updateDraft('cancellation_hours', v)} />
              </div>

              {/* Auto-confirm */}
              <div className="bat-settings-card">
                <div className="bat-settings-card-header" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span className="bat-settings-icon">⚡</span>
                    <div>
                      <h4 className="bat-settings-title">Auto-confirm Bookings</h4>
                      <p className="bat-settings-desc">Confirm instantly or review each request manually.</p>
                    </div>
                  </div>
                  <button type="button"
                    className={`bat-toggle${settingsDraft.auto_confirm ? ' active' : ''}`}
                    onClick={() => updateDraft('auto_confirm', !settingsDraft.auto_confirm)}>
                    <span className="bat-toggle-thumb" />
                  </button>
                </div>
                {settingsDraft.auto_confirm && (
                  <p className="bat-hint bat-hint--warning">⚠ Bookings will be confirmed without your review.</p>
                )}
              </div>

              {settingsError && <p className="bat-error">{settingsError}</p>}

              <div className="bat-btn-row">
                <button className="bat-btn-secondary" onClick={() => setEditingSettings(false)}>Cancel</button>
                <button className="bat-btn-confirm" style={{ padding: '0.6rem 1.5rem' }}
                  disabled={savingSettings} onClick={saveSettings}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default TutorDashboard;