from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from database.database import Base


class Institute(Base):
    __tablename__ = "institutes"

    id = Column(Integer, primary_key=True, index=True)

    institute_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    contact_number = Column(
        String(50),
        nullable=True
    )

    address = Column(
        String(255),
        nullable=True
    )

    admin_username = Column(
        String(100),
        nullable=False
    )

    # Payment Settings for Institute
    payment_upi_id = Column(String(100), nullable=True)
    payment_upi_number = Column(String(50), nullable=True)
    payment_account_holder = Column(String(150), nullable=True)
    payment_bank_name = Column(String(150), nullable=True)
    payment_account_number = Column(String(100), nullable=True)
    payment_ifsc_code = Column(String(50), nullable=True)
    payment_qr_code_url = Column(String(500), nullable=True)
    payment_bank_details = Column(String(500), nullable=True)
    payment_instructions = Column(String(500), nullable=True)


    # Certificate Template Settings for Institute
    certificate_title = Column(String(150), nullable=True)
    certificate_signatory_name = Column(String(100), nullable=True)
    certificate_logo_url = Column(String(500), nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
