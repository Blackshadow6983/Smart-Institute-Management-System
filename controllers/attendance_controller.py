from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user, require_faculty

from services.attendance_service import (
    mark_attendance,
    get_attendance_percentage
)

from models.attendance import Attendance
from models.student import Student


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


# =========================================================
# ATTENDANCE REQUEST
# =========================================================

class AttendanceRequest(BaseModel):
    student_id: int
    date: date
    status: bool
    course: str | None = None


# =========================================================
# MARK ATTENDANCE
# FACULTY ONLY
# =========================================================

@router.post("/")
def create_attendance(
    data: AttendanceRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_faculty)
):

    attendance = mark_attendance(
        db,
        data.student_id,
        data.date,
        data.status,
        data.course
    )

    return {
        "message": "Attendance saved",
        "attendance": {
            "id": attendance.id,
            "student_id": attendance.student_id,
            "date": attendance.date,
            "status": attendance.status,
            "course": attendance.course
        }
    }


# =========================================================
# VIEW ATTENDANCE PERCENTAGE
# =========================================================

@router.get("/percentage/{student_id}")
def attendance_percentage(
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
                detail="You can only view your own attendance"
            )

    # -----------------------------------------------------
    # ADMIN / FACULTY
    # -----------------------------------------------------

    elif role in ["admin", "faculty"]:
        pass

    # -----------------------------------------------------
    # INVALID ROLE
    # -----------------------------------------------------

    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    percentage = get_attendance_percentage(
        db,
        student_id
    )

    return {
        "student_id": student_id,
        "attendance_percentage": percentage
    }


# =========================================================
# VIEW ATTENDANCE RECORDS
# =========================================================

@router.get("/student/{student_id}")
def get_student_attendance(
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
                detail="You can only view your own attendance"
            )

    # -----------------------------------------------------
    # ADMIN / FACULTY
    # -----------------------------------------------------

    elif role in ["admin", "faculty"]:
        pass

    # -----------------------------------------------------
    # INVALID ROLE
    # -----------------------------------------------------

    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    records = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student_id
        )
        .all()
    )

    return {
        "student_id": student_id,
        "total_classes": len(records),
        "attendance": [
            {
                "id": record.id,
                "date": record.date,
                "status": record.status,
                "course": record.course
            }
            for record in records
        ]
    }