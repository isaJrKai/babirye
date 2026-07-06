from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Core Database
    database_url: str = 'postgresql://babirye:babirye_password@postgres:5432/babirye'

    # Vector Store
    qdrant_url: str = 'http://qdrant:6333'
    qdrant_collection: str = 'babirye_memories'

    # Graph Database
    neo4j_uri: str = 'bolt://neo4j:7687'
    neo4j_user: str = 'neo4j'
    neo4j_password: str = 'babirye_password'

    # Search
    meilisearch_url: str = 'http://meilisearch:7700'
    meilisearch_api_key: str = 'babirye_master_key'

    # Messaging & Workflow
    nats_url: str = 'nats://nats:4222'
    temporal_url: str = 'temporal:7233'

    # Intelligence Services
    omniroute_url: str = 'http://omniroute:8088'

    # Authentication (MUST be set via .env — no insecure defaults)
    babirye_password: str = ''
    babirye_jwt_secret: str = ''
    grafana_password: str = ''

    # CORS
    babirye_cors_origins: str = 'http://localhost:3000,http://localhost:8000'

    # Subsystem Gateway Ports
    forensic_gateway_port: int = 4748
    offensive_gateway_port: int = 4747
    defensive_gateway_port: int = 4749
    micro_defensive_gateway_port: int = 4750
    sensors_port: int = 9901
    vip_gateway_port: int = 4751

    # Subsystem Passwords (for SPA shell scripts)
    forensic_password: str = 'CHANGE_ME'
    offensive_password: str = 'CHANGE_ME'
    defensive_password: str = 'CHANGE_ME'
    micro_defensive_password: str = 'CHANGE_ME'
    sensors_password: str = 'CHANGE_ME'
    vip_password: str = 'CHANGE_ME'

    # Expert Council
    expert_council_size: int = 12
    council_consensus_threshold: float = 0.667  # 8/12

    class Config:
        env_file = '.env'


settings = Settings()
