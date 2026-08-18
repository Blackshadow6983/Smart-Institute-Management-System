from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date

from database.database import get_db
from security.auth import get_current_user, require_admin

from models.student import Student
from models.course import Course
from models.course_application import CourseApplication
from models.certificate import Certificate

from services.certificate_service import (
    create_certificate,
    get_student_certificate,
    generate_certificate_pdf
)


router = APIRouter(
    prefix="/certificates",
    tags=["Certificates"]
)


class CertificateRequest(BaseModel):
    student_id: int
    certificate_number: str
    certificate_type: str = "Course Completion Certificate"
    course_name: str | None = None


# =========================================================
# PUBLIC CERTIFICATE VERIFICATION (NO AUTH REQUIRED)
# =========================================================

@router.get("/verify/{certificate_number}")
def verify_certificate_public(
    certificate_number: str,
    db: Session = Depends(get_db)
):
    clean_no = certificate_number.strip()
    cert = db.query(Certificate).filter(Certificate.certificate_number == clean_no).first()
    if not cert:
        return {
            "valid": False,
            "message": f"Certificate ID '{clean_no}' was not found in our verification registry."
        }

    student = db.query(Student).filter(Student.id == cert.student_id).first()
    student_name = student.name if student else "Scholar"
    registration_id = student.registration_id if student else "N/A"

    return {
        "valid": True,
        "message": "Certificate is Authentic and Verified",
        "certificate": {
            "id": cert.id,
            "certificate_number": cert.certificate_number,
            "certificate_type": cert.certificate_type,
            "student_name": student_name,
            "registration_id": registration_id,
            "course_name": cert.course_name or "Course Completion",
            "issue_date": str(cert.issue_date) if cert.issue_date else str(date.today()),
            "status": cert.status or "Issued"
        }
    }


# =========================================================
# DOWNLOAD PDF CERTIFICATE
# =========================================================

@router.get("/download/{certificate_id_or_number}")
def download_certificate_pdf(
    certificate_id_or_number: str,
    db: Session = Depends(get_db)
):
    if certificate_id_or_number.isdigit():
        cert = db.query(Certificate).filter(Certificate.id == int(certificate_id_or_number)).first()
    else:
        cert = db.query(Certificate).filter(Certificate.certificate_number == certificate_id_or_number).first()

    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    student = db.query(Student).filter(Student.id == cert.student_id).first()
    student_name = student.name if student else "Scholar"

    from models.institute import Institute
    inst_code = (student.institute_code if student else None) or cert.institute_code
    inst = db.query(Institute).filter(Institute.institute_code == inst_code).first() if inst_code else None

    inst_name = inst.name if inst else "AI SMART INSTITUTE"
    sig_name = (inst.certificate_signatory_name if inst and inst.certificate_signatory_name else "Academic Director")
    cert_title = (inst.certificate_title if inst and inst.certificate_title else "CERTIFICATE OF COMPLETION")

    pdf_buffer = generate_certificate_pdf(
        student_name=student_name,
        course_name=cert.course_name or "Full Course Program",
        issue_date=str(cert.issue_date) if cert.issue_date else str(date.today()),
        certificate_number=cert.certificate_number,
        institute_name=inst_name,
        signatory_name=sig_name,
        cert_title=cert_title
    )

    filename = f"Certificate-{cert.certificate_number}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )



# =========================================================
# CREATE CERTIFICATE (ADMIN ONLY)
# =========================================================

