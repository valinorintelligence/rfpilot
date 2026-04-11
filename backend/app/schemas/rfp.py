from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID

from pydantic import BaseModel


class RFPCreate(BaseModel):
    title: str
    client_name: str
    department: Optional[str] = None
    estimated_value: Optional[float] = None
    submission_deadline: Optional[datetime] = None
    tags: Optional[str] = None


class RFPUpdate(BaseModel):
    title: Optional[str] = None
    client_name: Optional[str] = None
    department: Optional[str] = None
    assigned_to: Optional[UUID] = None
    estimated_value: Optional[float] = None
    submission_deadline: Optional[datetime] = None
    tags: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


class RFPFileResponse(BaseModel):
    id: UUID
    file_type: str
    original_filename: str
    storage_path: str
    file_size_bytes: int
    mime_type: Optional[str]
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class AIExtractionResponse(BaseModel):
    id: UUID
    extraction_type: str
    raw_json: Any
    model_used: Optional[str]
    tokens_used: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}


class ProposalResponse(BaseModel):
    id: UUID
    version: int
    storage_path: str
    generation_params: Optional[Any]
    generated_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_name: Optional[str] = None
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RFPResponse(BaseModel):
    id: UUID
    title: str
    client_name: str
    status: str
    department: Optional[str]
    assigned_to: Optional[UUID]
    created_by: UUID
    estimated_value: Optional[float]
    submission_deadline: Optional[datetime]
    tags: Optional[str]
    created_at: datetime
    updated_at: datetime
    files: List[RFPFileResponse] = []
    extractions: List[AIExtractionResponse] = []
    proposals: List[ProposalResponse] = []
    comments: List[CommentResponse] = []

    model_config = {"from_attributes": True}


class RFPListResponse(BaseModel):
    id: UUID
    title: str
    client_name: str
    status: str
    department: Optional[str]
    assigned_to: Optional[UUID]
    assigned_user_name: Optional[str] = None
    estimated_value: Optional[float]
    submission_deadline: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
