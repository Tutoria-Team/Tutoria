# Tutoria — Client

This is the frontend for Tutoria. It is a **React** application that provides the user interface for finding tutors, booking sessions, and managing profiles.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [File Structure](#file-structure)
- [Folder Breakdown](#folder-breakdown)
- [Pages & Routes](#pages--routes)
- [How It All Connects](#how-it-all-connects)
- [Authentication Flow](#authentication-flow)
- [Adding Something New](#adding-something-new)
- [Common Errors](#common-errors)

---

## Tech Stack

| Technology | What it does |
|---|---|
| React | Builds the UI with reusable components |
| React Router | Handles page navigation without full page reloads |
| Axios | Makes HTTP requests to the backend API |
| Bootstrap | Provides pre-built CSS styles and layout utilities |

---

## Getting Started

The client runs inside Docker — you do not need to install Node locally.

```bash
# From the project root
docker-compose up --build -d
```

The app will be available at **http://localhost:3000**.

To rebuild after making frontend changes:
```bash
docker-compose up --build -d
```

To see frontend logs:
```bash
docker-compose logs client -f
```

---

## File Structure

```
client/
├── Dockerfile                        ← How to run the client in Docker
├── package.json                      ← Dependencies and project info
├── public/
│   ├── index.html                    ← The single HTML file React mounts into
│   ├── Icons/                        ← App icons (profile picture, messages, etc.)
│   └── LogoVersions/                 ← Logo variants
│
└── src/
    ├── App.js                        ← Root component. Sets up routing and auth state.
    ├── App.css                       ← Global app styles
    ├── index.js                      ← Entry point. Mounts App into index.html.
    ├── index.css                     ← Base CSS reset and global font styles
    │
    ├── api/
    │   └── axios.js                  ← Configured Axios instance. All API calls go through here.
    │
    ├── components/
    │   ├── Header.js                 ← Top navigation bar shown on every page
    │   ├── PrivateRoute.js           ← Protects pages that require login
    │   └── auth/
    │       ├── Authentication.js     ← Auth popup container — controls which auth view is shown
    │       ├── Login.js              ← Login form
    │       ├── Signup.js             ← Signup form
    │       ├── OtpVerification.js    ← OTP entry form shown after signup
    │       └── ForgotPassword.js     ← Forgot password (request OTP + reset steps)
    │
    ├── pages/
    │   ├── FindATutor.js             ← Home page — browse tutors and courses
    │   ├── BecomeATutor.js           ← Page for tutors to set up their profile
    │   └── Profile.js                ← User profile — sessions, courses, availability
    │
    └── styles/
        ├── auth.css                  ← Styles for the login/signup/OTP popup
        ├── header.css                ← Styles for the navigation header
        ├── pages.css                 ← Shared styles for FindATutor and BecomeATutor
        └── profile.css               ← Styles for the profile page
```

---

## Folder Breakdown

### `src/App.js`
The root of the entire application. It does three things:

1. **Checks if the user is already logged in** on page load by reading the token from `localStorage` and calling `/api/users/me`
2. **Holds the `user` state** that is passed down to components that need it
3. **Defines all the routes** — which URL maps to which page

If you need to add a new page, you register its route here.

---

### `src/api/`
**`axios.js`** — Creates a single configured Axios instance that every component imports. It does two things automatically:

- Sets `http://localhost:9000/api` as the base URL so you never need to type the full URL in components
- Attaches the JWT token from `localStorage` to every request via an interceptor

**Go here when:** you need to change the backend URL (e.g. when deploying) or add global request/response handling.

Every API call in the app should use this instance:
```js
import api from '../api/axios';
api.get('/courses')      // calls http://localhost:9000/api/courses
api.post('/auth/login')  // calls http://localhost:9000/api/auth/login
```

---

### `src/components/`
Reusable pieces of UI that appear across multiple pages.

**Go here when:** you need to change the header, navigation, or anything auth-related.

| File | What it does |
|---|---|
| `Header.js` | Navigation bar at the top of every page. Shows Login button when logged out, profile picture + icons when logged in. |
| `PrivateRoute.js` | Wraps any route that requires login. Redirects to home if the user is not logged in. Shows a spinner while auth is being checked. |

#### `components/auth/`
All auth UI lives here. `Authentication.js` is the popup container that switches between the four views based on the current step.

| File | What it does |
|---|---|
| `Authentication.js` | The popup wrapper. Manages which form is currently shown (login, signup, OTP, forgot password). |
| `Login.js` | Email/mobile + password form. On success, saves the token and updates the user state. |
| `Signup.js` | First/last name, email, mobile, password form. On success, passes email to OTP step. |
| `OtpVerification.js` | 6-digit OTP entry. On success, switches to the login view. |
| `ForgotPassword.js` | Two-step form: step 1 requests an OTP, step 2 resets the password. |

---

### `src/pages/`
Full pages that are rendered at specific URLs.

**Go here when:** you need to change what users see on a specific page.

| File | URL | Who can see it |
|---|---|---|
| `FindATutor.js` | `/` and `/find-a-tutor` | Everyone |
| `BecomeATutor.js` | `/become-a-tutor` | Everyone |
| `Profile.js` | `/profile` | Logged-in users only |

---

### `src/styles/`
CSS files scoped to specific parts of the app. Each component imports only the CSS file it needs.

**Go here when:** you need to change the look of a specific part of the app.

| File | What it styles |
|---|---|
| `auth.css` | The login/signup popup |
| `header.css` | The navigation bar |
| `pages.css` | FindATutor and BecomeATutor pages |
| `profile.css` | The profile page |

---

## Pages & Routes

| URL | Component | Login Required |
|---|---|---|
| `/` | `FindATutor` | No |
| `/find-a-tutor` | `FindATutor` | No |
| `/become-a-tutor` | `BecomeATutor` | No |
| `/profile` | `Profile` | Yes |

Routes are defined in `src/App.js`. Protected routes are wrapped in `<PrivateRoute>`.

---

## How It All Connects

```
Browser loads http://localhost:3000
        ↓
    index.js              (mounts App into the HTML page)
        ↓
     App.js               (checks localStorage for token, fetches user, sets up routes)
        ↓
   Header.js              (always visible — shows login button or user icons)
        ↓
   pages/*.js             (renders the correct page based on the URL)
        ↓
 components/*.js           (smaller pieces used inside pages)
        ↓
  api/axios.js            (makes HTTP request to the backend with token attached)
        ↓
  Express Server          (http://localhost:9000/api/...)
```

---

## Authentication Flow

Here is what happens from signup to being logged in:

```
1. User fills out Signup form
         ↓
2. POST /api/auth/signup
         ↓
3. OTP printed to server logs (development) or emailed (production)
         ↓
4. User enters OTP in OtpVerification form
         ↓
5. POST /api/auth/validate-otp
         ↓
6. Redirected to Login form
         ↓
7. User logs in with email + password
         ↓
8. POST /api/auth/login → returns JWT token + user object
         ↓
9. Token saved to localStorage
10. User state set in App.js
11. Auth popup closes
```

On every page load, `App.js` reads the token from `localStorage` and calls `GET /api/users/me` to restore the session automatically. If the token is expired or invalid, it is removed and the user is treated as logged out.

> **Development tip:** OTPs are not emailed in development. Run this to get your OTP:
> ```bash
> docker-compose logs server | grep OTP
> ```

---

## Adding Something New

### Adding a new page

1. Create `src/pages/YourPage.js`
2. Register the route in `src/App.js`:
```js
import YourPage from './pages/YourPage';
// inside <Routes>
<Route path="/your-page" element={<YourPage />} />
```
3. Add a link in `Header.js` if needed:
```js
<Link to="/your-page" className="headerItem">Your Page</Link>
```
4. Create `src/styles/yourpage.css` if it needs its own styles

### Adding a new component

1. Create `src/components/YourComponent.js`
2. Import it in the page or component that needs it:
```js
import YourComponent from '../components/YourComponent';
```

### Making a new API call

Always use the configured `api` instance — never import raw `axios`:
```js
import api from '../api/axios';

// GET request
const res = await api.get('/some-endpoint');

// POST request
const res = await api.post('/some-endpoint', { key: 'value' });
```
The base URL and auth token are handled automatically.

---

## Common Errors

| Error | Likely cause | Fix |
|---|---|---|
| Blank page on load | JavaScript crash — check browser console | Open DevTools (F12) → Console and look for the red error |
| `Network Error` on API call | Backend is not running | Run `docker-compose ps` and check the server container is up |
| `401 Unauthorized` | Token missing or expired | Log out and log back in |
| `403 Forbidden` | Token is invalid | Clear localStorage and log in again |
| Page shows but data doesn't load | API call failing silently | Open DevTools → Network tab and check the failed request |
| Styles not applying | Wrong CSS file imported or class name typo | Check the import path and class name match |
| Auth popup not closing after login | `setUser` or `setShowAuth` not passed correctly | Check props passed to `Authentication` in `Header.js` |
| Changes not showing in browser | Docker using old cached build | Run `docker-compose up --build -d` |