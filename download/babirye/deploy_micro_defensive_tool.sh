#!/bin/bash
set -euo pipefail
SVC=$1
if [ -z "$SVC" ]; then echo "Usage: $0 <service>"; echo "Services: html-sanitizer, sql-sanitizer, xss-filter, cmd-injection-guard, path-traversal-guard, ldap-injection-guard, xml-sanitizer, header-injection-guard ... (+142 more)"; exit 1; fi
source .env.micro_defensive
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$MICRO_DEFENSIVE_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:deploy:$SVC::{}" | openssl dgst -sha256 -hmac "$MICRO_DEFENSIVE_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4750/spa/deploy -H 'Content-Type: application/json' -d '{"timestamp":$TS,"nonce":"$NC","signature":"$SIG","action":"deploy","service":"$SVC","params":{}}'
echo "$SVC deployed."
