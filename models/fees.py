from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from datetime import datetime
from database.database import Base


class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)

    institute_code = Column(
        String(50),
        nullable=True,
        index=True
    )

    student_id = Column(
        Integer,
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    payment_date = Column(Date)

    payment_method = Column(
        String(50)
    )

    # Status: Paid / Successful, Pending, Failed, Cancelled
    status = Column(
        String(50),
        default="Pending"
    )

    receipt_number = Column(
        String(100)
    )

    transaction_id = Column(
        String(100),
        nullable=True
    )

    verification_notes = Column(
        String(255),
        nullable=True
    )

    verified_by = Column(
        String(100),
        nullable=True
    )

    verification_date = Column(
        DateTime,
        nullable=True
    )