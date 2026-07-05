#!/usr/bin/env python3
"""Part 4b: VIP docker-compose, VIP scripts, docker-compose.vip.yml"""
OUT = "/home/z/my-project/upload/Pasted Content_1782740004460.txt"
F = open(OUT, "a", encoding="utf-8")
def w(s=""): F.write(s + "\n")

# Read current line count to determine file index
import subprocess
result = subprocess.run(['wc', '-l', OUT], capture_output=True, text=True)
lines = int(result.stdout.strip().split()[0])
# Count existing ## markers to find current si
result2 = subprocess.run(['grep', '-c', '^## [0-9]', OUT], capture_output=True, text=True)
si = int(result2.stdout.strip()) + 1

# ═══ VIP DOCKER-COMPOSE ═══
w(f"## {si}. docker-compose.vip.yml")
w("```yaml")
w("""version: '3.8'

services:
  zt-gateway-vip:
    image: alpine:latest
    container_name: babirye-zt-gateway-vip
    restart: "no"
    networks:
      - vip-net
    command: >
      sh -c "
        apk add --no-cache python3 py3-pip curl bash jq &&
        pip3 install fastapi uvicorn pydantic &&
        cat > /app/gateway.py << 'GWEOF'
        import os, hmac, hashlib, time, json, subprocess
        from fastapi import FastAPI, HTTPException
        from pydantic import BaseModel
        import uvicorn

        SECRET = os.getenv('VIP_SECRET', 'CHANGE_ME')
        PASSWORD = os.getenv('VIP_PASSWORD', 'CHANGE_ME')
        ACTIVE = False
        DEPLOYED = []
        app = FastAPI()

        class SPAPacket(BaseModel):
            timestamp: int
            nonce: str
            signature: str
            action: str
            service: str = None
            params: dict = {}

        def verify_spa(p):
            if abs(time.time() - p.timestamp) > 300:
                return False
            msg = f'{p.timestamp}:{p.nonce}:{p.action}:{p.service or ""}:{json.dumps(p.params)}'
            expected = hmac.new(SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
            return hmac.compare_digest(expected, p.signature)

        @app.post('/spa/activate')
        async def activate(p: SPAPacket):
            global ACTIVE
            if not verify_spa(p):
                raise HTTPException(401, 'Invalid SPA')
            ACTIVE = True
            return {'status': 'activated'}

        @app.post('/spa/deactivate')
        async def deactivate(p: SPAPacket):
            global ACTIVE, DEPLOYED
            if not verify_spa(p):
                raise HTTPException(401, 'Invalid SPA')
            ACTIVE = False
            for s in DEPLOYED:
                subprocess.run(['docker', 'compose', '-f', '/app/docker-compose.vip.yml', '--profile', 'vip', 'stop', s])
                subprocess.run(['docker', 'compose', '-f', '/app/docker-compose.vip.yml', '--profile', 'vip', 'rm', '-f', s])
            DEPLOYED = []
            return {'status': 'deactivated'}

        @app.post('/spa/deploy')
        async def deploy(p: SPAPacket):
            if not verify_spa(p):
                raise HTTPException(401, 'Invalid SPA')
            if not ACTIVE:
                raise HTTPException(403, 'VIP arsenal dormant')
            if not p.service:
                raise HTTPException(400, 'Service required')
            result = subprocess.run(['docker', 'compose', '-f', '/app/docker-compose.vip.yml', '--profile', 'vip', 'up', '-d', p.service], capture_output=True)
            if result.returncode == 0:
                DEPLOYED.append(p.service)
                return {'status': 'deployed', 'service': p.service}
            return {'status': 'failed', 'error': result.stderr.decode()}

        @app.get('/spa/status')
        async def status():
            return {'active': ACTIVE, 'deployed': DEPLOYED}

        @app.get('/spa/services')
        async def services():
            return {'services': ["tello-drone-pilot","deep-drone-control","meshtastic-swarm","vehicle-mpc-control","vehicle-slam","vehicle-kalman","garmin-ble","pico-watch-ble","biometric-access","lpr-gate","cctv-ai","vip-surveillance"]}

        if __name__ == '__main__':
            uvicorn.run(app, host='0.0.0.0', port=4751)
        GWEOF
        python3 /app/gateway.py
      "
    environment:
      - VIP_SECRET=${VIP_SECRET:-CHANGE_ME}
      - VIP_PASSWORD=${VIP_PASSWORD:-CHANGE_ME}
    ports:
      - "4751:4751"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./docker-compose.vip.yml:/app/docker-compose.vip.yml
    deploy:
      replicas: 0
    profiles:
      - vip
    cap_add:
      - NET_ADMIN
    networks:
      - vip-net

  tello-drone-pilot:
    image: python:3.11-slim
    container_name: babirye-tello-drone-pilot
    restart: "no"
    command: >
      sh -c "pip install djitellopy opencv-python-headless numpy &&
        echo 'BABIRYE DJI Tello Drone Pilot ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  deep-drone-control:
    image: python:3.11-slim
    container_name: babirye-deep-drone-control
    restart: "no"
    command: >
      sh -c "pip install numpy scipy pyyaml &&
        echo 'BABIRYE Deep Drone Control ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  meshtastic-swarm:
    image: python:3.11-slim
    container_name: babirye-meshtastic-swarm
    restart: "no"
    command: >
      sh -c "pip install meshtastic serial &&
        echo 'BABIRYE Meshtastic Swarm Controller ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  vehicle-mpc-control:
    image: python:3.11-slim
    container_name: babirye-vehicle-mpc-control
    restart: "no"
    command: >
      sh -c "pip install numpy scipy casadi &&
        echo 'BABIRYE Vehicle MPC Controller ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  vehicle-slam:
    image: python:3.11-slim
    container_name: babirye-vehicle-slam
    restart: "no"
    command: >
      sh -c "pip install numpy opencv-python-headless &&
        echo 'BABIRYE Vehicle SLAM Navigation ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  vehicle-kalman:
    image: python:3.11-slim
    container_name: babirye-vehicle-kalman
    restart: "no"
    command: >
      sh -c "pip install numpy scipy filterpy &&
        echo 'BABIRYE Vehicle Kalman Filter ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  garmin-ble:
    image: python:3.11-slim
    container_name: babirye-garmin-ble
    restart: "no"
    command: >
      sh -c "pip install bleak asyncio-mqtt &&
        echo 'BABIRYE Garmin BLE Integration ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  pico-watch-ble:
    image: python:3.11-slim
    container_name: babirye-pico-watch-ble
    restart: "no"
    command: >
      sh -c "pip install bleak &&
        echo 'BABIRYE Pico Watch BLE ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  biometric-access:
    image: python:3.11-slim
    container_name: babirye-biometric-access
    restart: "no"
    command: >
      sh -c "pip install opencv-python-headless numpy &&
        echo 'BABIRYE Biometric Access Control ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  lpr-gate:
    image: python:3.11-slim
    container_name: babirye-lpr-gate
    restart: "no"
    command: >
      sh -c "pip install opencv-python-headless numpy &&
        echo 'BABIRYE LPR Gate Controller ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  cctv-ai:
    image: python:3.11-slim
    container_name: babirye-cctv-ai
    restart: "no"
    command: >
      sh -c "pip install opencv-python-headless numpy &&
        echo 'BABIRYE CCTV AI Surveillance ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

  vip-surveillance:
    image: python:3.11-slim
    container_name: babirye-vip-surveillance
    restart: "no"
    command: >
      sh -c "pip install httpx numpy &&
        echo 'BABIRYE VIP Surveillance Orchestrator ready' && tail -f /dev/null"
    deploy:
      replicas: 0
    profiles:
      - vip
    networks:
      - vip-net

networks:
  vip-net:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.35.0.0/16
""")
w("```")
w("---"); w()
si += 1

