from datetime import datetime, timedelta, timezone

from jose import jwt
from sqlalchemy.orm import Session

from config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

from models.user import User
from models.institute import Institute
from models.student import Student

from services.password_service import (
    verify_password,
    hash_password
)


def authenticate_user(
    db: Session,
    username: str,
    password: str
):
    clean_username = username.strip()
    clean_lower = clean_username.lower()
    import re
    from sqlalchemy import func

    # 1. Direct match (exact or case-insensitive)
    user = (
        db.query(User)
        .filter(func.lower(User.username) == clean_lower)
        .first()
    )

    # 2. Match unhyphenated or formatted institute code variants (e.g. LNO001 -> LNO-001, LNO02 -> LNO-002)
    if not user:
        m = re.match(r"^([A-Za-z]+)[-_]?(\d+)$", clean_username)
        if m:
            prefix = m.group(1).upper()
            num = int(m.group(2))
            formatted_candidate = f"{prefix}-{num:03d}"
            user = db.query(User).filter(func.lower(User.username) == formatted_candidate.lower()).first()

    # 3. Match username ignoring hyphens and non-alphanumeric characters
    if not user:
        clean_no_hyphen = re.sub(r"[^a-zA-Z0-9]", "", clean_lower)
        all_users = db.query(User).all()
        for u in all_users:
            if u.username and re.sub(r"[^a-zA-Z0-9]", "", u.username.lower()) == clean_no_hyphen:
                user = u
                break

    # 4. If not found by username/code, try matching institute email
    if not user:
        inst = db.query(Institute).filter(func.lower(Institute.email) == clean_lower).first()
        if inst:
            user = db.query(User).filter(User.username == inst.institute_code).first()

    # 5. Try matching student email
    if not user:
        student = db.query(Student).filter(func.lower(Student.email) == clean_lower).first()
        if student:
            user = db.query(User).filter(User.username == student.registration_id).first()

    if not user:
        return None

    if not user.is_active:
        return None

    if not verify_password(
        password,
        user.password
    ):
        return None

    return user


def create_access_token(user: User):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    data = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "institute_code": user.institute_code,
        "exp": expire
    }

    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def change_password(
    db: Session,
    user: User,
    new_password: str
):
    user.password = hash_password(new_password)
    user.must_change_password = False
    db.commit()
    return True