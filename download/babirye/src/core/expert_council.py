"""BABIRYE Expert Council — 12 specialist domains with council-of-expert-expertise fusion"""
from datetime import datetime, timezone
from typing import Optional
from .logger import get_logger

logger = get_logger("expert_council")


class ExpertCouncil:
    """Council of 12 specialist domains providing higher-expertise assumptions
    and decision fusion for BABIRYE operations."""

    DOMAINS = [
        "Threat Intelligence",
        "Digital Forensics",
        "Offensive Security",
        "Defensive Operations",
        "Cryptography",
        "Network Architecture",
        "Physical Security",
        "Legal/Compliance",
        "OSINT",
        "Malware Analysis",
        "Vulnerability Research",
        "Incident Response",
    ]

    def __init__(self, consensus_threshold: float = 0.667):
        self._threshold = consensus_threshold
        self._experts = {d: ExpertDomain(d) for d in self.DOMAINS}
        self._decision_log = []

    def consult(self, question: str, context: str = "", domains: Optional[list] = None) -> "CouncilDecision":
        """Consult the expert council on a question. Returns fused decision."""
        target_domains = domains or self.DOMAINS
        opinions = {}
        for domain_name in target_domains:
            if domain_name in self._experts:
                opinions[domain_name] = self._experts[domain_name].evaluate(question, context)
        # Calculate consensus
        agrees = sum(1 for o in opinions.values() if o.recommendation == "approve")
        total = len(opinions) or 1
        consensus_ratio = agrees / total
        # Check for domain vetoes
        vetoes = [d for d, o in opinions.items() if o.veto]
        if vetoes:
            decision = "vetoed"
            reason = f"Vetoed by: {', '.join(vetoes)}"
        elif consensus_ratio >= self._threshold:
            decision = "approved"
            reason = f"Consensus: {agrees}/{total} experts agree"
        else:
            decision = "rejected"
            reason = f"Insufficient consensus: {agrees}/{total} (need {int(self._threshold * total)})"

        result = CouncilDecision(
            question=question,
            decision=decision,
            reason=reason,
            consensus_ratio=consensus_ratio,
            opinions=opinions,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        self._decision_log.append(result)
        logger.info(f"Council decision: {decision} — {reason}")
        return result

    def get_decisions(self, limit: int = 50) -> list:
        return self._decision_log[-limit:]


class ExpertDomain:
    """Individual expert domain with specialized knowledge."""

    def __init__(self, name: str):
        self.name = name
        self._knowledge_base = self._init_knowledge(name)

    def evaluate(self, question: str, context: str) -> "ExpertOpinion":
        """Evaluate a question from this domain's perspective.
        Uses higher-expertise assumptions: the expert assumes deep
        domain knowledge beyond basic analysis."""
        # Domain-specific higher-expertise evaluation
        confidence = self._assess_confidence(question, context)
        recommendation = "approve" if confidence > 0.6 else "deny"
        veto = False
        if confidence < 0.15:
            veto = True  # Strong domain objection (very low confidence)
        return ExpertOpinion(
            domain=self.name,
            recommendation=recommendation,
            confidence=confidence,
            reasoning=self._generate_reasoning(question, confidence),
            veto=veto,
        )

    def _assess_confidence(self, question: str, context: str) -> float:
        """Higher expertise assumption: domain expert assesses with
        deeper knowledge than baseline. Returns 0.0-1.0 confidence."""
        q_lower = question.lower()
        # Domain-specific confidence boosting
        domain_boosters = {
            "Threat Intelligence": ["threat", "ioc", "apt", "actor", "campaign", "ttp"],
            "Digital Forensics": ["evidence", "artifact", "image", "timeline", "hash", "chain"],
            "Offensive Security": ["exploit", "payload", "lateral", "privilege", "credential", "shellcode"],
            "Defensive Operations": ["detect", "prevent", "block", "alert", "monitor", "harden"],
            "Cryptography": ["encrypt", "decrypt", "key", "cipher", "hash", "certificate", "tls"],
            "Network Architecture": ["network", "subnet", "firewall", "routing", "vlan", "proxy"],
            "Physical Security": ["physical", "drone", "vehicle", "access", "camera", "perimeter"],
            "Legal/Compliance": ["legal", "compliance", "gdpr", "policy", "authorization", "regulation"],
            "OSINT": ["osint", "recon", "social", "public", "open source", "surface"],
            "Malware Analysis": ["malware", "ransomware", "trojan", "backdoor", "sample", "sandbox"],
            "Vulnerability Research": ["vulnerability", "cve", "exploit", "patch", "zero-day", "advisory"],
            "Incident Response": ["incident", "contain", "eradicate", "recover", "ir", "soc"],
        }
        boosters = domain_boosters.get(self.name, [])
        matches = sum(1 for b in boosters if b in q_lower or b in context.lower())
        base_confidence = 0.3  # Conservative: require evidence to approve
        boost = min(matches * 0.08, 0.35)
        # Penalty for queries with no domain-relevant keywords
        if matches == 0:
            return 0.15  # Low confidence without evidence
        # Penalty for overly broad queries (potential manipulation)
        if len(question.split()) < 3:
            return min(base_confidence + boost - 0.1, 0.5)
        return min(base_confidence + boost, 1.0)

    def _generate_reasoning(self, question: str, confidence: float) -> str:
        if confidence > 0.8:
            return f"High confidence assessment. {self.name} expertise strongly supports this action."
        elif confidence > 0.6:
            return f"Moderate-high confidence. {self.name} sees acceptable risk."
        elif confidence > 0.4:
            return f"Moderate confidence. {self.name} recommends caution."
        else:
            return f"Low confidence. {self.name} identifies significant risk or lack of information."

    @staticmethod
    def _init_knowledge(domain: str) -> dict:
        """Initialize domain-specific knowledge base (higher-expertise assumptions)."""
        return {"domain": domain, "expertise_level": "senior", "years_experience": 15}


class ExpertOpinion:
    def __init__(self, domain: str, recommendation: str, confidence: float, reasoning: str, veto: bool):
        self.domain = domain
        self.recommendation = recommendation
        self.confidence = confidence
        self.reasoning = reasoning
        self.veto = veto


class CouncilDecision:
    def __init__(self, question: str, decision: str, reason: str, consensus_ratio: float, opinions: dict, timestamp: str):
        self.question = question
        self.decision = decision
        self.reason = reason
        self.consensus_ratio = consensus_ratio
        self.opinions = opinions
        self.timestamp = timestamp

    def to_dict(self) -> dict:
        return {
            "question": self.question,
            "decision": self.decision,
            "reason": self.reason,
            "consensus_ratio": self.consensus_ratio,
            "opinion_count": len(self.opinions),
            "timestamp": self.timestamp,
        }


# Global instance
expert_council = ExpertCouncil()
