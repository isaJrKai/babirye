#!/bin/bash
set -euo pipefail
echo "Deactivating Defensive..."
source .env.defensive
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$DEFENSIVE_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:deactivate::{}" | openssl dgst -sha256 -hmac "$DEFENSIVE_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4749/spa/deactivate -H 'Content-Type: application/json' -d '{"timestamp":$TS,"nonce":"$NC","signature":"$SIG","action":"deactivate","service":null,"params":{}}'
docker compose -f docker-compose.defensive.yml --profile defensive down -v
echo "DORMANT and wiped."
