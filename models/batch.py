from sqlalchemy import Column, Integer, String

from database.database import Base


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String(100),
        nullable=False
    )

    course = Column(String(100))

    timing = Column(String(100))

    faculty = Column(String(100))