import re
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.student import Student
from models.user import User
from models.institute import Institute
from models.course import Course
from models.notification import NotificationLog
from services.password_service import hash_password
from services.email_service import send_student_credentials_email


def generate_student_registration_id(db: Session, institute_code: str) -> str:
    """
    Generates a unique registration ID for a student under the given institute, e.g. ITE-001-STU001
    """
    pattern = f"{institute_code}-STU%"
    existing = (
        db.query(Student.registration_id)
        .filter(Student.registration_id.like(pattern))
        .all()
    )
    
    highest_num = 0
    for row in existing:
        reg_id = row[0]
        m = re.search(r"-STU(\d+)$", reg_id)
        if m:
            val = int(m.group(1))
            if val > highest_num:
                highest_num = val

    next_num = highest_num + 1
    return f"{institute_code}-STU{next_num:03d}"


def register_student(
    db: Session,
    name: str,
    email: str,
    mobile: str,
    password: str,
    institute_code: str = "DEFAULT",
    registration_id: str = None,
    address: str = None,
    date_of_birth: str = None,
    gender: str = "Male",
    parent_name: str = None,
    parent_mobile: str = None,
    parent_email: str = None,
    course: str = None,
    course_duration: str = None,
    course_fee: float = 0.0,
    batch: str = None,
    send_credentials_email: bool = True
):
    # Ensure valid institute code
    inst = db.query(Institute).filter(Institute.institute_code == institute_code).first()
    institute_name = inst.name if inst else "AI Smart Institute"

    # Auto-generate registration ID if not provided or format accordingly
    if not registration_id or not registration_id.strip():
        registration_id = generate_student_registration_id(db, institute_code)
    else:
        registration_id = registration_id.strip().upper()
        # If student ID doesn't already contain institute prefix, prepend it
        if not registration_id.startswith(institute_code) and not registration_id.startswith("STU"):
            registration_id = f"{institute_code}-{registration_id}"

    # Check registration ID uniqueness
    existing_student = (
        db.query(Student)
        .filter(Student.registration_id == registration_id)
        .first()
    )

    if existing_student:
        return None, f"Registration ID {registration_id} already exists"

    # Check username in users table
    existing_user = (
        db.query(User)
        .filter(User.username == registration_id)
        .first()
    )

    if existing_user:
        return None, f"User account for ID {registration_id} already exists"

    # Auto fill course duration and fees if not provided but course selected
    if course and (not course_duration or course_fee == 0.0):
        course_obj = (
            db.query(Course)
            .filter((Course.name == course) | (Course.course_code == course))
            .first()
        )
        if course_obj:
            if not course_duration and course_obj.duration:
                course_duration = course_obj.duration
            if course_fee == 0.0 and course_obj.fees:
                course_fee = float(course_obj.fees)

    # Create student profile
    student = Student(
        institute_code=institute_code,
        registration_id=registration_id,
        name=name.strip(),
        email=email.strip().lower(),
        mobile=mobile.strip(),
        address=address,
        date_of_birth=date_of_birth,
        gender=gender,
        parent_name=parent_name.strip() if parent_name else None,
        parent_mobile=parent_mobile.strip() if parent_mobile else None,
        parent_email=parent_email.strip().lower() if parent_email else None,
        course=course,
        course_duration=course_duration,
        course_fee=float(course_fee or 0.0),
        batch=batch
    )

    db.add(student)
    db.flush()

    # Create login account
    user = User(
        username=registration_id,
        password=hash_password(password),
        role="student",
        institute_code=institute_code,
        must_change_password=False
    )

    db.add(user)
    db.flush()

    # Dispatch Welcome Email to Student's Gmail and Parent's Email
    if send_credentials_email:
        send_student_credentials_email(
            student_email=student.email,
            student_name=student.name,
            registration_id=student.registration_id,
            password=password,
            institute_name=institute_name,
            institute_code=institute_code,
            course_name=student.course,
            course_duration=student.course_duration,
            course_fee=student.course_fee,
            parent_email=student.parent_email
        )

        # Log notification in NotificationLog
        notif = NotificationLog(
            institute_code=institute_code,
            student_id=student.id,
            student_registration_id=student.registration_id,
            recipient_email=student.email,
            recipient_type="student",
            notification_type="welcome_credentials",
            subject=f"Welcome to {institute_name} [{institute_code}] - Credentials",
            message=f"Student ID: {registration_id}, Course: {student.course}, Fee: ₹{student.course_fee}",
            status="Delivered"
        )
        db.add(notif)

    db.commit()
    db.refresh(student)
    db.refresh(user)

    return {
        "student": student,
        "user": user,
        "registration_id": registration_id,
        "temporary_password": password
    }, None