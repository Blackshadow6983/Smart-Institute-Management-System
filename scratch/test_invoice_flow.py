import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))

from database.database import SessionLocal
from models.student import Student
from models.fees import Fee
from models.tax_invoice import TaxInvoice
from services.tax_invoice_service import create_tax_invoice, get_student_tax_invoices
from datetime import date

def test_flow():
    db = SessionLocal()
    try:
        # Find or create sample student
        student = db.query(Student).first()
        if not student:
            print("No student found in database.")
            return

        print(f"Testing for student: {student.name} ({student.registration_id})")

        # Create sample pending fee with UTR
        fee = Fee(
            institute_code=student.institute_code or "ITE-001",
            student_id=student.id,
            amount=25000.0,
            payment_date=date.today(),
            payment_method="UPI",
            status="Pending",
            receipt_number="REC-TEST-99",
            transaction_id="UTR-2026-98765432"
        )
        db.add(fee)
        db.commit()
        db.refresh(fee)
        print(f"Created Fee record ID {fee.id} with status: {fee.status}")

        # Simulate Admin verification -> Paid / Successful
        fee.status = "Paid / Successful"
        fee.verified_by = "admin"
        db.commit()

        # Generate Tax Invoice
        invoice = create_tax_invoice(db, fee.id, transaction_id=fee.transaction_id, verified_by="admin")
        print("SUCCESS! Tax Invoice Generated:")
        print(f"  - Invoice Number: {invoice.invoice_number}")
        print(f"  - Student: {invoice.student_name}")
        print(f"  - Course: {invoice.course_name}")
        print(f"  - SAC Code: {invoice.hsn_sac_code}")
        print(f"  - Subtotal (Base Amount): ₹{invoice.subtotal_amount}")
        print(f"  - CGST (9%): ₹{invoice.cgst_amount}")
        print(f"  - SGST (9%): ₹{invoice.sgst_amount}")
        print(f"  - Total Amount: ₹{invoice.total_amount}")
        print(f"  - Status: {invoice.status}")
        print(f"  - UTR / Txn ID: {invoice.transaction_id}")

        # Clean up test fee & invoice
        db.delete(invoice)
        db.delete(fee)
        db.commit()
        print("Test record cleaned up successfully.")

    finally:
        db.close()

if __name__ == "__main__":
    test_flow()
