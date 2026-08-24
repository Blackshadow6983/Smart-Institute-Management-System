from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from models.batch import Batch
from security.auth import get_current_user

router = APIRouter(
    prefix="/batches",
    tags=["Batches"]
)

# =========================================================
# CREATE BATCH REQUEST
# =========================================================

class BatchCreateRequest(BaseModel):
    name: str
    course: str | None = None
    timing: str | None = None
    faculty: str | None = None

# =========================================================
# UPDATE BATCH REQUEST
# =========================================================

class BatchUpdateRequest(BaseModel):
    name: str | None = None
    course: str | None = None
    timing: str | None = None
    faculty: str | None = None

# =========================================================
# CREATE NEW BATCH
# ADMIN + FACULTY
# =========================================================

@router.post("/")
def create_batch(
    data: BatchCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in ["admin", "institute", "institute_admin", "staff", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only Admins, Staff, and Faculty can create batches"
        )

    inst_code = current_user.get("institute_code")

    batch = Batch(
        institute_code=inst_code,
        name=data.name,
        course=data.course,
        timing=data.timing,
        faculty=data.faculty
    )

    db.add(batch)
    db.commit()
    db.refresh(batch)

    return {
        "message": "Batch created successfully",
        "batch": batch
    }

# =========================================================
# GET ALL BATCHES
# =========================================================

@router.get("/")
def get_all_batches(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    inst_code = current_user.get("institute_code")

    if role == "student" and not inst_code:
        from models.student import Student
        stu = db.query(Student).filter(Student.registration_id == current_user.get("username")).first()
        if stu:
            inst_code = stu.institute_code

    query = db.query(Batch)
    if inst_code:
        query = query.filter(Batch.institute_code == inst_code)
    batches = query.all()
    return batches


# =========================================================
# GET BATCH
# =========================================================

@router.get("/{batch_id}")
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    batch = (
        db.query(Batch)
        .filter(Batch.id == batch_id)
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    return {
        "message": "Batch found",
        "batch": batch
    }

# =========================================================
# UPDATE BATCH
# =========================================================

@router.put("/{batch_id}")
def update_batch(
    batch_id: int,
    data: BatchUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role not in ["admin", "institute", "institute_admin", "staff", "faculty"]:
        raise HTTPException(
            status_code=403,
            detail="Only Admins, Staff, and Faculty can update batches"
        )

    batch = (
        db.query(Batch)
        .filter(Batch.id == batch_id)
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=404,
            detail="Batch not found"
        )

    if data.name is not None:
        batch.name = data.name

    if data.course is not None:
        batch.course = data.course

    if data.timing is not None:
        batch.timing = data.timing

    if data.faculty is not None:
        batch.faculty = data.faculty

    db.commit()
    db.refresh(batch)

    return {
        "message": "Batch updated successfully",
        "batch": batch
    }