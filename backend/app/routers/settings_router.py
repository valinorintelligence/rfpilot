from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.settings import AppSettings
from app.schemas.settings import SettingsResponse, SettingsUpdate
from app.utils.security import get_current_user, require_role
from app.utils.storage import save_file

router = APIRouter(prefix="/settings", tags=["Settings"])


def _get_or_create_settings(db: Session) -> AppSettings:
    s = db.query(AppSettings).first()
    if not s:
        s = AppSettings()
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("", response_model=SettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = _get_or_create_settings(db)
    return SettingsResponse(
        company_name=s.company_name,
        logo_path=s.logo_path,
        base_template_path=s.base_template_path,
        has_api_key=bool(s.claude_api_key_encrypted),
    )


@router.put("", response_model=SettingsResponse)
def update_settings(
    body: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    s = _get_or_create_settings(db)

    if body.company_name is not None:
        s.company_name = body.company_name
    if body.claude_api_key is not None:
        # In production, encrypt with Fernet
        s.claude_api_key_encrypted = body.claude_api_key

    db.commit()
    db.refresh(s)

    return SettingsResponse(
        company_name=s.company_name,
        logo_path=s.logo_path,
        base_template_path=s.base_template_path,
        has_api_key=bool(s.claude_api_key_encrypted),
    )


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    content = await file.read()
    rel_path = f"templates/logo{file.filename[file.filename.rfind('.'):]}"
    save_file(rel_path, content)

    s = _get_or_create_settings(db)
    s.logo_path = rel_path
    db.commit()

    return {"logo_path": rel_path}


@router.post("/template")
async def upload_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx templates are accepted")

    content = await file.read()
    rel_path = "templates/base_template.docx"
    save_file(rel_path, content)

    s = _get_or_create_settings(db)
    s.base_template_path = rel_path
    db.commit()

    return {"template_path": rel_path}
