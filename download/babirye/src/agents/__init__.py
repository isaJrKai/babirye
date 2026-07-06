"""BABIRYE Agent System — Lazy-loaded singleton agent registry."""
from typing import Optional

# Lazy singleton registry — agents are created once on first access
_registry: dict = {}


def _lazy_import(agent_name: str):
    """Import and instantiate an agent lazily."""
    if agent_name in _registry:
        return _registry[agent_name]
    imports = {
        "orchestrator": (".orchestrator", "OrchestratorAgent"),
        "forensic": (".forensic_agent", "ForensicAgent"),
        "security": (".security_agent", "SecurityAgent"),
        "offensive": (".offensive_agent", "OffensiveAgent"),
        "defensive": (".defensive_agent", "DefensiveAgent"),
        "micro_defensive": (".micro_defensive_agent", "MicroDefensiveAgent"),
        "sensors": (".sensors_agent", "SensorsAgent"),
        "potentials": (".potentials_agent", "PotentialsAgent"),
        "vip": (".vip_agent", "VIPAgent"),
    }
    if agent_name not in imports:
        raise KeyError(f"Unknown agent: {agent_name}")
    module_path, class_name = imports[agent_name]
    from importlib import import_module
    mod = import_module(module_path, package=__name__)
    cls = getattr(mod, class_name)
    instance = cls()
    _registry[agent_name] = instance
    return instance


def get_agent(name: str):
    """Get or create a singleton agent by name."""
    return _lazy_import(name)


def get_orchestrator():
    """Get the orchestrator with all sub-agents pre-registered."""
    orch = _lazy_import("orchestrator")
    if not orch._agents:
        # Auto-register all specialized agents
        for agent_name in ["forensic", "security", "offensive", "defensive",
                           "micro_defensive", "sensors", "potentials", "vip"]:
            agent = _lazy_import(agent_name)
            orch.register_agent(agent)
    return orch


def list_registered_agents() -> list:
    """Return names of all registered agents."""
    return list(_registry.keys())
from .vip_agent import VIPAgent
