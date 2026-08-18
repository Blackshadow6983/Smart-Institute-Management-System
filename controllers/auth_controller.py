from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from services.auth_service import (
    authenticate_user,
    create_access_token,
    change_password
)
from models.user import User
from models.institute import Institute
from models.student import Student


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    username: str
    old_password: str
    new_password: str


class StudentSelfRegisterRequest(BaseModel):
    name: str
    email: str
    mobile: str
    password: str
    institute_code: str
    course: str | None = None
    registration_id: str | None = None
    gender: str | None = "Male"
    date_of_birth: str | None = None
    address: str | None = None


@router.post("/register-student")
def self_register_student(
    data: StudentSelfRegisterRequest,
    db: Session = Depends(get_db)
):
    from services.registration_service import register_student

    inst_code = (data.institute_code or "ITE-001").strip().upper()

    result, err = register_student(
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
        course=data.course,
        send_credentials_email=False
    )

    if err:
        raise HTTPException(
            status_code=400,
            detail=err
        )

    student = result["student"]
    return {
        "message": f"Registration successful! Account activated with Enrollment Number {student.registration_id}.",
        "student": {
            "id": student.id,
            "name": student.name,
            "registration_id": student.registration_id,
            "email": student.email,
            "mobile": student.mobile,
            "institute_code": student.institute_code,
            "course": student.course
        },
        "registration_id": student.registration_id,
        "status": "Approved"
    }



@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = authenticate_user(
        db,
        data.username,
        data.password
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username/email or password"
        )

    token = create_access_token(user)

    # Determine institute context
    institute_name = "AI Smart Institute"
    institute_code = user.institute_code or "DEFAULT"

    if user.role in ["admin", "institute", "institute_admin"]:
        inst = db.query(Institute).filter(
            (Institute.institute_code == user.username) | 
            (Institute.institute_code == user.institute_code)
        ).first()
        if inst:
            institute_name = inst.name
            institute_code = inst.institute_code
    elif user.role == "student":
        student = db.query(Student).filter(Student.registration_id == user.username).first()
        if student and student.institute_code:
            institute_code = student.institute_code
            inst = db.query(Institute).filter(Institute.institute_code == student.institute_code).first()
            if inst:
                institute_name = inst.name

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "institute_code": institute_code,
            "institute_name": institute_name,
            "must_change_password": user.must_change_password
        }
    }


@router.post("/change-password")
def change_user_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.username == data.username)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not authenticate_user(
        db,
        data.username,
        data.old_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Old password is incorrect"
        )

    change_password(
        db,
        user,
        data.new_password
    )

    return {
        "message": "Password changed successfully"
    }