from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from database.database import get_db
from models.student import Student

from services.report_service import student_report

from security.auth import get_current_user


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/student/{student_id}")
def get_student_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    role = current_user["role"].lower()

    # =========================================
    # STUDENT ACCESS
    # =========================================

    if role == "student":

        # Find the student using registration ID
        student = (
            db.query(Student)
            .filter(
                Student.registration_id ==
                current_user["username"]
            )
            .first()
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found"
            )

        # Student can only see their own report
        if student.id != student_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own report"
            )

    # =========================================
    # FACULTY / ADMIN
    # =========================================

    elif role in ["faculty", "admin"]:

        # Faculty and admin can access any student report
        pass

    # =========================================
    # INVALID ROLE
    # =========================================

    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    # =========================================
    # GET REPORT
    # =========================================

    report = student_report(
        db,
        student_id
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return report