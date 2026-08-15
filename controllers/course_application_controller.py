from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from database.database import get_db

from security.auth import get_current_user

from models.student import Student
from models.course import Course
from models.course_application import CourseApplication


router = APIRouter(
    prefix="/course-applications",
    tags=["Course Applications"]
)


# =========================================================
# REQUEST MODEL
# =========================================================

class CourseApplicationRequest(BaseModel):
    course_id: int


# =========================================================
# STUDENT - APPLY FOR COURSE
# =========================================================

@router.post("/")
def apply_for_course(
    data: CourseApplicationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    # Only student can apply
    if current_user["role"].lower() != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can apply for courses"
        )

    # Find logged-in student
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

    # Find course
    course = (
        db.query(Course)
        .filter(
            Course.id == data.course_id
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    # Check if student already applied
    existing_application = (
        db.query(CourseApplication)
        .filter(
            CourseApplication.student_id == student.id,
            CourseApplication.course_id == course.id
        )
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this course"
        )

    # Create approved application
    application = CourseApplication(
        student_id=student.id,
        course_id=course.id,
        status="Approved"
    )

    db.add(application)

    db.commit()

    db.refresh(application)

    return {
        "message": "Course application submitted successfully",

        "application": {
            "student_name": student.name,

            "registration_id":
                student.registration_id,

            "course": course.name,

            "course_code":
                course.course_code,

            "status":
                application.status,

            "application_date":
                application.application_date
        }
    }


# =========================================================
# STUDENT - VIEW OWN APPLICATIONS
# =========================================================

@router.get("/my")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    # Only student
    if current_user["role"].lower() != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can view their applications"
        )

    # Find student
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

    # Get applications
    applications = (
        db.query(CourseApplication)
        .filter(
            CourseApplication.student_id == student.id
        )
        .all()
    )

    result = []

    for application in applications:

        course = (
            db.query(Course)
            .filter(
                Course.id == application.course_id
            )
            .first()
        )

        result.append({

            "student_name":
                student.name,

            "registration_id":
                student.registration_id,

            "course":
                course.name
                if course
                else None,

            "course_code":
                course.course_code
                if course
                else None,

            "status":
                application.status,

            "application_date":
                application.application_date
        })

    return result


# =========================================================
# ADMIN + FACULTY - VIEW ALL APPLICATIONS
# =========================================================

@router.get("/all")
def get_all_course_applications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    # Get role
    role = current_user["role"].lower()

    # Only Admin and Faculty
    if role not in ["admin", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin and faculty can view all applications"
        )

    # Get all applications
    applications = (
        db.query(CourseApplication)
        .all()
    )

    result = []

    for application in applications:

        # Find student
        student = (
            db.query(Student)
            .filter(
                Student.id ==
                application.student_id
            )
            .first()
        )

        # Find course
        course = (
            db.query(Course)
            .filter(
                Course.id ==
                application.course_id
            )
            .first()
        )

        result.append({

            "student_name":
                student.name
                if student
                else None,

            "registration_id":
                student.registration_id
                if student
                else None,

            "course":
                course.name
                if course
                else None,

            "course_code":
                course.course_code
                if course
                else None,

            "status":
                application.status,

            "application_date":
                application.application_date
        })

    return result