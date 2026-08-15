from sqlalchemy import Column, Integer, String

from database.database import Base


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    employee_id = Column(
        String(50),
        unique=True,
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    mobile = Column(
        String(20),
        nullable=False
    )

    address = Column(
        String(255),
        nullable=True
    )

    qualification = Column(
        String(100),
        nullable=True
    )

    specialization = Column(
        String(150),
        nullable=True
    )

    department = Column(
        String(100),
        nullable=True
    )