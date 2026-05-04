# Agenrix: Unified Agent Registry & Audit System

**Agenrix** is an enterprise-grade solution for managing, monitoring, and auditing autonomous agents across software repositories. It combines a centralized **Unified Registry** with split-database architecture to track agent identities, control access rights, and maintain comprehensive audit logs for security and compliance.

---

## 🏗️ Technical Architecture

Agenrix employs a **Split-Write Strategy** to optimize for both relational integrity and high-volume telemetry:

- **Registry Layer (PostgreSQL):** Stores structural metadata (repositories, agents, classifications, access rights) with ACID guarantees.
- **Audit Layer (MongoDB):** Stores high-frequency telemetry (AI reasoning signals, framework detection, activity events) with flexible schema.

---

## 📂 Project Components

Each component has its own comprehensive README with setup instructions, API documentation, and configuration details. Start with the component that matches your role:

| Component              | Tech Stack                       | Purpose                                                                                           | Doc Link                                       |
| ---------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Backend API**        | FastAPI, AsyncPG, MongoDB, Motor | Core registry and audit service; handles ingestion, validation, and dual-database writes          | [Backend README](./apps/api-legacy/README.md)  |
| **Frontend Dashboard** | React 19, Vite, Tailwind CSS 4.0 | Web UI for registry exploration, advanced search, and audit intelligence visualization            | [Frontend README](./apps/app-legacy/README.md) |
| **Worker Service**     | Bun, TypeScript, Hono, Inngest   | Background job processor for repository analysis, AI provider integration, and telemetry emission | [Worker README](./apps/worker/README.md)       |

---

## 🚀 Quick Start

## � Quick Start

### Option 1: Docker Compose (Recommended for Full Stack)

Run the entire stack (Frontend, Backend, Worker, Inngest, PostgreSQL, MongoDB) with a single command:

```bash
# 1. Configure environment variables for each service
cp apps/api-legacy/.env.example apps/api-legacy/.env
cp apps/app-legacy/.env.example apps/app-legacy/.env
cp apps/worker/.env.example apps/worker/.env

# 2. Start the full stack
docker compose up -d --build

# 3. Access services
# Frontend: http://localhost:80
# Backend API: http://localhost:8000 (or via Nginx proxy)
# Inngest Dashboard: http://localhost:8288
```

For detailed setup and service access information, see [Docker Deployment](#docker-deployment) below.

### Option 2: Local Development

Each component can be run independently. Refer to the component's README for detailed setup:

- [Backend Setup](./apps/api-legacy/README.md#setup-and-running)
- [Frontend Setup](./apps/app-legacy/README.md#development-setup)
- [Worker Setup](./apps/worker/README.md#step-by-step-setup-and-execution)

---

## 🐳 Docker Deployment

All services can be deployed together using Docker Compose. Ensure Docker and Docker Compose are installed.

**Services included:**

- PostgreSQL (Registry database)
- MongoDB (Audit database)
- Inngest Dev Server (Job orchestration dashboard)
- Backend API (FastAPI on port 8000)
- Frontend (React dashboard on port 80, via Nginx)
- Worker (Bun service on port 3000)

**Instructions:**

1. **Configure Environment Variables:**
   Create `.env` files for each service from their examples:

    ```bash
    cp apps/api-legacy/.env.example apps/api-legacy/.env
    cp apps/app-legacy/.env.example apps/app-legacy/.env
    cp apps/worker/.env.example apps/worker/.env
    ```

2. **Start the Stack:**

    ```bash
    docker compose up -d --build
    ```

3. **Access Services:**
    - **Frontend (Registry Dashboard):** `http://localhost:80`
    - **Backend API Docs:** `http://localhost:8000/docs`
    - **Inngest Dashboard:** `http://localhost:8288`

4. **View Logs:**

    ```bash
    docker compose logs -f [service-name]
    # Examples: docker compose logs -f backend, docker compose logs -f worker
    ```

5. **Stop the Stack:**
    ```bash
    docker compose down
    ```

---

## ⚠️ Important Notes

- **PostgreSQL Connection:** Ensure IPv4-compatible connection strings with transaction pooling (`?prepared_statement_cache_size=0`). See [Backend README](./apps/api-legacy/README.md) for details.
- **Database Connectivity:** PostgreSQL and MongoDB must be reachable and authorized before starting the backend service.
- **API Keys:** The Worker service requires `GOOGLE_GENERATIVE_AI_API_KEY` and `E2B_API_KEY` (see [Worker README](./apps/worker/README.md) for details).
