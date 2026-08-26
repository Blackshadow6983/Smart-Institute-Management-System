import unittest
from fastapi.testclient import TestClient
from main import app
from security.auth import (
    ADMIN_ROLES,
    STAFF_ROLES,
    ATTENDANCE_ROLES,
    STUDENT_ROLES,
    normalize_role,
    is_admin_role,
    is_staff_role,
    can_manage_attendance_role,
    is_student_role
)
from services.auth_service import create_access_token
from models.user import User

client = TestClient(app)


def get_auth_headers(role: str, username: str = "testuser"):
    user = User(
        id=999,
        username=username,
        role=role,
        institute_code="BIT-001",
        is_active=True
    )
    token = create_access_token(user)
    return {"Authorization": f"Bearer {token}"}


def test_role_classification_helpers():
    assert is_admin_role("admin") is True
    assert is_admin_role("ADMIN") is True
    assert is_admin_role("institute") is True
    assert is_admin_role("institute_admin") is True
    assert is_admin_role("faculty") is False
    assert is_admin_role("student") is False

    assert is_staff_role("faculty") is True
    assert is_staff_role("staff") is True
    assert is_staff_role("admin") is False
    assert is_staff_role("student") is False

    assert can_manage_attendance_role("admin") is True
    assert can_manage_attendance_role("faculty") is True
    assert can_manage_attendance_role("staff") is True
    assert can_manage_attendance_role("student") is False


def test_admin_access_to_endpoints():
    for admin_role in ["admin", "institute", "institute_admin"]:
        headers = get_auth_headers(admin_role, "BIT-001")

        # Faculty Management
        res_fac = client.get("/admin/faculty", headers=headers)
        assert res_fac.status_code == 200

        # Student Management
        res_stu = client.get("/students/", headers=headers)
        assert res_stu.status_code == 200

        # Enrollment Management
        res_app = client.get("/course-applications/all", headers=headers)
        assert res_app.status_code == 200

        # Certificates
        res_cert = client.get("/certificates/", headers=headers)
        assert res_cert.status_code == 200

        # Attendance Roster
        res_att_roster = client.get("/students/attendance-roster", headers=headers)
        assert res_att_roster.status_code == 200


def test_staff_access_restrictions():
    for staff_role in ["faculty", "staff"]:
        headers = get_auth_headers(staff_role, "BIT-001-EMP-002")

        # Faculty Management -> 403
        res_fac = client.get("/admin/faculty", headers=headers)
        assert res_fac.status_code == 403

        # Student Management -> 403
        res_stu = client.get("/students/", headers=headers)
        assert res_stu.status_code == 403

        # Enrollment Management -> 403
        res_app = client.get("/course-applications/all", headers=headers)
        assert res_app.status_code == 403

        # Certificates -> 403
        res_cert = client.get("/certificates/", headers=headers)
        assert res_cert.status_code == 403

        # Attendance Roster -> 200 ALLOWED
        res_att_roster = client.get("/students/attendance-roster", headers=headers)
        assert res_att_roster.status_code == 200


def test_student_access_restrictions():
    headers = get_auth_headers("student", "BIT-001-STU001")

    # Faculty Management -> 403
    res_fac = client.get("/admin/faculty", headers=headers)
    assert res_fac.status_code == 403

    # Student Management -> 403
    res_stu = client.get("/students/", headers=headers)
    assert res_stu.status_code == 403

    # Enrollment Management -> 403
    res_app = client.get("/course-applications/all", headers=headers)
    assert res_app.status_code == 403

    # Attendance Roster -> 403
    res_att_roster = client.get("/students/attendance-roster", headers=headers)
    assert res_att_roster.status_code == 403
