from services.db_service import create_email_log

def send_email(to: str, subject: str, body: str) -> bool:
    # Simulated email sending – always returns True
    return True

def create_draft(session_id: str, user_id: str, to: str, subject: str, body: str):
    draft = {"to": to, "subject": subject, "body": body}
    return create_email_log(session_id, user_id, draft)