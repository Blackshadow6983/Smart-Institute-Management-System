from sqlalchemy.orm import Session

from models.assessment import Assessment


def add_assessment(
    db: Session,
    student_id: int,
    subject: str,
    marks: float,
    total_marks: float,
    exam_type: str
):
    assessment = Assessment(
        student_id=student_id,
        subject=subject,
        marks=marks,
        total_marks=total_marks,
        exam_type=exam_type
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment


def get_student_results(
    db: Session,
    student_id: int
):
    return (
        db.query(Assessment)
        .filter(
            Assessment.student_id == student_id
        )
        .all()
    )


def calculate_result(
    db: Session,
    student_id: int
):
    records = (
        db.query(Assessment)
        .filter(
            Assessment.student_id == student_id
        )
        .all()
    )

    if not records:
        return {
            "student_id": student_id,
            "total_marks": 0,
            "marks_obtained": 0,
            "percentage": 0,
            "grade": "N/A"
        }

    total_marks = sum(
        record.total_marks for record in records
    )

    marks_obtained = sum(
        record.marks for record in records
    )

    if total_marks == 0:
        percentage = 0
    else:
        percentage = round(
            (marks_obtained / total_marks) * 100,
            2
        )

    if percentage >= 75:
        grade = "A"
    elif percentage >= 60:
        grade = "B"
    elif percentage >= 50:
        grade = "C"
    elif percentage >= 35:
        grade = "D"
    else:
        grade = "F"

    return {
        "student_id": student_id,
        "total_marks": total_marks,
        "marks_obtained": marks_obtained,
        "percentage": percentage,
        "grade": grade
    }