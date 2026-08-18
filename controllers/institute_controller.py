from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user, require_admin
from models.institute import Institute
from models.student import Student
from models.course import Course
from models.notification import NotificationLog
from services.institute_service import (
    create_institute,
    get_institute_by_code,
    get_institute_for_user,
    get_institute_stats
)
from services.email_service import send_fee_notification_email
from services.fee_service import get_fee_summary


router = APIRouter(
    prefix="/institutes",
    tags=["Institutes"]
)


class InstituteRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    contact_number: str | None = None
    address: str | None = None
    preferred_code: str | None = None


class InstituteUpdateRequest(BaseModel):
    name: str | None = None
    contact_number: str | None = None
    address: str | None = None
    payment_upi_id: str | None = None
    payment_qr_code_url: str | None = None
    payment_bank_details: str | None = None
    payment_instructions: str | None = None
    certificate_title: str | None = None
    certificate_signatory_name: str | None = None
    certificate_logo_url: str | None = None


class SendFeeNotificationRequest(BaseModel):
    student_id: int
    custom_note: str | None = None


# =========================================================
# INSTITUTE REGISTRATION (Admin Sign-Up)
# =========================================================

@router.post("/register")
def register_institute(
    data: InstituteRegisterRequest,
    db: Session = Depends(get_db)
):
    result, error = create_institute(
        db=db,
        name=data.name,
        email=data.email,
        password=data.password,
        contact_number=data.contact_number,
        address=data.address,
        preferred_code=data.preferred_code
    )

    if error:
        raise HTTPException(
            status_code=400,
            detail=error
        )

    inst = result["institute"]
    user = result["user"]

    return {
        "message": "Institute registered successfully!",
        "institute": {
            "id": inst.id,
            "institute_code": inst.institute_code,
            "name": inst.name,
            "email": inst.email,
            "contact_number": inst.contact_number,
            "address": inst.address
        },
        "login": {
            "username": user.username,
            "institute_code": inst.institute_code,
            "message": f"You can now login with Institute Code '{inst.institute_code}' or email '{inst.email}'"
        }
    }


# =========================================================
# GET CURRENT INSTITUTE PROFILE
# =========================================================

@router.get("/profile")
def get_current_institute_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    institute = get_institute_for_user(db, current_user)
    if not institute:
        return {
            "institute_code": current_user.get("institute_code") or "INST-001",
            "name": "Institute Portal",
            "email": "admin@institute.edu",
            "contact_number": "",
            "address": "",
            "payment_upi_id": "",
            "payment_qr_code_url": "",
            "payment_bank_details": "",
            "payment_instructions": "",
            "certificate_title": "Course Completion Certificate",
            "certificate_signatory_name": "Director",
            "certificate_logo_url": ""
        }

    return {
        "id": institute.id,
        "institute_code": institute.institute_code,
        "name": institute.name,
        "email": institute.email,
        "contact_number": institute.contact_number,
        "address": institute.address,
        "payment_upi_id": institute.payment_upi_id,
        "payment_qr_code_url": institute.payment_qr_code_url,
        "payment_bank_details": institute.payment_bank_details,
        "payment_instructions": institute.payment_instructions,
        "certificate_title": institute.certificate_title,
        "certificate_signatory_name": institute.certificate_signatory_name,
        "certificate_logo_url": institute.certificate_logo_url
    }


# =========================================================
# GET PUBLIC INSTITUTE PAYMENT INFO FOR STUDENTS
# =========================================================

@router.get("/payment-info/{institute_code}")
def get_institute_payment_info(
    institute_code: str,
    db: Session = Depends(get_db)
):
    inst = get_institute_by_code(db, institute_code.strip().upper())
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")

    return {
        "institute_code": inst.institute_code,
        "name": inst.name,
        "email": inst.email,
        "contact_number": inst.contact_number,
        "payment_upi_id": inst.payment_upi_id or f"{inst.institute_code.lower()}@upi",
        "payment_qr_code_url": inst.payment_qr_code_url,
        "payment_bank_details": inst.payment_bank_details or f"Bank: State Bank of India\nA/C: 1234567890\nIFSC: SBIN0001234\nBranch: Main Branch",
        "payment_instructions": inst.payment_instructions or "Scan QR code or use UPI ID to complete fee payment. Submit UTR reference ID to Admin for verification."
    }


