# Tutoria — Client

This is the frontend for Tutoria. It is a **React** application for browsing tutors, booking sessions, and managing tutor and student profiles.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [File Structure](#file-structure)
- [Folder Breakdown](#folder-breakdown)
- [Pages & Routes](#pages--routes)
- [Authentication Flow](#authentication-flow)
- [How It All Connects](#how-it-all-connects)
- [Adding Something New](#adding-something-new)
- [Common Errors](#common-errors)

---

## Tech Stack

| Technology | What it does |
|---|---|
| React | Component-based UI |
| React Router | Client-side routing without full page reloads |
| Axios | HTTP requests to the backend API |
| Bootstrap | Layout utilities and base styles |

---

## Getting Started

The client runs inside Docker — no local Node installation needed.

```bash
# From the project root
docker-compose up --build -d
```

App available at **http://localhost:3000**.

```bash
# Rebuild after frontend changes
docker-compose up --build -d

# View frontend logs
docker-compose logs client -f
```

---

## File Structure

```
client/
├── Dockerfile
├── package.json
├── public/
│   ├── index.html
│   ├── Icons/                        ← Profile, messages, notifications icons
│   └── LogoVersions/                 ← Logo variants
│
└── src/
    ├── App.js                        ← Root component: routing + global auth state
    ├── App.css
    ├── index.js
    ├── index.css                     ← CSS variables (--gold, --border, --radius-*, etc.)
    │
    ├── api/
    │   └── axios.js                  ← Configured Axios instance with JWT interceptor
    │
    ├── components/
    │   ├── Header.js                 ← Sticky nav: logo, nav links, login/avatar
    │   ├── PrivateRoute.js           ← Redirects to home if not logged in
    │   └── auth/
    │       ├── Authentication.js     ← Auth popup container
    │       ├── Login.js
    │       ├── Signup.js
    │       ├── OtpVerification.js
    │       └── ForgotPassword.js
    │
    ├── pages/
    │   ├── FindATutor.js             ← Browse tutors with filters (coming soon: real data)
    │   ├── BecomeATutor.js           ← Route-level orchestrator: wizard / dashboard / marketing
    │   └── Profile.js                ← Private profile: edit info, session history, tutor summary
    │
    ├── components/tutor/
    │   ├── BecomeTutorForm.js        ← 4-step wizard: courses → availability → session settings → review
    │   └── TutorDashboard.js         ← Tutor hub: bookings, sessions, courses, availability, settings
    │
    └── styles/
        ├── auth.css                  ← Auth popup styles
        ├── header.css                ← Navigation bar styles
        ├── pages.css                 ← Shared page layout utilities
        ├── becometutor.css           ← All tutor onboarding + dashboard styles (single consolidated file)
        └── profile.css               ← Profile page styles
```

---

## Folder Breakdown

### `src/App.js`
The root component. On every page load it:
1. Reads the JWT from `localStorage`
2. Calls `GET /api/users/me` to restore the logged-in user
3. Holds `user` state passed down to all pages and the Header
4. Defines all routes

Add new routes here.

---

### `src/api/axios.js`
Single configured Axios instance used by every component. Automatically:
- Sets base URL to `http://localhost:9000/api`
- Attaches the JWT from `localStorage` to every request via a request interceptor

Always import this instead of raw Axios:
```js
import api from '../api/axios';
api.get('/courses');
api.post('/sessions', { tcid: 1, session_timestamp: '...', duration_minutes: 60 });
```

---

### `src/components/Header.js`
Sticky top navigation. Adapts based on auth state:
- **Logged out:** Login button
- **Logged in:** Messages icon, Notifications icon, profile avatar (links to `/profile`)

The nav link label changes dynamically:
- Non-tutors: `Become a Tutor`
- Tutors: `My Dashboard`

---

### `src/components/auth/`

| File | What it does |
|---|---|
| `Authentication.js` | Popup container — switches between Login, Signup, OTP, ForgotPassword views |
| `Login.js` | Email or mobile + password form. Saves token to `localStorage` on success. |
| `Signup.js` | Name, email, mobile, password. Passes email to OTP step on success. |
| `OtpVerification.js` | 6-digit OTP entry. Switches to Login on success. |
| `ForgotPassword.js` | Two-step: request OTP → reset password. |

---

### `src/pages/`

#### `BecomeATutor.js`
Route-level orchestrator at `/become-a-tutor`. Renders one of three views depending on auth state:

| User state | Renders |
|---|---|
| Logged out | Marketing page with sign up / log in CTAs |
| Logged in, not a tutor | `BecomeTutorForm` (4-step wizard) |
| Logged in, is a tutor | `TutorDashboard` |

#### `Profile.js`
Private profile page at `/profile`. Three sections:

1. **Identity card** — photo, name, email, mobile (masked) with inline edit form. Saves via `PATCH /api/users/me` and updates global user state instantly.
2. **Tutor summary card** — only shown to tutors. Displays course count + average rating with a link to the Dashboard. No management UI here.
3. **My Sessions** — student's own booking history via `GET /api/sessions`. Shows course name, tutor name, date/time, duration, cost, and status badge. Filterable by status (all / pending / confirmed / completed / cancelled).

#### `FindATutor.js`
Public browse page at `/` and `/find-a-tutor`. Currently a mockup — real data + filters coming next.

---

### `src/components/tutor/`

#### `BecomeTutorForm.js`
4-step wizard for first-time tutor setup. All data collected here is posted to the API in `handleConfirm`:

| Step | What it collects | API calls |
|---|---|---|
| 1 — Courses | Default rate type + rate, per-course overrides | `POST /courses` (×n) |
| 2 — Availability | Weekly grid (click/drag), timezone, blackout dates | `POST /availability` (×n), `POST /availability/blackout-dates` (×n) |
| 3 — Session Settings | Duration range + increment, buffer, advance booking, cancellation window, auto-confirm | Sent in `PATCH /users/me/become-tutor` body |
| 4 — Review | Summary only — no new input | — |

Key implementation details:
- The weekly grid uses `DISPLAY_HOURS` (6 AM → 2 AM) with a visual midnight divider
- `computeSlots()` merges consecutive selected cells into time-range objects before posting
- `expandSlotsToCells()` (in `TutorDashboard`) reverses this to pre-populate the grid on edit
- Ranges ending at 11 PM store `end_time = '23:59'` to satisfy `CHECK(end_time > start_time)`

#### `TutorDashboard.js`
Full management hub for tutors. Sections:

| Section | What it shows | API used |
|---|---|---|
| Stats row | Courses, pending count (pulsing dot if > 0), upcoming, avg rating | — (derived) |
| Pending Requests | Gold-highlighted cards with Confirm / Decline buttons | `PATCH /sessions/:id/status` |
| Upcoming Sessions | Confirmed future sessions with Cancel option | `PATCH /sessions/:id/status` |
| My Courses | Course cards with inline rate editing, add/delete | `GET/POST/PATCH/DELETE /courses` |
| My Availability | Read view by default; Edit opens the weekly grid pre-populated from DB | `GET/POST/DELETE /availability` |
| Unavailable Dates | Blackout dates with live add/remove | `GET/POST/DELETE /availability/blackout-dates` |
| Session Settings | Read-only summary by default; Edit opens pill-based settings form with live duration preview | `GET/PATCH /tutor-settings` |

---

### `src/styles/`

| File | What it styles |
|---|---|
| `auth.css` | Login/signup popup |
| `header.css` | Navigation bar |
| `pages.css` | Shared layout utilities |
| `becometutor.css` | Everything in `BecomeTutorForm` and `TutorDashboard` — wizard steps, availability grid, session cards, settings cards, blackout dates, toggle switch, pending badge, stat cards |
| `profile.css` | Profile page — identity card, inline edit form, role badges, tutor summary card, session list with status filter tabs and status badges |

**CSS variables** (defined in `index.css`):

| Variable | Usage |
|---|---|
| `--gold` | Primary accent colour |
| `--gold-hover` | Darker gold for hover states |
| `--gold-light` | Light gold background tint |
| `--gold-border` | Gold border for tags and badges |
| `--border` | Default light border |
| `--border-dark` | Slightly darker border for inputs |
| `--bg` | Page background (white) |
| `--bg-light` | Slightly off-white card background |
| `--bg-subtle` | Very subtle tint for table headers etc. |
| `--text` | Primary text |
| `--text-muted` | Secondary/helper text |
| `--text-light` | Tertiary/disabled text |
| `--radius-sm` | Small border radius |
| `--radius-md` | Medium border radius |
| `--radius-lg` | Large border radius |
| `--header-height` | Used for sticky positioning calculations |

---

## Pages & Routes

| URL | Component | Login Required |
|---|---|---|
| `/` | `FindATutor` | No |
| `/find-a-tutor` | `FindATutor` | No |
| `/become-a-tutor` | `BecomeATutor` | No (wizard requires login) |
| `/profile` | `Profile` | Yes |
| `/messages` | *(coming soon)* | Yes |
| `/notifications` | *(coming soon)* | Yes |

---

## Authentication Flow

```
1. Signup form → POST /auth/signup
2. OTP printed to server logs (dev) or emailed (prod)
3. OTP entry → POST /auth/validate-otp
4. Login form → POST /auth/login → JWT returned
5. Token saved to localStorage
6. user state set in App.js → auth popup closes

On every page load:
  App.js reads token → GET /api/users/me → restores session
  Invalid/expired token → removed → user treated as logged out
```

---

## How It All Connects

```
Browser → index.js → App.js (auth check + routing)
                          ↓
                     Header.js (always visible)
                          ↓
                     pages/*.js (correct page for URL)
                          ↓
                  components/*.js (UI pieces)
                          ↓
                    api/axios.js (HTTP + JWT)
                          ↓
              Express server (localhost:9000)
```

---

## Adding Something New

### New page
1. Create `src/pages/YourPage.js`
2. Add route in `App.js`: `<Route path="/your-page" element={<YourPage user={user} setUser={setUser} />} />`
3. Add nav link in `Header.js` if needed
4. Create `src/styles/yourpage.css` if it needs dedicated styles

### New component
1. Create `src/components/YourComponent.js`
2. Import where needed: `import YourComponent from '../components/YourComponent'`

### New API call
```js
import api from '../api/axios';
const res = await api.get('/endpoint');
const res = await api.post('/endpoint', { key: 'value' });
const res = await api.patch('/endpoint/123', { field: 'value' });
const res = await api.delete('/endpoint/123');
```

---

## Common Errors

| Error | Likely cause | Fix |
|---|---|---|
| Blank page | JS crash | DevTools → Console |
| `Network Error` | Backend not running | `docker-compose ps` — check server container |
| `401 Unauthorized` | Token missing or expired | Log out and back in |
| `403 Forbidden` | Token invalid | Clear localStorage and log in again |
| Data doesn't load | Silent API failure | DevTools → Network tab |
| Styles not applying | Wrong import or class name typo | Check import path and class spelling |
| Auth popup not closing | `setUser` / `setShowAuth` prop not passed | Check props in parent component |
| Changes not showing | Docker using old cached build | `docker-compose up --build -d` |
| Availability grid not pre-filling | `expandSlotsToCells` receiving wrong format | Check DB `start_time` / `end_time` are `HH:MM:SS` strings |
| Profile update fails silently | `setUser` not passed to `Profile` from `App.js` | Add `setUser={setUser}` to the Profile route in `App.js` |