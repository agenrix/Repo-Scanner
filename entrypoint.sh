#!/bin/sh
# =============================================================================
# Agenrix — Container Entrypoint
# Starts: Nginx · FastAPI (uvicorn)
# =============================================================================
set -e

# ── Validate required environment variables ───────────────────────────────
check_var() {
    eval val="\$$1"
    if [ -z "$val" ]; then
        echo "❌  ERROR: Required environment variable '$1' is not set."
        exit 1
    fi
}
check_var MONGODB_URI
check_var POSTGRES_URI

echo "✅  Environment validated."

# ── Start Nginx ───────────────────────────────────────────────────────────
echo "🚀  Starting Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# ── Start FastAPI backend ─────────────────────────────────────────────────
echo "🚀  Starting FastAPI backend on port 8000..."
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2 &
FASTAPI_PID=$!



echo ""
echo "═══════════════════════════════════════"
echo "  Agenrix stack is up and running 🎉"
echo "  React UI  → http://0.0.0.0:80"
echo "  FastAPI   → http://127.0.0.1:8000 (proxied via /api/)"
echo "═══════════════════════════════════════"
echo ""

# ── Graceful shutdown on SIGTERM / SIGINT ────────────────────────────────
shutdown() {
    echo ""
    echo "⏹  Shutting down services..."
    kill "$NGINX_PID"   2>/dev/null || true
    kill "$FASTAPI_PID" 2>/dev/null || true
    wait
    echo "✅  All services stopped."
    exit 0
}
trap shutdown TERM INT

# ── Wait for any process to exit; fail the container if one dies ─────────
wait -n 2>/dev/null || {
    # Fallback for shells that don't support `wait -n`
    wait
}

# If we reach here, one process exited — bring down the container
shutdown
