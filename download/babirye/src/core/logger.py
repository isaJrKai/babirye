import logging
import sys
from datetime import datetime, timezone


class BABIRYEFormatter(logging.Formatter):
    def format(self, record):
        record.asctime = datetime.now(timezone.utc).isoformat()
        return super().format(record)


def get_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(f"babirye.{name}")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(BABIRYEFormatter(
            '%(asctime)s | %(name)s | %(levelname)s | %(message)s'
        ))
        logger.addHandler(handler)
        logger.setLevel(level)
    return logger
