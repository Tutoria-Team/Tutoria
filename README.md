# Tutoria

Hire a Tutor Website

## Tutoria Project - Quick Start

Start development with Docker, backend, and frontend.

---

### **1. Start PostgreSQL Docker Container**

```bash
docker start postgres_container
```

### **2. Start Backend (Node + Express)**

```bash
cd server
npm install       # only if dependencies changed
node index.js
```

Backend runs at http://localhost:9000

### **3. Start Frontend (React client)**

```bash
cd client
npm install       # only if dependencies changed
npm start
```

Frontend runs at http://localhost:3000

### **4. Quick DB Check (Optional)**

```bash
docker exec -it postgres_container psql -U admin -d postgres -c "SELECT * FROM users;"
```

### **5. Stop Everything (Optional)**

```bash
# Stop backend and frontend via Ctrl+C
docker stop postgres_container
```

---


## **First-Time Setup for New Developers**

These instructions guide a developer who is setting up the project for the first time on their machine.

---

### **1. Install Prerequisites**

- **Node.js & npm**  
  Download and install from: [https://nodejs.org](https://nodejs.org)

- **Docker Desktop**  
  Download and install from: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

- **(Optional) Postgres CLI** if you want to test DB manually:**
  ```bash
  sudo apt install postgresql-client    # Linux
  brew install libpq                     # macOS
  ```

---

### **2. Clone the Project**

```bash
git clone <your-repo-url>
cd <project-folder>
```

---

### **3. Setup PostgreSQL Docker Container**

1. Build and run the Postgres container:

```bash
docker run --name postgres_container \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres
```

* This creates a Docker container named `postgres_container`.
* `-p 5432:5432` exposes the database to your local machine.
* `yourpassword` is the password for the `admin` user (replace with your choice).

2. Verify it’s running:

```bash
docker ps
```

* You should see the container with `STATUS: Up`.

---

### **4. Setup the Database Schema**

1. Copy your `setup_users.sql` file into the container or mount it when creating the container.
2. Run the SQL script to create tables and insert sample data:

```bash
docker exec -ti postgres_container /bin/bash -c "psql -U admin -d postgres -f /tmp/setup_users.sql"
```

* You should see `CREATE TABLE` and `INSERT` messages.

---

### **5. Backend Setup (Node/Express)**

1. Go to backend folder:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
PGUSER=admin
PGPASSWORD=yourpassword
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=postgres
PORT=9000
```

4. Start backend:

```bash
node index.js
```

> Server will run at `http://localhost:9000`

---

### **6. Frontend Setup (React)**

1. Go to client folder:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Set proxy in `package.json`:

```json
"proxy": "http://localhost:9000"
```

4. Start React app:

```bash
npm start
```

> Frontend runs at `http://localhost:3000`
> Users table should populate from the database.

---

### **7. Verify Everything Works**

* Open `http://localhost:3000` → Table displays users.
* Open `http://localhost:9000/users` → JSON response with users.

---

### **8. Optional: Test DB from host**

```bash
docker exec -it postgres_container psql -U admin -d postgres -c "SELECT * FROM users;"
```

---

### **9. Shutting Down**

* Stop backend and frontend: `Ctrl + C` in respective terminals
* Stop Docker container:

```bash
docker stop postgres_container
```

---
