import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.rfp import RFP, RFPFile, AIExtraction, Proposal, RFPComment
from app.models.audit import AuditLog
from app.schemas.rfp import (
    RFPCreate, RFPUpdate, RFPResponse, RFPListResponse,
    RFPFileResponse, AIExtractionResponse, ProposalResponse,
    CommentCreate, CommentResponse, StatusUpdate,
)
from app.utils.security import get_current_user
from app.utils.storage import get_upload_path, save_file, STORAGE_ROOT
from app.services.extraction_service import extract_text
from app.services.ai_service import analyze_rfp, capability_match
from app.services.docx_service import generate_proposal

router = APIRouter(prefix="/rfps", tags=["RFPs"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".txt"}
MAX_FILE_SIZE = settings.MAX_UPLOAD_MB * 1024 * 1024


def _log_audit(db: Session, user_id, action: str, resource_type: str, resource_id: str = None):
    log = AuditLog(
        user_id=user_id, action=action,
        resource_type=resource_type, resource_id=resource_id,
    )
    db.add(log)


@router.get("", response_model=list[RFPListResponse])
def list_rfps(
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(RFP)
    if status:
        query = query.filter(RFP.status == status)
    if department:
        query = query.filter(RFP.department == department)
    if search:
        query = query.filter(
            (RFP.title.ilike(f"%{search}%")) | (RFP.client_name.ilike(f"%{search}%"))
        )
    rfps = query.order_by(RFP.created_at.desc()).offset(skip).limit(limit).all()

    results = []
    for rfp in rfps:
        data = RFPListResponse.model_validate(rfp)
        if rfp.assigned_to:
            user = db.query(User).filter(User.id == rfp.assigned_to).first()
            if user:
                data.assigned_user_name = user.full_name
        results.append(data)
    return results


@router.post("", response_model=RFPResponse, status_code=201)
def create_rfp(
    body: RFPCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = RFP(
        title=body.title,
        client_name=body.client_name,
        department=body.department,
        estimated_value=body.estimated_value,
        submission_deadline=body.submission_deadline,
        tags=body.tags,
        created_by=current_user.id,
        assigned_to=current_user.id,
    )
    db.add(rfp)
    _log_audit(db, current_user.id, "create", "rfp", str(rfp.id))
    db.commit()
    db.refresh(rfp)
    return rfp


@router.get("/{rfp_id}", response_model=RFPResponse)
def get_rfp(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    response = RFPResponse.model_validate(rfp)
    # Populate comment user names
    comments_with_names = []
    for comment in rfp.comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        c = CommentResponse.model_validate(comment)
        c.user_name = user.full_name if user else "Unknown"
        comments_with_names.append(c)
    response.comments = comments_with_names
    return response


@router.put("/{rfp_id}", response_model=RFPResponse)
def update_rfp(
    rfp_id: uuid.UUID,
    body: RFPUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rfp, key, value)

    _log_audit(db, current_user.id, "update", "rfp", str(rfp.id))
    db.commit()
    db.refresh(rfp)
    return rfp


@router.patch("/{rfp_id}/status", response_model=RFPResponse)
def update_status(
    rfp_id: uuid.UUID,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    valid_statuses = {"draft", "in_progress", "submitted", "won", "lost"}
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    rfp.status = body.status
    _log_audit(db, current_user.id, "status_change", "rfp", str(rfp.id))
    db.commit()
    db.refresh(rfp)
    return rfp


@router.post("/{rfp_id}/upload/rfp", response_model=RFPFileResponse)
async def upload_rfp_document(
    rfp_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _upload_file(rfp_id, file, "rfp", db, current_user)


@router.post("/{rfp_id}/upload/capability", response_model=RFPFileResponse)
async def upload_capability_document(
    rfp_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _upload_file(rfp_id, file, "capability", db, current_user)


async def _upload_file(
    rfp_id: uuid.UUID, file: UploadFile, file_type: str,
    db: Session, current_user: User,
) -> RFPFileResponse:
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    rel_path = get_upload_path(file_type, str(rfp_id), file.filename)
    save_file(rel_path, content)

    rfp_file = RFPFile(
        rfp_id=rfp_id,
        file_type=file_type,
        original_filename=file.filename,
        storage_path=rel_path,
        file_size_bytes=len(content),
        mime_type=file.content_type,
        uploaded_by=current_user.id,
    )
    db.add(rfp_file)
    _log_audit(db, current_user.id, "upload", "rfp_file", str(rfp_file.id))
    db.commit()
    db.refresh(rfp_file)
    return rfp_file


@router.post("/{rfp_id}/analyze", response_model=AIExtractionResponse)
def analyze_rfp_endpoint(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    # Find RFP document file
    rfp_file = db.query(RFPFile).filter(
        RFPFile.rfp_id == rfp_id, RFPFile.file_type == "rfp"
    ).first()
    if not rfp_file:
        raise HTTPException(status_code=400, detail="No RFP document uploaded")

    full_path = str(STORAGE_ROOT / rfp_file.storage_path)
    text = extract_text(full_path, rfp_file.mime_type or "")
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from document")

    result = analyze_rfp(text)

    extraction = AIExtraction(
        rfp_id=rfp_id,
        extraction_type="rfp_analysis",
        raw_json=result["data"],
        model_used=result["model"],
        tokens_used=result["tokens"],
    )
    db.add(extraction)

    if rfp.status == "draft":
        rfp.status = "in_progress"

    _log_audit(db, current_user.id, "analyze", "rfp", str(rfp.id))
    db.commit()
    db.refresh(extraction)
    return extraction


@router.post("/{rfp_id}/match", response_model=AIExtractionResponse)
def match_capability_endpoint(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    rfp_file = db.query(RFPFile).filter(
        RFPFile.rfp_id == rfp_id, RFPFile.file_type == "rfp"
    ).first()
    cap_file = db.query(RFPFile).filter(
        RFPFile.rfp_id == rfp_id, RFPFile.file_type == "capability"
    ).first()

    if not rfp_file:
        raise HTTPException(status_code=400, detail="No RFP document uploaded")
    if not cap_file:
        raise HTTPException(status_code=400, detail="No capability document uploaded")

    rfp_text = extract_text(str(STORAGE_ROOT / rfp_file.storage_path), rfp_file.mime_type or "")
    cap_text = extract_text(str(STORAGE_ROOT / cap_file.storage_path), cap_file.mime_type or "")

    if not rfp_text or not cap_text:
        raise HTTPException(status_code=400, detail="Could not extract text from documents")

    result = capability_match(rfp_text, cap_text)

    extraction = AIExtraction(
        rfp_id=rfp_id,
        extraction_type="capability_match",
        raw_json=result["data"],
        model_used=result["model"],
        tokens_used=result["tokens"],
    )
    db.add(extraction)
    _log_audit(db, current_user.id, "match", "rfp", str(rfp.id))
    db.commit()
    db.refresh(extraction)
    return extraction


@router.get("/{rfp_id}/extractions", response_model=list[AIExtractionResponse])
def get_extractions(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(AIExtraction).filter(AIExtraction.rfp_id == rfp_id).order_by(
        AIExtraction.created_at.desc()
    ).all()


@router.post("/{rfp_id}/generate", response_model=ProposalResponse)
def generate_proposal_endpoint(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    # Get latest extraction
    extraction = db.query(AIExtraction).filter(
        AIExtraction.rfp_id == rfp_id,
        AIExtraction.extraction_type == "rfp_analysis",
    ).order_by(AIExtraction.created_at.desc()).first()

    if not extraction:
        raise HTTPException(status_code=400, detail="Run RFP analysis first")

    # Get capability match if available
    match_extraction = db.query(AIExtraction).filter(
        AIExtraction.rfp_id == rfp_id,
        AIExtraction.extraction_type == "capability_match",
    ).order_by(AIExtraction.created_at.desc()).first()

    # Get next version number
    latest_proposal = db.query(Proposal).filter(
        Proposal.rfp_id == rfp_id
    ).order_by(Proposal.version.desc()).first()
    next_version = (latest_proposal.version + 1) if latest_proposal else 1

    rfp_data = {
        "id": str(rfp.id),
        "title": rfp.title,
        "client_name": rfp.client_name,
        "next_version": next_version,
    }

    # Get company name from settings
    from app.models.settings import AppSettings
    app_settings = db.query(AppSettings).first()
    company_name = app_settings.company_name if app_settings else "Your Company"
    template_path = app_settings.base_template_path if app_settings else None

    rel_path = generate_proposal(
        rfp_data=rfp_data,
        extraction_data=extraction.raw_json,
        match_data=match_extraction.raw_json if match_extraction else None,
        company_name=company_name,
        template_path=template_path,
    )

    proposal = Proposal(
        rfp_id=rfp_id,
        version=next_version,
        storage_path=rel_path,
        generated_by=current_user.id,
    )
    db.add(proposal)
    _log_audit(db, current_user.id, "generate", "proposal", str(proposal.id))
    db.commit()
    db.refresh(proposal)
    return proposal


@router.get("/{rfp_id}/proposals/{proposal_id}/download")
def download_proposal(
    rfp_id: uuid.UUID,
    proposal_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    proposal = db.query(Proposal).filter(
        Proposal.id == proposal_id, Proposal.rfp_id == rfp_id
    ).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    full_path = STORAGE_ROOT / proposal.storage_path
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    _log_audit(db, current_user.id, "download", "proposal", str(proposal.id))
    db.commit()

    return FileResponse(
        path=str(full_path),
        filename=f"proposal_v{proposal.version}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.post("/{rfp_id}/comments", response_model=CommentResponse, status_code=201)
def add_comment(
    rfp_id: uuid.UUID,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    comment = RFPComment(
        rfp_id=rfp_id,
        user_id=current_user.id,
        content=body.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    result = CommentResponse.model_validate(comment)
    result.user_name = current_user.full_name
    return result


@router.delete("/{rfp_id}", status_code=204)
def delete_rfp(
    rfp_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    if current_user.role not in ("admin", "manager") and rfp.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this RFP")

    _log_audit(db, current_user.id, "delete", "rfp", str(rfp.id))
    db.delete(rfp)
    db.commit()
