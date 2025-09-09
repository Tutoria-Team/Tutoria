# Tutoria Project

Hire a Tutor Website

This project is a **PERN stack application** using Docker:

- **P**ostgreSQL (Docker container)  
- **E**xpress/Node backend (Docker container)  
- **R**eact frontend (Docker container)  

Docker allows you to run everything without installing Node, npm, or Postgres locally.  

All containers communicate via the `tutoria_network`.

---

## Quick Start (Daily Development)

These commands assume containers are already built.

### 1. Start containers

```bash
docker start postgres_container
docker start server_container
docker start client_container
````

### 2. Verify the app

* Frontend: [http://localhost:3000](http://localhost:3000) — should display the users table
* Backend API: [http://localhost:9000/users](http://localhost:9000/users) — should return JSON of users

### 3. Optional: Check database

```bash
docker exec -it postgres_container psql -U admin -d postgres -c "SELECT * FROM users;"
```

### 4. Stop containers

```bash
docker stop client_container server_container postgres_container
```

---

## First-Time Setup for New Developers

### 1. Install prerequisites

* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* (Optional) `psql` CLI for manual database inspection

### 2. Clone the project

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 3. Build Docker images

```bash
# Backend
cd server
docker build -t server:latest .

# Frontend
cd ../client
docker build -t client:latest .
```

### 4. Create and connect containers

```bash
# Create Docker network
docker network create tutoria_network

# Run Postgres
docker run --name postgres_container \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin_password \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  --network tutoria_network \
  -d postgres

# Run backend
docker run --name server_container \
  -p 9000:9000 \
  --network tutoria_network \
  -d server:latest

# Run frontend
docker run --name client_container \
  -p 3000:3000 \
  --network tutoria_network \
  -d client:latest
```

---

### 5. Configuration files

#### Backend `.env`:

```env
PGHOST=postgres_container
PGUSER=admin
PGPASSWORD=admin_password
PGPORT=5432
PGDATABASE=postgres
PORT=9000
```

#### Frontend `package.json` proxy:

```json
"proxy": "http://server_container:9000"
```

---

### 6. Verify everything works

* Frontend: [http://localhost:3000](http://localhost:3000) — users table should display
* Backend: [http://localhost:9000/users](http://localhost:9000/users) — JSON response
* Optional DB check:

```bash
docker exec -it postgres_container psql -U admin -d postgres -c "SELECT * FROM users;"
```

---

## Rebuilding Containers After Code Changes

If you modify backend or frontend code, follow these steps:

### 1. Backend changes

```bash
# Stop and remove old container
docker stop server_container
docker rm server_container

# Rebuild backend image
cd server
docker build -t server:latest .

# Start new backend container
docker run --name server_container \
  -p 9000:9000 \
  --network tutoria_network \
  -d server:latest
```

### 2. Frontend changes

```bash
# Stop and remove old container
docker stop client_container
docker rm client_container

# Rebuild frontend image
cd client
docker build -t client:latest .

# Start new frontend container
docker run --name client_container \
  -p 3000:3000 \
  --network tutoria_network \
  -d client:latest
```

> The database container (`postgres_container`) remains untouched, so your data is safe.

---

## Daily workflow after first-time setup

```bash
# Start all containers
docker start postgres_container server_container client_container

# Stop containers
docker stop client_container server_container postgres_container
```

---

## Container Architecture

```
┌─────────────────────┐
│  client_container   │  → React frontend (port 3000)
└─────────┬───────────┘
          │ calls API
          ▼
┌─────────────────────┐
│  server_container   │  → Node/Express backend (port 9000)
└─────────┬───────────┘
          │ connects to
          ▼
┌─────────────────────┐
│  postgres_container │  → PostgreSQL database (port 5432)
└─────────────────────┘
```

* All containers are on the same network: `tutoria_network`
* Backend connects to Postgres via container name (`postgres_container`)
* Frontend connects to backend via container name (`server_container`)

---

## Notes

* Proxy in React is for development only. For production, use full URLs or serve frontend from backend.
* Using a Docker network ensures all containers can communicate without inspecting IPs.
* Rebuild containers only when code changes; the database container stays intact.
