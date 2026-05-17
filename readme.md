<p align="center">
  <img src="./assets/agenrixLogo.png" alt="agenRIX Logo" width="200"/>
</p>

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

## 📝 Note
Ensure both your **PostgreSQL** and **MongoDB** instances are reachable and authorized before starting the backend service. See the [Backend README](./Backend/README.md) for precise connection string requirements and IP allowlisting tips.
