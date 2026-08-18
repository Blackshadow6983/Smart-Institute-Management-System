from sqlalchemy import Column, Integer, DateTime, ForeignKey
from datetime import datetime
from database.database import Base


class StudentModuleProgress(Base):
    __tablename__ = "student_module_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    module_id = Column(Integer, ForeignKey("course_modules.id"), nullable=False, index=True)
    completed_at = Column(DateTime, default=datetime.now, nullable=False)
