#!/bin/bash
# BABIRYE Server Watchdog - keeps the dev server alive
export DATABASE_URL="file:/home/z/my-project/db/babirye.db"
export BABIRYE_JWT_SECRET="babirye-titanium-ultra-v10-production-secret-2024"
cd /home/z/my-project

while true; do
  echo "[$(date)] Starting Next.js dev server..."
  npx next dev -p 3000 2>&1 &
  SERVER_PID=$!
  
  # Wait for server to be ready
  for i in $(seq 1 60); do
    if curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null | grep -q "200"; then
      echo "[$(date)] Server ready (PID: $SERVER_PID)"
      break
    fi
    sleep 1
  done
  
  # Wait for server to die
  wait $SERVER_PID 2>/dev/null
  EXIT_CODE=$?
  echo "[$(date)] Server died (exit: $EXIT_CODE), restarting in 3s..."
  sleep 3
done