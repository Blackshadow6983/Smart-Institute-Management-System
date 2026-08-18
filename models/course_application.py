from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)

from datetime import datetime

from database.database import Base


class CourseApplication(Base):

    __tablename__ = "course_applications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=False
    )

    application_date = Column(
        DateTime,
        default=datetime.now,
        nullable=False
    )

    status = Column(
        String(20),
        default="Approved",
        nullable=False
    )

    remarks = Column(
        String(500),
        nullable=True
    )

    learning_mode = Column(
        String(20),
        default="Online",
        nullable=False
    )

    payment_status = Column(
        String(20),
        default="Paid",
        nullable=False
    )

    payment_method = Column(
        String(50),
        default="UPI",
        nullable=True
    )

    amount_paid = Column(
        Integer,
        default=0,
        nullable=False
    )

    completion_status = Column(
        Integer,
        default=0,
        nullable=False
    )

    completion_date = Column(
        DateTime,
        nullable=True
    )