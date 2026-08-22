from datetime import datetime
from sqlalchemy.orm import Session

from models.tax_invoice import TaxInvoice
from models.fees import Fee
from models.student import Student
from models.institute import Institute
from models.course import Course
from models.course_application import CourseApplication


def create_tax_invoice(
    db: Session,
    fee_id: int,
    transaction_id: str | None = None,
    verified_by: str | None = None
) -> TaxInvoice:
    fee = db.query(Fee).filter(Fee.id == fee_id).first()
    if not fee:
        raise ValueError("Fee record not found")

    # Check if tax invoice already generated for this fee
    existing_inv = db.query(TaxInvoice).filter(TaxInvoice.fee_id == fee.id).first()
    if existing_inv:
        if transaction_id and not existing_inv.transaction_id:
            existing_inv.transaction_id = transaction_id
            db.commit()
            db.refresh(existing_inv)
        return existing_inv

    student = db.query(Student).filter(Student.id == fee.student_id).first()
    if not student:
        raise ValueError("Associated student profile not found")

    inst_code = fee.institute_code or student.institute_code or "DEFAULT"
    inst = db.query(Institute).filter(Institute.institute_code == inst_code).first()

    # Find associated course name
    course_name = student.course or "Academic Course Training"
    app = db.query(CourseApplication).filter(CourseApplication.student_id == student.id).first()
    if app:
        c = db.query(Course).filter(Course.id == app.course_id).first()
        if c:
            course_name = c.name

    # Calculate Tax Breakdown (18% GST included: 9% CGST + 9% SGST)
    total_amt = float(fee.amount or 0.0)
    subtotal = round(total_amt / 1.18, 2) if total_amt > 0 else 0.0
    total_tax = round(total_amt - subtotal, 2)
    cgst_amt = round(total_tax / 2.0, 2)
    sgst_amt = round(total_tax - cgst_amt, 2)

    now_str = datetime.now().strftime("%Y%m%d")
    inv_num = f"INV-{now_str}-{fee.id:05d}"
    txn_ref = transaction_id or fee.transaction_id or fee.receipt_number or f"TXN-{fee.id:06d}"

    invoice = TaxInvoice(
        invoice_number=inv_num,
        institute_code=inst_code,
        student_id=student.id,
        fee_id=fee.id,
        application_id=app.id if app else None,
        student_name=student.name,
        registration_id=student.registration_id,
        student_email=student.email,
        student_mobile=student.mobile,
        student_address=student.address,
        course_name=course_name,
        hsn_sac_code="999293",
        subtotal_amount=subtotal,
        cgst_rate=9.0,
        cgst_amount=cgst_amt,
        sgst_rate=9.0,
        sgst_amount=sgst_amt,
        igst_rate=0.0,
        igst_amount=0.0,
        total_tax_amount=total_tax,
        total_amount=total_amt,
        payment_method=fee.payment_method or "UPI",
        transaction_id=txn_ref,
        payment_date=str(fee.payment_date or datetime.now().date()),
        status="Paid / Successful",
        created_at=datetime.now()
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return invoice


def get_invoice_by_id(db: Session, invoice_id: int) -> TaxInvoice | None:
    return db.query(TaxInvoice).filter(TaxInvoice.id == invoice_id).first()


def get_student_tax_invoices(db: Session, student_id: int):
    return db.query(TaxInvoice).filter(TaxInvoice.student_id == student_id).order_by(TaxInvoice.id.desc()).all()


def get_institute_tax_invoices(db: Session, institute_code: str):
    return db.query(TaxInvoice).filter(TaxInvoice.institute_code == institute_code).order_by(TaxInvoice.id.desc()).all()
