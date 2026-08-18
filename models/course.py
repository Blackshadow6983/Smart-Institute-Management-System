from sqlalchemy import Column, Integer, String, Boolean, Date
from database.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    institute_code = Column(
        String(50),
        nullable=True,
        index=True
    )

    course_code = Column(
        String(50),
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    duration = Column(
        String(100),
        nullable=True,
        default="6 Months"
    )

    fees = Column(
        Integer,
        default=0
    )

    mode = Column(
        String(50),
        default="Both",
        nullable=False
    )

    total_classes = Column(
        Integer,
        default=20,
        nullable=False
    )

    start_date = Column(
        String(30),
        nullable=True
    )

    end_date = Column(
        String(30),
        nullable=True
    )

    capacity = Column(
        Integer,
        default=50,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )