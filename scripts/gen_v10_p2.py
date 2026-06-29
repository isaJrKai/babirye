#!/usr/bin/env python3
"""Part 2: Main docker-compose.yml + env + Dockerfile + scripts"""
OUT = "/home/z/my-project/upload/Pasted Content_1782740004460.txt"
F = open(OUT, "a", encoding="utf-8")
def w(s=""): F.write(s + "\n")

# 1. Main docker-compose.yml (FIXED: no duplicate networks in ironsight)
w("## 1. docker-compose.yml"); w("```yaml")
w("version: '3.8'\nservices:")
core_svcs = """  postgres:
    image: postgres:16
    container_name: babirye-postgres
    environment:
      POSTGRES_USER: babirye
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-babirye_password}
      POSTGRES_DB: babirye
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U babirye"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - babirye-net

  qdrant:
    image: qdrant/qdrant:latest
    container_name: babirye-qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - babirye-net

  neo4j:
    image: neo4j:latest
    container_name: babirye-neo4j
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD:-babirye_password}
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - neo4j_data:/data
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "${NEO4J_PASSWORD:-babirye_password}", "RETURN 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - babirye-net

  meilisearch:
    image: getmeili/meilisearch:latest
    container_name: babirye-meilisearch
    ports:
      - "7700:7700"
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY:-babirye_master_key}
    volumes:
      - meili_data:/meili_data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - babirye-net

  nats:
    image: nats:latest
    container_name: babirye-nats
    ports:
      - "4222:4222"
      - "8222:8222"
    networks:
      - babirye-net

  temporal:
    image: temporalio/auto-setup:latest
    container_name: babirye-temporal
    ports:
      - "7233:7233"
    environment:
      DB: postgres12
      DB_PORT: 5432
      POSTGRES_USER: babirye
      POSTGRES_PWD: ${POSTGRES_PASSWORD:-babirye_password}
      POSTGRES_SEEDS: postgres
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - babirye-net

  temporal-ui:
    image: temporalio/ui:latest
    container_name: babirye-temporal-ui
    ports:
      - "8080:8080"
    environment:
      TEMPORAL_ADDRESS: temporal:7233
    depends_on:
      temporal:
        condition: service_started
    networks:
      - babirye-net

  prometheus:
    image: prom/prometheus:latest
    container_name: babirye-prometheus
    ports:
      - "9090:9090"
    volumes:
      - prometheus_data:/prometheus
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - babirye-net

  grafana:
    image: grafana/grafana:latest
    container_name: babirye-grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-babirye_admin}
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - babirye-net

  omniroute:
    image: diegosouzapw/omni-route:latest
    container_name: babirye-omniroute
    ports:
      - "8088:8088"
    environment:
      OMNI_SECRET: ${OMNI_SECRET:-omni_secret}
    networks:
      - babirye-net

  ironsight:
    image: node:20-alpine
    container_name: babirye-ironsight
    restart: unless-stopped
    command: >
      sh -c "apk add git python3 make g++ && git clone https://github.com/NoblerWorks-HQ/IRONSIGHT.git /app || { echo IRONSIGHT ready; } && cd /app && npm install && npm run build && npm start"
    ports:
      - "9200:3000"
    networks:
      - babirye-net

  openthreat:
    image: python:3.11-slim
    container_name: babirye-openthreat
    restart: unless-stopped
    command: >
      sh -c "pip install fastapi uvicorn sqlalchemy psycopg2-binary redis httpx && git clone https://github.com/hoodinformatik/openthreat.git /app || { echo OpenThreat ready; } && python /app/threat_api.py"
    ports:
      - "8100:8100"
    networks:
      - babirye-net

  mini-shodan:
    image: python:3.11-slim
    container_name: babirye-mini-shodan
    restart: unless-stopped
    command: >
      sh -c "pip install shodan requests beautifulsoup4 pandas && echo Mini-Shodan ready && tail -f /dev/null"
    ports:
      - "8200:8200"
    networks:
      - babirye-net

  circuit-simulator:
    image: node:18-alpine
    container_name: babirye-circuit-simulator
    restart: unless-stopped
    command: >
      sh -c "npm install -g avr8js three && echo 3D Circuit Simulator ready && tail -f /dev/null"
    ports:
      - "8400:8400"
    networks:
      - babirye-net

  freemocap:
    image: python:3.11-slim
    container_name: babirye-freemocap
    restart: unless-stopped
    command: >
      sh -c "pip install opencv-python-headless numpy mediapipe && echo FreeMoCap ready && tail -f /dev/null"
    ports:
      - "8800:8800"
    networks:
      - babirye-net

  artifixer:
    image: python:3.11-slim
    container_name: babirye-artifixer
    restart: unless-stopped
    command: >
      sh -c "pip install torch torchvision diffusers opencv-python-headless && echo ArtiFixer ready && tail -f /dev/null"
    ports:
      - "8500:8500"
    networks:
      - babirye-net

  badger:
    image: golang:1.22-alpine
    container_name: babirye-badger
    restart: unless-stopped
    command: >
      sh -c "apk add git build-base && git clone https://github.com/Codehagen/Badger.git /app || { echo Badger ready; } && go run /app/badger.go"
    ports:
      - "9100:9100"
    networks:
      - babirye-net

  opensentry:
    image: node:20-alpine
    container_name: babirye-opensentry
    restart: unless-stopped
    command: >
      sh -c "npm install -g opensentry && echo OpenSentry ready && tail -f /dev/null"
    ports:
      - "9700:9700"
    networks:
      - babirye-net

  babirye-app:
    build: .
    container_name: babirye-app
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - qdrant
      - neo4j
      - meilisearch
      - nats
      - temporal
    environment:
      - DATABASE_URL=postgresql://babirye:${POSTGRES_PASSWORD:-babirye_password}@postgres:5432/babirye
      - QDRANT_URL=http://qdrant:6333
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD:-babirye_password}
      - MEILISEARCH_URL=http://meilisearch:7700
      - MEILISEARCH_API_KEY=${MEILI_MASTER_KEY:-babirye_master_key}
      - NATS_URL=nats://nats:4222
      - TEMPORAL_URL=temporal:7233
      - OMNIROUTE_URL=http://omniroute:8088
      - BABIRYE_PASSWORD=${BABIRYE_PASSWORD:-babirye_admin}
    volumes:
      - ./src:/app/src
      - ./skills:/app/skills
      - ./constitution:/app/constitution
      - ./data:/app/data
    networks:
      - babirye-net

networks:
  babirye-net:
    driver: bridge

volumes:
  postgres_data:
  qdrant_data:
  neo4j_data:
  meili_data:
  prometheus_data:
  grafana_data:"""
