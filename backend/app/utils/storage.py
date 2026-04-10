import os
import uuid
from pathlib import Path

from app.config import settings

STORAGE_ROOT = Path(settings.STORAGE_PATH)


def get_upload_path(file_type: str, rfp_id: str, filename: str) -> str:
    ext = Path(filename).suffix
    unique_name = f"{uuid.uuid4().hex}{ext}"
    if file_type == "rfp":
        rel_path = f"uploads/rfp/{rfp_id}/{unique_name}"
    elif file_type == "capability":
        rel_path = f"uploads/capability/{rfp_id}/{unique_name}"
    else:
        rel_path = f"generated/{rfp_id}/{unique_name}"
    full_path = STORAGE_ROOT / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    return rel_path


def save_file(rel_path: str, content: bytes) -> str:
    full_path = STORAGE_ROOT / rel_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_bytes(content)
    return str(full_path)


def read_file(rel_path: str) -> bytes:
    full_path = STORAGE_ROOT / rel_path
    return full_path.read_bytes()


def file_exists(rel_path: str) -> bool:
    return (STORAGE_ROOT / rel_path).exists()
