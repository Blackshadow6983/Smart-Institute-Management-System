import re
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.institute import Institute
from models.student import Student
from models.user import User
from models.admin import Admin
from models.course import Course
from models.fees import Fee
from models.notification import NotificationLog
from services.password_service import hash_password


def generate_institute_code(db: Session, institute_name: str, preferred_code: str = None) -> str:
    """
    Generates a clean, unique institute code such as LNO-001, ITE-001, ITE-002, etc.
    If preferred_code is provided and available, respects it.
    """
    if preferred_code and preferred_code.strip():
        raw = preferred_code.strip().upper()
        # Format candidate code (e.g. LNO02 -> LNO-002 if prefix + digits, or keep as is)
        m = re.match(r"^([A-Z]+)[-_]?(\d+)$", raw)
        if m:
            pref_alpha = m.group(1)[:6]
            pref_num = int(m.group(2))
            candidate = f"{pref_alpha}-{pref_num:03d}"
        else:
            candidate = re.sub(r"[^A-Z0-9-]", "", raw)[:12]

        if candidate:
            existing = db.query(Institute).filter(Institute.institute_code == candidate).first()
            if not existing:
                return candidate

        # Fallback prefix extraction if preferred code was already taken
        m_prefix = re.match(r"^([A-Z]+)", raw)
        prefix = m_prefix.group(1)[:6] if m_prefix else "INST"
    else:
        # Extract abbreviation from institute name e.g. "LinearNovo" -> "LNO" or words
        words = re.findall(r"[A-Za-z0-9]+", institute_name)
        if len(words) >= 2:
            prefix = "".join(w[0].upper() for w in words if w.lower() not in ["of", "and", "the", "&"])[:5]
        elif len(words) == 1 and len(words[0]) >= 3:
            prefix = words[0][:3].upper()
        else:
            prefix = "INST"

    if len(prefix) < 2:
        prefix = "INST"

    # Find all existing codes with this prefix (e.g. LNO-001, LNO-002...)
    pattern = f"{prefix}-%"
    existing = (
        db.query(Institute.institute_code)
        .filter(Institute.institute_code.like(pattern))
        .all()
    )

    existing_codes = {row[0] for row in existing}

    # Find highest sequence number
    highest_num = 0
    for code in existing_codes:
        m = re.search(r"-(\d+)$", code)
        if m:
            val = int(m.group(1))
            if val > highest_num:
                highest_num = val

    next_num = highest_num + 1
    return f"{prefix}-{next_num:03d}"


def create_institute(
    db: Session,
    name: str,
    email: str,
    password: str,
    contact_number: str = None,
    address: str = None,
    preferred_code: str = None
):
    # Check email in institutes
    existing_inst = db.query(Institute).filter(Institute.email == email.strip().lower()).first()
    if existing_inst:
        return None, "An institute is already registered with this email address"

    # Generate unique institute code
    inst_code = generate_institute_code(db, name, preferred_code)

    # Check username in users
    existing_user = db.query(User).filter(User.username == inst_code).first()
    if existing_user:
        return None, f"User account with code {inst_code} already exists"

    institute = Institute(
        institute_code=inst_code,
        name=name.strip(),
        email=email.strip().lower(),
        contact_number=contact_number,
        address=address,
        admin_username=inst_code
    )

    db.add(institute)
    db.flush()

    # Create admin user account
    user = User(
        username=inst_code,
        password=hash_password(password),
        role="admin",
        institute_code=inst_code,
        must_change_password=False
    )
    db.add(user)

    # Create Admin record for legacy compatibility
    admin_rec = Admin(
        admin_id=inst_code,
        name=name.strip(),
        email=email.strip().lower()
    )
    db.add(admin_rec)

    # Add default foundation courses for this institute
    default_courses = [
        Course(
            institute_code=inst_code,
            course_code=f"{inst_code}-CS101",
            name="Computer Science & Engineering",
            description="Foundation & Advanced Computer Science Program",
            duration="4 Years",
            fees=45000
        ),
        Course(
            institute_code=inst_code,
            course_code=f"{inst_code}-AI201",
            name="Artificial Intelligence & Data Science",
            description="Machine Learning, Deep Learning, and AI Systems",
            duration="1 Year",
            fees=35000
        ),
        Course(
            institute_code=inst_code,
            course_code=f"{inst_code}-WD100",
            name="Full Stack Web Development Bootcamp",
            description="Modern Web Applications with React & Python",
            duration="6 Months",
            fees=20000
        )
    ]
    for c in default_courses:
        db.add(c)

    db.commit()
    db.refresh(institute)
    db.refresh(user)

    return {
        "institute": institute,
        "user": user,
        "institute_code": inst_code
    }, None


def get_institute_by_code(db: Session, institute_code: str):
    return db.query(Institute).filter(Institute.institute_code == institute_code).first()


def get_institute_for_user(db: Session, current_user: dict):
    # Try finding institute by institute_code in token or user
    inst_code = current_user.get("institute_code")
    if inst_code:
        inst = get_institute_by_code(db, inst_code)
        if inst:
            return inst

    username = current_user.get("username")
    inst = db.query(Institute).filter(
        (Institute.institute_code == username) | (Institute.admin_username == username)
    ).first()
    if inst:
        return inst

    # Check if student's institute
    if current_user.get("role") == "student":
        student = db.query(Student).filter(Student.registration_id == username).first()
        if student and student.institute_code:
            return get_institute_by_code(db, student.institute_code)

    # Fallback to first institute or create default
    return db.query(Institute).first()


def get_institute_stats(db: Session, institute_code: str):
    total_students = (
        db.query(func.count(Student.id))
        .filter(Student.institute_code == institute_code)
        .scalar() or 0
    )

    total_courses = (
        db.query(func.count(Course.id))
        .filter((Course.institute_code == institute_code) | (Course.institute_code == None))
        .scalar() or 0
    )

    students = db.query(Student).filter(Student.institute_code == institute_code).all()
    student_ids = [s.id for s in students]

    total_course_fee_value = sum(float(s.course_fee or 0) for s in students)

    total_fees_collected = 0.0
    if student_ids:
        total_fees_collected = (
            db.query(func.sum(Fee.amount))
            .filter(Fee.student_id.in_(student_ids), Fee.status.ilike("paid"))
            .scalar() or 0.0
        )

    pending_fees = max(float(total_course_fee_value) - float(total_fees_collected), 0.0)

    recent_students = (
        db.query(Student)
        .filter(Student.institute_code == institute_code)
        .order_by(Student.id.desc())
        .limit(6)
        .all()
    )

    recent_notifications = (
        db.query(NotificationLog)
        .filter(NotificationLog.institute_code == institute_code)
        .order_by(NotificationLog.id.desc())
        .limit(8)
        .all()
    )

    return {
        "institute_code": institute_code,
        "total_students": total_students,
        "total_courses": total_courses,
        "total_course_fee_value": float(total_course_fee_value),
        "total_fees_collected": float(total_fees_collected),
        "pending_fees": float(pending_fees),
        "recent_students": recent_students,
        "recent_notifications": recent_notifications
    }
