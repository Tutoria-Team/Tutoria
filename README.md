# 📚 Tutoria — Tutoring Marketplace

A full-stack **PERN** (PostgreSQL, Express, React, Node.js) application containerized with **Docker** and managed via **Docker Compose**.

> No need to install Node, npm, or PostgreSQL locally — everything runs in containers.

---

## 🚀 Project Overview

| Layer | Technology | Port |
|---|---|---|
| Frontend | React + React Router + Axios | `3000` |
| Backend | Node.js + Express REST API | `9000` |
| Database | PostgreSQL | `5432` |
| Container | Docker Compose | — |

For full breakdowns see:
- [`server/README.md`](./server/README.md) — API routes, controllers, models
- [`client/README.md`](./client/README.md) — Pages, components, styles

---

## 🧰 First-Time Setup

### 1. Install Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- (Optional) `psql` CLI for manual database inspection

### 2. Clone the Repository
```bash
git clone <your-repo-url>
cd Tutoria
```

### 3. Create your `.env` file
```bash
cp server/.env.example server/.env
```
Open `server/.env` and fill in your values. The defaults work for local Docker development as-is.

### 4. Start the App
```bash
docker-compose up --build -d
```

### 5. Verify Everything is Running
```bash
docker-compose ps
```
All three containers should show status `Up`:
```
client_container    Up    0.0.0.0:3000->3000/tcp
server_container    Up    0.0.0.0:9000->9000/tcp
postgres_container  Up (healthy)    0.0.0.0:5432->5432/tcp
```

- **Frontend:** http://localhost:3000
- **Backend health check:** http://localhost:9000/api/test

---

## ⚡ Daily Development

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up --build -d

# Wipe everything including the database
docker-compose down -v
docker-compose up --build -d
```

> ⚠️ `docker-compose down -v` removes all containers and volumes including the database. The app re-seeds automatically on next startup.

---

## 📬 OTP During Development

No real emails are sent in development. OTP codes are printed to the server logs:

```bash
docker-compose logs server | grep OTP
```

Output looks like:
```
server_container  | 📬 OTP for your@email.com: 482910
```

### Pre-seeded Test Accounts

| Role | Email | Password |
|---|---|---|
| Tutor | tutor.alice@example.com | password123 |
| Student | student.bob@example.com | password123 |

Alice is a fully configured tutor with courses, availability, and session settings. Bob is a plain student account.

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `users` | All user accounts (students and tutors) |
| `tutor_courses` | Courses a tutor offers, with rates |
| `tutor_availability` | Recurring weekly availability slots |
| `tutor_session_settings` | Booking preferences (duration, buffer, etc.) |
| `tutor_unavailable_dates` | Specific blackout dates |
| `sessions` | Booked sessions between student and tutor |
| `reviews` | Post-session ratings and comments |

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default `9000`) |
| `NODE_ENV` | `development` or `production` |
| `PGUSER` | PostgreSQL username |
| `PGPASSWORD` | PostgreSQL password |
| `PGHOST` | PostgreSQL host (`postgres_container` with Docker) |
| `PGPORT` | PostgreSQL port (default `5432`) |
| `PGDATABASE` | Database name |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `CLIENT_URL` | React app URL (for CORS) |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Sending email address |
| `SMTP_PASS` | Email password or app password |
| `CRON_SECRET` | Secret header for the `/api/sessions/complete-past` endpoint |
| `ETHEREAL_USER` | Fake email for local dev (optional) |
| `ETHEREAL_PASS` | Fake email password (optional) |

---

## 🧑‍💻 Useful Commands

```bash
# View logs
docker-compose logs -f
docker-compose logs server -f
docker-compose logs postgres -f

# Access the database
docker-compose exec postgres psql -U admin -d postgres

# Useful SQL once inside psql
\dt                              -- list all tables
SELECT * FROM users;
SELECT * FROM tutor_courses;
SELECT * FROM sessions;
SELECT * FROM tutor_session_settings;
\q                               -- quit

# Run a one-off query
docker-compose exec postgres psql -U admin -d postgres -c "SELECT * FROM users;"

# Mark past confirmed sessions as completed (cron endpoint)
curl -X PATCH http://localhost:9000/api/sessions/complete-past \
  -H "X-Cron-Secret: your-cron-secret"
```

---

## 🧱 Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│  React App   │ --> │  Express API │ --> │  PostgreSQL DB │
│  (client)    │     │  (server)    │     │  (postgres)    │
└──────────────┘     └──────────────┘     └────────────────┘
       │                    │                      │
       ▼                    ▼                      ▼
 localhost:3000       localhost:9000          Port 5432

All services run on a shared Docker network (tutoria_network).
```

---

## 🌿 Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, working code only |
| `feature/your-feature` | All new development |

```bash
git checkout main
git pull
git checkout -b feature/your-feature-name
```

---

## 🔄 Clean Rebuild (Existing Developers)

If you have an existing copy running and pull significant backend changes, do a full clean rebuild:

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

Check it worked:
```bash
docker-compose ps
docker-compose logs server
```

You should see all tables created and seed data inserted. If not, check [`server/README.md`](./server/README.md#common-errors).