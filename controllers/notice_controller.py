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
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only Institute Admins can create notices"
        )

    inst_code = current_user.get("institute_code")

    notice = Notice(
        institute_code=inst_code,
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
            "institute_code": notice.institute_code,
            "title": notice.title,
            "message": notice.message,
            "created_at": notice.created_at
        }
    }


# =========================================================
# VIEW NOTICES
# =========================================================

@router.get("/")
def get_notices(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    if role == "faculty":
        raise HTTPException(
            status_code=403,
            detail="Faculty access is restricted to student attendance only."
        )

    inst_code = current_user.get("institute_code")

    if role == "student" and not inst_code:
        from models.student import Student
        stu = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if stu:
            inst_code = stu.institute_code

    query = db.query(Notice)
    if inst_code:
        query = query.filter(Notice.institute_code == inst_code)

    return (
        query.order_by(Notice.id.desc())
        .all()
    )