#!/bin/bash
cd /home/z/my-project
rm -f .next/dev/lock
while true; do
  npx next dev -p 3000 -H 0.0.0.0 2>&1 &
  CPID=$!
  # Keep pinging to prevent idle kill
  (while kill -0 $CPID 2>/dev/null; do curl -s -o /dev/null http://localhost:3000/; sleep 8; done) &
  wait $CPID
  echo "Server died at $(date). Restarting in 3s..."
  sleep 3
done
