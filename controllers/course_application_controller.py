from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date, datetime

from database.database import get_db
from security.auth import get_current_user
from models.student import Student
from models.course import Course
from models.course_module import CourseModule
from models.student_module_progress import StudentModuleProgress
from models.course_application import CourseApplication
from models.attendance import Attendance
from models.fees import Fee
from models.certificate import Certificate
from services.certificate_service import create_certificate


router = APIRouter(
    prefix="/course-applications",
    tags=["Course Applications"]
)


# =========================================================
# REQUEST MODELS
# =========================================================

class CourseApplicationRequest(BaseModel):
    course_id: int
    learning_mode: str = "Online"
    payment_method: str = "UPI"
    amount_paid: float | None = None


class CompletionStatusUpdateRequest(BaseModel):
    completion_status: int
    remarks: str | None = None


# =========================================================
# HELPER: Calculate Attendance Percentage for Course
# =========================================================

def _calculate_course_attendance(db: Session, student_id: int, course_name: str | None, course_code: str | None) -> dict:
    query = db.query(Attendance).filter(Attendance.student_id == student_id)
    if course_name or course_code:
        course_records = query.filter(
            (Attendance.course == course_name) | (Attendance.course == course_code)
        ).all()
        records = course_records if course_records else query.all()
    else:
        records = query.all()

    total = len(records)
    if total == 0:
        return {"total": 0, "present": 0, "absent": 0, "percentage": 0.0}

    present = len([r for r in records if r.status])
    absent = total - present
    percentage = round((present / total) * 100, 1)
    return {"total": total, "present": present, "absent": absent, "percentage": percentage}


# =========================================================
# STUDENT - ENROLL IN COURSE & PAY FEES
# =========================================================

