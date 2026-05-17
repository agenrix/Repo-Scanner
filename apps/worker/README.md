# @agenrix/worker

Background job processor for autonomous repository analysis and agent telemetry emission. Orchestrates AI provider integrations, framework detection, and registry updates through async job workflows.

## 🏗 Architecture Overview

The Worker service operates as a distributed job processor within the Agenrix ecosystem:

1. **Job Dispatch:** Receives repository analysis requests and creates Inngest events
2. **Async Execution:** Processes jobs in the background using Inngest scheduling
3. **AI Integration:** Leverages Google Generative AI and E2B sandboxes for code analysis
4. **Telemetry Emission:** Sends analyzed data back to the Backend API for registry/audit ingestion
5. **Status Tracking:** Provides real-time job status polling via event IDs

### Key Components

- **HTTP API (Hono):** RESTful endpoints for job dispatch and status polling
- **Inngest Client:** Event-driven job orchestration with local dev dashboard
- **AI Providers:** Google Generative AI for code reasoning, E2B for isolated execution
- **Logger (Pino):** Structured logging with pretty-print support in development
- **Validation (Zod):** Runtime schema validation for requests and responses

---

## 🛠 Tech Stack

| Component          | Version  | Purpose                                      |
| ------------------ | -------- | -------------------------------------------- |
| **Bun**            | Latest   | JavaScript runtime with superior performance |
| **TypeScript**     | ^5.0     | Type-safe code                               |
| **Hono**           | ^4.12.15 | Lightweight HTTP framework                   |
| **Inngest**        | ^4.2.4   | Background job orchestration                 |
| **@ai-sdk/google** | ^3.0.64  | Google Generative AI integration             |
| **E2B**            | ^2.19.1  | Sandboxed code execution                     |
| **Pino**           | ^10.3.1  | Structured logging                           |
| **Zod**            | ^4.3.6   | Schema validation                            |
| **ULID**           | ^3.0.2   | Unique ID generation                         |

---

## ⚙️ Step-by-Step Setup and Execution

### Step 1: Configure Environment Variables

Create a `.env` file in the `apps/worker/` directory from the provided example:

```bash
cp .env.example .env
```

**Required Environment Variables:**

| Variable                       | Description                         | Example     | Obtain From                                                |
| ------------------------------ | ----------------------------------- | ----------- | ---------------------------------------------------------- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key for code analysis | `AIzaSy...` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `E2B_API_KEY`                  | E2B sandbox API key                 | `e2b_...`   | [E2B Dashboard](https://e2b.dev/dashboard)                 |

**Optional Environment Variables:**

| Variable               | Description                              | Example                   | Default                 |
| ---------------------- | ---------------------------------------- | ------------------------- | ----------------------- |
| `PORT`                 | Worker API port                          | `3002`                    | `3002`                  |
| `LOG_LEVEL`            | Logging level                            | `DEBUG`, `INFO`, `WARN`   | `INFO`                  |
| `INNGEST_DEV`          | Enable local Inngest dev server          | `1` or `0`                | `1`                     |
| `INNGEST_API_BASE_URL` | Inngest API base URL (production)        | `https://api.inngest.com` | Local dev server        |
| `INNGEST_SIGNING_KEY`  | Inngest webhook signing key (production) | `signsk_...`              | Optional (local dev)    |
| `BACKEND_WEBHOOK_BASE_URL` | Backend webhook URL for result submission | `http://127.0.0.1:3001/v1` | `http://127.0.0.1:3001/v1` |

### Step 2: Install Dependencies

```bash
bun install
```

**Note:** Bun handles `package.json` and `bun.lock` automatically. If using npm/yarn, install with those tools instead.

### Step 3: Start the Inngest Dev Server (Local Development Only)

In a **separate terminal**, start the Inngest local dev server:

```bash
npx inngest-cli@latest dev
```

**Expected output:**

```
Starting Inngest Dev Server
Server listening at http://localhost:8200
Dashboard at http://localhost:8288
```

- **Dashboard URL:** `http://localhost:8288` — view jobs, runs, and logs
- **API Endpoint:** `http://localhost:8200` — internal API for job management

**Skip this step if:**

- Running the full stack via Docker Compose (Inngest service is provisioned automatically)
- Using production Inngest (set `INNGEST_API_BASE_URL` and `INNGEST_SIGNING_KEY`)

### Step 4: Run the Worker Application

In your primary terminal, start the development server:

```bash
bun run dev
```

**Expected output:**

```
Server listening on http://0.0.0.0:3002
```

**Build for production:**

```bash
bun run build
```

This generates optimized output in `dist/` using TypeScript compilation and path aliasing.

**Start production build:**

```bash
bun dist src/index.js
```

---

## 📡 API Reference

### Job Submission

#### `POST /v1/worker`

Dispatch a repository analysis job to the background queue.

**Request Body:**

```json
{
    "organizationId": "018e4c71-3f9a-7000-9b59-a1234567890a",
    "repository": "https://github.com/advtszn/altar"
}
```

**Request:**

```bash
curl -X POST http://localhost:3002/v1/worker \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"018e4c71-3f9a-7000-9b59-a1234567890a","repository":"https://github.com/advtszn/altar"}'
```

**Success Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "eventId": ["01KQ43JX0DEA7P9ZQBKMC6N5J8"]
    }
}
```

**Response Fields:**

- `success` (boolean): Request succeeded
- `data.eventId` (array): Inngest event IDs (typically one per request)
    - Use this ID to poll job status

**Validation Error (400 Bad Request):**

```json
{
    "success": false,
    "error": {
        "message": "repository: Invalid URL format"
    }
}
```

**Common Validation Errors:**

- `Invalid URL format`: Repository is not a valid HTTPS GitHub URL
- `Missing required field`: Repository URL was not provided
- `Invalid input`: Repository parameter is malformed


---

## 🧪 Testing the Worker

### Full End-to-End Flow

**Terminal 1: Start Inngest Dev Server**

```bash
npx inngest-cli@latest dev
```

**Terminal 2: Start Worker Service**

```bash
cd apps/worker
bun run dev
```

**Terminal 3: Test Job Submission**

```bash
# Submit a repository analysis job
curl -s -X POST http://localhost:3002/v1/worker \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"018e4c71-3f9a-7000-9b59-a1234567890a","repository":"https://github.com/advtszn/altar"}' | jq .
```

### View Job Details in Inngest Dashboard

Open `http://localhost:8288` to:

