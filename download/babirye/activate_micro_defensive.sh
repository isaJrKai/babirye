#!/bin/bash
set -euo pipefail
echo "Activating Micro_Defensive..."
source .env.micro_defensive
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$MICRO_DEFENSIVE_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:activate::{}" | openssl dgst -sha256 -hmac "$MICRO_DEFENSIVE_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4750/spa/activate -H 'Content-Type: application/json' -d '{"timestamp":$TS,"nonce":"$NC","signature":"$SIG","action":"activate","service":null,"params":{}}'
echo "ACTIVE."
