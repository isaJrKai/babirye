#!/bin/bash
set -euo pipefail
echo "Deactivating VIP Protection..."
source .env.vip
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$VIP_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:deactivate::{}" | openssl dgst -sha256 -hmac "$VIP_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4751/spa/deactivate -H 'Content-Type: application/json' -d '{"timestamp":'$TS',"nonce":"'$NC'","signature":"'$SIG'","action":"deactivate","service":null,"params":{}}'
docker compose -f docker-compose.vip.yml --profile vip down -v
echo "VIP Protection DORMANT and wiped."
