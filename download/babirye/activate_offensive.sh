#!/bin/bash
set -euo pipefail
echo "Activating Offensive..."
source .env.offensive
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$OFFENSIVE_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:activate::{}" | openssl dgst -sha256 -hmac "$OFFENSIVE_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4747/spa/activate -H 'Content-Type: application/json' -d '{"timestamp":$TS,"nonce":"$NC","signature":"$SIG","action":"activate","service":null,"params":{}}'
echo "ACTIVE."
