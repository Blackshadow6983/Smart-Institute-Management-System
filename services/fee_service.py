from sqlalchemy.orm import Session

from models.fees import Fee
from models.course import Course
from models.student import Student


# =========================================================
# ADD FEE PAYMENT
# =========================================================

def add_fee(
    db: Session,
    student_id: int,
    amount: float,
    payment_method: str,
    receipt_number: str
):
    fee = Fee(
        student_id=student_id,
        amount=amount,
        payment_method=payment_method,
        receipt_number=receipt_number,
        status="Paid"
    )

    db.add(fee)
    db.commit()
    db.refresh(fee)

    return fee


# =========================================================
# GET STUDENT FEES
# =========================================================

def get_student_fees(
    db: Session,
    student_id: int
):
    return (
        db.query(Fee)
        .filter(Fee.student_id == student_id)
        .order_by(Fee.id.desc())
        .all()
    )


# =========================================================
# GET FEE SUMMARY
# =========================================================

def get_fee_summary(
    db: Session,
    student_id: int
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        return {
            "student_id": student_id,
            "course_fee": 0,
            "total_paid": 0,
            "pending_fee": 0
        }

    # Use student's individual course fee first if specified
    course_fee = float(student.course_fee or 0)

    if course_fee <= 0 and student.course:
        # Find course using student's course
        course = (
            db.query(Course)
            .filter((Course.name == student.course) | (Course.course_code == student.course))
            .first()
        )
        if course and course.fees:
            course_fee = float(course.fees)

    # Get all payments
    fees = (
        db.query(Fee)
        .filter(Fee.student_id == student_id)
        .all()
    )

    total_paid = sum(
        fee.amount
        for fee in fees
        if fee.status and fee.status.lower() == "paid"
    )

    pending_fee = max(
        course_fee - total_paid,
        0
    )

    return {
        "student_id": student_id,
        "course_fee": course_fee,
        "total_paid": total_paid,
        "pending_fee": pending_fee
    }