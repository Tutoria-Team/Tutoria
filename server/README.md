# Tutoria — Server

This is the backend for Tutoria. It is a **Node.js + Express** REST API connected to a **PostgreSQL** database. It handles authentication, user profiles, tutor onboarding, course management, availability, session booking, and reviews.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [File Structure](#file-structure)
- [Folder Breakdown](#folder-breakdown)
- [API Routes](#api-routes)
- [Session Lifecycle](#session-lifecycle)
- [How It All Connects](#how-it-all-connects)
- [Adding Something New](#adding-something-new)
- [Common Errors](#common-errors)

---

## Tech Stack

| Technology | What it does |
|---|---|
| Node.js | Runs the JavaScript server |
| Express | Handles HTTP requests and routes |
| PostgreSQL | The relational database |
| pg | Node library to talk to PostgreSQL (connection pool + transactions) |
| bcrypt | Hashes passwords — never stored in plain text |
| jsonwebtoken (JWT) | Creates login tokens so users stay logged in |
| nodemailer | Sends OTP emails |
| helmet | Adds security headers automatically |
| cors | Allows the React frontend to talk to this server |
| morgan | Logs every request to the console |
| express-rate-limit | Limits requests per IP to prevent abuse |

---

## Getting Started

```bash
npm install
cp .env.example .env   # fill in your values
node index.js          # or: npx nodemon index.js
```

Server runs on **http://localhost:9000** by default.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default `9000`) |
| `NODE_ENV` | `development` or `production` |
| `PGUSER` | PostgreSQL username |
| `PGPASSWORD` | PostgreSQL password |
| `PGHOST` | PostgreSQL host (`postgres_container` with Docker) |
| `PGPORT` | PostgreSQL port (default `5432`) |
| `PGDATABASE` | Database name |
| `JWT_SECRET` | Long random string for signing tokens |
| `CLIENT_URL` | React app URL (for CORS) |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Sending email address |
| `SMTP_PASS` | Email password or app password |
| `CRON_SECRET` | Header secret for the `complete-past` sessions endpoint |
| `ETHEREAL_USER` | Fake email for local dev (optional) |
| `ETHEREAL_PASS` | Fake email password (optional) |

> In `development`, OTPs are printed to the terminal instead of being emailed.

---

## File Structure

```
server/
├── index.js
├── .env
├── .env.example
├── Dockerfile
├── package.json
│
└── src/
    ├── app.js
    │
    ├── config/
    │   └── db.config.js
    │
    ├── models/
    │   ├── index.js
    │   ├── users.model.js
    │   ├── tutorCourses.model.js
    │   ├── tutorSessionSettings.model.js
    │   ├── tutorUnavailableDates.model.js
    │   ├── reviews.model.js
    │   ├── sessions.model.js
    │   └── availability.model.js
    │
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── users.controller.js
    │   ├── courses.controller.js
    │   ├── sessions.controller.js
    │   ├── availability.controller.js
    │   └── tutorSessionSettings.controller.js
    │
    ├── middleware/
    │   ├── auth.middleware.js
    │   ├── error.middleware.js
    │   └── rateLimiter.middleware.js
    │
    ├── routes/
    │   ├── auth.routes.js
    │   ├── users.routes.js
    │   ├── courses.routes.js
    │   ├── sessions.routes.js
    │   ├── availability.routes.js
    │   └── tutorSessionSettings.routes.js
    │
    └── utils/
        ├── availability.util.js
        ├── mailer.util.js
        └── otp.util.js
```

---

## Folder Breakdown

### `index.js`
Starts the server and calls `initDB()` to create all tables on startup. Rarely needs to be touched.

### `src/app.js`
Configures Express: helmet, CORS, JSON parsing, Morgan logging, rate limiting, and all route mounts. Add new route groups here.

### `src/config/db.config.js`
Exports the PostgreSQL connection pool. Every controller imports this to run queries. Reads credentials from `.env`.

---

### `src/models/`

Tables are created in dependency order inside `index.js`. All `CREATE TABLE` statements use `IF NOT EXISTS` so restarts are always safe.

| File | Table | Notes |
|---|---|---|
| `users.model.js` | `users` | Seeded with Alice (tutor) and Bob (student) |
| `tutorCourses.model.js` | `tutor_courses` | Rate type: hourly / session / both |
| `tutorSessionSettings.model.js` | `tutor_session_settings` | One row per tutor — duration, buffer, advance booking, cancellation, auto-confirm |
| `tutorUnavailableDates.model.js` | `tutor_unavailable_dates` | Specific blackout dates with optional reason |
| `availability.model.js` | `tutor_availability` | Recurring weekly slots, day 0–6 + time range |
| `sessions.model.js` | `sessions` | Includes `duration_minutes`, `end_timestamp` (computed by app on insert), `status`, `tutor_email` |
| `reviews.model.js` | `reviews` | Rating 1–5, comment, linked to `tcid` |

**Dependency order (FK constraints):**
```
users
  ├── tutor_courses          → tutor_email
  ├── tutor_availability     → tutor_email
  ├── tutor_session_settings → tutor_email
  ├── tutor_unavailable_dates→ tutor_email
  └── sessions               → tutor_email + user_email
        └── tutor_courses    → tcid
              └── reviews    → tcid
```

---

### `src/controllers/`

| File | Responsibility |
|---|---|
| `auth.controller.js` | Signup, OTP validation, login, password reset |
| `users.controller.js` | `getMe`, `updateMe`, `becomeATutor` (transactional — flips `is_tutor` + inserts session settings atomically) |
| `courses.controller.js` | CRUD for tutor courses + inline rate editing |
| `availability.controller.js` | Weekly slots CRUD + blackout dates CRUD |
| `tutorSessionSettings.controller.js` | Get and patch session booking preferences |
| `sessions.controller.js` | Full booking pipeline — see [Session Lifecycle](#session-lifecycle) |

---

### `src/middleware/`

| File | What it does |
|---|---|
| `auth.middleware.js` | Verifies JWT then does a DB lookup to attach full `req.user` (`{ id, email, first_name, last_name, is_tutor }`). |
| `error.middleware.js` | `notFound` (404) and `errorHandler` (500) — always return clean JSON. |
| `rateLimiter.middleware.js` | Auth routes: 200 req / 15 min (dev) / 20 (prod). General routes: 2000 req / 15 min (dev) / 200 (prod). |

---

### `src/routes/`

Each file maps HTTP method + URL to a controller function. No logic lives here.

```js
router.get('/', authenticateToken, getAvailability);
//        ↑          ↑                  ↑
//      URL      middleware         controller
```

---

### `src/utils/`

| File | What it does |
|---|---|
| `availability.util.js` | Three exported functions: `checkSessionConflict` (overlap detection with buffer), `checkAvailabilityCovers` (validates a slot against recurring availability + blackout dates), `getBookableSlots` (returns available time slots for a tutor on a given date) |
| `mailer.util.js` | Creates the Nodemailer transporter (Ethereal in dev, SMTP in prod) |
| `otp.util.js` | `generateOtp()` and `sendOtp()` |

---

## API Routes

All routes are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | No | Create account, send OTP |
| POST | `/auth/validate-otp` | No | Verify OTP |
| POST | `/auth/login` | No | Login, return JWT |
| POST | `/auth/request-password-reset` | No | Send reset OTP |
| POST | `/auth/reset-password` | No | Set new password |

### Users — `/api/users`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | Yes | Get current user |
| PATCH | `/users/me` | Yes | Update name, mobile, photo URL |
| PATCH | `/users/me/become-tutor` | Yes | Upgrade to tutor + create session settings (transactional) |

`PATCH /users/me/become-tutor` body:
```json
{
  "min_duration_minutes": 30,
  "max_duration_minutes": 120,
  "duration_increment": 30,
  "buffer_minutes": 0,
  "advance_booking_days": 14,
  "cancellation_hours": 24,
  "auto_confirm": false
}
```

### Courses — `/api/courses`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/courses` | Yes | Get tutor's own courses |
| POST | `/courses` | Yes | Create course with rates |
| PATCH | `/courses/:tcid` | Yes | Update course name or rates |
| DELETE | `/courses/:tcid` | Yes | Delete course |

### Availability — `/api/availability`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/availability` | Yes | Get tutor's recurring slots |
| POST | `/availability` | Yes | Add a slot |
| DELETE | `/availability/:availability_id` | Yes | Remove a slot |
| GET | `/availability/blackout-dates` | Yes | Get blackout dates |
| POST | `/availability/blackout-dates` | Yes | Add a blackout date |
| DELETE | `/availability/blackout-dates/:id` | Yes | Remove a blackout date |

### Tutor Session Settings — `/api/tutor-settings`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/tutor-settings` | Yes | Get session booking preferences |
| PATCH | `/tutor-settings` | Yes | Update one or more preferences |

### Sessions — `/api/sessions`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/sessions` | Yes | Student: get own session history |
| GET | `/sessions/tutor` | Yes (tutor) | Tutor: get all incoming bookings |
| POST | `/sessions` | Yes | Student: book a session |
| PATCH | `/sessions/:id/status` | Yes | Confirm (tutor) or cancel (either) |
| PATCH | `/sessions/:id/feedback` | Yes | Submit feedback (completed sessions only) |
| PATCH | `/sessions/complete-past` | Cron secret | Mark past confirmed sessions as completed |

`POST /sessions` body:
```json
{
  "tcid": 1,
  "session_timestamp": "2026-04-01T10:00:00Z",
  "duration_minutes": 60
}
```

`GET /sessions/tutor` supports optional query param: `?status=pending|confirmed|cancelled|completed`

### Reviews — `/api/reviews` *(coming soon)*

---

## Session Lifecycle

Sessions move through four statuses:

```
pending → confirmed → completed
   ↓           ↓
cancelled   cancelled
```

| Transition | Who can trigger | Conditions |
|---|---|---|
| `pending → confirmed` | Tutor only | Any time before session |
| `pending → cancelled` | Tutor (decline) or student | Student must be within cancellation window |
| `confirmed → cancelled` | Tutor or student | Student must be within cancellation window |
| `confirmed → completed` | Cron job only | `end_timestamp < NOW()` |
| `completed → *` | Nobody | Terminal state |

**Automatically set at booking time:** if `auto_confirm = true`, new bookings are created as `confirmed` directly. Otherwise `pending`.

**Cost computation at booking:** stored at booking time so rate changes don't affect past sessions.
- `hourly` rate type: `(duration_minutes / 60) × hourly_rate`
- `session` rate type: flat `session_rate` regardless of duration
- `both` rate type: uses `hourly_rate` for fair duration-based billing

**Conflict detection** runs on every `POST /sessions`:
1. Validates `duration_minutes` against `tutor_session_settings` constraints
2. Checks `advance_booking_days` window
3. Calls `checkAvailabilityCovers` — ensures the slot falls within recurring availability and is not a blackout date
4. Calls `checkSessionConflict` — overlap check against existing `pending`/`confirmed` sessions, extended by `buffer_minutes`

---

## How It All Connects

```
Request from React
      ↓
  app.js          (helmet → cors → morgan → rate limiter)
      ↓
routes/*.js        (matches URL → controller function)
      ↓
middleware         (auth check if required)
      ↓
controllers/*.js   (validation → DB queries → response)
      ↓
utils/*.js         (availability checks, mailer, OTP)
      ↓
db.config.js       (PostgreSQL pool)
      ↓
PostgreSQL
      ↓
Response to React
```

---

## Adding Something New

1. **Model** — add table to `src/models/`, register in `src/models/index.js`
2. **Controller** — create `src/controllers/yourfeature.controller.js`
3. **Routes** — create `src/routes/yourfeature.routes.js`
4. **Register** — add to `src/app.js`:
```js
app.use('/api/yourfeature', require('./routes/yourfeature.routes'));
```

---

## Common Errors

| Error | Likely cause | Fix |
|---|---|---|
| `ECONNREFUSED` on startup | PostgreSQL not running | Start Docker |
| `invalid signature` | `JWT_SECRET` changed | Log in again for a fresh token |
| `401 Unauthorized` | No token in request | Add `Authorization: Bearer <token>` header |
| `403 Forbidden` | Token expired or invalid | Log in again |
| `409 Conflict` on booking | Time slot overlap or outside availability | Check availability and existing sessions |
| `400` on `become-tutor` | Session settings fail validation | Check `min % increment === 0` and `min ≤ max` |
| `23505` PostgreSQL error | Duplicate value in a unique column | Check unique constraints in the model |
| `Cannot find module` | Wrong `require()` path | Double-check relative path |
| OTP not arriving | `NODE_ENV=development` | OTP is in server terminal logs |