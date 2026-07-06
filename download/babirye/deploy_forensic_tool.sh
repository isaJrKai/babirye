#!/bin/bash
set -euo pipefail
SVC=$1
if [ -z "$SVC" ]; then echo "Usage: $0 <service>"; echo "Services: andriller, lockknife, ibex, hashcat, volatility, sleuthkit, lazagne, mvt ... (+4 more)"; exit 1; fi
source .env.forensic
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$FORENSIC_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:deploy:$SVC::{}" | openssl dgst -sha256 -hmac "$FORENSIC_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4748/spa/deploy -H 'Content-Type: application/json' -d '{"timestamp":$TS,"nonce":"$NC","signature":"$SIG","action":"deploy","service":"$SVC","params":{}}'
echo "$SVC deployed."
