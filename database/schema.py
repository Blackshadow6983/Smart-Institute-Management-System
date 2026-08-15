from database.database import Base, engine
from models.attendance import Attendance

import models


def create_tables():
    Base.metadata.create_all(bind=engine)