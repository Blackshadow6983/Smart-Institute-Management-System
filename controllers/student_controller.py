from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database.database import get_db
from models.student import Student
from models.institute import Institute
from services.registration_service import register_student
from security.auth import get_current_user, require_admin


router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


class StudentRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str
    institute_code: str | None = None
    registration_id: str | None = None
    address: str | None = None
    date_of_birth: str | None = None
    gender: str | None = "Male"
    parent_name: str | None = None
    parent_mobile: str | None = None
    parent_email: EmailStr | None = None
    course: str | None = None
    course_duration: str | None = None
    course_fee: float | None = 0.0
    batch: str | None = None


class StudentUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    mobile: str | None = None
    address: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    parent_name: str | None = None
    parent_mobile: str | None = None
    parent_email: EmailStr | None = None
    course: str | None = None
    course_duration: str | None = None
    course_fee: float | None = None
    batch: str | None = None


# =========================================================
# STUDENT REGISTRATION (Performed by Institute / Admin)
# =========================================================

@router.post("/register")
def register_new_student(
    data: StudentRegisterRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Determine which institute this student belongs to
    inst_code = data.institute_code
    if not inst_code:
        inst_code = current_user.get("institute_code")

    if not inst_code or inst_code == "DEFAULT":
        # Check if current user is an institute
        inst = db.query(Institute).filter(
            (Institute.institute_code == current_user.get("username")) |
            (Institute.admin_username == current_user.get("username"))
        ).first()
        if inst:
            inst_code = inst.institute_code
        else:
            first_inst = db.query(Institute).first()
            inst_code = first_inst.institute_code if first_inst else "INST-001"

    result, error = register_student(
        db=db,
        name=data.name,
        email=data.email,
        mobile=data.mobile,
        password=data.password,
        institute_code=inst_code,
        registration_id=data.registration_id,
        address=data.address,
        date_of_birth=data.date_of_birth,
        gender=data.gender or "Male",
        parent_name=data.parent_name,
        parent_mobile=data.parent_mobile,
        parent_email=data.parent_email,
        course=data.course,
        course_duration=data.course_duration,
        course_fee=float(data.course_fee or 0.0),
        batch=data.batch,
        send_credentials_email=True
    )

    if error:
        raise HTTPException(
            status_code=400,
            detail=error
        )

    student = result["student"]

    return {
        "message": f"Student registered successfully with ID {student.registration_id}! Login credentials dispatched to {student.email}",
        "student": {
            "id": student.id,
            "institute_code": student.institute_code,
            "registration_id": student.registration_id,
            "name": student.name,
            "email": student.email,
            "mobile": student.mobile,
            "parent_name": student.parent_name,
            "parent_mobile": student.parent_mobile,
            "parent_email": student.parent_email,
            "course": student.course,
            "course_duration": student.course_duration,
            "course_fee": student.course_fee,
            "batch": student.batch
        },
        "login": {
            "username": student.registration_id,
            "password": result["temporary_password"],
            "message": f"Credentials sent to {student.email}"
        }
    }


# =========================================================
# GET ALL STUDENTS (Multi-Tenant Institute Filtered)
# =========================================================

@router.get("/")
def get_all_students(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    inst_code = current_user.get("institute_code")

    query = db.query(Student)

    if role == "student":
        # Student sees only themselves
        query = query.filter(Student.registration_id == current_user["username"])
    elif inst_code:
        # Institute admin sees only students of their institute
        query = query.filter(
            (Student.institute_code == inst_code) |
            (Student.institute_code == "DEFAULT")
        )

    students = query.order_by(Student.id.desc()).all()
    return [
        {
            "id": s.id,
            "institute_code": s.institute_code,
            "registration_id": s.registration_id,
            "name": s.name,
            "email": s.email,
            "mobile": s.mobile,
            "address": s.address,
            "date_of_birth": s.date_of_birth,
            "gender": s.gender,
            "parent_name": s.parent_name,
            "parent_mobile": s.parent_mobile,
            "parent_email": s.parent_email,
            "course": s.course,
            "course_duration": s.course_duration,
            "course_fee": s.course_fee,
            "batch": s.batch
        }
        for s in students
    ]


# =========================================================
# GET STUDENT PROFILE
# =========================================================

@router.get("/{registration_id}")
def get_student(
    registration_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role == "student" and current_user["username"] != registration_id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own profile"
        )

    student = (
        db.query(Student)
        .filter(Student.registration_id == registration_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Fetch institute info
    inst = db.query(Institute).filter(Institute.institute_code == student.institute_code).first()

    return {
        "message": "Student found",
        "student": {
            "id": student.id,
            "institute_code": student.institute_code,
            "institute_name": inst.name if inst else "AI Smart Institute",
            "registration_id": student.registration_id,
            "name": student.name,
            "email": student.email,
            "mobile": student.mobile,
            "address": student.address,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "parent_name": student.parent_name,
            "parent_mobile": student.parent_mobile,
            "parent_email": student.parent_email,
            "course": student.course,
            "course_duration": student.course_duration,
            "course_fee": student.course_fee,
            "batch": student.batch
        }
    }


# =========================================================
# UPDATE STUDENT PROFILE
# =========================================================

@router.put("/{registration_id}")
def update_student(
    registration_id: str,
    data: StudentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in ["admin", "institute", "institute_admin"]:
        if role == "student" and current_user["username"] != registration_id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own profile"
            )

    student = (
        db.query(Student)
        .filter(Student.registration_id == registration_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    if data.name is not None:
        student.name = data.name.strip()
    if data.email is not None:
        student.email = data.email.strip().lower()
    if data.mobile is not None:
        student.mobile = data.mobile.strip()
    if data.address is not None:
        student.address = data.address.strip()
    if data.date_of_birth is not None:
        student.date_of_birth = data.date_of_birth
    if data.gender is not None:
        student.gender = data.gender
    if data.parent_name is not None:
        student.parent_name = data.parent_name.strip()
    if data.parent_mobile is not None:
        student.parent_mobile = data.parent_mobile.strip()
    if data.parent_email is not None:
        student.parent_email = data.parent_email.strip().lower()
    if data.course is not None:
        student.course = data.course
    if data.course_duration is not None:
        student.course_duration = data.course_duration
    if data.course_fee is not None:
        student.course_fee = float(data.course_fee)
    if data.batch is not None:
        student.batch = data.batch

    db.commit()
    db.refresh(student)

    return {
        "message": "Student record updated successfully",
        "student": {
            "id": student.id,
            "institute_code": student.institute_code,
            "registration_id": student.registration_id,
            "name": student.name,
            "email": student.email,
            "mobile": student.mobile,
            "parent_name": student.parent_name,
            "parent_mobile": student.parent_mobile,
            "parent_email": student.parent_email,
            "course": student.course,
            "course_duration": student.course_duration,
            "course_fee": student.course_fee,
            "batch": student.batch
        }
    }