#!/bin/bash
# Keep BABIRYE dev server alive by pinging every 10s
while true; do
  curl -s --max-time 3 -o /dev/null http://localhost:3000/ 2>/dev/null
  sleep 10
done
