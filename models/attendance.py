from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey

from database.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    date = Column(
        Date,
        nullable=False
    )

    status = Column(
        Boolean,
        default=False,
        nullable=False
    )

    course = Column(
        String(100),
        nullable=False
    )