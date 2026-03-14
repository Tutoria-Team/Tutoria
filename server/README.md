# Tutoria — Server

This is the backend for Tutoria. It is a **Node.js + Express** REST API that connects to a **PostgreSQL** database. It handles user accounts, authentication, tutor courses, sessions, and availability.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [File Structure](#file-structure)
- [Folder Breakdown](#folder-breakdown)
- [API Routes](#api-routes)
- [How It All Connects](#how-it-all-connects)
- [Adding Something New](#adding-something-new)
- [Common Errors](#common-errors)

---

## Tech Stack

| Technology | What it does |
|---|---|
| Node.js | Runs the JavaScript server |
| Express | Handles HTTP requests and routes |
| PostgreSQL | The database |
| pg | Node library to talk to PostgreSQL |
| bcrypt | Hashes passwords so they are never stored in plain text |
| jsonwebtoken (JWT) | Creates login tokens so users stay logged in |
| nodemailer | Sends OTP emails |
| helmet | Adds security headers automatically |
| cors | Allows the React frontend to talk to this server |
| morgan | Logs every request to the console so you can see what is happening |
| express-rate-limit | Limits how many requests one person can make (prevents abuse) |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file and fill in your values
cp .env.example .env

# 3. Start the server (make sure Docker / PostgreSQL is running first)
node index.js

# Or with auto-restart on file changes (recommended for development)
npx nodemon index.js
```

The server runs on **http://localhost:9000** by default.

---

## Environment Variables

Copy `.env.example` to `.env`. Never commit `.env` to Git — it contains secrets.

| Variable | What it is |
|---|---|
| `PORT` | Port the server runs on (default 9000) |
| `NODE_ENV` | Set to `development` locally, `production` when deployed |
| `PGUSER` | PostgreSQL username |
| `PGPASSWORD` | PostgreSQL password |
| `PGHOST` | PostgreSQL host (use `postgres_container` with Docker) |
| `PGPORT` | PostgreSQL port (default 5432) |
| `PGDATABASE` | Database name |
| `JWT_SECRET` | A long random secret string used to sign login tokens |
| `CLIENT_URL` | Your React app URL (needed for CORS) |
| `SMTP_HOST` | Email server host for sending OTPs |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Email address to send from |
| `SMTP_PASS` | Email password or app password |
| `ETHEREAL_USER` | Fake email for local dev testing (optional) |
| `ETHEREAL_PASS` | Fake email password for local dev testing (optional) |

> **Note:** In development (`NODE_ENV=development`), OTPs are printed to the terminal instead of sending real emails.

---

## File Structure

```
server/
├── index.js                        ← Entry point. Starts the server.
├── .env                            ← Your secret config (never commit this)
├── .env.example                    ← Template showing what variables are needed
├── Dockerfile                      ← How to run this server in Docker
├── package.json                    ← Dependencies and project info
│
└── src/
    ├── app.js                      ← Sets up Express, connects all middleware and routes
    │
    ├── config/
    │   └── db.config.js            ← Database connection (PostgreSQL pool)
    │
    ├── models/                     ← Database table definitions
    │   ├── index.js                ← Runs all table creation on startup
    │   ├── users.model.js
    │   ├── tutorCourses.model.js
    │   ├── reviews.model.js
    │   ├── sessions.model.js
    │   └── availability.model.js
    │
    ├── controllers/                ← Business logic for each feature
    │   ├── auth.controller.js      ← Signup, login, OTP, password reset
    │   ├── users.controller.js     ← Get and update the logged-in user's profile
    │   ├── courses.controller.js   ← Tutor course management
    │   ├── sessions.controller.js  ← Session booking and feedback
    │   └── availability.controller.js ← Tutor availability management
    │
    ├── middleware/                 ← Code that runs between a request and a response
    │   ├── auth.middleware.js      ← Checks if the user is logged in (JWT check)
    │   ├── error.middleware.js     ← Handles 404s and crashes cleanly
    │   └── rateLimiter.middleware.js ← Limits request rate to prevent abuse
    │
    ├── routes/                     ← URL definitions — maps URLs to controllers
    │   ├── auth.routes.js
    │   ├── users.routes.js
    │   ├── courses.routes.js
    │   ├── sessions.routes.js
    │   └── availability.routes.js
    │
    └── utils/                      ← Small reusable helper functions
        ├── mailer.util.js          ← Creates the email transporter
        └── otp.util.js             ← Generates and sends OTP codes
```

---

## Folder Breakdown

### `index.js`
The only job of this file is to start the server and initialize the database. You should rarely need to touch this.

---

### `src/app.js`
This is where Express is configured. It sets up all the middleware (security, logging, CORS) and connects all the route files. If you need to add a brand new group of routes, you register them here.

---

### `src/config/`
**`db.config.js`** — Creates and exports the PostgreSQL connection pool. Every controller imports this when it needs to run a database query. The connection reads credentials from your `.env` file automatically.

---

### `src/models/`
Each file in here represents one database table. It contains the `CREATE TABLE` SQL and any seed data for development.

**Go here when:** you need to add a column, change a data type, add a new table, or update seed data.

| File | Table it creates |
|---|---|
| `users.model.js` | `users` |
| `tutorCourses.model.js` | `tutor_courses` |
| `reviews.model.js` | `reviews` |
| `sessions.model.js` | `sessions` |
| `availability.model.js` | `tutor_availability` |

`index.js` runs all of them in the correct order every time the server starts. Tables are created only if they do not already exist, so it is safe to restart.

---

### `src/controllers/`
This is where the actual logic lives. Each function receives a request, does something (query the database, hash a password, etc.), and sends back a response.

**Go here when:** you need to change what happens when an API endpoint is called — for example, changing what data is returned, adding validation, or fixing a bug.

| File | What it handles |
|---|---|
| `auth.controller.js` | Signup, login, OTP verification, password reset |
| `users.controller.js` | Getting and updating the current user's profile |
| `courses.controller.js` | Tutors listing, creating, and deleting their courses |
| `sessions.controller.js` | Students booking sessions, tutors adding feedback |
| `availability.controller.js` | Tutors setting and removing their available time slots |

---

### `src/middleware/`
Middleware is code that runs on a request **before** it reaches a controller. Think of it as a checkpoint.

**Go here when:** you need to change authentication rules, add new rate limits, or update how errors are displayed.

| File | What it does |
|---|---|
| `auth.middleware.js` | Checks that the user has a valid login token. Any route that uses `authenticateToken` requires the user to be logged in. |
| `error.middleware.js` | Catches 404 (route not found) errors and any unhandled crashes, and returns clean JSON instead of an HTML error page. |
| `rateLimiter.middleware.js` | Auth endpoints (login, signup, etc.) allow 20 requests per 15 minutes. All other endpoints allow 100. This prevents brute-force attacks. |

---

### `src/routes/`
Route files define which URL maps to which controller function. They are intentionally kept simple — no logic lives here.

**Go here when:** you need to add a new URL endpoint, change an HTTP method (GET → POST), or attach/remove middleware from a specific route.

Each line looks like this:
```js
router.get('/', authenticateToken, getCourses);
//        ↑          ↑                ↑
//      URL      middleware         controller function
```

---

### `src/utils/`
Small helper functions that are reused across the app.

| File | What it does |
|---|---|
| `mailer.util.js` | Creates the email transporter. Uses Ethereal (fake) in development, real SMTP in production. |
| `otp.util.js` | `generateOtp()` creates a 6-digit code and expiry time. `sendOtp()` sends it to the user's email. |

---

## API Routes

All routes are prefixed with `/api`.

### Auth — `/api/auth`
| Method | URL | What it does | Login required |
|---|---|---|---|
| POST | `/api/auth/signup` | Create a new account | No |
| POST | `/api/auth/validate-otp` | Verify OTP after signup | No |
| POST | `/api/auth/login` | Log in and get a token | No |
| POST | `/api/auth/request-password-reset` | Send OTP to email for reset | No |
| POST | `/api/auth/reset-password` | Set a new password using OTP | No |

### Users — `/api/users/me`
| Method | URL | What it does | Login required |
|---|---|---|---|
| GET | `/api/users/me` | Get current user's profile | Yes |
| PATCH | `/api/users/me` | Update current user's profile | Yes |

### Courses — `/api/courses`
| Method | URL | What it does | Login required |
|---|---|---|---|
| GET | `/api/courses` | Get all courses for the logged-in tutor | Yes |
| POST | `/api/courses` | Create a new course | Yes |
| DELETE | `/api/courses/:tcid` | Delete a course | Yes |

### Sessions — `/api/sessions`
| Method | URL | What it does | Login required |
|---|---|---|---|
| GET | `/api/sessions` | Get all sessions for the logged-in user | Yes |
| POST | `/api/sessions` | Book a new session | Yes |
| PATCH | `/api/sessions/:session_id/feedback` | Add feedback to a session | Yes |

### Availability — `/api/availability`
| Method | URL | What it does | Login required |
|---|---|---|---|
| GET | `/api/availability` | Get tutor's active availability blocks | Yes |
| POST | `/api/availability` | Add an availability block | Yes |
| DELETE | `/api/availability/:availability_id` | Remove an availability block | Yes |

---

## How It All Connects

Here is what happens from the moment a request comes in to when a response goes back:

```
Request from React app
        ↓
    index.js          (starts everything)
        ↓
     app.js           (helmet, cors, morgan, rate limiter run first)
        ↓
   routes/*.js        (matches the URL to the right controller function)
        ↓
middleware/*.js        (auth check runs here if the route requires login)
        ↓
controllers/*.js       (runs the logic, queries the database)
        ↓
 config/db.config.js   (sends SQL query to PostgreSQL)
        ↓
  PostgreSQL returns data
        ↓
controllers/*.js       (formats and sends the response)
        ↓
  Response back to React
```

---

## Adding Something New

Follow these steps every time you add a new feature. Use any existing feature as a reference.

**Example: adding a "reviews" feature**

1. **Model** — open `src/models/reviews.model.js` and confirm the table is set up correctly. Register it in `src/models/index.js` if it is not already.

2. **Controller** — create `src/controllers/reviews.controller.js`. Write one function per action (getReviews, createReview, deleteReview).

3. **Routes** — create `src/routes/reviews.routes.js`. Map each URL + method to a controller function.

4. **Register the route** — open `src/app.js` and add:
   ```js
   const reviewsRoutes = require('./routes/reviews.routes');
   app.use('/api/reviews', reviewsRoutes);
   ```

That's it. No other files need to change.

---

## Common Errors

| Error | Likely cause | Fix |
|---|---|---|
| `ECONNREFUSED` on startup | PostgreSQL is not running | Start Docker or your local Postgres |
| `invalid signature` on a request | `JWT_SECRET` in `.env` changed | Log in again to get a fresh token |
| `401 Unauthorized` | No token sent in request | Add `Authorization: Bearer <token>` header |
| `403 Forbidden` | Token is expired or invalid | Log in again |
| `409 Conflict` on signup | Email or mobile already registered | Use a different email |
| `23505` PostgreSQL error | Duplicate value in a unique column | Check the unique constraints in the relevant model file |
| `Cannot find module` | Wrong file path in a `require()` | Double-check the relative path |
| OTP not arriving | `NODE_ENV` is `development` | OTP is printed to the terminal, not emailed |