- See all dispatched events
- View run logs and execution details
- Debug job failures
- Track job performance metrics

---

## 🔌 Inngest Integration Details

### Event Schema

The worker dispatches events to Inngest with the following schema:

```typescript
{
  name: "agent/analyze-repository",
  data: {
    repository: string  // GitHub repository URL
  }
}
```

### Function Definition

The repository analysis function is triggered by `agent/analyze-repository` events and:

1. Clones and analyzes the repository
2. Detects frameworks and agent patterns
3. Generates classification and reasoning
4. Returns structured analysis results

### Webhook Signing (Production)

In production, Inngest sends signed webhooks to the Worker. Verify signatures using `INNGEST_SIGNING_KEY`:

```typescript
import { inngest } from "./inngest";

// Inngest client automatically handles signature verification
const result = await inngest.send({
    name: "agent/analyze-repository",
    data: { repository: url },
});
```

---

## 🚀 Deployment

### Docker Deployment

The Worker includes a `Dockerfile` for containerized deployment. See root `docker-compose.yml` for full stack setup:

```bash
docker compose up -d worker
```

### Production Configuration

For production deployment:

1. **Set Inngest credentials:**

    ```env
    INNGEST_API_BASE_URL=https://api.inngest.com
    INNGEST_SIGNING_KEY=signsk_prod_...
    ```

2. **Configure API keys:**

    ```env
    GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
    E2B_API_KEY=e2b_...
    BACKEND_WEBHOOK_BASE_URL=https://api.agenrix.com/v1
    ```

3. **Set logging level:**

    ```env
    LOG_LEVEL=INFO
    ```

4. **Build and run:**
    ```bash
    bun run build
    bun dist src/index.js
    ```

---

## 📚 Build & Deployment Scripts

All scripts are defined in `package.json`:

| Script  | Command                                                          | Purpose                                   |
| ------- | ---------------------------------------------------------------- | ----------------------------------------- |
| `dev`   | `bun --hot src/index.ts`                                         | Run in dev mode with hot reload           |
| `build` | `tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json` | TypeScript compilation with path aliasing |
| `start` | `bun dist src/index.js`                                          | Run production build                      |

---

## 🐛 Troubleshooting

### Issue: `INNGEST_SIGNING_KEY is not configured`

- **Cause:** Missing signing key for Inngest webhook validation
- **Solution:** Set `INNGEST_SIGNING_KEY` in `.env` (can be dummy value in local dev)

### Issue: `Cannot connect to Inngest`

- **Cause:** Inngest dev server not running or wrong URL
- **Solution:** Start Inngest dev server in separate terminal: `npx inngest-cli@latest dev`

### Issue: `Google Generative AI API key invalid`

- **Cause:** Missing or invalid `GOOGLE_GENERATIVE_AI_API_KEY`
- **Solution:** Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey), verify it's correctly set in `.env`

### Issue: E2B sandbox failures

- **Cause:** Invalid or expired `E2B_API_KEY`
- **Solution:** Get fresh key from [E2B Dashboard](https://e2b.dev/dashboard), ensure account has remaining credits

### Issue: Slow job processing

- **Check:** View Inngest dashboard logs for bottlenecks
- **Optimize:** Consider increasing concurrency limits in Inngest settings

---

## 📖 Additional Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest CLI Reference](https://www.inngest.com/docs/cli)
- [Google Generative AI SDK](https://ai.google.dev)
- [E2B Sandbox Documentation](https://e2b.dev/docs)
- [Hono Documentation](https://hono.dev)
- [Pino Logger Documentation](https://getpino.io)
