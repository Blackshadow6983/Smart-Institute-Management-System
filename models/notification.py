from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime

from database.database import Base


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)

    institute_code = Column(
        String(50),
        nullable=False,
        index=True
    )

    student_id = Column(
        Integer,
        nullable=True
    )

    student_registration_id = Column(
        String(50),
        nullable=True
    )

    recipient_email = Column(
        String(150),
        nullable=False
    )

    recipient_type = Column(
        String(50),
        default="student"
    )

    notification_type = Column(
        String(50),
        nullable=False
    )

    subject = Column(
        String(255),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    status = Column(
        String(30),
        default="Delivered"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
