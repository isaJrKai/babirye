#!/bin/bash
set -euo pipefail
echo "Deactivating Forensic..."
source .env.forensic
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$FORENSIC_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:deactivate::{}" | openssl dgst -sha256 -hmac "$FORENSIC_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4748/spa/deactivate -H 'Content-Type: application/json' -d '{"timestamp":$TS,"nonce":"$NC","signature":"$SIG","action":"deactivate","service":null,"params":{}}'
docker compose -f docker-compose.forensic.yml --profile forensic down -v
echo "DORMANT and wiped."
