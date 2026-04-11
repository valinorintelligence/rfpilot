import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
) -> bool:
    """Send an email using configured SMTP settings."""
    if not settings.SMTP_HOST:
        logger.warning("SMTP not configured, skipping email to %s", to_email)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    if body_text:
        msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            if settings.SMTP_PORT == 587:
                server.starttls()
                server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
        logger.info("Email sent to %s: %s", to_email, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        return False


def send_rfp_deadline_reminder(to_email: str, rfp_title: str, client_name: str, deadline: str):
    """Send a deadline reminder for an RFP."""
    subject = f"[RFPilot] Deadline Approaching: {rfp_title}"
    body_html = f"""
    <div style="font-family: 'IBM Plex Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #0A0A0A; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="font-family: 'IBM Plex Serif', Georgia, serif; color: #0A0A0A; margin: 0;">RFPILOT</h1>
        </div>
        <h2 style="color: #0A0A0A;">Deadline Reminder</h2>
        <p>The following RFP deadline is approaching:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border: 1px solid #CCC; font-weight: 600;">RFP Title</td>
                <td style="padding: 8px; border: 1px solid #CCC;">{rfp_title}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #CCC; font-weight: 600;">Client</td>
                <td style="padding: 8px; border: 1px solid #CCC;">{client_name}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #CCC; font-weight: 600;">Deadline</td>
                <td style="padding: 8px; border: 1px solid #CCC; color: #8B0000; font-weight: 600;">{deadline}</td></tr>
        </table>
        <p>Please review and take necessary action.</p>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #CCC; color: #555; font-size: 12px;">
            This is an automated notification from RFPilot.
        </div>
    </div>
    """
    return send_email(to_email, subject, body_html)


def send_status_change_notification(to_email: str, rfp_title: str, old_status: str, new_status: str):
    """Send notification when an RFP status changes."""
    subject = f"[RFPilot] Status Update: {rfp_title}"
    body_html = f"""
    <div style="font-family: 'IBM Plex Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #0A0A0A; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="font-family: 'IBM Plex Serif', Georgia, serif; color: #0A0A0A; margin: 0;">RFPILOT</h1>
        </div>
        <h2 style="color: #0A0A0A;">Status Changed</h2>
        <p>The RFP <strong>{rfp_title}</strong> status has been updated:</p>
        <p style="font-size: 18px;">
            <span style="text-decoration: line-through; color: #555;">{old_status.upper()}</span>
            &rarr;
            <span style="font-weight: 600; color: #1A5C1A;">{new_status.upper()}</span>
        </p>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #CCC; color: #555; font-size: 12px;">
            This is an automated notification from RFPilot.
        </div>
    </div>
    """
    return send_email(to_email, subject, body_html)


def send_analysis_complete_notification(to_email: str, rfp_title: str, rfp_id: str):
    """Send notification when AI analysis is complete."""
    subject = f"[RFPilot] Analysis Complete: {rfp_title}"
    body_html = f"""
    <div style="font-family: 'IBM Plex Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #0A0A0A; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="font-family: 'IBM Plex Serif', Georgia, serif; color: #0A0A0A; margin: 0;">RFPILOT</h1>
        </div>
        <h2 style="color: #0A0A0A;">AI Analysis Complete</h2>
        <p>The AI analysis for <strong>{rfp_title}</strong> has been completed.</p>
        <p>Key extractions including requirements, compliance items, and scope summary are now available for review.</p>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #CCC; color: #555; font-size: 12px;">
            This is an automated notification from RFPilot.
        </div>
    </div>
    """
    return send_email(to_email, subject, body_html)
