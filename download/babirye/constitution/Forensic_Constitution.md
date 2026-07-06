# Forensic Subsystem Constitution

# Forensic Subsystem Constitution

## Authorization
- All forensic acquisitions require explicit consent or documented legal authority
- Tools are dormant by default; activated only via SPA with HMAC-SHA256 authentication
- Every acquisition logged in tamper-evident blockchain-hash audit chain
- No forensic action without authenticated, time-stamped authorization record

## Evidence Handling
- Chain-of-custody maintained via SHA-256 hash audit logs
- Data extracted stored in AES-256 encrypted volumes
- Hash-verified integrity (SHA-256 + SHA-512 dual verification) for all forensic images
- Evidence write-once: no modification after acquisition without supervisor override
- All evidence transfers logged with checksums

## Scope
- Android forensics: Andriller, LockKnife, IBEX
- iOS forensics: MVT, custom extraction pipeline
- Computer forensics: Volatility, SleuthKit, Scalpel, Foremost, Log2Timeline
- Network forensics: full PCAP analysis, DNS reconstruction, TLS decryption
- Memory forensics: live RAM analysis, hibernation files, crash dumps
- Advanced: timeline reconstruction, registry analysis, artifact carving

## Destruction
- All forensic data cryptographically wiped on subsystem deactivation
- Wipe verification with multi-pass validation
- Destruction certificate generated and logged

## Network Isolation
- Forensic network fully isolated on 172.31.0.0/16 (internal bridge, no external access)
- Gateway on port 4748 handles SPA verification and individual tool deployment
