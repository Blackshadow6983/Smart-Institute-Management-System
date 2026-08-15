from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user, require_admin

from models.student import Student

from services.certificate_service import (
    create_certificate,
    get_student_certificate
)


router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"]
)


# =========================================================
# CERTIFICATE REQUEST
# =========================================================

class CertificateRequest(BaseModel):
    student_id: int
    certificate_number: str
    certificate_type: str = "Course Completion"


# =========================================================
# CREATE CERTIFICATE
# ADMIN ONLY
# =========================================================

@router.post("/")
def generate_certificate(
    data: CertificateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):

    certificate = create_certificate(
        db,
        data.student_id,
        data.certificate_number,
        data.certificate_type
    )

    return {
        "message": "Certificate generated successfully",
        "certificate": certificate
    }


# =========================================================
# GET STUDENT CERTIFICATE
# =========================================================

@router.get("/{student_id}")
def student_certificate(
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
                detail="You can only view your own certificate"
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

    return get_student_certificate(
        db,
        student_id
    )