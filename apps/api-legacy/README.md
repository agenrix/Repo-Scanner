# Agenrix Backend API

High-performance asynchronous backend service for managing and auditing autonomous agents across repositories. Employs a split-database architecture to balance relational integrity with high-volume telemetry scalability.

## 🏗 Architecture Overview

### Split-Write Strategy

The system optimizes for different data access patterns through dual databases:

- **PostgreSQL (Registry Layer):** Stores structural metadata—repositories, agents, classifications, and access control configuration. Provides ACID guarantees and relational consistency.
- **MongoDB (Audit Layer):** Stores high-frequency telemetry—AI reasoning signals, framework detection, activity events, and agent behavior logs. Supports flexible, evolving schema through document-based storage.

### Auto-Registration Engine

When a repository is submitted via `/repo_scans`, the system automatically registers agents if classification indicates `AGENT` or `POSSIBLE_AGENT`. This triggers an upsert operation in the PostgreSQL registry with extracted metadata.

## 🛠 Tech Stack

| Component        | Purpose                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| **FastAPI**      | Asynchronous HTTP framework with built-in validation and OpenAPI documentation |
| **SQLAlchemy**   | Async ORM for PostgreSQL with AsyncPG driver                                   |
| **Motor**        | Async MongoDB driver for document operations                                   |
| **Pydantic v2**  | Data validation and serialization                                              |
| **Python 3.10+** | Runtime environment                                                            |

---

## ⚙️ Setup and Running

### Prerequisites

- Python 3.10 or higher
- PostgreSQL 12+ (local or remote)
- MongoDB 4.4+ (local or remote)
- pip or poetry for dependency management

### Step 1: Environment Configuration

Create a `.env` file in the `apps/api-legacy/` directory from the provided example:

```bash
cp .env.example .env
```

**Required environment variables:**

| Variable       | Description                        | Example                                                                                 |
| -------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| `PORT`         | Backend API port                   | `8000`                                                                                  |
| `POSTGRES_URI` | PostgreSQL async connection string | `postgresql+asyncpg://user:pass@localhost:5432/agenrix?prepared_statement_cache_size=0` |
| `MONGODB_URI`  | MongoDB connection string          | `mongodb+srv://user:pass@cluster.mongodb.net/agenrix`                                   |

**Important PostgreSQL Configuration:**

- Use **async-compatible** connection strings with the `asyncpg://` protocol (not `postgresql://`)
- Append `?prepared_statement_cache_size=0` for proper transaction pooling
- For IPv4 compatibility: ensure pooler configurations support IPv4 (e.g., Supabase IPv4 addon)

**Optional variables:**

- `LOG_LEVEL`: Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`)
- `DATABASE_ECHO`: Enable SQL query logging (`true` or `false`)

### Step 2: Install Dependencies

```bash
# Create and activate virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Database Initialization (Optional)

If using fresh databases, run migrations to create schema:

```bash
# PostgreSQL schema will be created automatically on first run
# MongoDB collections will be created on first write
```

### Step 4: Run the Server

```bash
python main.py
```

**Expected output:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Access endpoints:**

- API Docs (Swagger UI): `http://localhost:8000/docs`
  <!-- - ReDoc: `http://localhost:8000/redoc`
- Health Check: `GET http://localhost:8000/health` -->

---

## 🚦 API Reference

### Agent Management (Registry Operations)

#### `GET /agents`

Retrieve a filtered list of agents from the registry.

**Query Parameters:**

- `search` (str, optional): Search across agent ID, name, and other fields
- `agent_id` (str, optional): Filter by agent ID
- `agent_name` (str, optional): Filter by agent name
- `owner` (str, optional): Filter by owner
- `authorized_by` (str, optional): Filter by authorizer
- `subscription_plan` (str, optional): Filter by subscription plan
- `status` (str, optional): Filter by status
- `classification` (str, optional): Filter by classification
- `confidence` (str, optional): Filter by confidence level
- `limit` (int, optional): Maximum records to return (default: 100, max: 500)
- `offset` (int, optional): Number of records to skip (default: 0)

Additional activity and repository filters available.

**Request:**

```bash
curl "http://localhost:8000/agents?owner=soum-rakshit&limit=20"
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "agent_id": "researcher-01",
            "agent_name": "DeepSearch AI",
            "description": "Autonomous agent for deep web research",
            "owner": "soum-rakshit",
            "subscription_plan": "Free",
            "access_rights": {
                "read": true,
                "write": false,
                "delete": false
            },
            "integration_details": {
                "tools": ["google_search", "web_scraper"]
            }
        }
    ],
    "total_count": 1
}
```

**Error Response (400 Bad Request):**

```json
{
    "success": false,
    "error": {
        "message": "Invalid search parameter"
    }
}
```

