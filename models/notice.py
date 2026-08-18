from sqlalchemy import Column, Integer, String, Text, DateTime

from database.database import Base


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)

    institute_code = Column(
        String(50),
        nullable=True,
        index=True
    )

    title = Column(String(200), nullable=False)

    message = Column(Text, nullable=False)

    created_at = Column(DateTime)