# =========================================================
# UPDATE INSTITUTE PROFILE & SETTINGS
# =========================================================

@router.put("/profile")
def update_institute_profile(
    data: InstituteUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    institute = get_institute_for_user(db, current_user)
    if not institute:
        raise HTTPException(
            status_code=404,
            detail="Institute profile not found"
        )

    if data.name:
        institute.name = data.name.strip()
    if data.contact_number is not None:
        institute.contact_number = data.contact_number.strip()
    if data.address is not None:
        institute.address = data.address.strip()
    if data.payment_upi_id is not None:
        institute.payment_upi_id = data.payment_upi_id.strip()
    if data.payment_qr_code_url is not None:
        institute.payment_qr_code_url = data.payment_qr_code_url.strip()
    if data.payment_bank_details is not None:
        institute.payment_bank_details = data.payment_bank_details.strip()
    if data.payment_instructions is not None:
        institute.payment_instructions = data.payment_instructions.strip()
    if data.certificate_title is not None:
        institute.certificate_title = data.certificate_title.strip()
    if data.certificate_signatory_name is not None:
        institute.certificate_signatory_name = data.certificate_signatory_name.strip()
    if data.certificate_logo_url is not None:
        institute.certificate_logo_url = data.certificate_logo_url.strip()

    db.commit()
    db.refresh(institute)

    return {
        "message": "Institute settings and profile updated successfully",
        "institute": {
            "id": institute.id,
            "institute_code": institute.institute_code,
            "name": institute.name,
            "email": institute.email,
            "contact_number": institute.contact_number,
            "address": institute.address,
            "payment_upi_id": institute.payment_upi_id,
            "payment_qr_code_url": institute.payment_qr_code_url,
            "payment_bank_details": institute.payment_bank_details,
            "payment_instructions": institute.payment_instructions,
            "certificate_title": institute.certificate_title,
            "certificate_signatory_name": institute.certificate_signatory_name,
            "certificate_logo_url": institute.certificate_logo_url
        }
    }



# =========================================================
# INSTITUTE DASHBOARD STATS
# =========================================================

@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    institute = get_institute_for_user(db, current_user)
    inst_code = institute.institute_code if institute else (current_user.get("institute_code") or "DEFAULT")

    stats = get_institute_stats(db, inst_code)
    
    return {
        "institute": {
            "name": institute.name if institute else "AI Smart Institute",
            "institute_code": inst_code,
            "email": institute.email if institute else "admin@institute.edu",
            "contact_number": institute.contact_number if institute else ""
        },
        "stats": {
            "total_students": stats["total_students"],
            "total_courses": stats["total_courses"],
            "total_course_fee_value": stats["total_course_fee_value"],
            "total_fees_collected": stats["total_fees_collected"],
            "pending_fees": stats["pending_fees"]
        },
        "recent_students": [
            {
                "id": s.id,
                "registration_id": s.registration_id,
                "name": s.name,
                "email": s.email,
                "mobile": s.mobile,
                "course": s.course,
                "course_duration": s.course_duration,
                "course_fee": s.course_fee,
                "batch": s.batch
            }
            for s in stats["recent_students"]
        ],
        "recent_notifications": [
            {
                "id": n.id,
                "recipient_email": n.recipient_email,
                "recipient_type": n.recipient_type,
                "notification_type": n.notification_type,
                "subject": n.subject,
                "message": n.message,
                "status": n.status,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in stats["recent_notifications"]
        ]
    }


# =========================================================
# SEND FEE NOTIFICATION / REMINDER EMAIL
# =========================================================

@router.post("/send-fee-notification")
def send_fee_notification(
    data: SendFeeNotificationRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    institute = get_institute_for_user(db, current_user)
    inst_name = institute.name if institute else "AI Smart Institute"
    inst_code = institute.institute_code if institute else student.institute_code

    # Calculate actual fee summary
    fee_sum = get_fee_summary(db, student.id)
    total_fee = float(student.course_fee or fee_sum.get("course_fee", 0.0))
    paid_fee = float(fee_sum.get("total_paid", 0.0))
    pending_fee = max(total_fee - paid_fee, 0.0)

    # 1. Send to Student's Gmail
    send_fee_notification_email(
        recipient_email=student.email,
        recipient_name=student.name,
        student_name=student.name,
        registration_id=student.registration_id,
        institute_name=inst_name,
        institute_code=inst_code,
        course_name=student.course,
        total_fee=total_fee,
        paid_fee=paid_fee,
        pending_fee=pending_fee,
        custom_note=data.custom_note
    )

    # Log notification
    notif_stu = NotificationLog(
        institute_code=inst_code,
        student_id=student.id,
        student_registration_id=student.registration_id,
        recipient_email=student.email,
        recipient_type="student",
        notification_type="fee_reminder",
        subject=f"Fee Notice: ₹{pending_fee:,.2f} Pending - {inst_name}",
        message=f"Total: ₹{total_fee:,.2f}, Paid: ₹{paid_fee:,.2f}, Due: ₹{pending_fee:,.2f}. Note: {data.custom_note or 'None'}",
        status="Delivered"
    )
    db.add(notif_stu)

    # 2. Also send to Parent's Email if provided
    if student.parent_email and student.parent_email.strip() and student.parent_email != student.email:
        send_fee_notification_email(
            recipient_email=student.parent_email,
            recipient_name=student.parent_name or f"Parent of {student.name}",
            student_name=student.name,
            registration_id=student.registration_id,
            institute_name=inst_name,
            institute_code=inst_code,
            course_name=student.course,
            total_fee=total_fee,
            paid_fee=paid_fee,
            pending_fee=pending_fee,
            custom_note=data.custom_note
        )

        notif_parent = NotificationLog(
            institute_code=inst_code,
            student_id=student.id,
            student_registration_id=student.registration_id,
            recipient_email=student.parent_email,
            recipient_type="parent",
            notification_type="fee_reminder",
            subject=f"Parent Fee Notice for {student.name}: ₹{pending_fee:,.2f} Due",
            message=f"Total: ₹{total_fee:,.2f}, Paid: ₹{paid_fee:,.2f}, Due: ₹{pending_fee:,.2f}",
            status="Delivered"
        )
        db.add(notif_parent)

    db.commit()

    return {
        "message": f"Fee notification successfully sent to {student.name}'s email ({student.email})" + (f" and parent email ({student.parent_email})" if student.parent_email else ""),
        "student": {
            "name": student.name,
            "registration_id": student.registration_id,
            "total_fee": total_fee,
            "paid_fee": paid_fee,
            "pending_fee": pending_fee
        }
    }


# =========================================================
# GET NOTIFICATIONS HISTORY
# =========================================================

@router.get("/notifications")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    inst_code = current_user.get("institute_code")

    query = db.query(NotificationLog)

    if role == "student":
        query = query.filter(NotificationLog.student_registration_id == current_user["username"])
    elif inst_code:
        query = query.filter(NotificationLog.institute_code == inst_code)

    logs = query.order_by(NotificationLog.id.desc()).limit(50).all()

    return [
        {
            "id": n.id,
            "institute_code": n.institute_code,
            "student_registration_id": n.student_registration_id,
            "recipient_email": n.recipient_email,
            "recipient_type": n.recipient_type,
            "notification_type": n.notification_type,
            "subject": n.subject,
            "message": n.message,
            "status": n.status,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in logs
    ]
