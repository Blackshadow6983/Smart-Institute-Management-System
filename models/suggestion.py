from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database.database import Base


class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True, index=True)

    institute_code = Column(
        String(50),
        nullable=True,
        index=True
    )

    user_id = Column(String(100), nullable=True)
    user_name = Column(String(100), nullable=True)
    user_role = Column(String(50), nullable=True)

    title = Column(String(200), nullable=False)
    category = Column(String(100), default="General")
    message = Column(Text, nullable=False)
    
    status = Column(String(50), default="Pending")  # Pending, Reviewed, Resolved
    admin_response = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.now)
