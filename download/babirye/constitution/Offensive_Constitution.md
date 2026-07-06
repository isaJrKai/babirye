# Offensive Subsystem Constitution

# Offensive Subsystem Constitution

## Authorization
- Offensive tools dormant by default; SPA password required for activation
- All operations require documented authorization (scope, duration, targets)
- No offensive action without verified, time-stamped authorization
- Authorization expires after defined engagement window

## Rules of Engagement
- Scope defined and approved before any engagement begins
- No lateral movement beyond authorized scope boundaries
- All actions logged with full audit trail (timestamp, action, target, result)
- Pivot points require additional authorization
- No persistence mechanisms beyond engagement duration without approval

## Tool Categories (72 total)
- Original 22: RedAmoN, PentestAI, Empire, Sliver, Covenant, Mythic, Freeze, ShhhLoader, Donut, Pezor, ScareCrow, Crimson-Wisp, Cable, PowerSploit, OffSec-Tools, AutoPentest, Legion, RedPi, zer0dayslater, Chimera-C2, Agent-P2P, GhostHID
- New 50: Metasploit, Nmap, Nikto, SQLMap, Hydra, John, Aircrack-ng, Wifite, Responder, Mimikatz, BloodHound, CrackMapExec, Ligolo-ng, Chisel, DNSCat2, Nishang, Inveigh, BetterCAP, Ettercap, TShark, Impacket, Rubeus, Gobuster, Feroxbuster, WFuzz, Arjun, Subfinder, Amass, HTTPX, Nuclei, Auto-Recon, LinPEAS, WinPEAS, Linux-Exploit-Suggester, KeePwn, Laudanum, PHPSploit, Commix, XSStrike, Tplmap, WhatWeb, WPScan, Joomscan, Droopescan, Recon-ng, SpiderFoot, theHarvester, Maltego, Fierce

## Containment
- Offensive network fully isolated on 172.30.0.0/16 (internal bridge)
- No outbound connections from offensive containers
- Gateway on port 4747 with SPA verification
