from sqlalchemy import Column, Integer, String, Float

from database.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    institute_code = Column(
        String(50),
        nullable=False,
        default="DEFAULT",
        index=True
    )

    registration_id = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    name = Column(String(100), nullable=False)

    email = Column(
        String(150),
        nullable=False
    )

    mobile = Column(String(20), nullable=False)

    address = Column(String(255), nullable=True)

    date_of_birth = Column(String(30), nullable=True)

    gender = Column(String(20), nullable=True)

    # Parent/Guardian Details
    parent_name = Column(String(100), nullable=True)

    parent_mobile = Column(String(20), nullable=True)

    parent_email = Column(String(150), nullable=True)

    # Academic & Course Details
    course = Column(String(100), nullable=True)

    course_duration = Column(String(50), nullable=True)

    course_fee = Column(Float, default=0.0)

    batch = Column(String(100), nullable=True)

    # Approval & Registration Workflow
    approval_status = Column(String(30), default="Approved", index=True)

    registration_date = Column(String(50), nullable=True)