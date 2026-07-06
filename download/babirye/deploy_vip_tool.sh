#!/bin/bash
set -euo pipefail
SVC=$1
if [ -z "$SVC" ]; then
  echo "Usage: $0 <service>"
  echo "Services: tello-drone-pilot, deep-drone-control, meshtastic-swarm, vehicle-mpc-control, vehicle-slam, vehicle-kalman, garmin-ble, pico-watch-ble, biometric-access, lpr-gate, cctv-ai, vip-surveillance"
  exit 1
fi
source .env.vip
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$VIP_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:deploy:$SVC::{}" | openssl dgst -sha256 -hmac "$VIP_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4751/spa/deploy -H 'Content-Type: application/json' -d '{"timestamp":'$TS',"nonce":"'$NC'","signature":"'$SIG'","action":"deploy","service":"'$SVC'","params":{}}'
echo "$SVC deployed."
