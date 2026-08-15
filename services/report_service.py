from sqlalchemy.orm import Session

from models.student import Student
from models.attendance import Attendance
from models.fees import Fee
from models.assessment import Assessment
from models.certificate import Certificate
from models.course import Course


def student_report(
    db: Session,
    student_id: int
):
    # =========================================
    # STUDENT
    # =========================================

    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        return None

    # =========================================
    # ATTENDANCE
    # =========================================

    attendance = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student_id
        )
        .all()
    )

    total_attendance = len(attendance)

    present = sum(
        1
        for item in attendance
        if item.status
    )

    attendance_percentage = 0

    if total_attendance > 0:
        attendance_percentage = round(
            present / total_attendance * 100,
            2
        )

    # =========================================
    # FEES
    # =========================================

    fees = (
        db.query(Fee)
        .filter(
            Fee.student_id == student_id
        )
        .all()
    )

    total_paid = sum(
        fee.amount
        for fee in fees
        if fee.status == "Paid"
    )

    # Get course fee
    course_fee = 0

    if student.course:

        course = (
            db.query(Course)
            .filter(
                Course.name == student.course
            )
            .first()
        )

        if course:
            course_fee = course.fees or 0

    pending_fee = max(
        course_fee - total_paid,
        0
    )

    # =========================================
    # ASSESSMENT
    # =========================================

    assessments = (
        db.query(Assessment)
        .filter(
            Assessment.student_id == student_id
        )
        .all()
    )

    total_marks = sum(
        assessment.total_marks or 0
        for assessment in assessments
    )

    marks_obtained = sum(
        assessment.marks or 0
        for assessment in assessments
    )

    result_percentage = 0
    grade = "N/A"

    if total_marks > 0:

        result_percentage = round(
            marks_obtained / total_marks * 100,
            2
        )

        if result_percentage >= 90:
            grade = "A+"

        elif result_percentage >= 80:
            grade = "A"

        elif result_percentage >= 70:
            grade = "B"

        elif result_percentage >= 60:
            grade = "C"

        elif result_percentage >= 50:
            grade = "D"

        else:
            grade = "F"

    # =========================================
    # CERTIFICATES
    # =========================================

    certificates = (
        db.query(Certificate)
        .filter(
            Certificate.student_id == student_id
        )
        .all()
    )

    certificate_list = []

    for certificate in certificates:

        certificate_list.append({
            "id": certificate.id,
            "certificate_number":
                certificate.certificate_number,
            "certificate_type":
                certificate.certificate_type,
            "issue_date":
                certificate.issue_date,
            "status":
                certificate.status
        })

    # =========================================
    # FINAL STUDENT REPORT
    # =========================================

    return {
        "student": {
            "id": student.id,
            "registration_id":
                student.registration_id,
            "name": student.name,
            "email": student.email,
            "course": student.course,
            "batch": student.batch
        },

        "attendance": {
            "total": total_attendance,
            "present": present,
            "percentage":
                attendance_percentage
        },

        "fees": {
            "course_fee": course_fee,
            "total_paid": total_paid,
            "pending_fee": pending_fee
        },

        "result": {
            "total_marks": total_marks,
            "marks_obtained": marks_obtained,
            "percentage":
                result_percentage,
            "grade": grade
        },

        "certificates": certificate_list
    }