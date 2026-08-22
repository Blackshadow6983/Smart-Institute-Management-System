from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from models.student import Student
from models.fees import Fee
from models.course_application import CourseApplication
from services.fee_service import (
    add_fee,
    get_student_fees,
    get_fee_summary
)
from services.tax_invoice_service import create_tax_invoice

router = APIRouter(
    prefix="/fees",
    tags=["Fees"]
)


class FeeRequest(BaseModel):
    student_id: int
    amount: float
    payment_method: str = "UPI"
    receipt_number: str | None = None
    transaction_id: str | None = None


class StudentPaymentSubmissionRequest(BaseModel):
    amount: float
    payment_method: str = "UPI"
    transaction_id: str


class PaymentVerificationRequest(BaseModel):
    fee_id: int
    status: str  # 'Paid / Successful', 'Failed', 'Cancelled'
    transaction_id: str | None = None
    notes: str | None = None


# =========================================================
# CREATE FEE PAYMENT (ADMIN)
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

    receipt = data.receipt_number or f"REC-{int(datetime.now().timestamp())}"

    fee = add_fee(
        db,
        data.student_id,
        data.amount,
        data.payment_method,
        receipt
    )
    fee.transaction_id = data.transaction_id or receipt
    fee.status = "Paid / Successful"
    fee.verified_by = current_user.get("username")
    fee.verification_date = datetime.now()
    db.commit()

    # Automatically generate Tax Invoice upon creating verified fee
    invoice = None
    try:
        invoice = create_tax_invoice(db, fee.id, transaction_id=fee.transaction_id, verified_by=current_user.get("username"))
    except Exception as e:
        print("Tax Invoice auto-generation note:", e)

    return {
        "message": "Fee payment recorded & verified successfully!",
        "fee": fee,
        "tax_invoice": invoice
    }


# =========================================================
# STUDENT SUBMIT PAYMENT WITH TRANSACTION ID / UTR
# =========================================================
@router.post("/submit-payment")
def student_submit_payment(
    data: StudentPaymentSubmissionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    if role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit fee payments")

    student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    receipt = f"REC-{int(datetime.now().timestamp())}"
    inst_code = student.institute_code or current_user.get("institute_code")

    fee = Fee(
        institute_code=inst_code,
        student_id=student.id,
        amount=data.amount,
        payment_date=date.today(),
        payment_method=data.payment_method or "UPI",
        status="Pending",
        receipt_number=receipt,
        transaction_id=data.transaction_id.strip()
    )

    db.add(fee)
    db.commit()
    db.refresh(fee)

    return {
        "message": f"Payment of ₹{data.amount} submitted with UTR/Txn ID {data.transaction_id}. Pending Institute verification.",
        "fee": fee
    }


# =========================================================
# ADMIN PAYMENT VERIFICATION ENDPOINT
# VERIFIES STATUS: Paid / Successful, Failed, Cancelled
# =========================================================
@router.post("/verify")
def verify_payment_status(
    data: PaymentVerificationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(status_code=403, detail="Admin authorization required for payment verification.")

    fee = db.query(Fee).filter(Fee.id == data.fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee payment record not found.")

    raw_status = data.status.strip()
    norm_status = "Paid / Successful" if raw_status.lower() in ["paid", "paid / successful", "successful", "approved"] else raw_status

    fee.status = norm_status
    fee.verified_by = current_user.get("username")
    fee.verification_date = datetime.now()
    if data.transaction_id:
        fee.transaction_id = data.transaction_id.strip()
    if data.notes:
        fee.verification_notes = data.notes

    # Update associated CourseApplication payment_status if applicable
    app = db.query(CourseApplication).filter(CourseApplication.student_id == fee.student_id).first()
    if app:
        app.payment_status = "Paid" if norm_status == "Paid / Successful" else norm_status
        if app.payment_method is None and fee.payment_method:
            app.payment_method = fee.payment_method

    db.commit()
    db.refresh(fee)

    # Generate Tax Invoice automatically if status is Paid / Successful
    invoice = None
    if norm_status == "Paid / Successful":
        try:
            invoice = create_tax_invoice(
                db=db,
                fee_id=fee.id,
                transaction_id=fee.transaction_id,
                verified_by=current_user.get("username")
            )
        except Exception as err:
            print("Invoice creation note:", err)

    return {
        "message": f"Payment transaction verified as '{norm_status}'.",
        "fee": fee,
        "tax_invoice": invoice
    }


# =========================================================
# ADMIN VIEW ALL FEE TRANSACTIONS & VERIFICATION LIST
# =========================================================
@router.get("/verification-list")
def list_fee_verifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(status_code=403, detail="Admin authorization required.")

    inst_code = current_user.get("institute_code")

    query = db.query(Fee)
    if inst_code:
        query = query.filter(Fee.institute_code == inst_code)

    fees = query.order_by(Fee.id.desc()).all()
    result = []
    for f in fees:
        student = db.query(Student).filter(Student.id == f.student_id).first()
        s_name = student.name if student else "Unknown Student"
        s_reg = student.registration_id if student else "—"
        s_email = student.email if student else "—"

        result.append({
            "id": f.id,
            "student_id": f.student_id,
            "student_name": s_name,
            "registration_id": s_reg,
            "student_email": s_email,
            "amount": f.amount,
            "payment_date": str(f.payment_date) if f.payment_date else None,
            "payment_method": f.payment_method or "UPI",
            "status": f.status or "Pending",
            "receipt_number": f.receipt_number,
            "transaction_id": f.transaction_id,
            "verification_notes": f.verification_notes,
            "verified_by": f.verified_by,
            "verification_date": str(f.verification_date) if f.verification_date else None
        })

    return result


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
        raise HTTPException(status_code=403, detail="Faculty access restricted.")

    if role == "student":
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="You can only view your own fees.")

    return get_student_fees(db, student_id)


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
        raise HTTPException(status_code=403, detail="Faculty access restricted.")

    if role == "student":
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="You can only view your own fee summary.")

    return get_fee_summary(db, student_id)