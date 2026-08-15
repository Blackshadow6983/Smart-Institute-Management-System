from sqlalchemy import Column, Integer, String, Float, Date

from database.database import Base


class Fee(Base):
    __tablename__ = "fees"

    id = Column(Integer, primary_key=True, index=True)

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

    status = Column(
        String(30),
        default="Paid"
    )

    receipt_number = Column(
        String(100)
    )