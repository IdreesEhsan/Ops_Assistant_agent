"""
Email service – simulated.
In a real system, this would connect to an SMTP provider.
Here we only mark emails as sent.
"""

from services.db_service import create_email_log, update_email_status

def send_email(to: str, subject: str, body: str) -> bool:
    """Simulated sending – always returns True."""
    # In production, integrate with SendGrid/Resend/etc.
    return True

def create_draft(session_id, user_id, to, subject, body):
    """Create a draft email in the email_logs table."""
    draft = {"to": to, "subject": subject, "body": body}
    return create_email_log(session_id, user_id, draft)