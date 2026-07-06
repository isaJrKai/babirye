#!/bin/bash
set -euo pipefail
echo "========================================"
echo "BABIRYE v10.0.0 Titanium Ultra + VIP Protection"
echo "========================================"
echo ""
echo "WARNING: Ensure ALL .env files are configured with strong secrets"
echo "  before deploying. Services will FAIL if secrets are not set."
echo ""

# Validate required secrets are not defaults
for VAR in POSTGRES_PASSWORD NEO4J_PASSWORD MEILI_MASTER_KEY BABIRYE_PASSWORD BABIRYE_JWT_SECRET; do
    VAL=$(grep "^${VAR}=" .env 2>/dev/null | cut -d'=' -f2)
    if [ -z "$VAL" ] || [ "$VAL" = "CHANGE_ME_STRONG" ] || [ "$VAL" = "CHANGE_ME_RANDOM" ]; then
        echo "FATAL: $VAR is not configured in .env. Edit .env before deploying."
        exit 1
    fi
done

echo "Secret validation passed. Deploying..."
mkdir -p data/forensic/{android,ios,computers} data/security data/defensive data/sensors data/vip
docker compose up -d
for f in forensic offensive defensive micro_defensive sensors; do docker compose -f docker-compose.$f.yml --profile $f up -d; done
echo "BABIRYE deployed."
echo "   Core API: http://localhost:8000"
echo "   Grafana: http://localhost:3000"
echo "   IRONSIGHT: http://localhost:9200"
echo "   Sensors: http://localhost:9901 (dormant)"
echo "All subsystems DORMANT. Activate individually."
echo "   ./activate_forensic.sh"
echo "   ./activate_offensive.sh"
echo "   ./activate_defensive.sh"
echo "   ./activate_micro_defensive.sh"
echo "   ./activate_sensors.sh"