---

#### `POST /add_agent`

Manually register a new agent in the registry.

**Request Body:**

```json
{
    "agent_id": "researcher-01",
    "agent_name": "DeepSearch AI",
    "description": "Autonomous agent for deep web research",
    "owner": "soum-rakshit",
    "authorized_by": "admin",
    "subscription_plan": "Free",
    "access_rights": {
        "read": true,
        "write": false,
        "delete": false
    },
    "integration_details": {
        "tools": ["google_search", "web_scraper"]
    }
}
```

**Request:**

```bash
curl -X POST http://localhost:8000/add_agent \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "researcher-01",
    "agent_name": "DeepSearch AI",
    "owner": "soum-rakshit"
  }'
```

**Success Response (201 Created):**

```json
{
    "success": true,
    "message": "Agent registered successfully",
    "data": {
        "id": 1,
        "agent_id": "researcher-01",
        "agent_name": "DeepSearch AI"
    }
}
```

**Error Response (400 Bad Request - Duplicate):**

```json
{
    "success": false,
    "error": {
        "message": "Agent with ID 'researcher-01' already exists"
    }
}
```

---

#### `PATCH /update_agent/{agent_id}`

Update existing agent configuration or access rights.

**Path Parameters:**

- `agent_id` (str): The unique identifier of the agent to update

**Request Body (all fields optional):**

```json
{
    "agent_name": "Updated Name",
    "description": "Updated description",
    "subscription_plan": "Premium",
    "access_rights": {
        "read": true,
        "write": true,
        "delete": false
    }
}
```

**Request:**

```bash
curl -X PATCH http://localhost:8000/update_agent/researcher-01 \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_plan": "Premium"
  }'
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Agent updated successfully",
    "data": {
        "id": 1,
        "agent_id": "researcher-01",
        "subscription_plan": "Premium"
    }
}
```

**Error Response (404 Not Found):**

```json
{
    "success": false,
    "error": {
        "message": "Agent with ID 'researcher-01' not found"
    }
}
```

---

### Repository Scan & Ingestion (Unified Audit/Registry)

#### `POST /repo_scans`

The primary ingestion endpoint. Submits repository analysis and triggers auto-registration of agents if classification indicates autonomous behavior.

> [!IMPORTANT]
> This endpoint performs **split-writes**: structural metadata is committed to PostgreSQL, while detailed analysis logs are stored in MongoDB.

**Request Body:**

```json
{
    "repo": {
        "repo_id": "auto-agent-4041",
        "repo_name": "langchain-crawler-bot",
        "repo_link": "https://github.com/example/langchain-crawler-bot",
        "classification": "AGENT",
        "confidence": "high",
        "agent_signals": [
            "Langchain agent loop detected",
            "OpenAI tool calling implementation"
        ],
        "evidence_files": ["src/agent/executor.ts"],
        "frameworks_detected": ["LangChain"],
        "reasoning": "The codebase contains a primary execution loop that autonomously calls the OpenAI API."
    },
    "agent": {
        "agent_id": "researcher-01",
        "agent_name": "DeepSearch AI",
        "agent_description": "Autonomous agent for deep web research",
        "owner": "soum-rakshit",
        "authorized_by": "Worker-Scan",
        "subscription_plan": "Free",
        "access_rights": {
            "read": true,
            "write": false,
            "delete": false
        },
        "integration_details": {
            "tools": ["google_search", "web_scraper"]
        }
    }
}
```

**Request:**

```bash
curl -X POST http://localhost:8000/repo_scans \
  -H "Content-Type: application/json" \
  -d @payload.json
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "message": "Repository scan ingested successfully",
    "data": {
        "repo_id": "auto-agent-4041",
        "agent_id": "researcher-01",
        "registry_written": true,
        "audit_written": true
    }
}
```

**Validation Error (400 Bad Request):**

```json
{
    "success": false,
    "error": {
        "message": "Missing required field: repo_link"
    }
}
```

---

#### `GET /repo_scans`

Retrieve detailed audit records with linked registry metadata and NoSQL analysis data.

**Query Parameters - SQL Repository Fields:**

- `search` (str, optional): Fuzzy search across `repo_id`, `repo_name`, and `repo_link` using SQL `ILIKE` (case-insensitive). **Ignored if any NoSQL filters are active**
- `repo_id` (str, optional): Exact match on repository ID
- `repo_name` (str, optional): Fuzzy search (case-insensitive) on repository name
- `repo_link` (str, optional): Fuzzy search (case-insensitive) on repository URL
- `classification` (str, optional): Exact match on classification (`AGENT`, `POSSIBLE_AGENT`, `NOT_AGENT`)
- `confidence` (str, optional): Exact match on confidence level (`high`, `medium`, `low`)

