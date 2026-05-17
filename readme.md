<p align="center">
  <img src="./assets/agenrixLogo.png" alt="agenRIX Logo" width="200"/>
</p>

# Agenrix: Unified Agent Registry & Audit System

**Agenrix** is an enterprise-grade solution for managing, monitoring, and auditing autonomous agents across software repositories. It provides a centralized **Unified Registry** to track agent identities, control access rights, and maintain comprehensive audit logs for security and compliance.

---

## 🏗️ Technical Architecture

Agenrix uses **PostgreSQL** (via Drizzle ORM) as the primary data store for all registry metadata — repositories, agents, organizations, classifications, and access control.

---

## 📂 Project Components

| Component          | Tech Stack                           | Purpose                                                                                           | Doc Link                                 |
| ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **API**            | Bun, TypeScript, Hono                | Core registry and audit service (WIP — TypeScript port)                                           | [API README](./apps/api/README.md)       |
| **App**            | React 19, TanStack Start, Tailwind 4 | Frontend dashboard                                                                                | [App README](./apps/app/README.md)       |
| **Worker Service** | Bun, TypeScript, Hono, Inngest       | Background job processor for repository analysis, AI provider integration, and telemetry emission | [Worker README](./apps/worker/README.md) |
