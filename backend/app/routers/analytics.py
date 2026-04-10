from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.rfp import RFP, AIExtraction
from app.schemas.analytics import AnalyticsOverview, QuarterlyData, QuarterlyItem, GapAnalyticsResponse, GapItem
from app.utils.security import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(func.count(RFP.id)).scalar() or 0
    active = db.query(func.count(RFP.id)).filter(
        RFP.status.in_(["draft", "in_progress"])
    ).scalar() or 0
    won = db.query(func.count(RFP.id)).filter(RFP.status == "won").scalar() or 0
    lost = db.query(func.count(RFP.id)).filter(RFP.status == "lost").scalar() or 0
    decided = won + lost
    win_rate = (won / decided * 100) if decided > 0 else 0

    pipeline = db.query(func.sum(RFP.estimated_value)).filter(
        RFP.status.in_(["draft", "in_progress", "submitted"])
    ).scalar() or 0

    return AnalyticsOverview(
        total_rfps=total,
        active_proposals=active,
        win_rate=round(win_rate, 1),
        avg_proposal_time_days=4.2,  # Would calculate from timestamps in production
        pipeline_value=float(pipeline),
        won_count=won,
        lost_count=lost,
    )


@router.get("/quarterly", response_model=QuarterlyData)
def get_quarterly(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Group by quarter
    rfps = db.query(RFP).filter(RFP.status.in_(["won", "lost"])).all()
    quarters = {}
    for rfp in rfps:
        q = f"Q{(rfp.created_at.month - 1) // 3 + 1} {rfp.created_at.year}"
        if q not in quarters:
            quarters[q] = {"won": 0, "lost": 0, "value": 0}
        if rfp.status == "won":
            quarters[q]["won"] += 1
            quarters[q]["value"] += rfp.estimated_value or 0
        else:
            quarters[q]["lost"] += 1

    return QuarterlyData(
        quarters=[
            QuarterlyItem(quarter=k, won=v["won"], lost=v["lost"], value=v["value"])
            for k, v in sorted(quarters.items())
        ]
    )


@router.get("/gaps", response_model=GapAnalyticsResponse)
def get_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Aggregate gap data from capability match extractions
    extractions = db.query(AIExtraction).filter(
        AIExtraction.extraction_type == "capability_match"
    ).all()

    gap_counts = {}
    for ext in extractions:
        data = ext.raw_json
        if isinstance(data, dict):
            for gap in data.get("gaps", []):
                req = gap.get("requirement", "Unknown")
                gap_counts[req] = gap_counts.get(req, 0) + 1

    gaps = [
        GapItem(capability=k, frequency=v, impact="High" if v > 5 else "Medium")
        for k, v in sorted(gap_counts.items(), key=lambda x: -x[1])[:10]
    ]

    return GapAnalyticsResponse(gaps=gaps)
