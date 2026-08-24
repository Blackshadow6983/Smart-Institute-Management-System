import sys, os
sys.path.insert(0, os.path.abspath('.'))

from database.database import get_db
from models.user import User
from models.student import Student
from controllers.notice_controller import create_notice, get_notices, NoticeRequest
from controllers.batch_controller import create_batch, BatchCreateRequest
from controllers.attendance_controller import create_attendance, AttendanceRequest
from datetime import date

def run_tests():
    db = next(get_db())
    
    # Check or create staff user
    staff_user = db.query(User).filter(User.role == "staff").first()
    if not staff_user:
        from services.password_service import hash_password
        staff_user = User(
            username="STAFF-TEST",
            password=hash_password("staff123"),
            role="staff",
            institute_code="ITE-001",
            is_active=True
        )
        db.add(staff_user)
        db.commit()
        db.refresh(staff_user)
    
    current_user = {
        "id": staff_user.id,
        "username": staff_user.username,
        "role": staff_user.role,
        "institute_code": staff_user.institute_code
    }
    
    print("Testing STAFF role authorization logic directly...")

    # 1. Test Notice Creation
    n_req = NoticeRequest(title="Staff Test Circular", message="Notice posted by staff user")
    n_res = create_notice(n_req, db=db, current_user=current_user)
    print("Notice Creation Result:", n_res["message"])
    assert n_res["notice"]["title"] == "Staff Test Circular"

    # 2. Test Get Notices
    notices = get_notices(db=db, current_user=current_user)
    print("Get Notices Count:", len(notices))

    # 3. Test Batch Creation
    b_req = BatchCreateRequest(name="Staff Test Batch 2026", course="Full Stack", timing="Morning 9am", faculty="Staff Faculty")
    b_res = create_batch(b_req, db=db, current_user=current_user)
    print("Batch Creation Result:", b_res["message"])
    assert b_res["batch"].name == "Staff Test Batch 2026"

    # 4. Test Attendance Marking
    student = db.query(Student).first()
    if student:
        att_req = AttendanceRequest(student_id=student.id, date=date.today(), status=True, course="Full Stack")
        att_res = create_attendance(att_req, db=db, current_user=current_user)
        print("Attendance Result:", att_res["message"])

    print("\nALL STAFF AUTHORIZATION UNIT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
