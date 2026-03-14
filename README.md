# 📚 Tutoria — Hire a Tutor Platform
A full-stack **PERN** (PostgreSQL, Express, React, Node.js) application containerized with **Docker** and managed via **Docker Compose**.

> No need to install Node, npm, or PostgreSQL locally — everything runs in containers.

---

## 🚀 Project Overview

- **Frontend:** React (port `3000`)
- **Backend:** Node + Express API (port `9000`)
- **Database:** PostgreSQL (port `5432`)
- **Docker:** Managed via `docker-compose`

For a full breakdown of the backend structure, see [`server/README.md`](./server/README.md).

---

## 🧰 First-Time Setup (New Developers)

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
You should see all three containers with status `Up`:
```
client_container    Up    0.0.0.0:3000->3000/tcp
server_container    Up    0.0.0.0:9000->9000/tcp
postgres_container  Up (healthy)    0.0.0.0:5432->5432/tcp
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:9000/api/test

---

## ⚡ Daily Development

### Start All Services
```bash
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### Rebuild After Code Changes
```bash
docker-compose up --build -d
```

### Wipe Everything (database included)
```bash
docker-compose down -v
docker volume rm tutoria_pgdata
docker-compose up --build -d
```
> ⚠️ This deletes all data. Only use this when you need a completely clean slate.

---

## 📬 Getting Your OTP During Development

In development, **no real emails are sent**. OTP codes are printed directly to the server logs instead.

After signing up or requesting a password reset, run:
```bash
docker-compose logs server | grep OTP
```

You will see something like:
```
server_container  | 📬 OTP for your@email.com: 482910
```

Use that 6-digit code to complete verification.

### Pre-seeded Test Accounts
Two accounts are automatically created when the app starts. No signup needed:

| Role    | Email                       | Password     |
|---------|-----------------------------|--------------|
| Tutor   | tutor.alice@example.com     | password123  |
| Student | student.bob@example.com     | password123  |

---

## 🧑‍💻 Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Server only
docker-compose logs server -f

# Postgres only
docker-compose logs postgres -f
```

### Access the Database
```bash
docker-compose exec postgres psql -U admin -d postgres
```

Useful queries inside psql:
```sql
\dt                          -- list all tables
SELECT * FROM users;
SELECT * FROM tutor_courses;
SELECT * FROM sessions;
\q                           -- quit
```

Run a one-off query without entering psql:
```bash
docker-compose exec postgres psql -U admin -d postgres -c "SELECT * FROM users;"
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

## 🔄 Existing Developers — Clean Rebuild Required

The backend was recently reorganized (server restructured into MVC folders). If you have an existing copy of this project running, your old containers and volumes will not work with the new code. **You must do a full clean rebuild.**

Run these commands in order:

```bash
# 1. Stop and remove all containers
docker-compose down

# 2. Remove the database volume
docker volume rm tutoria_pgdata

# 3. Remove old cached images so Docker picks up the new code
docker-compose build --no-cache

# 4. Start everything fresh
docker-compose up -d
```

Then verify it worked:
```bash
docker-compose ps
docker-compose logs server
```

You should see all tables created and seed data inserted in the server logs. If you see any errors, check the [Common Errors](./server/README.md#common-errors) section in the server README.

> ⚠️ `docker volume rm tutoria_pgdata` deletes all local database data. This is expected — the app seeds fresh test data automatically on every clean startup.

---

## 🌿 Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, working code only |
| `feature/your-feature` | All new development |

Always branch off `main` and open a pull request to merge back.

```bash
git checkout main
git pull
git checkout -b feature/your-feature-name
```