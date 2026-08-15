from sqlalchemy import Column, Integer, String, Float

from database.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, nullable=False)

    subject = Column(String(100), nullable=False)

    marks = Column(Float, default=0)

    total_marks = Column(Float, default=100)

    exam_type = Column(String(50))