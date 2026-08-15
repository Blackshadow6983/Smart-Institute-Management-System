from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from models.student import Student
from models.faculty import Faculty
from security.auth import require_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/students")
def all_students(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    inst_code = current_user.get("institute_code")
    query = db.query(Student)
    if inst_code and inst_code != "DEFAULT":
        query = query.filter((Student.institute_code == inst_code) | (Student.institute_code == "DEFAULT"))
    return query.order_by(Student.id.desc()).all()


@router.get("/faculty")
def all_faculty(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    return db.query(Faculty).all()