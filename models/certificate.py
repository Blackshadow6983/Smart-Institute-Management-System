from sqlalchemy import Column, Integer, String, Date

from database.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, nullable=False)

    certificate_number = Column(
        String(100),
        unique=True,
        nullable=False
    )

    certificate_type = Column(
        String(100),
        default="Course Completion"
    )

    issue_date = Column(Date)

    status = Column(
        String(30),
        default="Issued"
    )