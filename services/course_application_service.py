from sqlalchemy.orm import Session

from models.course_application import CourseApplication
from models.student import Student
from models.course import Course


# =========================================================
# STUDENT - APPLY FOR COURSE
# =========================================================

def apply_for_course(
    db: Session,
    student_id: int,
    course_id: int
):
    # Check student
    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:
        return None, "Student not found"

    # Check course
    course = (
        db.query(Course)
        .filter(
            Course.id == course_id
        )
        .first()
    )

    if not course:
        return None, "Course not found"

    # Check if already applied
    existing_application = (
        db.query(CourseApplication)
        .filter(
            CourseApplication.student_id == student_id,
            CourseApplication.course_id == course_id,
            CourseApplication.status.in_(
                ["Pending", "Approved"]
            )
        )
        .first()
    )

    if existing_application:
        return None, "You have already applied for this course"

    # Create application
    application = CourseApplication(
        student_id=student_id,
        course_id=course_id,
        status="Pending"
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application, None


# =========================================================
# STUDENT - VIEW OWN APPLICATIONS
# =========================================================

def get_student_applications(
    db: Session,
    student_id: int
):
    return (
        db.query(CourseApplication)
        .filter(
            CourseApplication.student_id == student_id
        )
        .all()
    )


# =========================================================
# ADMIN - VIEW ALL APPLICATIONS
# =========================================================

def get_all_applications(db: Session):

    return (
        db.query(CourseApplication)
        .all()
    )


# =========================================================
# ADMIN - APPLICATION DASHBOARD
# =========================================================

def get_admin_application_summary(
    db: Session
):

    applications = (
        db.query(CourseApplication)
        .all()
    )

    total = len(applications)

    pending = sum(
        1
        for application in applications
        if application.status == "Pending"
    )

    approved = sum(
        1
        for application in applications
        if application.status == "Approved"
    )

    rejected = sum(
        1
        for application in applications
        if application.status == "Rejected"
    )

    application_list = []

    for application in applications:

        # Find student
        student = (
            db.query(Student)
            .filter(
                Student.id == application.student_id
            )
            .first()
        )

        # Find course
        course = (
            db.query(Course)
            .filter(
                Course.id == application.course_id
            )
            .first()
        )

        application_list.append({

            "application_id": application.id,

            "student_name": (
                student.name
                if student
                else None
            ),

            "registration_id": (
                student.registration_id
                if student
                else None
            ),

            "course_id": application.course_id,

            "course_name": (
                course.name
                if course
                else None
            ),

            "status": application.status,

            "application_date": (
                application.application_date
            ),

            "remarks": application.remarks
        })

    return {
        "total_applications": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "applications": application_list
    }


# =========================================================
# ADMIN - APPROVE BY REGISTRATION ID
# =========================================================

def approve_by_registration_id(
    db: Session,
    registration_id: str
):

    # Find student
    student = (
        db.query(Student)
        .filter(
            Student.registration_id == registration_id
        )
        .first()
    )

    if not student:
        return None, "Student not found"

    # Find pending application
    application = (
        db.query(CourseApplication)
        .filter(
            CourseApplication.student_id == student.id,
            CourseApplication.status == "Pending"
        )
        .first()
    )

    if not application:
        return None, "No pending application found for this student"

    # Find course
    course = (
        db.query(Course)
        .filter(
            Course.id == application.course_id
        )
        .first()
    )

    if not course:
        return None, "Course not found"

    # Approve application
    application.status = "Approved"

    # Assign course to student
    student.course = course.name

    db.commit()

    db.refresh(application)
    db.refresh(student)

    return application, None


# =========================================================
# ADMIN - REJECT BY REGISTRATION ID
# =========================================================

def reject_by_registration_id(
    db: Session,
    registration_id: str,
    remarks: str | None = None
):

    # Find student
    student = (
        db.query(Student)
        .filter(
            Student.registration_id == registration_id
        )
        .first()
    )

    if not student:
        return None, "Student not found"

    # Find pending application
    application = (
        db.query(CourseApplication)
        .filter(
            CourseApplication.student_id == student.id,
            CourseApplication.status == "Pending"
        )
        .first()
    )

    if not application:
        return None, "No pending application found for this student"

    # Reject application
    application.status = "Rejected"

    if remarks:
        application.remarks = remarks

    db.commit()

    db.refresh(application)

    return application, None


# =========================================================
# ADMIN - APPROVE USING APPLICATION ID
# =========================================================

def approve_application(
    db: Session,
    application_id: int
):

    application = (
        db.query(CourseApplication)
        .filter(
            CourseApplication.id == application_id
        )
        .first()
    )

    if not application:
        return None, "Application not found"

    if application.status != "Pending":
        return None, "Application has already been processed"

    student = (
        db.query(Student)
        .filter(
            Student.id == application.student_id
        )
        .first()
    )

    if not student:
        return None, "Student not found"

    course = (
        db.query(Course)
        .filter(
            Course.id == application.course_id
        )
        .first()
    )

    if not course:
        return None, "Course not found"

    application.status = "Approved"

    student.course = course.name

    db.commit()

    db.refresh(application)

    return application, None


# =========================================================
# ADMIN - REJECT USING APPLICATION ID
# =========================================================

def reject_application(
    db: Session,
    application_id: int,
    remarks: str | None = None
):

    application = (
        db.query(CourseApplication)
        .filter(
            CourseApplication.id == application_id
        )
        .first()
    )

    if not application:
        return None, "Application not found"

    if application.status != "Pending":
        return None, "Application has already been processed"

    application.status = "Rejected"

    if remarks:
        application.remarks = remarks

    db.commit()

    db.refresh(application)

    return application, None