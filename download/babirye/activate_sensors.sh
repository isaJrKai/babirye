#!/bin/bash
set -euo pipefail
echo "Activating Sensors & Weapons..."
source .env.sensors
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$SENSORS_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
docker compose -f docker-compose.sensors.yml --profile sensors up -d
echo "Sensors ACTIVE."
