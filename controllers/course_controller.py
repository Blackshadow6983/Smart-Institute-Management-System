from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from models.course import Course
from models.course_module import CourseModule
from security.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


class CourseCreateRequest(BaseModel):
    course_code: str
    name: str
    description: str | None = None
    duration: str | None = "6 Months"
    fees: float | None = 0.0
    mode: str | None = "Both"
    total_classes: int | None = 20
    start_date: str | None = None
    end_date: str | None = None
    capacity: int | None = 50
    is_active: bool | None = True
    institute_code: str | None = None


class CourseUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    duration: str | None = None
    fees: float | None = None
    mode: str | None = None
    total_classes: int | None = None
    start_date: str | None = None
    end_date: str | None = None
    capacity: int | None = None
    is_active: bool | None = None


class ModuleCreateRequest(BaseModel):
    title: str
    description: str | None = None
    order_index: int | None = 1


# =========================================================
# CREATE COURSE (ADMIN ONLY)
# =========================================================

@router.post("/")
def create_course(
    data: CourseCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    inst_code = data.institute_code or current_user.get("institute_code")
    clean_code = data.course_code.strip().upper()

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
        duration=data.duration or "6 Months",
        fees=int(data.fees or 0),
        mode=data.mode or "Both",
        total_classes=data.total_classes or 20,
        start_date=data.start_date,
        end_date=data.end_date,
        capacity=data.capacity or 50,
        is_active=True if data.is_active is None else data.is_active
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    # Seed default modules if none exist for quick start
    default_modules = [
        ("Module 1: Orientation & Fundamentals", "Introduction to core concepts and environment setup"),
        ("Module 2: Core Concepts & Practice", "Deep dive into main principles and exercises"),
        ("Module 3: Advanced Topics & Hands-on", "Advanced techniques and real-world scenarios"),
        ("Module 4: Capstone Project & Evaluation", "Final assessment and project review")
    ]
    for idx, (title, desc) in enumerate(default_modules, start=1):
        mod = CourseModule(course_id=course.id, title=title, description=desc, order_index=idx)
        db.add(mod)
    db.commit()

    return {
        "message": "Course created successfully",
        "course": {
            "id": course.id,
            "institute_code": course.institute_code,
            "course_code": course.course_code,
            "name": course.name,
            "description": course.description,
            "duration": course.duration,
            "fees": course.fees,
            "mode": course.mode,
            "total_classes": course.total_classes,
            "start_date": course.start_date,
            "end_date": course.end_date,
            "capacity": course.capacity,
            "is_active": course.is_active
        }
    }


# =========================================================
# GET ALL PUBLIC ACTIVE COURSES (FOR REGISTRATION DROPDOWN)
# =========================================================

@router.get("/public")
def get_public_active_courses(
    institute_code: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Course).filter(Course.is_active == True)
    if institute_code:
        query = query.filter(Course.institute_code == institute_code.strip().upper())
    courses = query.all()
    return [
        {
            "id": c.id,
            "institute_code": c.institute_code,
            "course_code": c.course_code,
            "name": c.name,
            "description": c.description,
            "duration": c.duration,
            "fees": c.fees,
            "mode": c.mode,
            "capacity": c.capacity,
            "is_active": c.is_active
        }
        for c in courses
    ]


# =========================================================
# GET ALL COURSES (INSTITUTE SCOPED)
# =========================================================

@router.get("/")
def get_all_courses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = (current_user.get("role") or "").lower()
    inst_code = current_user.get("institute_code")

    # If student role, find student's institute code if not in token
    if role == "student" and not inst_code:
        from models.student import Student
        stu = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if stu:
            inst_code = stu.institute_code


    query = db.query(Course)
    if inst_code:
        query = query.filter(Course.institute_code == inst_code)

    # If student role, return only active courses by default
    if role == "student":
        query = query.filter(Course.is_active == True)

    courses = query.all()
    result = []
    for c in courses:
        # Fetch module count
        mod_count = db.query(CourseModule).filter(CourseModule.course_id == c.id).count()
        c_dict = {
            "id": c.id,
            "institute_code": c.institute_code,
            "course_code": c.course_code,
            "name": c.name,
            "description": c.description,
            "duration": c.duration or "6 Months",
            "fees": c.fees,
            "mode": c.mode or "Both",
            "total_classes": c.total_classes or 20,
            "start_date": c.start_date or "Immediate",
            "end_date": c.end_date or "Flexible",
            "capacity": c.capacity or 50,
            "is_active": c.is_active if c.is_active is not None else True,
            "status": "Active" if (c.is_active if c.is_active is not None else True) else "Inactive",
            "module_count": mod_count
        }
        result.append(c_dict)

    return result



# =========================================================
# GET COURSE BY CODE OR ID
# =========================================================

@router.get("/{course_id_or_code}")
def get_course(
    course_id_or_code: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if course_id_or_code.isdigit():
        course = db.query(Course).filter(Course.id == int(course_id_or_code)).first()
    else:
        course = db.query(Course).filter(Course.course_code == course_id_or_code).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    modules = db.query(CourseModule).filter(CourseModule.course_id == course.id).order_by(CourseModule.order_index).all()

    return {
        "message": "Course found",
        "course": course,
        "modules": modules
    }


# =========================================================
# UPDATE COURSE (ADMIN ONLY)
# =========================================================

@router.put("/{course_id_or_code}")
def update_course(
    course_id_or_code: str,
    data: CourseUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    if course_id_or_code.isdigit():
        course = db.query(Course).filter(Course.id == int(course_id_or_code)).first()
    else:
        course = db.query(Course).filter(Course.course_code == course_id_or_code).first()

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
    if data.mode is not None:
        course.mode = data.mode
    if data.total_classes is not None:
        course.total_classes = data.total_classes
    if data.start_date is not None:
        course.start_date = data.start_date
    if data.end_date is not None:
        course.end_date = data.end_date
    if data.capacity is not None:
        course.capacity = data.capacity
    if data.is_active is not None:
        course.is_active = data.is_active

    db.commit()
    db.refresh(course)

    return {
        "message": "Course updated successfully",
        "course": course
    }


# =========================================================
# TOGGLE COURSE ACTIVE / INACTIVE (ADMIN ONLY)
# =========================================================

@router.patch("/{course_id}/toggle-status")
def toggle_course_status(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.is_active = not (course.is_active if course.is_active is not None else True)
    db.commit()
    db.refresh(course)

    return {
        "message": f"Course status updated to {'Active' if course.is_active else 'Inactive'}",
        "is_active": course.is_active
    }


# =========================================================
# DELETE COURSE (ADMIN ONLY)
# =========================================================

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Delete associated modules
    db.query(CourseModule).filter(CourseModule.course_id == course.id).delete()
    db.delete(course)
    db.commit()

    return {"message": "Course deleted successfully"}


# =========================================================
# MODULE MANAGEMENT (ADMIN ONLY)
# =========================================================

@router.post("/{course_id}/modules")
def add_course_module(
    course_id: int,
    data: ModuleCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    module = CourseModule(
        course_id=course.id,
        title=data.title,
        description=data.description,
        order_index=data.order_index or 1
    )
    db.add(module)
    db.commit()
    db.refresh(module)

    return {"message": "Module added successfully", "module": module}


@router.get("/{course_id}/modules")
def get_course_modules(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    modules = db.query(CourseModule).filter(CourseModule.course_id == course_id).order_by(CourseModule.order_index).all()
    return modules


@router.delete("/modules/{module_id}")
def delete_course_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    mod = db.query(CourseModule).filter(CourseModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")

    db.delete(mod)
    db.commit()
    return {"message": "Module deleted successfully"}