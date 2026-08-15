from sqlalchemy import Column, Integer, String

from database.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)

    admin_id = Column(
        String(50),
        unique=True,
        nullable=False
    )

    name = Column(String(100), nullable=False)

    email = Column(String(150), unique=True)