@router.post("/")
def apply_for_course(
    data: CourseApplicationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"].lower() != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can enroll in courses"
        )

    student = (
        db.query(Student)
        .filter(Student.registration_id == current_user["username"])
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    course = (
        db.query(Course)
        .filter(Course.id == data.course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    if course.is_active is False:
        raise HTTPException(
            status_code=400,
            detail="This course is currently inactive and not accepting enrollments."
        )

    existing_application = (
        db.query(CourseApplication)
        .filter(
            CourseApplication.student_id == student.id,
            CourseApplication.course_id == course.id
        )
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You are already enrolled in this course"
        )

    paid_amt = data.amount_paid if data.amount_paid is not None else float(course.fees or 0)
    mode = data.learning_mode if data.learning_mode in ["Online", "Offline"] else "Online"
    pay_method = data.payment_method or "UPI"
    inst_code = student.institute_code or current_user.get("institute_code")

    application = CourseApplication(
        student_id=student.id,
        course_id=course.id,
        status="Approved",
        learning_mode=mode,
        payment_status="Pending",
        payment_method=pay_method,
        amount_paid=int(paid_amt),
        completion_status=0
    )

    db.add(application)

    # Record Fee Transaction in Fees table
    fee_receipt = f"REC-{int(datetime.now().timestamp())}"
    fee_entry = Fee(
        institute_code=inst_code,
        student_id=student.id,
        amount=paid_amt,
        payment_date=date.today(),
        payment_method=pay_method,
        status="Pending",
        receipt_number=fee_receipt
    )
    db.add(fee_entry)

    # Set primary course on student if empty
    if not student.course:
        student.course = course.name
        student.course_fee = paid_amt
        student.course_duration = course.duration

    db.commit()
    db.refresh(application)

    return {
        "message": f"Successfully registered for {course.name}! Payment request submitted for Admin verification.",
        "receipt_number": fee_receipt,

        "application": {
            "id": application.id,
            "student_name": student.name,
            "registration_id": student.registration_id,
            "course": course.name,
            "course_code": course.course_code,
            "fees": course.fees,
            "learning_mode": application.learning_mode,
            "payment_status": application.payment_status,
            "payment_method": application.payment_method,
            "amount_paid": application.amount_paid,
            "completion_status": application.completion_status,
            "status": application.status,
            "application_date": application.application_date
        }
    }


# =========================================================
# STUDENT - VIEW OWN ENROLLED COURSES
# =========================================================

@router.get("/my")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"].lower() != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can view their applications"
        )

    student = (
        db.query(Student)
        .filter(Student.registration_id == current_user["username"])
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    applications = (
        db.query(CourseApplication)
        .filter(CourseApplication.student_id == student.id)
        .all()
    )

    result = []
    for app in applications:
        course = db.query(Course).filter(Course.id == app.course_id).first()
        c_name = course.name if course else "Course"
        c_code = course.course_code if course else ""
        c_fees = course.fees if course else 0
        c_duration = course.duration if course else "6 Months"

        att_stats = _calculate_course_attendance(db, student.id, c_name, c_code)

        # Check module progress
        modules = db.query(CourseModule).filter(CourseModule.course_id == app.course_id).all()
        total_mods = len(modules)
        completed_mod_ids = [
            p.module_id for p in db.query(StudentModuleProgress).filter(
                StudentModuleProgress.student_id == student.id,
                StudentModuleProgress.course_id == app.course_id
            ).all()
        ]
        completed_mods = len(completed_mod_ids)

        # Check if certificate issued
        cert = db.query(Certificate).filter(
            Certificate.student_id == student.id,
            Certificate.course_name == c_name
        ).first()

        result.append({
            "id": app.id,
            "student_id": student.id,
            "student_name": student.name,
            "registration_id": student.registration_id,
            "course_id": app.course_id,
            "course": c_name,
            "course_code": c_code,
            "duration": c_duration,
            "fees": c_fees,
            "learning_mode": app.learning_mode or "Online",
            "payment_status": app.payment_status or "Paid",
            "payment_method": app.payment_method or "UPI",
            "amount_paid": app.amount_paid or c_fees,
            "completion_date": str(app.completion_date) if app.completion_date else None,
            "total_modules": total_mods,
            "completed_modules": completed_mods,
            "attendance_stats": att_stats,
            "status": "Completed" if (app.completion_status or 0) >= 100 else "In Progress",
            "certificate_available": (app.completion_status or 0) >= 100,
            "certificate_id": cert.certificate_number if cert else None,
            "remarks": app.remarks,
            "application_date": str(app.application_date) if app.application_date else None
        })

    return result


# =========================================================
# COURSE DETAILS PAGE (STUDENT VIEW)
# =========================================================

@router.get("/{application_id}/details")
def get_application_details(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    app = db.query(CourseApplication).filter(CourseApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    student = db.query(Student).filter(Student.id == app.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user["role"].lower() == "student":
        if student.registration_id != current_user["username"]:
            raise HTTPException(status_code=403, detail="Access denied")

    course = db.query(Course).filter(Course.id == app.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Modules
    modules = db.query(CourseModule).filter(CourseModule.course_id == course.id).order_by(CourseModule.order_index).all()
    completed_records = db.query(StudentModuleProgress).filter(
        StudentModuleProgress.student_id == student.id,
        StudentModuleProgress.course_id == course.id
    ).all()
    completed_map = {p.module_id: p.completed_at for p in completed_records}

    modules_data = [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "order_index": m.order_index,
            "completed": m.id in completed_map,
            "completed_at": str(completed_map.get(m.id)) if completed_map.get(m.id) else None
        }
        for m in modules
    ]

    att_stats = _calculate_course_attendance(db, student.id, course.name, course.course_code)

    # Attendance logs for this course
    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        (Attendance.course == course.name) | (Attendance.course == course.course_code)
    ).order_by(Attendance.date.desc()).all()

    # Certificate
    cert = db.query(Certificate).filter(
        Certificate.student_id == student.id,
        Certificate.course_name == course.name
    ).first()

    return {
        "enrollment": {
            "id": app.id,
            "application_date": str(app.application_date) if app.application_date else None,
            "learning_mode": app.learning_mode,
            "payment_status": app.payment_status,
            "payment_method": app.payment_method,
            "amount_paid": app.amount_paid,
            "completion_status": app.completion_status,
            "completion_date": str(app.completion_date) if app.completion_date else None,
            "status": "Completed" if (app.completion_status or 0) >= 100 else "In Progress"
        },
        "student": {
            "id": student.id,
            "name": student.name,
            "registration_id": student.registration_id,
            "email": student.email,
            "mobile": student.mobile
        },
        "course": {
            "id": course.id,
            "name": course.name,
            "course_code": course.course_code,
            "description": course.description,
            "duration": course.duration,
            "fees": course.fees,
            "mode": course.mode,
            "start_date": course.start_date,
            "total_classes": course.total_classes
        },
        "modules": modules_data,
        "attendance_stats": att_stats,
        "attendance_logs": [
            {"id": a.id, "date": str(a.date), "status": a.status}
            for a in attendance_records
        ],
        "certificate": {
            "available": (app.completion_status or 0) >= 100,
            "certificate_number": cert.certificate_number if cert else None,
            "issue_date": str(cert.issue_date) if cert and cert.issue_date else None
        } if cert or (app.completion_status or 0) >= 100 else None
    }


# =========================================================
# STUDENT - TOGGLE MODULE COMPLETION & TRACK PROGRESS
# =========================================================

@router.post("/{application_id}/modules/{module_id}/toggle")
def toggle_module_completion(
    application_id: int,
    module_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    app = db.query(CourseApplication).filter(CourseApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Enrollment record not found")

    student = db.query(Student).filter(Student.id == app.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    if current_user["role"].lower() == "student":
        if student.registration_id != current_user["username"]:
            raise HTTPException(status_code=403, detail="You can only track progress for your own enrolled courses")

    mod = db.query(CourseModule).filter(CourseModule.id == module_id, CourseModule.course_id == app.course_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found in this course")

    existing_progress = db.query(StudentModuleProgress).filter(
        StudentModuleProgress.student_id == student.id,
        StudentModuleProgress.course_id == app.course_id,
        StudentModuleProgress.module_id == module_id
    ).first()

    if existing_progress:
        db.delete(existing_progress)
        is_completed = False
    else:
        new_p = StudentModuleProgress(
            student_id=student.id,
            course_id=app.course_id,
            module_id=module_id,
            completed_at=datetime.now()
        )
        db.add(new_p)
        is_completed = True

    db.commit()

    # Recalculate progress %
    total_modules = db.query(CourseModule).filter(CourseModule.course_id == app.course_id).count()
    completed_modules = db.query(StudentModuleProgress).filter(
        StudentModuleProgress.student_id == student.id,
        StudentModuleProgress.course_id == app.course_id
    ).count()

    progress_pct = 100 if total_modules == 0 else round((completed_modules / total_modules) * 100)
    app.completion_status = progress_pct

    # Auto-complete & generate certificate if 100%
    cert_generated = False
    cert_no = None
    if progress_pct >= 100:
        if not app.completion_date:
            app.completion_date = datetime.now()
        course = db.query(Course).filter(Course.id == app.course_id).first()
        c_name = course.name if course else "Course Completion"
        
        existing_cert = db.query(Certificate).filter(
            Certificate.student_id == student.id,
            Certificate.course_name == c_name
        ).first()

        if not existing_cert:
            cert_no = f"CERT-2026-{student.registration_id}-{app.course_id}"
            new_cert = create_certificate(
                db=db,
                student_id=student.id,
                certificate_number=cert_no,
                certificate_type="Course Completion Certificate",
                course_name=c_name
            )
            cert_generated = True
        else:
            cert_no = existing_cert.certificate_number

    db.commit()
    db.refresh(app)

    return {
        "message": f"Module {'marked complete' if is_completed else 'unmarked'}. Overall progress: {progress_pct}%",
        "module_id": module_id,
        "is_completed": is_completed,
        "progress_pct": progress_pct,
        "course_completed": progress_pct >= 100,
        "certificate_generated": cert_generated,
        "certificate_id": cert_no
    }


# =========================================================
# ADMIN / FACULTY - VIEW ALL DETAILED APPLICATIONS
# =========================================================

class PaymentStatusUpdateRequest(BaseModel):
    payment_status: str  # "Paid" or "Pending"


@router.get("/all")
def get_all_course_applications(
    course_id: int | None = None,
    learning_mode: str | None = None,
    payment_status: str | None = None,
    is_completed: bool | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only Institute Admins can access enrollment management"
        )

    inst_code = current_user.get("institute_code")

    query = db.query(CourseApplication)
    if course_id:
        query = query.filter(CourseApplication.course_id == course_id)
    if learning_mode:
        query = query.filter(CourseApplication.learning_mode == learning_mode)
    if payment_status:
        query = query.filter(CourseApplication.payment_status == payment_status)
    if is_completed is True:
        query = query.filter(CourseApplication.completion_status >= 100)
    elif is_completed is False:
        query = query.filter(CourseApplication.completion_status < 100)

    applications = query.all()
    result = []

    for app in applications:
        student = db.query(Student).filter(Student.id == app.student_id).first()
        if inst_code and student and student.institute_code != inst_code:
            continue

        course = db.query(Course).filter(Course.id == app.course_id).first()

        c_name = course.name if course else "Course"
        c_code = course.course_code if course else ""
        c_fees = course.fees if course else 0
        c_duration = course.duration if course else "6 Months"

        s_id = student.id if student else app.student_id
        s_name = student.name if student else "Unknown Student"
        s_reg = student.registration_id if student else "—"

        att_stats = _calculate_course_attendance(db, s_id, c_name, c_code)

        result.append({
            "id": app.id,
            "student_id": s_id,
            "student_name": s_name,
            "registration_id": s_reg,
            "course_id": app.course_id,
            "course": c_name,
            "course_code": c_code,
            "duration": c_duration,
            "fees": c_fees,
            "learning_mode": app.learning_mode or "Online",
            "payment_status": app.payment_status or "Pending",
            "payment_method": app.payment_method or "UPI",
            "amount_paid": app.amount_paid or c_fees,
            "completion_status": app.completion_status or 0,
            "completion_date": str(app.completion_date) if app.completion_date else None,
            "status": "Completed" if (app.completion_status or 0) >= 100 else "In Progress",
            "attendance_stats": att_stats,
            "remarks": app.remarks,
            "application_date": str(app.application_date) if app.application_date else None
        })

    return result


# =========================================================
# ADMIN - APPROVE / UPDATE FEE PAYMENT STATUS
# =========================================================

@router.patch("/{application_id}/payment-status")
def update_payment_status(
    application_id: int,
    data: PaymentStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only Institute Admins can approve fee payment status."
        )

    app = db.query(CourseApplication).filter(CourseApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Course application record not found")

    status_val = "Paid" if data.payment_status.lower() in ["paid", "approved"] else "Pending"
    app.payment_status = status_val

    # Also update Fee table status for this student
    fees = db.query(Fee).filter(Fee.student_id == app.student_id).all()
    for f in fees:
        f.status = status_val

    db.commit()
    db.refresh(app)

    return {
        "message": f"Payment status updated to '{status_val}' successfully.",
        "application_id": app.id,
        "payment_status": app.payment_status
    }


# =========================================================
# ADMIN - UPDATE COMPLETION STATUS MANUAL OVERRIDE
# =========================================================

@router.patch("/{application_id}/completion")
def update_completion_status(
    application_id: int,
    data: CompletionStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only Institute Admins can update course completion status"
        )

    app = db.query(CourseApplication).filter(CourseApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Course application record not found")

    new_pct = max(0, min(100, data.completion_status))
    app.completion_status = new_pct
    if data.remarks is not None:
        app.remarks = data.remarks

    if new_pct >= 100 and not app.completion_date:
        app.completion_date = datetime.now()

    db.commit()
    db.refresh(app)

    return {
        "message": f"Course completion status updated to {new_pct}%",
        "application_id": app.id,
        "completion_status": app.completion_status,
        "remarks": app.remarks
    }