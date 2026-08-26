import unittest
import time
from fastapi.testclient import TestClient
from main import app
from services.auth_service import create_access_token
from database.database import SessionLocal
from models.user import User
from models.course_application import CourseApplication

client = TestClient(app)


def get_auth_headers(role: str, username: str = "testuser"):
    user = User(
        id=888,
        username=username,
        role=role,
        institute_code="BIT-001",
        is_active=True
    )
    token = create_access_token(user)
    return {"Authorization": f"Bearer {token}"}


def test_payment_settings_admin_and_staff_permissions():
    admin_headers = get_auth_headers("admin", "BIT-001")
    staff_headers = get_auth_headers("faculty", "BIT-001-EMP-002")
    student_headers = get_auth_headers("student", "BIT-001-STU001")

    # 1. Admin GET payment settings -> returns admin view with metadata
    res_admin_get = client.get("/institutes/payment-settings", headers=admin_headers)
    assert res_admin_get.status_code == 200
    assert "role" in res_admin_get.json()
    assert res_admin_get.json()["role"] == "admin"

    # 2. Student GET payment settings -> returns public payment details only
    res_stu_get = client.get("/institutes/payment-settings", headers=student_headers)
    assert res_stu_get.status_code == 200
    assert "role" not in res_stu_get.json()  # Shielded from students

    # 3. Admin PUT update payment settings
    payload = {
        "payment_upi_id": "testinstitute@okicici",
        "payment_upi_number": "9876543210",
        "payment_account_holder": "Test Institute Ltd",
        "payment_bank_name": "Test Bank",
        "payment_account_number": "1234567890",
        "payment_ifsc_code": "TEST0001234",
        "payment_instructions": "Pay via UPI"
    }
    res_put = client.put("/institutes/payment-settings", json=payload, headers=admin_headers)
    assert res_put.status_code == 200
    assert res_put.json()["settings"]["payment_upi_id"] == "testinstitute@okicici"

    # 4. Staff PUT update payment settings -> HTTP 403 Forbidden
    res_staff_put = client.put("/institutes/payment-settings", json=payload, headers=staff_headers)
    assert res_staff_put.status_code == 403


def test_student_payment_submission_and_admin_verification():
    student_headers = get_auth_headers("student", "BIT-001-STU001")
    admin_headers = get_auth_headers("admin", "BIT-001")
    staff_headers = get_auth_headers("faculty", "BIT-001-EMP-002")

    unique_utr = f"UTR{int(time.time())}"

    # 1. Student submits fee payment
    sub_payload = {
        "amount": 15000,
        "payment_method": "UPI",
        "transaction_id": unique_utr
    }
    res_sub = client.post("/fees/submit-payment", json=sub_payload, headers=student_headers)
    assert res_sub.status_code == 200
    fee_data = res_sub.json()["fee"]
    fee_id = fee_data["id"]
    assert fee_data["status"] == "Pending Verification"

    # 2. Duplicate UTR check -> HTTP 400 Bad Request
    res_dup = client.post("/fees/submit-payment", json=sub_payload, headers=student_headers)
    assert res_dup.status_code == 400

    # 3. Staff attempts verify -> HTTP 403 Forbidden
    verify_payload = {
        "fee_id": fee_id,
        "status": "Paid / Successful"
    }
    res_staff_ver = client.post("/fees/verify", json=verify_payload, headers=staff_headers)
    assert res_staff_ver.status_code == 403

    # 4. Admin approves payment
    res_ver = client.post("/fees/verify", json=verify_payload, headers=admin_headers)
    assert res_ver.status_code == 200
    res_json = res_ver.json()
    assert res_json["fee"]["status"] == "Paid / Successful"
    assert res_json["tax_invoice"] is not None
    assert res_json["tax_invoice"]["status"] == "Paid / Successful"


def test_admin_reject_payment_workflow():
    student_headers = get_auth_headers("student", "BIT-001-STU001")
    admin_headers = get_auth_headers("admin", "BIT-001")

    unique_utr_rej = f"UTRREJ{int(time.time())}"

    # Student submits payment
    sub_payload = {
        "amount": 5000,
        "payment_method": "UPI",
        "transaction_id": unique_utr_rej
    }
    res_sub = client.post("/fees/submit-payment", json=sub_payload, headers=student_headers)
    assert res_sub.status_code == 200
    fee_obj = res_sub.json()["fee"]
    fee_id = fee_obj["id"]
    fee_student_id = fee_obj["student_id"]
    assert fee_obj["status"] == "Pending Verification"

    # Set up application state for this exact student: status = Approved, payment_status = Pending Verification
    db = SessionLocal()
    app_obj = db.query(CourseApplication).filter(CourseApplication.student_id == fee_student_id).first()
    if not app_obj:
        app_obj = CourseApplication(
            student_id=fee_student_id,
            status="Approved",
            payment_status="Pending Verification"
        )
        db.add(app_obj)
        db.commit()
        db.refresh(app_obj)
    else:
        app_obj.status = "Approved"
        app_obj.payment_status = "Pending Verification"
        db.commit()
        db.refresh(app_obj)

    # BEFORE REJECTION ASSERTION:
    assert app_obj.status == "Approved"
    assert app_obj.payment_status == "Pending Verification"

    # Admin rejects payment
    rej_payload = {
        "fee_id": fee_id,
        "rejection_reason": "Invalid UTR reference ID in bank statement"
    }
    res_rej = client.post("/fees/reject", json=rej_payload, headers=admin_headers)
    assert res_rej.status_code == 200
    assert res_rej.json()["fee"]["status"] == "Rejected"
    assert res_rej.json()["fee"]["verification_notes"] == "Invalid UTR reference ID in bank statement"

    # AFTER REJECTION ASSERTION:
    db.refresh(app_obj)
    # CourseApplication.status MUST remain Approved!
    assert app_obj.status == "Approved", f"Expected Application status 'Approved', got '{app_obj.status}'"
    # Separate CourseApplication.payment_status field updated to Rejected
    assert app_obj.payment_status == "Rejected"

    db.close()
