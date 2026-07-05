---
Task ID: 1
Agent: main
Task: BABIRYE Phase 1 — Infrastructure & Docker Configuration Fixes

Work Log:
- Audited entire 90-section monolithic codebase (249KB, 8132 lines)
- Identified 14 infrastructure-level production issues
- Built and executed phase1_infrastructure_fix.py to apply all fixes
- Fixed a regex bug in shell script pipefail injection (first pass corrupted deploy.sh)
- Re-ran with corrected regex — all 18 scripts now have set -euo pipefail
- Final verification: 22/22 checks PASS, 90 sections intact, 0 HAL remnants

Stage Summary:
- Output: /home/z/my-project/download/BABIRYE_v10.0.0_Phase1_Fixed.txt (252KB, 8209 lines)
- 14 fixes applied: .env header, SPA HMAC alignment, compose version removal, secret hardening, Dockerfile non-root + healthcheck, CORS restriction, lifespan events, real health probes, shell script hardening, docker.sock documentation, gateway HMAC alignment, management network, deploy validation, config secret removal
- All changes are backward-compatible (structure preserved, 90 sections contiguous)