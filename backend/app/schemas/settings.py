from typing import Optional

from pydantic import BaseModel


class SettingsResponse(BaseModel):
    company_name: Optional[str]
    logo_path: Optional[str]
    base_template_path: Optional[str]
    has_api_key: bool = False

    model_config = {"from_attributes": True}


class SettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    claude_api_key: Optional[str] = None
