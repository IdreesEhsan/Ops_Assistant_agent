from services.db_service import create_email_log

def send_email(to, subject, body):
    return True

def create_draft(session_id, user_id, to, subject, body):
    draft = {"to": to, "subject": subject, "body": body}
    return create_email_log(session_id, user_id, draft)