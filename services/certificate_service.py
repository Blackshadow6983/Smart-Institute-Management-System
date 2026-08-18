from datetime import date
from io import BytesIO
from sqlalchemy.orm import Session

from models.certificate import Certificate

from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas


def create_certificate(
    db: Session,
    student_id: int,
    certificate_number: str,
    certificate_type: str = "Course Completion Certificate",
    course_name: str = None
):
    certificate = Certificate(
        student_id=student_id,
        certificate_number=certificate_number,
        certificate_type=certificate_type,
        issue_date=date.today(),
        status="Issued",
        course_name=course_name
    )

    db.add(certificate)
    db.commit()
    db.refresh(certificate)

    return certificate


def get_student_certificate(
    db: Session,
    student_id: int
):
    return (
        db.query(Certificate)
        .filter(
            Certificate.student_id == student_id
        )
        .all()
    )


def generate_certificate_pdf(
    student_name: str,
    course_name: str,
    issue_date: str,
    certificate_number: str,
    institute_name: str = "AI SMART INSTITUTE",
    signatory_name: str = "Academic Director",
    cert_title: str = "CERTIFICATE OF COMPLETION"
) -> BytesIO:
    buffer = BytesIO()
    # Landscape A4 size: 841.89 x 595.27 points
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    # Outer decorative border
    c.setStrokeColor(colors.HexColor("#1e293b"))
    c.setLineWidth(5)
    c.rect(20, 20, width - 40, height - 40)

    # Inner gold border
    c.setStrokeColor(colors.HexColor("#d97706"))
    c.setLineWidth(2)
    c.rect(28, 28, width - 56, height - 56)

    # Header - Institute Name
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(width / 2, height - 80, institute_name.upper())

    # Subheader
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawCentredString(width / 2, height - 105, "CENTER FOR ADVANCED LEARNING & ACADEMIC EXCELLENCE")

    # Line Separator
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.line(150, height - 120, width - 150, height - 120)

    # Certificate Title
    c.setFillColor(colors.HexColor("#2563eb"))
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 170, cert_title.upper())

    # Present statement
    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 210, "This is proudly presented to")

    # Student Name
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 255, student_name.upper())

    # Underline under name
    c.setStrokeColor(colors.HexColor("#2563eb"))
    c.setLineWidth(2)
    c.line(200, height - 265, width - 200, height - 265)

    # Statement text
    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(width / 2, height - 305, "for successfully completing 100% requirements of the prescribed course")

    # Course Name
    c.setFillColor(colors.HexColor("#1e1b4b"))
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(width / 2, height - 345, course_name)

    # Footer section: Date, Certificate ID, Signature
    c.setFont("Helvetica", 11)
    c.setFillColor(colors.HexColor("#475569"))

    # Issue Date
    c.drawString(70, 90, f"Issue Date: {issue_date}")

    # Certificate ID
    c.drawString(70, 70, f"Certificate ID: {certificate_number}")
    c.drawString(70, 50, "Verification: Official Digital Seal")

    # Signature line right
    c.line(width - 250, 90, width - 70, 90)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(width - 160, 75, signatory_name)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawCentredString(width - 160, 60, "Authorized Signatory")

    c.showPage()
    c.save()

    buffer.seek(0)
    return buffer