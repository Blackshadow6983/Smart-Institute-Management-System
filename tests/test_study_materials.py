import unittest
import io
from fastapi.testclient import TestClient
from main import app
from services.auth_service import create_access_token
from models.user import User

client = TestClient(app)


def get_auth_headers(role: str, username: str = "testuser"):
    user = User(
        id=777,
        username=username,
        role=role,
        institute_code="BIT-001",
        is_active=True
    )
    token = create_access_token(user)
    return {"Authorization": f"Bearer {token}"}


def test_staff_upload_and_student_access_control():
    staff_headers = get_auth_headers("faculty", "BIT-001-EMP-002")
    student_headers = get_auth_headers("student", "BIT-001-STU001")
    admin_headers = get_auth_headers("admin", "BIT-001")

    # 1. Student attempts upload -> HTTP 403 Forbidden
    fake_pdf = ("lecture1.pdf", b"%PDF-1.4 test study material content", "application/pdf")
    res_stu_up = client.post(
        "/study-materials/upload",
        data={"title": "Unauthorized Upload"},
        files={"file": fake_pdf},
        headers=student_headers
    )
    assert res_stu_up.status_code == 403

    # 2. Staff uploads PDF study material
    fake_pdf_staff = ("Unit1_ML.pdf", b"%PDF-1.4 Machine Learning Unit 1", "application/pdf")
    res_staff_up = client.post(
        "/study-materials/upload",
        data={"title": "Unit 1 - Machine Learning Slides", "description": "Introductory slides"},
        files={"file": fake_pdf_staff},
        headers=staff_headers
    )
    assert res_staff_up.status_code == 200
    material = res_staff_up.json()["material"]
    mat_id = material["id"]

    # 3. Student views study materials list
    res_list = client.get("/study-materials/", headers=student_headers)
    assert res_list.status_code == 200

    # 4. Student downloads study material
    res_dl = client.get(f"/study-materials/{mat_id}/download", headers=student_headers)
    assert res_dl.status_code == 200

    # 5. Student attempts delete -> HTTP 403 Forbidden
    res_del_stu = client.delete(f"/study-materials/{mat_id}", headers=student_headers)
    assert res_del_stu.status_code == 403

    # 6. Admin deletes study material -> HTTP 200 OK
    res_del_admin = client.delete(f"/study-materials/{mat_id}", headers=admin_headers)
    assert res_del_admin.status_code == 200


def test_invalid_file_extension_rejected():
    staff_headers = get_auth_headers("faculty", "BIT-001-EMP-002")
    fake_exe = ("hack.exe", b"malicious script", "application/x-msdownload")
    res_exe = client.post(
        "/study-materials/upload",
        data={"title": "Executable File"},
        files={"file": fake_exe},
        headers=staff_headers
    )
    assert res_exe.status_code == 400


def test_staff_unassigned_course_authorization_rejected():
    staff_headers = get_auth_headers("faculty", "BIT-001-EMP-UNASSIGNED")
    fake_pdf = ("lecture_unassigned.pdf", b"%PDF-1.4 Content", "application/pdf")

    res = client.post(
        "/study-materials/upload",
        data={"title": "Unassigned Course Material", "course_id": 9999},
        files={"file": fake_pdf},
        headers=staff_headers
    )
    assert res.status_code == 403
    assert "not assigned" in res.json()["detail"].lower()
