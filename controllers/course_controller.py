from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from models.course import Course
from security.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


class CourseCreateRequest(BaseModel):
    course_code: str
    name: str
    description: str | None = None
    duration: str | None = "1 Year"
    fees: float | None = 0.0
    institute_code: str | None = None


class CourseUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    duration: str | None = None
    fees: float | None = None


# =========================================================
# CREATE COURSE
# =========================================================

@router.post("/")
def create_course(
    data: CourseCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    inst_code = data.institute_code or current_user.get("institute_code")

    # Format course code if needed
    clean_code = data.course_code.strip().upper()
    if inst_code and not clean_code.startswith(inst_code) and not clean_code.startswith("CS") and not clean_code.startswith("AI"):
        clean_code = f"{inst_code}-{clean_code}"

    existing = (
        db.query(Course)
        .filter(Course.course_code == clean_code)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Course code {clean_code} already exists"
        )

    course = Course(
        institute_code=inst_code,
        course_code=clean_code,
        name=data.name.strip(),
        description=data.description,
        duration=data.duration or "1 Year",
        fees=int(data.fees or 0)
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return {
        "message": "Course created successfully",
        "course": {
            "id": course.id,
            "institute_code": course.institute_code,
            "course_code": course.course_code,
            "name": course.name,
            "description": course.description,
            "duration": course.duration,
            "fees": course.fees
        }
    }


# =========================================================
# GET ALL COURSES
# =========================================================

@router.get("/")
def get_all_courses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    inst_code = current_user.get("institute_code")
    query = db.query(Course)
    if inst_code and inst_code != "DEFAULT":
        query = query.filter(
            (Course.institute_code == inst_code) |
            (Course.institute_code == None)
        )
    return query.all()


# =========================================================
# GET COURSE
# =========================================================

@router.get("/{course_code}")
def get_course(
    course_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    course = (
        db.query(Course)
        .filter(Course.course_code == course_code)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    return {
        "message": "Course found",
        "course": {
            "id": course.id,
            "institute_code": course.institute_code,
            "course_code": course.course_code,
            "name": course.name,
            "description": course.description,
            "duration": course.duration,
            "fees": course.fees
        }
    }


# =========================================================
# UPDATE COURSE
# =========================================================

@router.put("/{course_code}")
def update_course(
    course_code: str,
    data: CourseUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    course = (
        db.query(Course)
        .filter(Course.course_code == course_code)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    if data.name is not None:
        course.name = data.name.strip()

    if data.description is not None:
        course.description = data.description

    if data.duration is not None:
        course.duration = data.duration

    if data.fees is not None:
        course.fees = int(data.fees)

    db.commit()
    db.refresh(course)

    return {
        "message": "Course updated successfully",
        "course": {
            "id": course.id,
            "institute_code": course.institute_code,
            "course_code": course.course_code,
            "name": course.name,
            "description": course.description,
            "duration": course.duration,
            "fees": course.fees
        }
    }