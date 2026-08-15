from sqlalchemy import Column, Integer, String

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
        default="1 Year"
    )

    fees = Column(
        Integer,
        default=0
    )