**Query Parameters - NoSQL Audit Fields:**

- `agent_signals` (str, optional): Fuzzy search on detected agent signals using MongoDB `$regex`
- `evidence_files` (str, optional): Fuzzy search on evidence file paths
- `frameworks_detected` (str, optional): Fuzzy search on detected frameworks (e.g., `LangChain`, `OpenAI`)
- `reasoning` (str, optional): Fuzzy search on analysis reasoning text

**Query Parameters - Pagination:**

- `limit` (int, optional): Maximum records to return (default: 100, max: 500)
- `offset` (int, optional): Number of records to skip (default: 0)

**Requests:**

_Simple fuzzy search (SQL mode):_

```bash
curl "http://localhost:8000/repo_scans?search=langchain&limit=20"
```

_Exact filter by classification:_

```bash
curl "http://localhost:8000/repo_scans?classification=AGENT&confidence=high&limit=20"
```

_NoSQL audit search (overrides `search`):_

```bash
curl "http://localhost:8000/repo_scans?agent_signals=loop+detected&frameworks_detected=openai&limit=15"
```

_Combined SQL and NoSQL search:_

```bash
curl "http://localhost:8000/repo_scans?repo_name=crawler&reasoning=autonomous&limit=10"
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "repo_id": "auto-agent-4041",
            "repo_name": "langchain-crawler-bot",
            "repo_link": "https://github.com/example/langchain-crawler-bot",
            "classification": "AGENT",
            "confidence": "high",
            "frameworks_detected": ["LangChain"],
            "agent_signals": ["Langchain agent loop detected"],
            "reasoning": "The codebase contains a primary execution loop...",
            "scanned_at": "2024-05-04T10:30:00Z"
        }
    ],
    "total_count": 5
}
```

---

### Advanced Search & Filtering

**Dual-Database Search Strategy:**

The system implements **conditional search logic** based on active filters:

#### Mode 1: SQL-Only Search

Triggered when: `search` parameter is used **without** any NoSQL filter parameters

**Behavior:**

- Searches PostgreSQL using `ILIKE '%value%'` (case-insensitive substring matching)
- For `/agents`: Searches `agent_id`, `agent_name`, `reasoning` fields
- For `/repo_scans`: Searches `repo_id`, `repo_name`, `repo_link` fields

**Example:**

```bash
# This uses SQL ILIKE search only
GET /agents?search=deepSearch
```

#### Mode 2: NoSQL-Priority Search

Triggered when: Any NoSQL filter parameter is provided (e.g., `agent_signals`, `used_by`, `action`, etc.)

**Behavior:**

- Searches MongoDB using `{$regex: 'value', $options: 'i'}` (case-insensitive regex)
- The `search` parameter is **ignored** to prevent ambiguity
- MongoDB results are merged with SQL results using `repo_id` or `agent_id` as join key
- Returns combined data with both SQL metadata and NoSQL telemetry

**Example:**

```bash
# This uses NoSQL search; 'search' param would be ignored
GET /agents?action=data_export&recipient=admin&limit=10
```

#### Mode 3: Field-Specific Filtering

Triggered when: Exact-match field parameters are used (e.g., `classification`, `status`, `subscription_plan`)

**Behavior:**

- Uses exact equality matching on SQL fields (case-sensitive for values)
- Can be combined with fuzzy search parameters
- NoSQL regex filters combined using AND logic

**Example:**

```bash
# Exact match on classification AND fuzzy on name
GET /repo_scans?classification=AGENT&repo_name=crawler&limit=20
```

**Searchable Fields Summary:**

