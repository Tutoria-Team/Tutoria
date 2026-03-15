import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS      = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

// Step 3 — session settings option sets
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
const todayStr   = () => new Date().toISOString().split('T')[0];
const formatHour = (h) => {
  if (h === 0)  return '12 AM';
  if (h < 12)   return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

const fmtMins = (m) => {
  if (m < 60)         return `${m} min`;
  if (m % 60 === 0)   return `${m / 60} hr`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

/**
 * Returns valid bookable durations given an increment.
 * Capped at 4 hours (240 min) for UX — the DB allows up to 480 but
 * no college tutor is running 8-hour sessions.
 */
const getValidDurations = (increment) => {
  const durations = [];
  for (let d = increment; d <= 240; d += increment) durations.push(d);
  return durations;
};

const STEPS = ['Add Courses', 'Set Availability', 'Session Settings', 'Review'];

// ─── Component ────────────────────────────────────────────────────────────────

const BecomeTutorForm = ({ onSuccess }) => {
  const [step, setStep] = useState(1);

  // ── Step 1 — Courses ──────────────────────────────────────
  const [defaultRateType, setDefaultRateType] = useState('hourly');
  const [defaultHourly,   setDefaultHourly]   = useState('');
  const [defaultSession,  setDefaultSession]  = useState('');
  const [courses,         setCourses]         = useState([]);
  const [courseInput,     setCourseInput]     = useState('');
  const [editingRates,    setEditingRates]    = useState({});

  // ── Step 2 — Availability grid ────────────────────────────
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [timezone,      setTimezone]      = useState(detectedTz);
  const [isDragging,    setIsDragging]    = useState(false);
  const [dragMode,      setDragMode]      = useState('add');

  // ── Step 2 — Blackout dates ───────────────────────────────
  const [blackoutDate,   setBlackoutDate]   = useState('');
  const [blackoutReason, setBlackoutReason] = useState('');
  const [blackoutDates,  setBlackoutDates]  = useState([]);

  // ── Step 3 — Session settings ─────────────────────────────
  const [durationIncrement,  setDurationIncrement]  = useState(30);
  const [minDuration,        setMinDuration]        = useState(30);
  const [maxDuration,        setMaxDuration]        = useState(120);
  const [bufferMins,         setBufferMins]         = useState(0);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(14);
  const [cancellationHours,  setCancellationHours]  = useState(24);
  const [autoConfirm,        setAutoConfirm]        = useState(false);

  // ── Misc ──────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // ── Effects ───────────────────────────────────────────────

  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // When increment changes, snap min/max to nearest valid options
  useEffect(() => {
    const valid = getValidDurations(durationIncrement);
    // Snap min: find first valid >= current min, else first option
    const snappedMin = valid.find(d => d >= minDuration) ?? valid[0];
    // Snap max: find last valid <= current max, else last option
    const snappedMax = [...valid].reverse().find(d => d <= maxDuration) ?? valid[valid.length - 1];
    setMinDuration(snappedMin);
    setMaxDuration(Math.max(snappedMin, snappedMax));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationIncrement]);

  // Ensure min never exceeds max
  useEffect(() => {
    if (minDuration > maxDuration) setMaxDuration(minDuration);
  }, [minDuration, maxDuration]);

  // ── Derived ───────────────────────────────────────────────

  const tzList = COMMON_TIMEZONES.some(t => t.value === detectedTz)
    ? COMMON_TIMEZONES
    : [{ label: `${detectedTz} (detected)`, value: detectedTz }, ...COMMON_TIMEZONES];

  const validDurations   = getValidDurations(durationIncrement);
  const bookableDurations = validDurations.filter(d => d >= minDuration && d <= maxDuration);

  // ── Step 1 helpers ────────────────────────────────────────

  const defaultRatesValid = () => {
    if (defaultRateType === 'hourly')  return !!defaultHourly  && parseFloat(defaultHourly)  > 0;
    if (defaultRateType === 'session') return !!defaultSession && parseFloat(defaultSession) > 0;
    if (defaultRateType === 'both')
      return !!defaultHourly  && parseFloat(defaultHourly)  > 0 &&
             !!defaultSession && parseFloat(defaultSession) > 0;
    return false;
  };

  const addCourse = () => {
    const name = courseInput.trim();
    if (!name) return;
    if (courses.find(c => c.name === name)) { setError('You already added that course.'); return; }
    setCourses([...courses, {
      name,
      rate_type:    defaultRateType,
      hourly_rate:  defaultHourly,
      session_rate: defaultSession,
    }]);
    setCourseInput('');
    setError('');
  };

  const removeCourse     = (name)         => setCourses(courses.filter(c => c.name !== name));
  const updateCourseRate = (name, f, val) => setCourses(courses.map(c => c.name === name ? { ...c, [f]: val } : c));

  const formatRate = (c) => {
    if (c.rate_type === 'hourly')  return `$${c.hourly_rate}/hr`;
    if (c.rate_type === 'session') return `$${c.session_rate}/session`;
    if (c.rate_type === 'both')    return `$${c.hourly_rate}/hr · $${c.session_rate}/session`;
    return '';
  };

  // ── Step 2 grid helpers ───────────────────────────────────

  const ck = (day, hour) => `${day}-${hour}`;

  const handleCellMouseDown = (day, hour) => {
    const key  = ck(day, hour);
    const mode = selectedCells.has(key) ? 'remove' : 'add';
    setDragMode(mode);
    setIsDragging(true);
    setSelectedCells(prev => {
      const next = new Set(prev);
      mode === 'add' ? next.add(key) : next.delete(key);
      return next;
    });
  };

  const handleCellMouseEnter = (day, hour) => {
    if (!isDragging) return;
    const key = ck(day, hour);
    setSelectedCells(prev => {
      const next = new Set(prev);
      dragMode === 'add' ? next.add(key) : next.delete(key);
      return next;
    });
  };

  const clearDay = (day) =>
    setSelectedCells(prev => {
      const next = new Set(prev);
      DISPLAY_HOURS.forEach(h => next.delete(ck(day, h)));
      return next;
    });

  const computeSlots = () => {
    const byDay = {};
    selectedCells.forEach(key => {
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

  // ── Step 2 blackout helpers ───────────────────────────────

  const addBlackoutDate = () => {
    if (!blackoutDate) return;
    if (blackoutDates.find(d => d.date === blackoutDate)) {
      setError('That date is already marked unavailable.');
      return;
    }
    setBlackoutDates(prev => [...prev, { date: blackoutDate, reason: blackoutReason.trim() }]);
    setBlackoutDate('');
    setBlackoutReason('');
    setError('');
  };

  const removeBlackoutDate = (date) => setBlackoutDates(prev => prev.filter(d => d.date !== date));

  const fmtDate = (ds) =>
    new Date(ds + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

  // ── Submit ────────────────────────────────────────────────

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    const slots = computeSlots();
    try {
      // 1. Upgrade to tutor + save session settings in one transaction (server handles it)
      const { data } = await api.patch('/users/me/become-tutor', {
        min_duration_minutes:  minDuration,
        max_duration_minutes:  maxDuration,
        duration_increment:    durationIncrement,
        buffer_minutes:        bufferMins,
        advance_booking_days:  advanceBookingDays,
        cancellation_hours:    cancellationHours,
        auto_confirm:          autoConfirm,
      });

      // 2. Courses
      for (const course of courses) {
        await api.post('/courses', {
          course_name:  course.name,
          rate_type:    course.rate_type,
          hourly_rate:  course.hourly_rate  ? parseFloat(course.hourly_rate)  : null,
          session_rate: course.session_rate ? parseFloat(course.session_rate) : null,
        });
      }

      // 3. Availability slots
      for (const slot of slots) {
        await api.post('/availability', {
          day_of_week: parseInt(slot.day),
          start_time:  slot.start,
          end_time:    slot.end,
          timezone,
        });
      }

      // 4. Blackout dates
      for (const bd of blackoutDates) {
        await api.post('/availability/blackout-dates', {
          unavailable_date: bd.date,
          reason:           bd.reason || null,
        });
      }

      onSuccess(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const computedSlots = computeSlots();

  // ── Pill button helper ────────────────────────────────────

  const PillGroup = ({ options, value, onChange, size = 'md' }) => (
    <div className="bat-pill-group">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`bat-rate-type-btn${size === 'sm' ? ' bat-rate-type-btn--sm' : ''} ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────
  return (
    <div className="bat-form-wrapper">

      {/* ── Progress bar ── */}
      <div className="bat-steps">
        {STEPS.map((label, i) => (
          <div key={label} className={`bat-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <div className="bat-step-circle">{step > i + 1 ? '✓' : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {error && <p className="bat-error">{error}</p>}

      {/* ════════════════════════════════════════════════════
          STEP 1 — Courses + Rates
          ════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="bat-step-content">
          <h2>What courses will you teach?</h2>
          <p className="bat-subtitle">Set a default rate then add your courses. You can adjust rates per course.</p>

          {/* Default rate */}
          <div className="bat-rate-defaults">
            <h4 className="bat-rate-label">Default Rate</h4>
            <div className="bat-rate-type-row">
              {['hourly', 'session', 'both'].map(type => (
                <button key={type} type="button"
                  className={`bat-rate-type-btn ${defaultRateType === type ? 'active' : ''}`}
                  onClick={() => setDefaultRateType(type)}>
                  {RATE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <div className="bat-rate-inputs">
              {(defaultRateType === 'hourly' || defaultRateType === 'both') && (
                <div className="bat-rate-field">
                  <span className="bat-rate-prefix">$</span>
                  <input type="number" className="bat-input bat-rate-input" placeholder="0.00"
                    min="0" step="0.01" value={defaultHourly}
                    onChange={e => setDefaultHourly(e.target.value)} />
                  <span className="bat-rate-suffix">/hr</span>
                </div>
              )}
              {(defaultRateType === 'session' || defaultRateType === 'both') && (
                <div className="bat-rate-field">
                  <span className="bat-rate-prefix">$</span>
                  <input type="number" className="bat-input bat-rate-input" placeholder="0.00"
                    min="0" step="0.01" value={defaultSession}
                    onChange={e => setDefaultSession(e.target.value)} />
                  <span className="bat-rate-suffix">/session</span>
                </div>
              )}
            </div>
          </div>

          <div className="bat-input-row">
            <input type="text" className="bat-input" placeholder="e.g. Data Structures"
              value={courseInput}
              onChange={e => setCourseInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCourse()}
              disabled={!defaultRatesValid()} />
            <button className="bat-btn-add" onClick={addCourse} disabled={!defaultRatesValid()}>Add</button>
          </div>
          {!defaultRatesValid() && <p className="bat-hint">Set a default rate above before adding courses.</p>}

          <ul className="bat-course-form-list">
            {courses.map(course => (
              <li key={course.name} className="bat-course-form-item">
                <div className="bat-course-form-header">
                  <span className="bat-course-form-name">{course.name}</span>
                  <div className="bat-course-form-actions">
                    <span className="bat-course-rate-display">{formatRate(course)}</span>
                    <button className="bat-btn-link"
                      onClick={() => setEditingRates(p => ({ ...p, [course.name]: !p[course.name] }))}>
                      {editingRates[course.name] ? 'Done' : 'Edit rate'}
                    </button>
                    <button onClick={() => removeCourse(course.name)} className="bat-tag-remove">×</button>
                  </div>
                </div>
                {editingRates[course.name] && (
                  <div className="bat-course-rate-edit">
                    <div className="bat-rate-type-row">
                      {['hourly', 'session', 'both'].map(type => (
                        <button key={type} type="button"
                          className={`bat-rate-type-btn bat-rate-type-btn--sm ${course.rate_type === type ? 'active' : ''}`}
                          onClick={() => updateCourseRate(course.name, 'rate_type', type)}>
                          {RATE_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                    <div className="bat-rate-inputs">
                      {(course.rate_type === 'hourly' || course.rate_type === 'both') && (
                        <div className="bat-rate-field">
                          <span className="bat-rate-prefix">$</span>
                          <input type="number" className="bat-input bat-rate-input" placeholder="0.00"
                            min="0" step="0.01" value={course.hourly_rate}
                            onChange={e => updateCourseRate(course.name, 'hourly_rate', e.target.value)} />
                          <span className="bat-rate-suffix">/hr</span>
                        </div>
                      )}
                      {(course.rate_type === 'session' || course.rate_type === 'both') && (
                        <div className="bat-rate-field">
                          <span className="bat-rate-prefix">$</span>
                          <input type="number" className="bat-input bat-rate-input" placeholder="0.00"
                            min="0" step="0.01" value={course.session_rate}
                            onChange={e => updateCourseRate(course.name, 'session_rate', e.target.value)} />
                          <span className="bat-rate-suffix">/session</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <button className="bat-btn-primary" disabled={courses.length === 0}
            onClick={() => { setError(''); setStep(2); }}>
            Next →
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          STEP 2 — Availability Grid + Blackout Dates
          ════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="bat-step-content">
          <h2>When are you available?</h2>
          <p className="bat-subtitle">Click or drag cells to mark your hours. Consecutive cells merge automatically.</p>

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
                  {DAYS.map((d, i) => (
                    <th key={d} className="bat-avail-day-col">
                      <div className="bat-avail-day-header">
                        <span>{d}</span>
                        {DISPLAY_HOURS.some(h => selectedCells.has(ck(i, h))) && (
                          <button className="bat-avail-clear-btn" onClick={() => clearDay(i)}
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
                      {DAYS.map((_, day) => {
                        const key = ck(day, hour);
                        return (
                          <td key={day}
                            className={`bat-avail-cell${selectedCells.has(key) ? ' selected' : ''}`}
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
            {selectedCells.size > 0 && (
              <span className="bat-avail-cell-count">
                {computedSlots.length} block{computedSlots.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Blackout dates */}
          <div className="bat-blackout-section">
            <h3 className="bat-blackout-title">
              🚫 Specific Unavailable Dates
              <span className="bat-blackout-optional">optional</span>
            </h3>
            <p className="bat-subtitle" style={{ marginBottom: '0.85rem' }}>
              Dates you won't be available despite your usual schedule — exams, travel, etc.
            </p>
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
                {[...blackoutDates].sort((a, b) => a.date.localeCompare(b.date)).map(bd => (
                  <li key={bd.date} className="bat-blackout-item">
                    <span className="bat-blackout-date">{fmtDate(bd.date)}</span>
                    {bd.reason && <span className="bat-blackout-reason">{bd.reason}</span>}
                    <button onClick={() => removeBlackoutDate(bd.date)} className="bat-tag-remove">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bat-btn-row">
            <button className="bat-btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="bat-btn-primary" style={{ width: 'auto' }}
              disabled={selectedCells.size === 0}
              onClick={() => { setError(''); setStep(3); }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          STEP 3 — Session Settings  (NEW)
          ════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="bat-step-content">
          <h2>How do you want to run sessions?</h2>
          <p className="bat-subtitle">
            These preferences control how students book you. You can change them anytime from your dashboard.
          </p>

          {/* ── Session Length ── */}
          <div className="bat-settings-card">
            <div className="bat-settings-card-header">
              <span className="bat-settings-icon">⏱</span>
              <div>
                <h4 className="bat-settings-title">Session Length</h4>
                <p className="bat-settings-desc">Define the range of durations students can choose from.</p>
              </div>
            </div>

            <label className="bat-settings-label">Booking increment</label>
            <PillGroup
              options={INCREMENT_OPTIONS}
              value={durationIncrement}
              onChange={setDurationIncrement}
            />
            <p className="bat-hint" style={{ marginTop: '0.4rem' }}>
              Students pick session lengths in multiples of this.
            </p>

            <div className="bat-duration-range-row">
              <div className="bat-duration-field">
                <label className="bat-settings-label">Minimum</label>
                <select className="bat-select" value={minDuration}
                  onChange={e => setMinDuration(Number(e.target.value))}>
                  {validDurations.map(d => (
                    <option key={d} value={d}>{fmtMins(d)}</option>
                  ))}
                </select>
              </div>
              <span className="bat-duration-to">to</span>
              <div className="bat-duration-field">
                <label className="bat-settings-label">Maximum</label>
                <select className="bat-select" value={maxDuration}
                  onChange={e => setMaxDuration(Number(e.target.value))}>
                  {validDurations.filter(d => d >= minDuration).map(d => (
                    <option key={d} value={d}>{fmtMins(d)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live preview of bookable durations */}
            <div className="bat-duration-preview">
              <span className="bat-settings-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                Students can book:
              </span>
              <div className="bat-duration-chips">
                {bookableDurations.map(d => (
                  <span key={d} className="bat-duration-chip">{fmtMins(d)}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Buffer ── */}
          <div className="bat-settings-card">
            <div className="bat-settings-card-header">
              <span className="bat-settings-icon">☕</span>
              <div>
                <h4 className="bat-settings-title">Buffer Between Sessions</h4>
                <p className="bat-settings-desc">Enforced gap after each session before the next can start.</p>
              </div>
            </div>
            <PillGroup options={BUFFER_OPTIONS} value={bufferMins} onChange={setBufferMins} />
          </div>

          {/* ── Advance Booking ── */}
          <div className="bat-settings-card">
            <div className="bat-settings-card-header">
              <span className="bat-settings-icon">📅</span>
              <div>
                <h4 className="bat-settings-title">Advance Booking Window</h4>
                <p className="bat-settings-desc">How far ahead students can schedule a session.</p>
              </div>
            </div>
            <PillGroup options={ADVANCE_OPTIONS} value={advanceBookingDays} onChange={setAdvanceBookingDays} />
          </div>

          {/* ── Cancellation ── */}
          <div className="bat-settings-card">
            <div className="bat-settings-card-header">
              <span className="bat-settings-icon">🚪</span>
              <div>
                <h4 className="bat-settings-title">Cancellation Window</h4>
                <p className="bat-settings-desc">Minimum notice required before a student can cancel.</p>
              </div>
            </div>
            <PillGroup options={CANCEL_OPTIONS} value={cancellationHours} onChange={setCancellationHours} />
          </div>

          {/* ── Auto-confirm ── */}
          <div className="bat-settings-card">
            <div className="bat-settings-card-header" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <span className="bat-settings-icon">⚡</span>
                <div>
                  <h4 className="bat-settings-title">Auto-confirm Bookings</h4>
                  <p className="bat-settings-desc">
                    When on, bookings are confirmed instantly. When off, you review and accept each request manually.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`bat-toggle${autoConfirm ? ' active' : ''}`}
                onClick={() => setAutoConfirm(p => !p)}
                aria-label="Toggle auto-confirm"
              >
                <span className="bat-toggle-thumb" />
              </button>
            </div>
            {autoConfirm && (
              <p className="bat-hint bat-hint--warning">
                ⚠ Bookings will be confirmed immediately without your review.
              </p>
            )}
          </div>

          <div className="bat-btn-row">
            <button className="bat-btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="bat-btn-primary" style={{ width: 'auto' }}
              onClick={() => { setError(''); setStep(4); }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          STEP 4 — Review & Confirm
          ════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="bat-step-content">
          <h2>Review & Confirm</h2>
          <p className="bat-subtitle">Here's what will be set up when you confirm.</p>

          {/* Courses */}
          <div className="bat-review-section">
            <h4>📚 Courses ({courses.length})</h4>
            <ul className="bat-course-form-list">
              {courses.map(c => (
                <li key={c.name} className="bat-course-form-item bat-course-form-item--review">
                  <span className="bat-course-form-name">{c.name}</span>
                  <span className="bat-course-rate-display">{formatRate(c)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Availability */}
          <div className="bat-review-section">
            <h4>🗓 Availability ({computedSlots.length} block{computedSlots.length !== 1 ? 's' : ''})</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', margin: '-0.25rem 0 0.75rem' }}>
              {timezone}
            </p>
            <ul className="bat-slot-list">
              {computedSlots.map((s, i) => (
                <li key={i} className="bat-slot-item">
                  <span className="bat-slot-day">{DAYS_FULL[s.day]}</span>
                  <span>{s.start} – {s.end === '23:59' ? 'midnight' : s.end}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Blackout dates */}
          {blackoutDates.length > 0 && (
            <div className="bat-review-section">
              <h4>🚫 Unavailable Dates ({blackoutDates.length})</h4>
              <ul className="bat-blackout-list">
                {[...blackoutDates].sort((a, b) => a.date.localeCompare(b.date)).map(bd => (
                  <li key={bd.date} className="bat-blackout-item bat-blackout-item--review">
                    <span className="bat-blackout-date">{fmtDate(bd.date)}</span>
                    {bd.reason && <span className="bat-blackout-reason">{bd.reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Session settings summary */}
          <div className="bat-review-section">
            <h4>⚙️ Session Settings</h4>
            <ul className="bat-review-settings-list">
              <li>
                <span className="bat-review-settings-key">Bookable durations</span>
                <span className="bat-review-settings-val">
                  {bookableDurations.map(fmtMins).join(', ')}
                </span>
              </li>
              <li>
                <span className="bat-review-settings-key">Increment</span>
                <span className="bat-review-settings-val">{fmtMins(durationIncrement)}</span>
              </li>
              <li>
                <span className="bat-review-settings-key">Buffer</span>
                <span className="bat-review-settings-val">
                  {bufferMins === 0 ? 'None' : `${bufferMins} min`}
                </span>
              </li>
              <li>
                <span className="bat-review-settings-key">Advance booking</span>
                <span className="bat-review-settings-val">
                  {ADVANCE_OPTIONS.find(o => o.value === advanceBookingDays)?.label}
                </span>
              </li>
              <li>
                <span className="bat-review-settings-key">Cancellation window</span>
                <span className="bat-review-settings-val">
                  {CANCEL_OPTIONS.find(o => o.value === cancellationHours)?.label}
                </span>
              </li>
              <li>
                <span className="bat-review-settings-key">Auto-confirm</span>
                <span className={`bat-review-settings-val ${autoConfirm ? 'bat-review-settings-val--on' : ''}`}>
                  {autoConfirm ? 'On — bookings confirmed instantly' : 'Off — you review each request'}
                </span>
              </li>
            </ul>
          </div>

          <div className="bat-btn-row">
            <button className="bat-btn-secondary" onClick={() => setStep(3)}>← Back</button>
            <button className="bat-btn-confirm" disabled={submitting} onClick={handleConfirm}>
              {submitting ? 'Setting up your profile...' : '🎓 Become a Tutor'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BecomeTutorForm;