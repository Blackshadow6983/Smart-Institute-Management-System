from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from database.database import get_db
from models.suggestion import Suggestion
from security.auth import get_current_user

router = APIRouter(
    prefix="/suggestions",
    tags=["Suggestions"]
)


class SuggestionCreateRequest(BaseModel):
    title: str
    category: str | None = "General"
    message: str


class SuggestionStatusUpdateRequest(BaseModel):
    status: str | None = None
    admin_response: str | None = None


# =========================================================
# CREATE SUGGESTION / FEEDBACK
# ALL AUTHENTICATED USERS
# =========================================================
@router.post("/")
def create_suggestion(
    data: SuggestionCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    inst_code = current_user.get("institute_code")
    role = current_user.get("role", "").lower()
    username = current_user.get("username")

    if role == "student" and not inst_code:
        from models.student import Student
        stu = db.query(Student).filter(Student.registration_id == username).first()
        if stu:
            inst_code = stu.institute_code

    suggestion = Suggestion(
        institute_code=inst_code,
        user_id=username,
        user_name=username,
        user_role=role,
        title=data.title,
        category=data.category or "General",
        message=data.message,
        status="Pending",
        created_at=datetime.now()
    )

    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)

    return {
        "message": "Suggestion submitted successfully",
        "suggestion": suggestion
    }


# =========================================================
# VIEW SUGGESTIONS
# ADMINS SEE ALL; USERS SEE THEIR OWN
# =========================================================
@router.get("/")
def get_suggestions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    inst_code = current_user.get("institute_code")
    username = current_user.get("username")

    query = db.query(Suggestion)

    if role == "student" and not inst_code:
        from models.student import Student
        stu = db.query(Student).filter(Student.registration_id == username).first()
        if stu:
            inst_code = stu.institute_code

    if inst_code:
        query = query.filter(Suggestion.institute_code == inst_code)

    if role not in ["admin", "institute", "institute_admin"]:
        query = query.filter(Suggestion.user_id == username)

    return query.order_by(Suggestion.id.desc()).all()


# =========================================================
# UPDATE SUGGESTION STATUS & RESPONSE
# ADMIN ONLY
# =========================================================
@router.patch("/{suggestion_id}/status")
def update_suggestion_status(
    suggestion_id: int,
    data: SuggestionStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only Institute Admins can update suggestion status"
        )

    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    if data.status is not None:
        suggestion.status = data.status

    if data.admin_response is not None:
        suggestion.admin_response = data.admin_response

    db.commit()
    db.refresh(suggestion)

    return {
        "message": "Suggestion updated successfully",
        "suggestion": suggestion
    }
