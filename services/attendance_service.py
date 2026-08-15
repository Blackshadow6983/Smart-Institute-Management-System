from datetime import date

from sqlalchemy.orm import Session

from models.attendance import Attendance


def mark_attendance(
    db: Session,
    student_id: int,
    attendance_date: date,
    status: bool,
    course=None
):

    attendance = Attendance(
        student_id=student_id,
        date=attendance_date,
        status=status,
        course=course
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance


def get_attendance_percentage(
    db: Session,
    student_id: int
):

    records = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student_id
        )
        .all()
    )

    if not records:
        return 0

    present = sum(
        1 for record in records
        if record.status
    )

    return round(
        (present / len(records)) * 100,
        2
    )