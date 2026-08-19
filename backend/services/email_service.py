import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from config import settings
from services.db_service import create_email_log

def send_email(to: str, subject: str, body: str, reply_to_email: str = None) -> bool:
    """
    Send an email via system SMTP.
    - From: system sender (OpsAssistant)
    - Reply-To: logged-in user's email
    """
    try:
        msg = MIMEText(body, "plain")
        msg["Subject"] = subject
        msg["From"] = formataddr((settings.EMAIL_FROM_NAME, settings.EMAIL_FROM_ADDRESS))
        msg["To"] = to
        if reply_to_email:
            msg["Reply-To"] = reply_to_email

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM_ADDRESS, [to], msg.as_string())
        return True
    except Exception as e:
        print(f"SMTP send failed: {e}")
        return False

def create_draft(session_id: str, user_id: str, to: str, subject: str, body: str):
    draft = {"to": to, "subject": subject, "body": body}
    return create_email_log(session_id, user_id, draft)