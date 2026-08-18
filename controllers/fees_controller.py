
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user

from models.student import Student

from services.fee_service import (
    add_fee,
    get_student_fees,
    get_fee_summary
)


router = APIRouter(
    prefix="/fees",
    tags=["Fees"]
)


# =========================================================
# FEE REQUEST
# =========================================================

class FeeRequest(BaseModel):
    student_id: int
    amount: float
    payment_method: str = "Cash"
    receipt_number: str


# =========================================================
# CREATE FEE PAYMENT
# ADMIN ONLY
# =========================================================

@router.post("/")
def create_fee(
    data: FeeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only Institute Admins can create fee payments"
        )

    fee = add_fee(
        db,
        data.student_id,
        data.amount,
        data.payment_method,
        data.receipt_number
    )

    return {
        "message": "Fee payment saved",
        "fee": fee
    }


# =========================================================
# GET STUDENT FEES
# =========================================================

@router.get("/{student_id}")
def student_fees(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role == "faculty":
        raise HTTPException(
            status_code=403,
            detail="Faculty access is restricted to student attendance only."
        )

    if role == "student":
        student = (
            db.query(Student)
            .filter(Student.registration_id == current_user["username"])
            .first()
        )

        if not student or student.id != student_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own fees"
            )

    elif role in ["admin", "institute", "institute_admin"]:
        pass
    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return get_student_fees(
        db,
        student_id
    )


# =========================================================
# GET FEE SUMMARY
# =========================================================

@router.get("/summary/{student_id}")
def fee_summary(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role == "faculty":
        raise HTTPException(
            status_code=403,
            detail="Faculty access is restricted to student attendance only."
        )

    if role == "student":
        student = (
            db.query(Student)
            .filter(Student.registration_id == current_user["username"])
            .first()
        )

        if not student or student.id != student_id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own fee summary"
            )

    elif role in ["admin", "institute", "institute_admin"]:
        pass
    else:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return get_fee_summary(
        db,
        student_id
    )