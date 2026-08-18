from sqlalchemy import Column, Integer, String, ForeignKey
from database.database import Base


class CourseModule(Base):
    __tablename__ = "course_modules"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    order_index = Column(Integer, default=1, nullable=False)