@router.post("/")
def generate_certificate(
    data: CertificateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    certificate = create_certificate(
        db,
        data.student_id,
        data.certificate_number,
        data.certificate_type,
        course_name=data.course_name
    )

    return {
        "message": "Certificate generated successfully",
        "certificate": certificate
    }


# =========================================================
# CLAIM / GENERATE CERTIFICATE ON 100% COURSE COMPLETION
# =========================================================

@router.post("/claim/{application_id}")
def claim_course_certificate(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    app = db.query(CourseApplication).filter(CourseApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Course application not found")

    student = db.query(Student).filter(Student.id == app.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user["role"].lower() == "student":
        if student.registration_id != current_user["username"]:
            raise HTTPException(status_code=403, detail="You can only claim certificates for your own courses")

    if (app.payment_status or "").lower() != "paid":
        raise HTTPException(
            status_code=400,
            detail="Fee payment is currently pending Admin verification. Certificate is unlocked after payment is marked Paid by Admin."
        )

    if (app.completion_status or 0) < 100:
        raise HTTPException(
            status_code=400,
            detail=f"Course completion is currently at {app.completion_status or 0}%. Certificate is unlocked only upon 100% course completion."
        )

    course = db.query(Course).filter(Course.id == app.course_id).first()
    course_name = course.name if course else "Course Completion"

    existing_cert = (
        db.query(Certificate)
        .filter(
            Certificate.student_id == student.id,
            Certificate.course_name == course_name
        )
        .first()
    )

    if existing_cert:
        return {
            "message": "Certificate already issued",
            "certificate": {
                "id": existing_cert.id,
                "student_id": existing_cert.student_id,
                "student_name": student.name,
                "registration_id": student.registration_id,
                "certificate_number": existing_cert.certificate_number,
                "certificate_type": existing_cert.certificate_type,
                "course_name": existing_cert.course_name,
                "issue_date": existing_cert.issue_date,
                "status": existing_cert.status
            }
        }

    cert_no = f"CERT-2026-{student.registration_id}-{app.course_id}"
    cert = create_certificate(
        db=db,
        student_id=student.id,
        certificate_number=cert_no,
        certificate_type="Course Completion Certificate",
        course_name=course_name
    )

    return {
        "message": f"Congratulations! Certificate for {course_name} successfully generated.",
        "certificate": {
            "id": cert.id,
            "student_id": cert.student_id,
            "student_name": student.name,
            "registration_id": student.registration_id,
            "certificate_number": cert.certificate_number,
            "certificate_type": cert.certificate_type,
            "course_name": cert.course_name,
            "issue_date": cert.issue_date,
            "status": cert.status
        }
    }


# =========================================================
# GET CERTIFICATE(S) FOR STUDENT OR ALL (ADMIN/STUDENT)
# =========================================================

@router.get("/")
def list_certificates(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role == "faculty":
        raise HTTPException(
            status_code=403,
            detail="Faculty access is restricted to student attendance only."
        )

    inst_code = current_user.get("institute_code")

    if role == "student":
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student:
            return []
        certs = db.query(Certificate).filter(Certificate.student_id == student.id).all()
        return [
            {
                "id": c.id,
                "student_id": c.student_id,
                "student_name": student.name,
                "registration_id": student.registration_id,
                "certificate_number": c.certificate_number,
                "certificate_type": c.certificate_type,
                "course_name": c.course_name,
                "issue_date": c.issue_date,
                "status": c.status
            }
            for c in certs
        ]
    else:
        certs = db.query(Certificate).all()
        result = []
        for c in certs:
            student = db.query(Student).filter(Student.id == c.student_id).first()
            if inst_code and student and student.institute_code != inst_code:
                continue
            result.append({
                "id": c.id,
                "student_id": c.student_id,
                "student_name": student.name if student else "Scholar",
                "registration_id": student.registration_id if student else "N/A",
                "certificate_number": c.certificate_number,
                "certificate_type": c.certificate_type,
                "course_name": c.course_name,
                "issue_date": c.issue_date,
                "status": c.status
            })
        return result



@router.get("/{student_id}")
def student_certificate(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()

    if role == "student":
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="You can only view your own certificates")

    certs = get_student_certificate(db, student_id)
    student_obj = db.query(Student).filter(Student.id == student_id).first()

    return [
        {
            "id": c.id,
            "student_id": c.student_id,
            "student_name": student_obj.name if student_obj else "Scholar",
            "registration_id": student_obj.registration_id if student_obj else "—",
            "certificate_number": c.certificate_number,
            "certificate_type": c.certificate_type,
            "course_name": c.course_name or "Course Completion",
            "issue_date": c.issue_date,
            "status": c.status
        }
        for c in certs
    ]