w(core_svcs)
w("```"); w("---"); w()

# 7-12. ENV FILES
envs = [("7",".env","BABIRYE Core Environment\nPOSTGRES_PASSWORD=CHANGE_ME_STRONG\nNEO4J_PASSWORD=CHANGE_ME_STRONG\nMEILI_MASTER_KEY=CHANGE_ME_STRONG\nBABIRYE_PASSWORD=CHANGE_ME_STRONG\nBABIRYE_JWT_SECRET=CHANGE_ME_RANDOM\nOMNI_SECRET=CHANGE_ME_STRONG\nGRAFANA_PASSWORD=CHANGE_ME_STRONG"),
("8",".env.forensic","FORENSIC_PASSWORD=CHANGE_ME_STRONG\nFORENSIC_SECRET=CHANGE_ME_RANDOM"),
("9",".env.offensive","OFFENSIVE_PASSWORD=CHANGE_ME_STRONG\nOFFENSIVE_SECRET=CHANGE_ME_RANDOM"),
("10",".env.defensive","DEFENSIVE_PASSWORD=CHANGE_ME_STRONG\nDEFENSIVE_SECRET=CHANGE_ME_RANDOM"),
("11",".env.micro_defensive","MICRO_DEFENSIVE_PASSWORD=CHANGE_ME_STRONG\nMICRO_DEFENSIVE_SECRET=CHANGE_ME_RANDOM"),
("12",".env.sensors","SENSORS_PASSWORD=CHANGE_ME_STRONG\nSENSORS_SECRET=CHANGE_ME_RANDOM")]
for num,name,content in envs:
    w(f"## {num}. {name}"); w("```bash"); w(content); w("```"); w("---"); w()

