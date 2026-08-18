from datetime import date as DateType
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
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
from models.course import Course


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


class AttendanceRequest(BaseModel):
    student_id: int
    date: DateType
    status: bool
    course: Optional[str] = None


class AttendanceUpdateRequest(BaseModel):
    status: bool
    date: Optional[DateType] = None
    course: Optional[str] = None


# =========================================================
# MARK ATTENDANCE (FACULTY / ADMIN ONLY)
# =========================================================

@router.post("/")
def create_attendance(
    data: AttendanceRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_faculty)
):
    course_name = data.course or "General"
    
    attendance = mark_attendance(
        db,
        data.student_id,
        data.date,
        data.status,
        course_name
    )

    return {
        "message": f"Attendance recorded for course: {course_name}",
        "attendance": {
            "id": attendance.id,
            "student_id": attendance.student_id,
            "date": attendance.date,
            "status": attendance.status,
            "course": attendance.course
        }
    }


# =========================================================
# EDIT ATTENDANCE RECORD (FACULTY / ADMIN ONLY)
# =========================================================

@router.put("/{attendance_id}")
def update_attendance(
    attendance_id: int,
    data: AttendanceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_faculty)
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    record.status = data.status
    if data.date is not None:
        record.date = data.date
    if data.course is not None:
        record.course = data.course

    db.commit()
    db.refresh(record)

    return {
        "message": "Attendance record updated",
        "attendance": record
    }


# =========================================================
# VIEW ATTENDANCE PERCENTAGE BY COURSE OR OVERALL
# =========================================================

@router.get("/percentage/{student_id}")
def attendance_percentage(
    student_id: int,
    course: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role == "student":
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="You can only view your own attendance")

    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    if course:
        query = query.filter(Attendance.course == course)

    records = query.all()
    total = len(records)
    present = len([r for r in records if r.status])
    absent = total - present
    percentage = round((present / total) * 100, 1) if total > 0 else 0.0

    return {
        "student_id": student_id,
        "course": course or "All Courses",
        "total_classes": total,
        "present_classes": present,
        "absent_classes": absent,
        "attendance_percentage": percentage
    }


# =========================================================
# VIEW STUDENT ATTENDANCE RECORDS (COURSE-FILTERABLE)
# =========================================================

@router.get("/student/{student_id}")
def get_student_attendance(
    student_id: int,
    course: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role == "student":
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="You can only view your own attendance")

    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    if course:
        query = query.filter(Attendance.course == course)

    records = query.order_by(Attendance.date.desc()).all()
    total = len(records)
    present = len([r for r in records if r.status])
    absent = total - present
    pct = round((present / total) * 100, 1) if total > 0 else 0.0

    return {
        "student_id": student_id,
        "course_filter": course,
        "total_classes": total,
        "present_classes": present,
        "absent_classes": absent,
        "attendance_percentage": pct,
        "attendance": [
            {
                "id": record.id,
                "date": record.date,
                "status": record.status,
                "status_text": "Present" if record.status else "Absent",
                "course": record.course
            }
            for record in records
        ]
    }


# =========================================================
# VIEW ATTENDANCE RECORDS FOR A SPECIFIC COURSE (FACULTY/ADMIN)
# =========================================================

@router.get("/course/{course_name}")
def get_course_attendance(
    course_name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_faculty)
):
    records = db.query(Attendance).filter(Attendance.course == course_name).order_by(Attendance.date.desc()).all()
    result = []
    for r in records:
        student = db.query(Student).filter(Student.id == r.student_id).first()
        result.append({
            "id": r.id,
            "student_id": r.student_id,
            "student_name": student.name if student else "Unknown",
            "registration_id": student.registration_id if student else "N/A",
            "date": r.date,
            "status": r.status,
            "status_text": "Present" if r.status else "Absent",
            "course": r.course
        })
    return result