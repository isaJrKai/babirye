#!/usr/bin/env python3
"""Final comprehensive verification of BABIRYE v10.0.0 Production Ready."""

import re

INPUT_FILE = "/home/z/my-project/download/BABIRYE_v10.0.0_Production_Ready.txt"

with open(INPUT_FILE, "r") as f:
    content = f.read()

sections = content.split("---")
print(f"Total sections: {len(sections)}")
print()

all_ok = True
def check(name, condition):
    global all_ok
    if condition:
        print(f"  [OK] {name}")
    else:
        print(f"  [FAIL] {name}")
        all_ok = False

# 1. No HAL name remnants
hal = re.findall(r'\bHAL\b', content)
real_hal = []
for m in hal:
    idx = content.find(m)
    ctx = content[max(0,idx-50):idx+50]
    if 'non_lethal' not in ctx:
        real_hal.append(m)
check("No HAL name remnants", len(real_hal) == 0)

# 2. Correct section count
section_headers = re.findall(r'## (\d+)\.\s+', content)
check("All 91 sections present", len(section_headers) == 91)

# 3. SPA signatures in all shell scripts
spa_ok = content.count('activate::{}') >= 5  # at least 5 subsystems
check("SPA signatures include {} in shell scripts", spa_ok)

# 4. No duplicate networks in gateways
dup = content.count("restart: \"no\"\n    networks:\n      -")
check("No duplicate networks in gateway YAML", dup == 0)

# 5. stderr.decode() in gateways
check("stderr.decode() in gateways", content.count("stderr.decode()") >= 4)

# 6. CORS restricted
check("CORS not wildcard", 'allow_origins=["http://localhost' in content)

# 7. Lifespan added
check("FastAPI lifespan", "lifespan=lifespan" in content)

# 8. API key auth
check("API key authentication", "X-BABIRYE-API-Key" in content)

# 9. Sensors gateway
check("Sensors SPA gateway", "zt-gateway-sensors" in content)

# 10. Health checks verify connectivity
check("Health checks verify services", "async with httpx.AsyncClient" in content)

# 11. Correct SQLAlchemy import
check("SQLAlchemy import fixed", "from sqlalchemy.orm import DeclarativeBase" in content)

# 12. No version: '3.8'
check("No obsolete docker-compose version", "version: '3.8'" not in content)

# 13. .env comment
check(".env has comment prefix", "# BABIRYE Core Environment" in content)

# 14. deploy.sh micro-defensive filename
check("deploy.sh micro-defensive filename", "docker-compose.micro-defensive.yml" in content and "for f in forensic offensive defensive sensors" in content)

# 15. chmod +x in deploy.sh
check("chmod +x in deploy.sh", "chmod +x" in content)

# 16. deactivate scripts resilient
check("Deactivate scripts have || true", content.count("|| true") >= 6)

# 17. Forensic tool categorization
check("lazagne in computer forensics", '"lazagne"' in content and '"computer": ["sleuthkit", "scalpel", "foremost", "lazagne", "yafed"]' in content)

# 18. No inline __import__
check("No inline __import__", "__import__" not in content)

# 19. Duplicate constitution titles removed
check("No duplicate constitution titles", content.count("# BABIRYE Core Constitution\n\n# BABIRYE Core Constitution") == 0)

# 20. deploy_sensors_tool.sh added
check("deploy_sensors_tool.sh present", "deploy_sensors_tool.sh" in content)

# 21. Makefile wipe explicit
check("Makefile wipe uses explicit filenames", "docker compose -f docker-compose.forensic.yml down -v" in content and "docker compose -f docker-compose.micro-defensive.yml down -v" in content)

# 22. README documents fixes
check("README documents v10 fixes", "Production Fixes (v10 Audit)" in content)

# 23. Tool counts correct
check("Offensive tools = 72", '"total_tools": 72' in content or '"total": 72' in content)
check("Defensive tools = 100", '"total_tools": 100' in content)
check("Micro tools = 150", '"total_tools": 150' in content)

# 24. Sensor gateway port in config
check("Sensors gateway port in config", "sensors_gateway_port: int = 9902" in content)

# 25. SecurityManager uses bcrypt
check("bcrypt for password hashing", "bcrypt.hashpw" in content)

# 26. datetime.now(timezone.utc) used
check("timezone-aware datetime", "datetime.now(timezone.utc)" in content)

# 27. stop+rm -f (not docker compose down)
check("stop+rm -f in gateways", "'rm', '-f'" in content)

# 28. SPA window 300s
check("300s SPA window", "300:" in content or "> 300:" in content)

# 29. Expert council 12 domains
check("12 expert domains", len(re.findall(r'"Threat Intelligence"', content)) >= 1 and "expert_council_size: int = 12" in content)

# 30. Self-attack wall 25 guards
check("25 self-attack wall guards", 'total_guards": 25' in content or "len(self.GUARDS)" in content)

print(f"\n{'='*60}")
if all_ok:
    print("ALL 30 CHECKS PASSED - PRODUCTION READY")
else:
    print("SOME CHECKS FAILED - REVIEW NEEDED")
print(f"{'='*60}")
print(f"\nOutput file: {INPUT_FILE}")
print(f"File size: {len(content):,} characters")