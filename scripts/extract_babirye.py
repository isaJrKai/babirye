#!/usr/bin/env python3
"""
Extract all 90 files from the monolithic BABIRYE text into a proper project tree.
Reads the Phase 2 fixed file and creates each file in the correct location.
"""
import re
import os

SRC = "/home/z/my-project/download/BABIRYE_v10.0.0_Phase2_Fixed.txt"
BASE = "/home/z/my-project/download/babirye"

data = open(SRC).read()
lines = data.split('\n')

# Map section numbers to file paths
FILE_MAP = {
    1: "docker-compose.yml",
    2: "docker-compose.forensic.yml",
    3: "docker-compose.offensive.yml",
    4: "docker-compose.defensive.yml",
    5: "docker-compose.micro-defensive.yml",
    6: "docker-compose.sensors.yml",
    7: ".env",
    8: ".env.forensic",
    9: ".env.offensive",
    10: ".env.defensive",
    11: ".env.micro_defensive",
    12: ".env.sensors",
    13: "Dockerfile",
    14: "prometheus.yml",
    15: "requirements.txt",
    16: "deploy.sh",
    17: "activate_forensic.sh",
    18: "deploy_forensic_tool.sh",
    19: "deactivate_forensic.sh",
    20: "activate_offensive.sh",
    21: "deploy_offensive_tool.sh",
    22: "deactivate_offensive.sh",
    23: "activate_defensive.sh",
    24: "deploy_defensive_tool.sh",
    25: "deactivate_defensive.sh",
    26: "activate_micro_defensive.sh",
    27: "deploy_micro_defensive_tool.sh",
    28: "deactivate_micro_defensive.sh",
    29: "activate_sensors.sh",
    30: "deactivate_sensors.sh",
    31: "Makefile",
    32: "README.md",
    33: "constitution/BABIRYE_Constitution.md",
    34: "constitution/Forensic_Constitution.md",
    35: "constitution/Offensive_Constitution.md",
    36: "constitution/Defensive_Constitution.md",
    37: "constitution/Micro_Defensive_Constitution.md",
    38: "constitution/Sensors_Constitution.md",
    39: "docker-compose.vip.yml",
    40: ".env.vip",
    41: "activate_vip.sh",
    42: "deploy_vip_tool.sh",
    43: "deactivate_vip.sh",
    44: "src/__init__.py",
    45: "src/core/__init__.py",
    46: "src/core/config.py",
    47: "src/core/database.py",
    48: "src/core/logger.py",
    49: "src/core/security_manager.py",
    50: "src/core/expert_council.py",
    51: "src/agents/__init__.py",
    52: "src/agents/base.py",
    53: "src/agents/orchestrator.py",
    54: "src/agents/forensic_agent.py",
    55: "src/agents/security_agent.py",
    56: "src/agents/offensive_agent.py",
    57: "src/agents/defensive_agent.py",
    58: "src/agents/micro_defensive_agent.py",
    59: "src/agents/sensors_agent.py",
    60: "src/agents/potentials_agent.py",
    61: "src/agents/vip_agent.py",
    62: "src/forensic/__init__.py",
    63: "src/forensic/android.py",
    64: "src/forensic/ios.py",
    65: "src/forensic/computer.py",
    66: "src/forensic/network.py",
    67: "src/forensic/memory.py",
    68: "src/forensic/advanced.py",
    69: "src/defensive/__init__.py",
    70: "src/defensive/network_defense.py",
    71: "src/defensive/endpoint_defense.py",
    72: "src/defensive/application_defense.py",
    73: "src/defensive/identity_defense.py",
    74: "src/defensive/data_defense.py",
    75: "src/defensive/cloud_defense.py",
    76: "src/defensive/micro_defense.py",
    77: "src/defensive/self_protection.py",
    78: "src/defensive/potentials_engine.py",
    79: "src/api/__init__.py",
    80: "src/api/main.py",
    81: "src/api/routes/__init__.py",
    82: "src/api/routes/health.py",
    83: "src/api/routes/agents.py",
    84: "src/api/routes/forensic.py",
    85: "src/api/routes/offensive.py",
    86: "src/api/routes/defensive.py",
    87: "src/api/routes/micro_defensive.py",
    88: "src/api/routes/sensors.py",
    89: "src/api/routes/potentials.py",
    90: "src/api/routes/vip.py",
}

# Parse sections
sections = []
for i, line in enumerate(lines):
    m = re.match(r'^## (\d+)\.\s+(.+)$', line)
    if m:
        num = int(m.group(1))
        name = m.group(2).strip()
        sections.append({"num": num, "name": name, "line": i})

# Extract content for each section
extracted = 0
errors = []
for idx, sec in enumerate(sections):
    num = sec["num"]
    if num not in FILE_MAP:
        continue

    # Content starts after the header line
    content_start = sec["line"] + 1
    # Content ends at next section or ---
    if idx + 1 < len(sections):
        content_end = sections[idx + 1]["line"]
    else:
        content_end = len(lines)

    # Find the code fence
    content_lines = lines[content_start:content_end]
    code_lines = []
    in_fence = False
    for cl in content_lines:
        if cl.strip().startswith('```') and not in_fence:
            in_fence = True
            continue
        if cl.strip() == '```' and in_fence:
            break
        if in_fence:
            code_lines.append(cl)

    content = '\n'.join(code_lines)
    filepath = os.path.join(BASE, FILE_MAP[num])

    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, 'w') as f:
        f.write(content)
        if content and not content.endswith('\n'):
            f.write('\n')

    extracted += 1

print(f"Extracted {extracted} files to {BASE}/")
print(f"Files: {extracted}/90")

# Make shell scripts executable
import stat
for root, dirs, files in os.walk(BASE):
    for fname in files:
        if fname.endswith('.sh'):
            fpath = os.path.join(root, fname)
            os.chmod(fpath, 0o755)
            print(f"  chmod +x {os.path.relpath(fpath, BASE)}")

# List the tree
print(f"\nProject structure:")
for root, dirs, files in os.walk(BASE):
    level = root.replace(BASE, '').count(os.sep)
    indent = '  ' * level
    print(f"{indent}{os.path.basename(root)}/")
    subindent = '  ' * (level + 1)
    for fname in sorted(files):
        fpath = os.path.join(root, fname)
        size = os.path.getsize(fpath)
        print(f"{subindent}{fname} ({size:,} bytes)")