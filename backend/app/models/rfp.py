import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text, Integer, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RFP(Base):
    __tablename__ = "rfps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum("draft", "in_progress", "submitted", "won", "lost", name="rfp_status"),
        default="draft",
    )
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    assigned_to: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    estimated_value: Mapped[float] = mapped_column(Float, nullable=True)
    submission_deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    tags: Mapped[str] = mapped_column(Text, nullable=True)  # comma-separated
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    files = relationship("RFPFile", back_populates="rfp", cascade="all, delete-orphan")
    extractions = relationship("AIExtraction", back_populates="rfp", cascade="all, delete-orphan")
    proposals = relationship("Proposal", back_populates="rfp", cascade="all, delete-orphan")
    comments = relationship("RFPComment", back_populates="rfp", cascade="all, delete-orphan")


class RFPFile(Base):
    __tablename__ = "rfp_files"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    file_type: Mapped[str] = mapped_column(
        SAEnum("rfp", "capability", "generated", name="file_type_enum"),
        nullable=False,
    )
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=True)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    rfp = relationship("RFP", back_populates="files")


class AIExtraction(Base):
    __tablename__ = "ai_extractions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    extraction_type: Mapped[str] = mapped_column(
        SAEnum("rfp_analysis", "capability_match", "gap_analysis", name="extraction_type_enum"),
        nullable=False,
    )
    raw_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    model_used: Mapped[str] = mapped_column(String(100), nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    rfp = relationship("RFP", back_populates="extractions")


class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    generation_params: Mapped[dict] = mapped_column(JSONB, nullable=True)
    generated_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    rfp = relationship("RFP", back_populates="proposals")


class RFPComment(Base):
    __tablename__ = "rfp_comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rfp_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rfps.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    rfp = relationship("RFP", back_populates="comments")
    user = relationship("User")
