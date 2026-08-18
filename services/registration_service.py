import re
from datetime import datetime
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

    existing_user = db.query(User).filter(User.username == registration_id).first()
    if existing_user:
        return None, f"User account for ID {registration_id} already exists"

    # Check duplicate email
    clean_email = email.strip().lower()
    existing_email_student = db.query(Student).filter(func.lower(Student.email) == clean_email).first()
    if existing_email_student:
        return None, f"A student with email '{clean_email}' is already registered. Please log in directly or use a different email address."

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
        batch=batch,
        approval_status="Approved",
        registration_date=datetime.now().strftime("%Y-%m-%d %H:%M")
    )

    db.add(student)
    db.flush()

    # Create login account
    user = User(
        username=registration_id,
        password=hash_password(password),
        role="student",
        institute_code=institute_code,
        is_active=True,
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

    # Auto-create CourseApplication if course specified
    if course:
        from models.course_application import CourseApplication
        c_obj = db.query(Course).filter((Course.name == course) | (Course.course_code == course)).first()
        if c_obj:
            app = CourseApplication(
                student_id=student.id,
                course_id=c_obj.id,
                learning_mode="Online",
                payment_status="Paid",
                payment_method="UPI",
                amount_paid=float(c_obj.fees or 0),
                completion_status=0
            )
            db.add(app)

    db.commit()
    db.refresh(student)
    db.refresh(user)

    return {
        "student": student,
        "user": user,
        "registration_id": registration_id,
        "temporary_password": password
    }, None


def register_student_pending(
    db: Session,
    name: str,
    email: str,
    mobile: str,
    password: str,
    institute_code: str,
    course: str = None
):
    from datetime import datetime

    clean_inst = institute_code.strip().upper()
    # Check if institute exists
    inst = db.query(Institute).filter(func.upper(Institute.institute_code) == clean_inst).first()
    if not inst:
        # Check if user with institute code exists
        user_inst = db.query(User).filter(func.upper(User.institute_code) == clean_inst).first()
        if not user_inst and clean_inst != "DEFAULT":
            return None, f"Institute Code '{clean_inst}' not found. Please verify the institute code."

    clean_email = email.strip().lower()
    clean_name = name.strip()
    clean_mobile = mobile.strip()

    # Check if student email already registered
    existing_stu = db.query(Student).filter(func.lower(Student.email) == clean_email).first()
    if existing_stu:
        if existing_stu.approval_status == "Pending":
            return None, "A registration request with this email is already pending approval by the Institute."
        elif existing_stu.approval_status == "Approved":
            return None, "An account with this email is already registered and approved."

    # Create temporary registration reference ID
    ref_num = f"REQ-{datetime.now().strftime('%Y%m%d')}-{int(datetime.now().timestamp()) % 10000:04d}"

    # Auto fill course fee if course selected
    course_fee = 0.0
    course_duration = "1 Year"
    if course:
        c_obj = db.query(Course).filter((Course.name == course) | (Course.course_code == course)).first()
        if c_obj:
            if c_obj.fees:
                course_fee = float(c_obj.fees)
            if c_obj.duration:
                course_duration = c_obj.duration

    student = Student(
        institute_code=clean_inst,
        registration_id=ref_num,
        name=clean_name,
        email=clean_email,
        mobile=clean_mobile,
        course=course,
        course_duration=course_duration,
        course_fee=course_fee,
        approval_status="Pending",
        registration_date=datetime.now().strftime("%Y-%m-%d %H:%M")
    )
    db.add(student)
    db.flush()

    # Create inactive login user account with temporary username
    user = User(
        username=ref_num,
        password=hash_password(password),
        role="student",
        institute_code=clean_inst,
        is_active=False,
        must_change_password=False
    )
    db.add(user)
    db.flush()

    # Log notification for Institute Admin
    notif = NotificationLog(
        institute_code=clean_inst,
        student_id=student.id,
        student_registration_id=ref_num,
        recipient_email=inst.email if inst else clean_email,
        recipient_type="admin",
        notification_type="new_student_registration_request",
        subject=f"New Student Registration Request: {clean_name}",
        message=f"Student {clean_name} ({clean_email}) registered for course '{course}' under Institute Code {clean_inst}. Pending Approval.",
        status="Unread"
    )
    db.add(notif)

    db.commit()
    db.refresh(student)

    return {
        "student": student,
        "reference_id": ref_num,
        "institute_code": clean_inst,
        "status": "Pending",
        "message": f"Registration request submitted to Institute [{clean_inst}]. Once approved by the Institute Admin, your official Enrollment Number will be issued for login."
    }, None


def approve_student_registration(
    db: Session,
    student_id: int,
    assigned_registration_id: str = None
):
    from models.course_application import CourseApplication

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None, "Student registration request not found"

    if student.approval_status == "Approved":
        return None, "Student is already approved"

    inst_code = student.institute_code or "DEFAULT"

    # Generate or format Enrollment Number
    if not assigned_registration_id or not assigned_registration_id.strip():
        assigned_registration_id = generate_student_registration_id(db, inst_code)
    else:
        assigned_registration_id = assigned_registration_id.strip().upper()
        if not assigned_registration_id.startswith(inst_code) and not assigned_registration_id.startswith("STU"):
            assigned_registration_id = f"{inst_code}-{assigned_registration_id}"

    # Check for existing user username conflicts
    user = db.query(User).filter((User.username == student.registration_id) | (User.username == student.email)).first()
    if not user:
        user = db.query(User).filter(User.id == student.id).first()

    old_ref = student.registration_id

    student.registration_id = assigned_registration_id
    student.approval_status = "Approved"

    if user:
        user.username = assigned_registration_id
        user.is_active = True
        user.institute_code = inst_code

    # Automatically create CourseApplication if student selected a course
    if student.course:
        c_obj = db.query(Course).filter((Course.name == student.course) | (Course.course_code == student.course)).first()
        if c_obj:
            # Check existing application
            existing_app = db.query(CourseApplication).filter(
                CourseApplication.student_id == student.id,
                CourseApplication.course_id == c_obj.id
            ).first()
            if not existing_app:
                app = CourseApplication(
                    student_id=student.id,
                    course_id=c_obj.id,
                    learning_mode="Online",
                    payment_status="Paid",
                    payment_method="UPI",
                    amount_paid=float(c_obj.fees or 0),
                    completion_status=0
                )
                db.add(app)

    db.commit()
    db.refresh(student)

    return {
        "student": student,
        "registration_id": assigned_registration_id,
        "message": f"Student request accepted! Assigned Enrollment Number: {assigned_registration_id}. Student account activated."
    }, None


def reject_student_registration(db: Session, student_id: int, reason: str = None):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return None, "Student registration request not found"

    student.approval_status = "Rejected"

    user = db.query(User).filter((User.username == student.registration_id) | (User.username == student.email)).first()
    if user:
        user.is_active = False

    db.commit()
    return {"message": f"Registration request for {student.name} rejected."}, None


def get_pending_student_approvals(db: Session, institute_code: str = None):
    query = db.query(Student).filter(Student.approval_status == "Pending")
    if institute_code and institute_code != "DEFAULT":
        query = query.filter(func.upper(Student.institute_code) == institute_code.upper())
    
    pending = query.order_by(Student.id.desc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "mobile": s.mobile,
            "institute_code": s.institute_code,
            "registration_id": s.registration_id,
            "course": s.course or "Not Selected",
            "course_fee": s.course_fee or 0,
            "registration_date": s.registration_date,
            "approval_status": s.approval_status
        }
        for s in pending
    ]