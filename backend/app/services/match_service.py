import logging
from pathlib import Path

from app.config import settings
from app.services.extraction_service import extract_text
from app.services.ai_service import capability_match

logger = logging.getLogger(__name__)

STORAGE_ROOT = Path(settings.STORAGE_PATH)


def run_capability_match(rfp_file_path: str, capability_file_path: str) -> dict:
    """Run Engine B capability match between RFP and capability documents."""
    rfp_full_path = str(STORAGE_ROOT / rfp_file_path)
    cap_full_path = str(STORAGE_ROOT / capability_file_path)

    rfp_text = extract_text(rfp_full_path)
    capability_text = extract_text(cap_full_path)

    if not rfp_text:
        return {"error": "Could not extract text from RFP document"}
    if not capability_text:
        return {"error": "Could not extract text from capability document"}

    return capability_match(rfp_text, capability_text)