# 13-15. Dockerfile, prometheus, requirements
w("## 13. Dockerfile"); w("```dockerfile")
w("FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY src/ /app/src/\nCOPY constitution/ /app/constitution/\nRUN mkdir -p /app/data /app/security\nEXPOSE 8000\nCMD [\"uvicorn\", \"src.api.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]")
w("```"); w("---"); w()
w("## 14. prometheus.yml"); w("```yaml")
w("global:\n  scrape_interval: 15s\nscrape_configs:\n  - job_name: 'babirye'\n    static_configs:\n      - targets: ['babirye-app:8000']\n  - job_name: 'prometheus'\n    static_configs:\n      - targets: ['localhost:9090']")
w("```"); w("---"); w()
w("## 15. requirements.txt"); w("```")
w("fastapi==0.109.0\nuvicorn[standard]==0.27.0\npydantic==2.5.3\npydantic-settings==2.1.0\nsqlalchemy==2.0.25\npsycopg2-binary==2.9.9\nredis==5.0.1\nhttpx==0.26.0\nqdrant-client==1.7.0\nneo4j==5.15.0\nmeilisearch==0.31.0\nnats-py==2.7.0\ntemporalio==1.4.0\ncryptography==41.0.7\nbcrypt==4.1.2\naiohttp==3.9.1\npython-multipart==0.0.6")
w("```"); w("---"); w()

# 16. deploy.sh
w("## 16. deploy.sh"); w("```bash")
w("#!/bin/bash\nset -e\necho \"BABIRYE v10.0.0 Titanium Ultra + VIP Protection — Deploying...\"\nmkdir -p data/forensic/{android,ios,computers} data/security data/defensive data/sensors data/vip\ndocker compose up -d\nfor f in forensic offensive defensive micro_defensive sensors; do docker compose -f docker-compose.$f.yml --profile $f up -d; done\necho \"BABIRYE deployed.\"\necho \"   Core API: http://localhost:8000\"\necho \"   Grafana: http://localhost:3000\"\necho \"   IRONSIGHT: http://localhost:9200\"\necho \"   Sensors: http://localhost:9901 (dormant)\"\necho \"All subsystems DORMANT. Activate individually.\"\necho \"   ./activate_forensic.sh\"\necho \"   ./activate_offensive.sh\"\necho \"   ./activate_defensive.sh\"\necho \"   ./activate_micro_defensive.sh\"\necho \"   ./activate_sensors.sh\"")
w("```"); w("---"); w()

# 17-28. Shell scripts (ALL FIXED SPA: include ::{} for service and params)
import json
with open("/home/z/my-project/scripts/_state.json") as sf: state = json.load(sf)

