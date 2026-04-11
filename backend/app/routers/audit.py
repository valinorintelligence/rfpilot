from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.utils.security import require_role

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for log in logs:
        data = AuditLogResponse.model_validate(log)
        if log.user_id:
            user = db.query(User).filter(User.id == log.user_id).first()
            if user:
                data.user_name = user.full_name
        items.append(data)

    return AuditLogListResponse(items=items, total=total)
