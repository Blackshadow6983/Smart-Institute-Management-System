from datetime import date
from sqlalchemy.orm import Session

from models.certificate import Certificate


def create_certificate(
    db: Session,
    student_id: int,
    certificate_number: str,
    certificate_type: str = "Course Completion"
):
    certificate = Certificate(
        student_id=student_id,
        certificate_number=certificate_number,
        certificate_type=certificate_type,
        issue_date=date.today(),
        status="Issued"
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    return certificate


def get_student_certificate(
    db: Session,
    student_id: int
):
    return (
        db.query(Certificate)
        .filter(
            Certificate.student_id == student_id
        )
        .all()
    )