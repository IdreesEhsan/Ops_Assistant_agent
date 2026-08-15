from fastapi import APIRouter, Depends, HTTPException
from models.schemas import EmailApproval
from services.db_service import supabase, get_pending_emails, update_email_status
from services.email_service import send_email
from dependencies import get_current_user

router = APIRouter(prefix="/api/emails", tags=["emails"])

@router.get("/pending")
def pending_emails(user = Depends(get_current_user)):
    """Get all email drafts awaiting approval for the current user."""
    return get_pending_emails(user.id)

@router.post("/approve")
def approve_email(request: EmailApproval, user = Depends(get_current_user)):
    """
    Approve or reject an email draft.
    - If approved, mark as sent (simulated).
    - If rejected, mark as rejected.
    """
    log = supabase.table("email_logs").select("*").eq("id", request.email_log_id).single().execute()
    if not log.data:
        raise HTTPException(status_code=404, detail="Email not found")
    if log.data["user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    draft = log.data["draft_json"]
    if request.approve:
        # Simulate sending (returns True)
        success = send_email(draft["to"], draft["subject"], draft["body"])
        if success:
            update_email_status(request.email_log_id, "sent")
            return {"status": "sent"}
        else:
            update_email_status(request.email_log_id, "failed")
            return {"status": "failed"}
    else:
        update_email_status(request.email_log_id, "rejected")
        return {"status": "rejected"}