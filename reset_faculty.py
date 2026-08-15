from database.database import SessionLocal
from models.user import User
from services.password_service import hash_password


db = SessionLocal()

try:
    faculty = (
        db.query(User)
        .filter(User.username == "faculty001")
        .first()
    )

    if faculty:
        faculty.password = hash_password("faculty123")
        faculty.role = "faculty"
        faculty.is_active = True
        faculty.must_change_password = False

        print("Faculty user already existed. Password reset.")

    else:
        faculty = User(
            username="faculty001",
            password=hash_password("faculty123"),
            role="faculty",
            is_active=True,
            must_change_password=False
        )

        db.add(faculty)
        print("Faculty user created.")

    db.commit()

finally:
    db.close()