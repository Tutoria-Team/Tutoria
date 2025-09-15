# 📚 Tutoria — Hire a Tutor Platform

A full-stack **PERN** (PostgreSQL, Express, React, Node.js) application containerized with **Docker** and managed via **Docker Compose**.

> No need to install Node, npm, or PostgreSQL locally — everything runs in containers.

---

## 🚀 Project Overview

- **Frontend:** React (port `3000`)
- **Backend:** Node + Express API (port `9000`)
- **Database:** PostgreSQL (port `5432`)
- **Docker:** Managed via `docker-compose`

---

## ⚡ Quick Start (Daily Development)

### 1. Start All Services

```bash
docker-compose up -d
````

This will:

* Build images (if not already built)
* Start all containers
* Attach them to a shared network (`tutoria_default`)

### 2. Verify the App

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend API: [http://localhost:9000/users](http://localhost:9000/users)

### 3. Stop All Services

```bash
docker-compose down
```

Add `-v` to remove volumes (and database data):

```bash
docker-compose down -v
```

---

## 🧰 First-Time Setup (New Developers)

### 1. Install Prerequisites

* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* (Optional) `psql` CLI for manual database inspection

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 3. Start the App

```bash
docker-compose up --build -d
```

The `--build` flag ensures code changes are reflected the first time.

---

## ⚙️ Configuration

### 1. Backend Environment (`server/.env`)

```env
PGHOST=postgres
PGUSER=admin
PGPASSWORD=admin_password
PGPORT=5432
PGDATABASE=postgres
PORT=9000
```

> The hostname `postgres` matches the service name in `docker-compose.yml`.

### 2. Frontend Proxy (`client/package.json`)

```json
"proxy": "http://server:9000"
```

> This allows the frontend to call the backend without CORS issues.

---

## 🔁 Rebuilding After Code Changes

If you modify **backend** or **frontend** code:

```bash
docker-compose up --build -d
```

This rebuilds only the changed services and restarts them.

---

## 🧑‍💻 Useful Commands

### View Logs

```bash
docker-compose logs -f
```

### Access the Database

```bash
docker-compose exec postgres psql -U admin -d postgres
```

Run a one-off query:

```bash
docker-compose exec postgres psql -U admin -d postgres -c "SELECT * FROM users;"
```

---

## 🧱 Architecture Overview

```text
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│  React App   │ --> │  Express API │ --> │  PostgreSQL DB │
│ (client)     │     │ (server)     │     │ (postgres)     │
└──────────────┘     └──────────────┘     └────────────────┘
       |                  |                     |
       ▼                  ▼                     ▼
   http://localhost:3000  http://localhost:9000 Port 5432

All services run on a shared Docker network.
```
