import os
import json
import requests
from playwright.sync_api import sync_playwright

OUTPUT_DIR = r"D:\LinearNovo\aiiiiiiiimanage\screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

API_URL = "http://127.0.0.1:8000/auth/login"
REACT_BASE_URL = "http://127.0.0.1:5173"
PORTAL_BASE_URL = "http://127.0.0.1:8000/portal"

# Obtain auth token & user info via backend API
print("Authenticating with backend FastAPI...")
try:
    resp = requests.post(API_URL, json={"username": "faculty001", "password": "faculty123"})
    if resp.status_code == 200:
        data = resp.json()
        ACCESS_TOKEN = data.get("access_token")
        USER_INFO = data.get("user")
        print("Backend login successful!", flush=True)
    else:
        print(f"Backend login failed: {resp.status_code} {resp.text}", flush=True)
        ACCESS_TOKEN = None
        USER_INFO = None
except Exception as e:
    print(f"API connection error: {e}", flush=True)
    ACCESS_TOKEN = None
    USER_INFO = None

react_pages = [
    ("/login", "01_react_login.png", False),
    ("/register", "02_react_register.png", False),
    ("/dashboard", "03_react_dashboard.png", True),
    ("/students", "04_react_students.png", True),
    ("/faculty", "05_react_faculty.png", True),
    ("/courses", "06_react_courses.png", True),
    ("/batches", "07_react_batches.png", True),
    ("/attendance", "08_react_attendance.png", True),
    ("/fees", "09_react_fees.png", True),
    ("/marks", "10_react_marks.png", True),
    ("/notices", "11_react_notices.png", True),
    ("/reports", "12_react_reports.png", True),
    ("/certificates", "13_react_certificates.png", True),
    ("/applications", "14_react_applications.png", True),
    ("/profile", "15_react_profile.png", True),
    ("/change-password", "16_react_change_password.png", True),
]

portal_pages = [
    ("index.html", "17_student_portal_home.png", False),
    ("login.html", "18_student_portal_login.png", False),
    ("dashboard.html", "19_student_portal_dashboard.png", True),
    ("profile.html", "20_student_portal_profile.png", True),
    ("marks.html", "21_student_portal_marks.png", True),
    ("attendance.html", "22_student_portal_attendance.png", True),
    ("assignments.html", "23_student_portal_assignments.png", True),
    ("fees.html", "24_student_portal_fees.png", True),
    ("notices.html", "25_student_portal_notices.png", True),
    ("certificates.html", "26_student_portal_certificates.png", True),
    ("change-password.html", "27_student_portal_change_password.png", True),
]

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. REACT MANAGEMENT PORTAL SCREENSHOTS
        print("\n--- Capturing React Management App Pages ---", flush=True)
        for path, filename, req_auth in react_pages:
            filepath = os.path.join(OUTPUT_DIR, filename)
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            if req_auth and ACCESS_TOKEN and USER_INFO:
                # Inject token & user data into localStorage
                page.goto(f"{REACT_BASE_URL}/login", wait_until="commit")
                page.evaluate("""({ token, user }) => {
                    localStorage.setItem('access_token', token);
                    localStorage.setItem('user_info', JSON.stringify(user));
                }""", {"token": ACCESS_TOKEN, "user": USER_INFO})

            try:
                page.goto(f"{REACT_BASE_URL}{path}", wait_until="networkidle")
                page.wait_for_timeout(1200)
                page.screenshot(path=filepath, full_page=True)
                print(f"[OK] React App -> Saved {filename}", flush=True)
            except Exception as e:
                print(f"[ERR] React App -> {path}: {e}", flush=True)
            finally:
                context.close()

        # 2. STUDENT WEBSITE PORTAL SCREENSHOTS
        print("\n--- Capturing Student Portal HTML Pages ---", flush=True)
        for html_page, filename, req_auth in portal_pages:
            filepath = os.path.join(OUTPUT_DIR, filename)
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()

            if req_auth and ACCESS_TOKEN and USER_INFO:
                page.goto(f"{PORTAL_BASE_URL}/login.html", wait_until="commit")
                page.evaluate("""({ token, user }) => {
                    localStorage.setItem('institute_access_token', token);
                    localStorage.setItem('institute_user_data', JSON.stringify(user));
                }""", {"token": ACCESS_TOKEN, "user": USER_INFO})

            try:
                page.goto(f"{PORTAL_BASE_URL}/{html_page}", wait_until="networkidle")
                page.wait_for_timeout(1200)
                page.screenshot(path=filepath, full_page=True)
                print(f"[OK] Student Portal -> Saved {filename}", flush=True)
            except Exception as e:
                print(f"[ERR] Student Portal -> {html_page}: {e}", flush=True)
            finally:
                context.close()

        browser.close()
        print("\n==========================================", flush=True)
        print("SUCCESS: All 27 website screenshots saved to D:\\LinearNovo\\aiiiiiiiimanage\\screenshots", flush=True)
        print("==========================================", flush=True)

if __name__ == "__main__":
    run()