# ═══ VIP .env ═══
w(f"## {si}. .env.vip")
w("```bash")
w("VIP_PASSWORD=CHANGE_ME_STRONG\nVIP_SECRET=CHANGE_ME_RANDOM")
w("```")
w("---"); w()
si += 1

# ═══ VIP activate/deploy/deactivate scripts ═══
w(f"## {si}. activate_vip.sh")
w("```bash")
w("""#!/bin/bash
echo "Activating VIP Protection..."
source .env.vip
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$VIP_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:activate::" | openssl dgst -sha256 -hmac "$VIP_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4751/spa/activate -H 'Content-Type: application/json' -d '{"timestamp":'$TS',"nonce":"'$NC'","signature":"'$SIG'","action":"activate","service":null,"params":{}}'
echo "VIP Protection ACTIVE."
""")
w("```")
w("---"); w()
si += 1

w(f"## {si}. deploy_vip_tool.sh")
w("```bash")
w("""#!/bin/bash
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
SIG=$(echo -n "$TS:$NC:deploy:$SVC::" | openssl dgst -sha256 -hmac "$VIP_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4751/spa/deploy -H 'Content-Type: application/json' -d '{"timestamp":'$TS',"nonce":"'$NC'","signature":"'$SIG'","action":"deploy","service":"'$SVC'","params":{}}'
echo "$SVC deployed."
""")
w("```")
w("---"); w()
si += 1

w(f"## {si}. deactivate_vip.sh")
w("```bash")
w("""#!/bin/bash
echo "Deactivating VIP Protection..."
source .env.vip
read -s -p "Password: " PW
echo ""
if [ "$PW" != "$VIP_PASSWORD" ]; then echo "Invalid!"; exit 1; fi
TS=$(date +%s); NC=$(head -c 16 /dev/urandom | xxd -p)
SIG=$(echo -n "$TS:$NC:deactivate::" | openssl dgst -sha256 -hmac "$VIP_SECRET" | cut -d' ' -f2)
curl -s -X POST http://localhost:4751/spa/deactivate -H 'Content-Type: application/json' -d '{"timestamp":'$TS',"nonce":"'$NC'","signature":"'$SIG'","action":"deactivate","service":null,"params":{}}'
docker compose -f docker-compose.vip.yml --profile vip down -v
echo "VIP Protection DORMANT and wiped."
""")
w("```")
w("---"); w()
si += 1

F.close()
print(f"Part 4b done. Next file index: {si}")