from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database.database import Base


class TaxInvoice(Base):
    __tablename__ = "tax_invoices"

    id = Column(Integer, primary_key=True, index=True)

    invoice_number = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    institute_code = Column(
        String(50),
        nullable=True,
        index=True
    )

    student_id = Column(Integer, nullable=False, index=True)
    fee_id = Column(Integer, nullable=True)
    application_id = Column(Integer, nullable=True)

    student_name = Column(String(150), nullable=False)
    registration_id = Column(String(100), nullable=False)
    student_email = Column(String(150), nullable=True)
    student_mobile = Column(String(50), nullable=True)
    student_address = Column(String(255), nullable=True)

    course_name = Column(String(150), nullable=False)
    hsn_sac_code = Column(String(50), default="999293")

    subtotal_amount = Column(Float, nullable=False)
    cgst_rate = Column(Float, default=9.0)
    cgst_amount = Column(Float, default=0.0)
    sgst_rate = Column(Float, default=9.0)
    sgst_amount = Column(Float, default=0.0)
    igst_rate = Column(Float, default=0.0)
    igst_amount = Column(Float, default=0.0)
    total_tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)

    payment_method = Column(String(50), default="UPI")
    transaction_id = Column(String(100), nullable=True)
    payment_date = Column(String(50), nullable=True)

    status = Column(String(50), default="Paid")  # Paid / Successful
    created_at = Column(DateTime, default=datetime.now)
