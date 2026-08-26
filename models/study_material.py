from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)
from datetime import datetime
from database.database import Base


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)

    institute_code = Column(
        String(50),
        nullable=False,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        String(1000),
        nullable=True
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    file_type = Column(
        String(50),
        nullable=False
    )

    file_size = Column(
        Integer,
        nullable=False,
        default=0
    )

    course_id = Column(
        Integer,
        ForeignKey("courses.id"),
        nullable=True
    )

    course_name = Column(
        String(150),
        nullable=True
    )

    batch_id = Column(
        Integer,
        ForeignKey("batches.id"),
        nullable=True
    )

    batch_name = Column(
        String(150),
        nullable=True
    )

    uploaded_by = Column(
        String(100),
        nullable=False
    )

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
