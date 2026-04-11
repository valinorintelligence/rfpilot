import logging
from datetime import datetime, timedelta, timezone

from app.celery_app import celery
from app.database import SessionLocal
from app.models.rfp import RFP
from app.models.user import User
from app.services.email_service import send_rfp_deadline_reminder

logger = logging.getLogger(__name__)


@celery.task(name="check_deadlines")
def check_deadlines():
    """Check for RFPs with approaching deadlines and send reminders."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        reminder_window = now + timedelta(days=3)

        upcoming_rfps = (
            db.query(RFP)
            .filter(
                RFP.deadline.isnot(None),
                RFP.deadline <= reminder_window,
                RFP.deadline > now,
                RFP.status.in_(["draft", "in_progress"]),
            )
            .all()
        )

        for rfp in upcoming_rfps:
            if rfp.assigned_to:
                user = db.query(User).filter(User.id == rfp.assigned_to).first()
                if user:
                    send_rfp_deadline_reminder(
                        to_email=user.email,
                        rfp_title=rfp.title,
                        client_name=rfp.client_name,
                        deadline=rfp.deadline.strftime("%B %d, %Y at %H:%M UTC"),
                    )

        logger.info("Checked %d RFPs with upcoming deadlines", len(upcoming_rfps))
    finally:
        db.close()


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Register periodic tasks."""
    # Check deadlines every 6 hours
    sender.add_periodic_task(
        21600.0,
        check_deadlines.s(),
        name="check-rfp-deadlines",
    )
