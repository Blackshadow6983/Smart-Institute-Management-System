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

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
