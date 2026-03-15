const pool = require('../config/db.config');

/**
 * checkSessionConflict
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns true if the proposed session overlaps with any existing
 * pending/confirmed session for the given tutor.
 *
 * Overlap logic (standard interval intersection):
 *   Two ranges [A_start, A_end) and [B_start, B_end) overlap when:
 *   A_start < B_end  AND  A_end > B_start
 *
 * Buffer logic:
 *   The effective end of an existing session is extended by the tutor's
 *   buffer_minutes before testing the overlap — so a 15-min buffer means
 *   the next session can't start until 15 min after the previous one ends.
 *
 * @param {string}  tutorEmail
 * @param {Date}    proposedStart  — JS Date object (UTC)
 * @param {number}  durationMins   — length of the proposed session
 * @param {number}  [excludeId]    — session_id to exclude (for rescheduling)
 * @returns {boolean}
 */
const checkSessionConflict = async (tutorEmail, proposedStart, durationMins, excludeId = null) => {
  const result = await pool.query(
    `SELECT 1
     FROM sessions s
     JOIN tutor_session_settings tss ON tss.tutor_email = s.tutor_email
     WHERE s.tutor_email = $1
       AND s.status IN ('pending', 'confirmed')
       AND ($2::timestamptz) < (s.end_timestamp + tss.buffer_minutes * INTERVAL '1 minute')
       AND (($2::timestamptz) + ($3 * INTERVAL '1 minute')) > s.session_timestamp
       AND ($4::integer IS NULL OR s.session_id <> $4)
     LIMIT 1`,
    [tutorEmail, proposedStart.toISOString(), durationMins, excludeId]
  );
  return result.rowCount > 0;
};

/**
 * checkAvailabilityCovers
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifies the tutor has a recurring availability slot that covers the
 * entire proposed session window on the correct day of week.
 *
 * Also checks that the proposed date is not in the tutor's blackout dates.
 *
 * @param {string}  tutorEmail
 * @param {Date}    proposedStart  — JS Date (UTC); we derive day + time from this
 * @param {number}  durationMins
 * @param {string}  timezone       — IANA tz string for day-of-week calculation
 * @returns {{ covered: boolean, reason?: string }}
 */
const checkAvailabilityCovers = async (tutorEmail, proposedStart, durationMins, timezone) => {
  const proposedEnd = new Date(proposedStart.getTime() + durationMins * 60_000);

  // Compute local day-of-week + local time strings in the tutor's timezone
  const localStart = proposedStart.toLocaleString('en-US', { timeZone: timezone });
  const localEnd   = proposedEnd.toLocaleString('en-US',   { timeZone: timezone });

  const startDate = new Date(localStart);
  const endDate   = new Date(localEnd);

  const dayOfWeek  = startDate.getDay(); // 0=Sun … 6=Sat
  const startTime  = startDate.toTimeString().slice(0, 5); // 'HH:MM'
  const endTime    = endDate.toTimeString().slice(0, 5);

  // 1. Check blackout dates
  const dateStr = proposedStart.toLocaleDateString('en-CA', { timeZone: timezone }); // 'YYYY-MM-DD'
  const blackout = await pool.query(
    `SELECT 1 FROM tutor_unavailable_dates
     WHERE tutor_email = $1 AND unavailable_date = $2::date`,
    [tutorEmail, dateStr]
  );
  if (blackout.rowCount > 0) {
    return { covered: false, reason: 'Tutor is unavailable on that date.' };
  }

  // 2. Check recurring availability covers the entire window
  //    The slot's start must be ≤ session start, and slot's end ≥ session end.
  const avail = await pool.query(
    `SELECT 1 FROM tutor_availability
     WHERE tutor_email = $1
       AND is_active   = TRUE
       AND day_of_week = $2
       AND start_time  <= $3::time
       AND end_time    >= $4::time
     LIMIT 1`,
    [tutorEmail, dayOfWeek, startTime, endTime]
  );
  if (avail.rowCount === 0) {
    return { covered: false, reason: 'Proposed time falls outside tutor\'s availability.' };
  }

  return { covered: true };
};