| Endpoint      | SQL Exact-Match                                                                            | SQL Fuzzy (ILIKE)                                    | NoSQL Fuzzy (Regex)                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/agents`     | `agent_id`, `authorized_by`, `subscription_plan`, `status`, `classification`, `confidence` | `agent_name`, `owner`, `source_repo_id`, `reasoning` | `used_by`, `action`, `files_altered`, `recipient`, `item`, `comm_classification`, `location_path`, `encryption_status`, `repo_*` fields |
| `/repo_scans` | `repo_id`, `classification`, `confidence`                                                  | `repo_name`, `repo_link`                             | `agent_signals`, `evidence_files`, `frameworks_detected`, `reasoning`                                                                   |

**Case Sensitivity Notes:**

- SQL `ILIKE`: Case-insensitive (e.g., 'LANGCHAIN' = 'langchain')
- MongoDB `$regex` with 'i' flag: Case-insensitive
- Exact-match fields: Case-sensitive on values (e.g., 'Premium' ≠ 'premium')

---

## 📊 Database Schema

### SQL Registry (PostgreSQL)

**repos table:**

```sql
CREATE TABLE repos (
  id SERIAL PRIMARY KEY,
  repo_id VARCHAR(255) UNIQUE NOT NULL,
  repo_name VARCHAR(255) NOT NULL,
  repo_link VARCHAR(500) NOT NULL,
  classification VARCHAR(50),
  confidence VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**agents table:**

```sql
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  agent_id VARCHAR(255) UNIQUE NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  description TEXT,
  owner VARCHAR(255),
  subscription_plan VARCHAR(50),
  access_rights JSONB,
  integration_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### NoSQL Audit (MongoDB)

**repo_audits collection:**

```json
{
  "_id": ObjectId,
  "repo_id": "auto-agent-4041",
  "agent_signals": ["Langchain agent loop detected"],
  "evidence_files": ["src/agent/executor.ts"],
  "frameworks_detected": ["LangChain"],
  "reasoning": "The codebase contains...",
  "scanned_at": ISODate("2024-05-04T10:30:00Z")
}
```

---

## 🔑 Key Constraints and Validation

| Field              | Requirement                | Behavior                                                                                       |
| ------------------ | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `repo_id`          | **Required** for all scans | Must be unique; used as join key across SQL and NoSQL databases                                |
| `repo_link`        | **Required** for all scans | Valid HTTPS GitHub URL; searchable via fuzzy matching                                          |
| `agent_id`         | Conditional                | Required only if agent auto-registration is intended                                           |
| `classification`   | **Required**               | One of: `AGENT`, `POSSIBLE_AGENT`, `NOT_AGENT`; exact-match field                              |
| `confidence`       | Optional                   | Recommended: `high`, `medium`, `low`; exact-match field (case-sensitive)                       |
| `search` parameter | Optional                   | **SQL mode:** Fuzzy search. **Ignored when NoSQL filters are active**                          |
| NoSQL filters      | Optional                   | When any NoSQL filter is active, enables dual-database search and overrides `search` parameter |

**Fuzzy Search Field Reference:**

| Endpoint          | SQL Fuzzy Search Fields                              | NoSQL Fuzzy Search Fields                                                                                                                                                                                            |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /agents`     | `agent_name`, `owner`, `source_repo_id`, `reasoning` | `used_by`, `action`, `files_altered`, `recipient`, `item`, `comm_classification`, `location_path`, `encryption_status`, `repo_name`, `repo_link`, `repo_agent_signals`, `repo_frameworks_detected`, `repo_reasoning` |
| `GET /repo_scans` | `repo_name`, `repo_link`                             | `agent_signals`, `evidence_files`, `frameworks_detected`, `reasoning`                                                                                                                                                |

---

## 📚 Troubleshooting

### PostgreSQL Connection Issues

- **Error:** `can't initialize a pool with an asynchronous context manager: TypeError`
    - **Solution:** Ensure `asyncpg://` protocol is used, not `postgresql://`
    - Check that `?prepared_statement_cache_size=0` is appended to connection string

### MongoDB Connection Issues

- **Error:** `ServerSelectionTimeoutError`
    - **Solution:** Verify MongoDB instance is reachable and credentials are correct
    - Check firewall rules and IP allowlisting on MongoDB Atlas (if cloud-hosted)

### Auto-Registration Not Triggering

- **Check:** Ensure `classification` field is set to `AGENT` or `POSSIBLE_AGENT`
- **Verify:** Agent metadata is included in the `agent` section of request payload

### Fuzzy Search Not Returning Expected Results

- **Issue:** Search term matches SQL fields but no results returned
    - **Cause:** NoSQL filters may be active (even unintentionally), which ignores the `search` parameter
    - **Solution:** Remove any NoSQL filter parameters and use only the `search` parameter
    - **Verification:** Check request URL for parameters like `action`, `agent_signals`, `used_by`, etc.

- **Issue:** Case-sensitivity mismatch in search
    - **Cause:** Using exact-match fields (like `classification`, `status`) which are case-sensitive
    - **Solution:** Use fuzzy fields instead or match exact case (e.g., `classification=AGENT` not `classification=agent`)

### Search Performance Issues with Large Datasets

- **Issue:** Slow fuzzy search on NoSQL queries
    - **Cause:** MongoDB `$regex` queries on large collections without indexes
    - **Solution 1:** Use exact-match fields when possible (e.g., `classification=AGENT` instead of searching for "AGENT")
    - **Solution 2:** Combine SQL exact matches with NoSQL searches to reduce scope
    - **Solution 3:** Limit results with `limit` parameter (max 500) and use pagination with `offset`

- **Issue:** Search returns too many results
    - **Solution:** Add more specific filters (e.g., both `classification` and `confidence`)
    - **Example:** Instead of `GET /repo_scans?search=langchain`, use `GET /repo_scans?repo_classification=AGENT&frameworks_detected=langchain`