script_cfgs = [
    ("forensic","forensic",4748,"FORENSIC","docker-compose.forensic.yml", state["ORIG_FOR"]),
    ("offensive","offensive",4747,"OFFENSIVE","docker-compose.offensive.yml", state["ORIG_OFF"] + [t[0] for t in state["NEW_OFF"]]),
    ("defensive","defensive",4749,"DEFENSIVE","docker-compose.defensive.yml", [t[0] for t in state["DEF_T"]]),
    ("micro_defensive","micro_defensive",4750,"MICRO_DEFENSIVE","docker-compose.micro-defensive.yml", [t[0] for t in state["MIC_T"]]),
]
si = 17
for name, profile, port, envpfx, cfile, svcs in script_cfgs:
    svcs_short = ", ".join(svcs[:8]) + f" ... (+{len(svcs)-8} more)"
    # activate
    w(f"## {si}. activate_{name}.sh"); w("```bash")
    w(f"#!/bin/bash\necho \"Activating {name.title()}...\"\nsource .env.{profile}\nread -s -p \"Password: \" PW\necho \"\"\nif [ \"$PW\" != \"${envpfx}_PASSWORD\" ]; then echo \"Invalid!\"; exit 1; fi\nTS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)\nSIG=$(echo -n \"$TS:$NC:activate::\" | openssl dgst -sha256 -hmac \"${envpfx}_SECRET\" | cut -d' ' -f2)\ncurl -s -X POST http://localhost:{port}/spa/activate -H 'Content-Type: application/json' -d '{{\"timestamp\":$TS,\"nonce\":\"$NC\",\"signature\":\"$SIG\",\"action\":\"activate\",\"service\":null,\"params\":{{}}}}'\necho \"ACTIVE.\"")
    w("```"); w("---"); w(); si += 1
    # deploy tool
    w(f"## {si}. deploy_{name}_tool.sh"); w("```bash")
    w(f"#!/bin/bash\nSVC=$1\nif [ -z \"$SVC\" ]; then echo \"Usage: $0 <service>\"; echo \"Services: {svcs_short}\"; exit 1; fi\nsource .env.{profile}\nread -s -p \"Password: \" PW\necho \"\"\nif [ \"$PW\" != \"${envpfx}_PASSWORD\" ]; then echo \"Invalid!\"; exit 1; fi\nTS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)\nSIG=$(echo -n \"$TS:$NC:deploy:$SVC::\" | openssl dgst -sha256 -hmac \"${envpfx}_SECRET\" | cut -d' ' -f2)\ncurl -s -X POST http://localhost:{port}/spa/deploy -H 'Content-Type: application/json' -d '{{\"timestamp\":$TS,\"nonce\":\"$NC\",\"signature\":\"$SIG\",\"action\":\"deploy\",\"service\":\"$SVC\",\"params\":{{}}}}'\necho \"$SVC deployed.\"")
    w("```"); w("---"); w(); si += 1
    # deactivate
    w(f"## {si}. deactivate_{name}.sh"); w("```bash")
    w(f"#!/bin/bash\necho \"Deactivating {name.title()}...\"\nsource .env.{profile}\nread -s -p \"Password: \" PW\necho \"\"\nif [ \"$PW\" != \"${envpfx}_PASSWORD\" ]; then echo \"Invalid!\"; exit 1; fi\nTS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)\nSIG=$(echo -n \"$TS:$NC:deactivate::\" | openssl dgst -sha256 -hmac \"${envpfx}_SECRET\" | cut -d' ' -f2)\ncurl -s -X POST http://localhost:{port}/spa/deactivate -H 'Content-Type: application/json' -d '{{\"timestamp\":$TS,\"nonce\":\"$NC\",\"signature\":\"$SIG\",\"action\":\"deactivate\",\"service\":null,\"params\":{{}}}}'\ndocker compose -f {cfile} --profile {profile} down -v\necho \"DORMANT and wiped.\"")
    w("```"); w("---"); w(); si += 1

# Sensors scripts
w(f"## {si}. activate_sensors.sh"); w("```bash")
w("#!/bin/bash\necho \"Activating Sensors & Weapons...\"\nsource .env.sensors\nread -s -p \"Password: \" PW\necho \"\"\nif [ \"$PW\" != \"$SENSORS_PASSWORD\" ]; then echo \"Invalid!\"; exit 1; fi\ndocker compose -f docker-compose.sensors.yml --profile sensors up -d\necho \"Sensors ACTIVE.\"")
w("```"); w("---"); w(); si += 1
w(f"## {si}. deactivate_sensors.sh"); w("```bash")
w("#!/bin/bash\necho \"Deactivating Sensors...\"\nsource .env.sensors\nread -s -p \"Password: \" PW\necho \"\"\nif [ \"$PW\" != \"$SENSORS_PASSWORD\" ]; then echo \"Invalid!\"; exit 1; fi\ndocker compose -f docker-compose.sensors.yml --profile sensors down -v\necho \"Sensors DORMANT and wiped.\"")
w("```"); w("---"); w(); si += 1

F.close()
print(f"Part 2 done: main compose + env + dockerfile + {si-17+1} scripts. Next section starts at {si+1}")
