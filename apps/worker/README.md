# @agenrix/worker

Background worker for repository analysis jobs

## Step-by-Step Setup and Execution

### Step 1: Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Required variables:

- `GOOGLE_GENERATIVE_AI_API_KEY`
- `E2B_API_KEY`

Optional:

- `PORT`
- `LOG_LEVEL`
- `INNGEST_API_BASE_URL`
- `INNGEST_SIGNING_KEY` (Required for `GET /worker/events/:eventId` to prevent `503` errors)

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Start the Inngest Dev Server

The worker relies on Inngest for background jobs. You must run the Inngest local server first in a separate terminal:

```bash
npx inngest-cli@latest dev
```

- Inngest dashboard address: `http://localhost:8288`

### Step 4: Run the Worker App

In your primary terminal, start the development server:

```bash
bun run dev
```

- Default worker API address: `http://localhost:3000/v1`

## API

### `POST /worker`

Dispatch a repository analysis job.

Request body:

```json
{
  "repository": "https://github.com/advtszn/altar"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "eventId": ["01KQ43JX0DEA7P9ZQBKMC6N5J8"]
  }
}
```

Notes:

- The returned value is an Inngest event ID array from `inngestClient.send(...)`.
- This app currently dispatches one event per request, so the array should contain one ID.

Validation error response:

```json
{
  "success": false,
  "error": {
    "message": "repository: Invalid input"
  }
}
```

### `GET /worker/events/:eventId`

Poll job status for a previously dispatched event.

Success response:

```json
{
  "success": true,
  "data": {
    "eventId": "01KQ43JX0DEA7P9ZQBKMC6N5J8",
    "event": {
      "id": "01KQ43JX0DEA7P9ZQBKMC6N5J8",
      "name": "agent/analyze-repository",
      "data": {
        "repository": "https://github.com/advtszn/altar"
      }
    },
    "runId": "01KQ43K123ABCDEF456789XYZ",
    "status": "running",
    "run": {
      "runId": "01KQ43K123ABCDEF456789XYZ",
      "functionId": "repository-analysis",
      "status": "running"
    }
  }
}
```

Possible `status` values:

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`

If no run exists yet, the route returns `runId: null`, `run: null`, and `status: "queued"`.

Config error response:

```json
{
  "success": false,
  "error": {
    "message": "INNGEST_SIGNING_KEY is not configured"
  }
}
```

## Step 5: Test the Worker

**1. Dispatch a job:**

Send a POST request to trigger a repository analysis job:

```bash
curl -X POST http://localhost:3000/v1/worker \
  -H "Content-Type: application/json" \
  -d '{"repository":"https://github.com/advtszn/altar"}'
```

This will return a JSON response containing an `eventId`.

**2. Poll the event status:**

Using the `eventId` from the previous step (replace `<YOUR_EVENT_ID>`), check the job's progress:

```bash
curl http://localhost:3000/v1/worker/events/<YOUR_EVENT_ID>
```
