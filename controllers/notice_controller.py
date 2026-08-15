from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from database.database import get_db
from models.notice import Notice
from security.auth import get_current_user

router = APIRouter(
    prefix="/notices",
    tags=["Notices"]
)


class NoticeRequest(BaseModel):
    title: str
    message: str


# =========================================================
# CREATE NOTICE
# ADMIN + FACULTY
# =========================================================

@router.post("/")
def create_notice(
    data: NoticeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    role = current_user["role"].lower()

    # Only Admin and Faculty can create notices
    if role not in ["admin", "faculty"]:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=403,
            detail="Only admin or faculty can create notices"
        )

    notice = Notice(
        title=data.title,
        message=data.message,
        created_at=datetime.now()
    )

    db.add(notice)
    db.commit()
    db.refresh(notice)

    return {
        "message": "Notice created successfully",
        "notice": {
            "id": notice.id,
            "title": notice.title,
            "message": notice.message,
            "created_at": notice.created_at
        }
    }


# =========================================================
# VIEW NOTICES
# ADMIN + FACULTY + STUDENT
# =========================================================

@router.get("/")
def get_notices(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    return (
        db.query(Notice)
        .order_by(Notice.id.desc())
        .all()
    )