from sqlalchemy import Column, Integer, String, Boolean

from database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(30),
        nullable=False
    )

    institute_code = Column(
        String(50),
        nullable=True,
        index=True
    )

    is_active = Column(
        Boolean,
        default=True
    )

    must_change_password = Column(
        Boolean,
        default=False
    )