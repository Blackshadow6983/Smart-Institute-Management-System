from database.database import SessionLocal
from models.user import User
from services.password_service import hash_password


def seed_admin():
    db = SessionLocal()

    try:
        existing = (
            db.query(User)
            .filter(User.username == "admin")
            .first()
        )

        if existing:
            print("Admin already exists")
            return

        admin = User(
            username="admin",
            password=hash_password("admin123"),
            role="admin",
            must_change_password=False
        )

        db.add(admin)
        db.commit()

        print("Admin created")

    finally:
        db.close()


def seed_faculty():
    db = SessionLocal()

    try:
        existing = (
            db.query(User)
            .filter(User.username == "faculty001")
            .first()
        )

        if existing:
            print("Faculty already exists")
            return

        faculty = User(
            username="faculty001",
            password=hash_password("faculty123"),
            role="faculty",
            must_change_password=False
        )

        db.add(faculty)
        db.commit()

        print("Faculty created")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
    seed_faculty()