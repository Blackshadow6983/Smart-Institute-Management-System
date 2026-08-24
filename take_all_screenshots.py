import os
import shutil
import json
import requests
from playwright.sync_api import sync_playwright

PRIMARY_DIR = r"D:\LinearNovo\aiiiiiiiimanage\screenshot"
SECONDARY_DIR = r"D:\LinearNovo\aiiiiiiiimanage\screenshots"

os.makedirs(PRIMARY_DIR, exist_ok=True)
os.makedirs(SECONDARY_DIR, exist_ok=True)

API_URL = "http://127.0.0.1:8000/auth/login"
REACT_BASE_URL = "http://127.0.0.1:5173"
PORTAL_BASE_URL = "http://127.0.0.1:8000/portal"

def get_auth_data(username, password):
    try:
        resp = requests.post(API_URL, json={"username": username, "password": password})
        if resp.status_code == 200:
            data = resp.json()
            return data.get("access_token"), data.get("user")
        else:
            print(f"Login failed for {username}: {resp.status_code} {resp.text}")
            return None, None
    except Exception as e:
        print(f"API login error for {username}: {e}")
        return None, None

print("Authenticating accounts...")
ADMIN_TOKEN, ADMIN_USER = get_auth_data("ITE-001", "password123")
STUDENT_TOKEN, STUDENT_USER = get_auth_data("STU-001", "student123")

react_pages = [
    ("/login", "01_institute_app_login.png", False, "admin"),
    ("/register", "02_institute_app_register.png", False, "admin"),
    ("/dashboard", "03_institute_app_dashboard.png", True, "admin"),
    ("/students", "04_institute_app_students.png", True, "admin"),
    ("/faculty", "05_institute_app_faculty.png", True, "admin"),
    ("/courses", "06_institute_app_courses.png", True, "admin"),
    ("/course-details/1", "07_institute_app_course_details.png", True, "admin"),
    ("/batches", "08_institute_app_batches.png", True, "admin"),
    ("/attendance", "09_institute_app_attendance.png", True, "admin"),
    ("/fees", "10_institute_app_fees.png", True, "admin"),
    ("/marks", "11_institute_app_marks.png", True, "admin"),
    ("/notices", "12_institute_app_notices.png", True, "admin"),
    ("/reports", "13_institute_app_reports.png", True, "admin"),
    ("/certificates", "14_institute_app_certificates.png", True, "admin"),
    ("/applications", "15_institute_app_applications.png", True, "admin"),
    ("/profile", "16_institute_app_profile.png", True, "admin"),
    ("/change-password", "17_institute_app_change_password.png", True, "admin"),
]

portal_pages = [
    ("index.html", "18_student_portal_home.png", False),
    ("login.html", "19_student_portal_login.png", False),
    ("dashboard.html", "20_student_portal_dashboard.png", True),
    ("profile.html", "21_student_portal_profile.png", True),
    ("marks.html", "22_student_portal_marks.png", True),
    ("attendance.html", "23_student_portal_attendance.png", True),
    ("assignments.html", "24_student_portal_assignments.png", True),
    ("fees.html", "25_student_portal_fees.png", True),
    ("notices.html", "26_student_portal_notices.png", True),
    ("certificates.html", "27_student_portal_certificates.png", True),
    ("change-password.html", "28_student_portal_change_password.png", True),
]

def run():
    captured_count = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        print("\n--- 1. Capturing Institute Management React App Screenshots ---")
        for path, filename, req_auth, role in react_pages:
            primary_path = os.path.join(PRIMARY_DIR, filename)
            secondary_path = os.path.join(SECONDARY_DIR, filename)

            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            token = ADMIN_TOKEN if role == "admin" else STUDENT_TOKEN
            user_info = ADMIN_USER if role == "admin" else STUDENT_USER

            if req_auth and token and user_info:
                page.goto(f"{REACT_BASE_URL}/login", wait_until="commit")
                page.evaluate("""({ token, user }) => {
                    localStorage.setItem('access_token', token);
                    localStorage.setItem('user_info', JSON.stringify(user));
                }""", {"token": token, "user": user_info})

            try:
                page.goto(f"{REACT_BASE_URL}{path}", wait_until="networkidle")
                page.wait_for_timeout(1500)
                page.screenshot(path=primary_path, full_page=True)
                shutil.copy(primary_path, secondary_path)
                print(f"[OK] Saved {filename}")
                captured_count += 1
            except Exception as e:
                print(f"[ERR] Failed {path}: {e}")
            finally:
                context.close()

        print("\n--- 2. Capturing Student Website Portal Screenshots ---")
        for html_page, filename, req_auth in portal_pages:
            primary_path = os.path.join(PRIMARY_DIR, filename)
            secondary_path = os.path.join(SECONDARY_DIR, filename)

            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            if req_auth and STUDENT_TOKEN and STUDENT_USER:
                page.goto(f"{PORTAL_BASE_URL}/login.html", wait_until="commit")
                page.evaluate("""({ token, user }) => {
                    localStorage.setItem('institute_access_token', token);
                    localStorage.setItem('institute_user_data', JSON.stringify(user));
                    localStorage.setItem('student_access_token', token);
                    localStorage.setItem('student_user_data', JSON.stringify(user));
                }""", {"token": STUDENT_TOKEN, "user": STUDENT_USER})

            try:
                page.goto(f"{PORTAL_BASE_URL}/{html_page}", wait_until="networkidle")
                page.wait_for_timeout(1500)
                page.screenshot(path=primary_path, full_page=True)
                shutil.copy(primary_path, secondary_path)
                print(f"[OK] Saved {filename}")
                captured_count += 1
            except Exception as e:
                print(f"[ERR] Failed {html_page}: {e}")
            finally:
                context.close()

        browser.close()

    print("\n" + "="*60)
    print(f"SUCCESS: Total {captured_count} screenshots saved to:")
    print(f" 1. {PRIMARY_DIR}")
    print(f" 2. {SECONDARY_DIR}")
    print("="*60)

if __name__ == "__main__":
    run()