/**
 * getBookableSlots
 * ─────────────────────────────────────────────────────────────────────────────
 * For a given tutor + date, returns all bookable time slots that:
 *   1. Fall within the tutor's recurring availability for that day of week
 *   2. Are not blocked by an existing pending/confirmed session (+ buffer)
 *   3. Are not on a blackout date
 *   4. Start at least `advance_booking_days` days from now (honoured by the
 *      caller — this function doesn't filter past slots, just conflicts)
 *
 * Slots are generated at `duration_increment` intervals, each of
 * `requestedDuration` minutes long.
 *
 * @param {string}  tutorEmail
 * @param {string}  dateStr          — 'YYYY-MM-DD' in tutor's local timezone
 * @param {number}  requestedDuration — in minutes
 * @returns {Array<{ start: string, end: string }>}  — 'HH:MM' strings
 */
const getBookableSlots = async (tutorEmail, dateStr, requestedDuration) => {
  // Fetch tutor settings
  const settingsResult = await pool.query(
    `SELECT * FROM tutor_session_settings WHERE tutor_email = $1`,
    [tutorEmail]
  );
  if (settingsResult.rowCount === 0) return [];
  const settings = settingsResult.rows[0];
  const { duration_increment, buffer_minutes, min_duration_minutes, max_duration_minutes } = settings;

  // Validate requested duration is within tutor's allowed range
  const duration = parseInt(requestedDuration);
  if (duration < min_duration_minutes || duration > max_duration_minutes) return [];
  if (duration % duration_increment !== 0) return [];

  // Check blackout
  const blackout = await pool.query(
    `SELECT 1 FROM tutor_unavailable_dates WHERE tutor_email = $1 AND unavailable_date = $2::date`,
    [tutorEmail, dateStr]
  );
  if (blackout.rowCount > 0) return [];

  // Get availability windows for this day of week
  // dateStr is YYYY-MM-DD; derive day-of-week via UTC date parse + offset correction
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();

  const availResult = await pool.query(
    `SELECT start_time, end_time, timezone FROM tutor_availability
     WHERE tutor_email = $1 AND is_active = TRUE AND day_of_week = $2
     ORDER BY start_time`,
    [tutorEmail, dayOfWeek]
  );
  if (availResult.rowCount === 0) return [];

  // Fetch all confirmed/pending sessions on this date for this tutor
  const sessionsResult = await pool.query(
    `SELECT session_timestamp, end_timestamp,
            (end_timestamp + $2 * INTERVAL '1 minute') AS buffered_end
     FROM sessions
     WHERE tutor_email = $1
       AND status IN ('pending','confirmed')
       AND DATE(session_timestamp AT TIME ZONE 'UTC') = $3::date
     ORDER BY session_timestamp`,
    [tutorEmail, buffer_minutes, dateStr]
  );
  const bookedRanges = sessionsResult.rows.map(r => ({
    start: new Date(r.session_timestamp),
    end:   new Date(r.buffered_end),      // already includes buffer
  }));

  // Generate candidate slots within each availability window
  const slots = [];

  for (const window of availResult.rows) {
    const [wStartH, wStartM] = window.start_time.split(':').map(Number);
    const [wEndH,   wEndM]   = window.end_time.split(':').map(Number);

    const windowStartMin = wStartH * 60 + wStartM;
    const windowEndMin   = wEndH   * 60 + wEndM;

    let cursor = windowStartMin;

    while (cursor + duration <= windowEndMin) {
      const slotEndMin = cursor + duration;

      // Convert to HH:MM strings
      const startStr = `${String(Math.floor(cursor   / 60)).padStart(2,'0')}:${String(cursor   % 60).padStart(2,'0')}`;
      const endStr   = `${String(Math.floor(slotEndMin / 60)).padStart(2,'0')}:${String(slotEndMin % 60).padStart(2,'0')}`;

      // Build a rough Date for overlap comparison (date portion doesn't matter for
      // within-day comparisons; we're only comparing time-of-day minutes)
      const slotStart = new Date(`${dateStr}T${startStr}:00Z`);
      const slotEnd   = new Date(`${dateStr}T${endStr}:00Z`);

      // Check overlap with any booked range
      const blocked = bookedRanges.some(
        br => slotStart < br.end && slotEnd > br.start
      );

      if (!blocked) {
        slots.push({ start: startStr, end: endStr });
      }

      cursor += duration_increment;
    }
  }

  return slots;
};

module.exports = { checkSessionConflict, checkAvailabilityCovers, getBookableSlots };