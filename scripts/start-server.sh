#!/bin/bash
# Reliable BABIRYE server startup
# Usage: bash /home/z/my-project/scripts/start-server.sh

# CRITICAL: Unset any inherited DATABASE_URL that might point to wrong DB
unset DATABASE_URL BABIRYE_JWT_SECRET

PROJECT="/home/z/my-project"
STANDALONE="$PROJECT/.next/standalone"

echo "[$(date)] Starting BABIRYE server..."

cd "$STANDALONE"
NODE_ENV=production node server.js &
SERVER_PID=$!

# Wait up to 10s for port to bind
for i in $(seq 1 10); do
  if ss -tlnp | grep -q ":3000 "; then
    echo "[$(date)] BABIRYE ready on port 3000 (PID: $SERVER_PID)"
    exit 0
  fi
  sleep 1
done

echo "[$(date)] ERROR: Server failed to start"
exit 1