from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database.database import get_db
from models.faculty import Faculty
from security.roles import require_admin, require_faculty


router = APIRouter(
    prefix="/faculty",
    tags=["Faculty"]
)


# =========================================================
# FACULTY REGISTRATION REQUEST
# =========================================================

class FacultyRegisterRequest(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    mobile: str
    password: str = "faculty123"
    address: str | None = None
    qualification: str | None = None
    specialization: str | None = None
    department: str | None = None


# =========================================================
# REGISTER NEW FACULTY (INSTITUTE ADMIN ONLY)
# =========================================================

@router.post("/register")
def register_faculty(
    data: FacultyRegisterRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    from models.user import User
    from services.password_service import hash_password

    inst_code = current_user.get("institute_code")

    existing = (
        db.query(Faculty)
        .filter(Faculty.employee_id == data.employee_id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Employee ID already exists"
        )

    existing_user = db.query(User).filter(User.username == data.employee_id).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"User login account for '{data.employee_id}' already exists"
        )

    faculty = Faculty(
        employee_id=data.employee_id,
        institute_code=inst_code,
        name=data.name,
        email=data.email,
        mobile=data.mobile,
        address=data.address,
        qualification=data.qualification,
        specialization=data.specialization,
        department=data.department
    )

    db.add(faculty)

    # Create faculty user login account
    user = User(
        username=data.employee_id,
        password=hash_password(data.password),
        role="faculty",
        institute_code=inst_code,
        is_active=True,
        must_change_password=False
    )
    db.add(user)

    db.commit()
    db.refresh(faculty)

    return {
        "message": f"Faculty '{faculty.name}' registered successfully! Login Username: {faculty.employee_id}",
        "faculty": {
            "id": faculty.id,
            "employee_id": faculty.employee_id,
            "institute_code": faculty.institute_code,
            "name": faculty.name,
            "email": faculty.email,
            "mobile": faculty.mobile,
            "address": faculty.address,
            "qualification": faculty.qualification,
            "specialization": faculty.specialization,
            "department": faculty.department
        }
    }



# =========================================================
# GET FACULTY
# FACULTY OWN PROFILE
# =========================================================

@router.get("/{employee_id}")
def get_faculty(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_faculty)
):
    if current_user["username"] != employee_id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own profile"
        )

    faculty = (
        db.query(Faculty)
        .filter(Faculty.employee_id == employee_id)
        .first()
    )

    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Faculty not found"
        )

    return {
        "message": "Faculty found",
        "faculty": {
            "id": faculty.id,
            "employee_id": faculty.employee_id,
            "name": faculty.name,
            "email": faculty.email,
            "mobile": faculty.mobile,
            "address": faculty.address,
            "qualification": faculty.qualification,
            "specialization": faculty.specialization,
            "department": faculty.department
        }
    }


# =========================================================
# FACULTY UPDATE REQUEST
# =========================================================

class FacultyUpdateRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    mobile: str | None = None
    address: str | None = None
    qualification: str | None = None
    specialization: str | None = None
    department: str | None = None


# =========================================================
# UPDATE FACULTY
# FACULTY OWN PROFILE
# =========================================================

@router.put("/{employee_id}")
def update_faculty(
    employee_id: str,
    data: FacultyUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_faculty)
):
    if current_user["username"] != employee_id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own profile"
        )

    faculty = (
        db.query(Faculty)
        .filter(Faculty.employee_id == employee_id)
        .first()
    )

    if not faculty:
        raise HTTPException(
            status_code=404,
            detail="Faculty not found"
        )

    if data.name is not None:
        faculty.name = data.name

    if data.email is not None:
        faculty.email = data.email

    if data.mobile is not None:
        faculty.mobile = data.mobile

    if data.address is not None:
        faculty.address = data.address

    if data.qualification is not None:
        faculty.qualification = data.qualification

    if data.specialization is not None:
        faculty.specialization = data.specialization

    if data.department is not None:
        faculty.department = data.department

    db.commit()
    db.refresh(faculty)

    return {
        "message": "Faculty updated successfully",
        "faculty": {
            "id": faculty.id,
            "employee_id": faculty.employee_id,
            "name": faculty.name,
            "email": faculty.email,
            "mobile": faculty.mobile,
            "address": faculty.address,
            "qualification": faculty.qualification,
            "specialization": faculty.specialization,
            "department": faculty.department
        }
    }