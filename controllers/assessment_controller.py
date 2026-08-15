from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user, require_faculty

from models.student import Student

from services.assessment_service import (
    add_assessment,
    get_student_results,
    calculate_result
)


router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"]
)


# =========================================================
# ASSESSMENT REQUEST
# =========================================================

class AssessmentRequest(BaseModel):
    student_id: int
    subject: str
    marks: float
    total_marks: float = 100
    exam_type: str = "Exam"


# =========================================================
# CREATE ASSESSMENT
# FACULTY ONLY
# =========================================================

@router.post("/")
def create_assessment(
    data: AssessmentRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_faculty)
):

    assessment = add_assessment(
        db,
        data.student_id,
        data.subject,
        data.marks,
        data.total_marks,
        data.exam_type
    )

    return {
        "message": "Assessment saved",
        "assessment": assessment
    }


# =========================================================
# RESULT / PERCENTAGE / GRADE
# =========================================================

@router.get("/result/{student_id}")
def get_result(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    role = current_user["role"].lower()

    # -----------------------------------------------------
    # STUDENT
    # -----------------------------------------------------

    if role == "student":

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

        if student.id != student_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own result"
            )

    # -----------------------------------------------------
    # FACULTY / ADMIN
    # -----------------------------------------------------

    elif role in ["faculty", "admin"]:
        pass

    # -----------------------------------------------------
    # INVALID ROLE
    # -----------------------------------------------------

    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return calculate_result(
        db,
        student_id
    )


# =========================================================
# ALL ASSESSMENTS OF STUDENT
# =========================================================

@router.get("/{student_id}")
def get_results(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    role = current_user["role"].lower()

    # -----------------------------------------------------
    # STUDENT
    # -----------------------------------------------------

    if role == "student":

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

        if student.id != student_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own assessments"
            )

    # -----------------------------------------------------
    # FACULTY / ADMIN
    # -----------------------------------------------------

    elif role in ["faculty", "admin"]:
        pass

    # -----------------------------------------------------
    # INVALID ROLE
    # -----------------------------------------------------

    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return get_student_results(
        db,
        student_id
    )