import os
import re
from datetime import datetime
from sqlalchemy.orm import Session

from models.student import Student
from models.faculty import Faculty
from models.course import Course
from models.batch import Batch
from models.notice import Notice
from models.attendance import Attendance
from models.fees import Fee
from models.assessment import Assessment
from models.course_application import CourseApplication

from services.attendance_service import get_attendance_percentage
from services.fee_service import get_fee_summary
from services.assessment_service import calculate_result


def process_chat_message(db: Session, current_user: dict, message: str) -> dict:
    """
    Secure, role-based AI Institute Assistant query processor.
    Strictly filters data access based on authenticated user credentials.
    """
    query = (message or "").strip().lower()
    role = (current_user.get("role") or "student").lower()
    username = current_user.get("username")

    if not query:
        return {
            "reply": "Hello! I am your AI Institute Assistant. How can I assist you with your academic records, attendance, fees, courses, or notices today?",
            "suggested_actions": ["Check Attendance", "View Fee Statement", "Check Marks", "Latest Notices"]
        }

    # -------------------------------------------------------------
    # 1. SECURITY & PRIVACY GUARDRAILS
    # -------------------------------------------------------------
    privacy_keywords = [
        "other student", "another student", "someone else", "password of", 
        "admin password", "secret key", "all passwords", "drop table", 
        "delete from", "select * from user"
    ]
    if any(pk in query for pk in privacy_keywords):
        return {
            "reply": "🔒 Security Notice: I cannot provide private personal credentials, security keys, or academic records belonging to other individuals. You may only access your own verified records.",
            "suggested_actions": ["Check My Profile", "View My Attendance", "View My Marks"]
        }

    # -------------------------------------------------------------
    # 2. ROLE-BASED CONTEXT FETCHING
    # -------------------------------------------------------------
    student = None
    if role == "student":
        student = db.query(Student).filter(Student.registration_id == username).first()

    faculty = None
    if role == "faculty":
        faculty = db.query(Faculty).filter(Faculty.employee_id == username).first()

    # -------------------------------------------------------------
    # 3. INTENT RECOGNITION & RESPONSE DISPATCH
    # -------------------------------------------------------------

    # --- ATTENDANCE INTENT ---
    if any(w in query for w in ["attendance", "present", "absent", "classes attended", "missed class"]):
        if role == "student":
            if student:
                percentage = get_attendance_percentage(db, student.id)
                records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
                total = len(records)
                present = sum(1 for r in records if r.status)
                absent = total - present
                
                threshold_msg = "✅ Your attendance is on track above the 75% examination threshold." if percentage >= 75 else "⚠️ Notice: Your attendance is below the mandatory 75% threshold. Please attend upcoming lectures."
                
                return {
                    "reply": f"📊 Attendance Report for {student.name} ({student.registration_id}):\n\n• Cumulative Attendance: {percentage}%\n• Classes Attended: {present} / {total}\n• Sessions Absent: {absent}\n\n{threshold_msg}",
                    "suggested_actions": ["View Attendance Table", "Check Fee Statement", "Academic Report"]
                }
            else:
                return {
                    "reply": f"📊 Attendance Policy:\n• The mandatory minimum attendance requirement is 75% across all courses.\n• Daily lecture attendance is logged by faculty.\n• Check the Attendance tab in the sidebar for your personalized attendance sheet.",
                    "suggested_actions": ["View Attendance Table", "Check Notices"]
                }
        elif role in ["admin", "faculty"]:
            return {
                "reply": "As faculty/administrator, you can record or monitor student attendance logs directly via the 'Attendance' module in the navigation sidebar.",
                "suggested_actions": ["Go to Attendance", "Manage Students"]
            }

    # --- FEES & FINANCIAL INTENT ---
    if any(w in query for w in ["fee", "fees", "balance", "dues", "payment", "paid", "receipt", "tuition", "cost"]):
        if role == "student":
            if student:
                summary = get_fee_summary(db, student.id)
                total_fee = summary.get("total_fee", 0.0)
                total_paid = summary.get("total_paid", 0.0)
                balance = summary.get("balance_due", 0.0)
                status = summary.get("status", "Active")

                status_note = "✅ All tuition charges are fully settled." if balance <= 0 else f"📌 Outstanding balance of ₹{balance:,.2f} is due for the current academic session."

                return {
                    "reply": f"💳 Fee Account Summary for {student.name} ({student.registration_id}):\n\n• Total Course Fee: ₹{total_fee:,.2f}\n• Amount Paid to Date: ₹{total_paid:,.2f}\n• Outstanding Balance: ₹{balance:,.2f}\n• Status: {status}\n\n{status_note}\n\nPayments can be posted via the Accounts Office through UPI/Bank Transfer, DD, or Debit Card.",
                    "suggested_actions": ["View Fees Page", "Check Academic Report"]
                }
            else:
                return {
                    "reply": "💳 Institute Fee Policy:\n• Course fees can be paid in installments or full term payment.\n• Accepted payment modes: Online/UPI, Bank Demand Draft, or at Accounts Counter.\n• Receipts are generated upon verification by the finance office.",
                    "suggested_actions": ["View Fees Page", "Browse Courses"]
                }
        elif role == "admin":
            return {
                "reply": "Administrator Access: You can verify financial ledgers and post new student fee receipts in the 'Fees & Accounts' module.",
                "suggested_actions": ["Fees Ledger", "Student Directory"]
            }

    # --- MARKS / RESULTS / ASSESSMENTS INTENT ---
    if any(w in query for w in ["mark", "marks", "result", "results", "score", "grade", "exam", "assessment", "scorecard", "percentage"]):
        if role == "student":
            if student:
                result = calculate_result(db, student.id)
                assessments = db.query(Assessment).filter(Assessment.student_id == student.id).all()
                
                if not assessments:
                    return {
                        "reply": f"📝 Assessment Record: No examination scores or evaluations have been officially published for your account ({student.registration_id}) yet.",
                        "suggested_actions": ["Check Notices", "View Attendance"]
                    }

                items = [f"• {a.subject} ({a.exam_type}): {a.marks} / {a.total_marks}" for a in assessments]
                items_str = "\n".join(items)
                pct = result.get("percentage", "N/A")
                grade = result.get("grade", "N/A")

                return {
                    "reply": f"🏆 Academic Scorecard for {student.name} ({student.registration_id}):\n\n{items_str}\n\n• Cumulative Percentage: {pct}%\n• Conferred Grade: {grade}",
                    "suggested_actions": ["View Marks Page", "View Academic Report", "View Certificates"]
                }
            else:
                return {
                    "reply": "📝 Examination & Grading Scheme:\n• Grading Scale: A+ (>=85%), A (>=70%), B (>=55%), C (>=40%), Fail (<40%).\n• Official marks and scorecards are published after faculty evaluation.",
                    "suggested_actions": ["View Marks Page", "Check Notices"]
                }
        elif role in ["faculty", "admin"]:
            return {
                "reply": "You have faculty/admin privileges to evaluate students and record marks in the 'Marks & Results' module.",
                "suggested_actions": ["Go to Marks", "Student Directory"]
            }

    # --- COURSES & CURRICULUM INTENT ---
    if any(w in query for w in ["course", "courses", "syllabus", "programs", "curriculum", "degree", "diploma"]):
        courses = db.query(Course).all()
        if not courses:
            return {
                "reply": "The institute offers accredited specializations in Artificial Intelligence, Machine Learning, Data Science, and Computer Engineering. Visit the Courses tab for active programs.",
                "suggested_actions": ["Browse Courses", "Latest Notices"]
            }
        
        c_list = [f"• {c.course_code}: {c.name} — Duration: {c.duration or 'Standard'} | Fees: ₹{c.fees:,.0f}" if c.fees else f"• {c.course_code}: {c.name} — Duration: {c.duration or 'Standard'}" for c in courses[:6]]
        return {
            "reply": f"📚 Available Academic Courses at AI Smart Institute:\n\n" + "\n".join(c_list) + "\n\nYou can apply for enrollment directly from the 'Courses' module!",
            "suggested_actions": ["Browse Courses", "Apply for Course", "View Batches"]
        }

    # --- BATCHES & TIMINGS INTENT ---
    if any(w in query for w in ["batch", "batches", "timing", "schedule", "cohort", "timings", "class time"]):
        batches = db.query(Batch).all()
        if not batches:
            return {
                "reply": "Batches run across Morning, Afternoon, and Evening cohorts. Check the Batches module for current timetables.",
                "suggested_actions": ["View Batches", "Check Attendance"]
            }
        
        b_list = [f"• {b.name}: {b.course or 'General'} (Timing: {b.timing or 'Mon-Fri'}) | Faculty: {b.faculty or 'Department Staff'}" for b in batches[:6]]
        return {
            "reply": f"⏰ Active Academic Batches & Cohort Timings:\n\n" + "\n".join(b_list),
            "suggested_actions": ["View Batches", "View Courses"]
        }

    # --- NOTICES & ANNOUNCEMENTS INTENT ---
    if any(w in query for w in ["notice", "notices", "circular", "announcement", "news", "update", "updates"]):
        notices = db.query(Notice).order_by(Notice.id.desc()).limit(4).all()
        if not notices:
            return {
                "reply": "📢 Notice Board: There are currently no urgent institutional circulars published today.",
                "suggested_actions": ["Go to Dashboard", "Check Courses"]
            }
        
        n_list = [f"📌 *{n.title}*\n{n.message}" for n in notices]
        return {
            "reply": "📢 Official Institutional Circulars:\n\n" + "\n\n".join(n_list),
            "suggested_actions": ["View Notices Board", "Go to Dashboard"]
        }

    # --- COURSE APPLICATIONS INTENT ---
    if any(w in query for w in ["application", "apply", "applied", "admission", "enroll", "enrollment"]):
        if role == "student" and student:
            apps = db.query(CourseApplication).filter(CourseApplication.student_id == student.id).all()
            if not apps:
                return {
                    "reply": f"You currently have no pending course applications. To apply for a new course specialization, open the 'Courses' module and click 'Apply'.",
                    "suggested_actions": ["Browse Courses", "View Applications"]
                }
            app_items = []
            for a in apps:
                c = db.query(Course).filter(Course.id == a.course_id).first()
                app_items.append(f"• {c.name if c else 'Course'} (Status: {a.status})")
            return {
                "reply": f"📋 Your Course Applications:\n\n" + "\n".join(app_items),
                "suggested_actions": ["View Applications", "Browse Courses"]
            }
        else:
            return {
                "reply": "Students can apply for academic courses directly via the 'Courses' or 'Applications' tab. Administrators review all applications from the Applications manager.",
                "suggested_actions": ["View Applications", "Browse Courses"]
            }

    # --- PASSWORD & ACCOUNT INTENT ---
    if any(w in query for w in ["password", "change password", "reset password", "security"]):
        return {
            "reply": "🔒 To update your account password:\n1. Click 'Change Password' in the navigation sidebar.\n2. Enter your current password.\n3. Type your new secure password (minimum 6 characters) and confirm.\n4. Click 'Update Password'.",
            "suggested_actions": ["Change Password", "My Profile"]
        }

    # --- PROFILE / REGISTRATION ID INTENT ---
    if any(w in query for w in ["profile", "who am i", "my id", "registration id", "my name", "my email", "my batch"]):
        if role == "student" and student:
            return {
                "reply": f"👤 Student Profile Overview:\n\n• Full Name: {student.name}\n• Registration ID: {student.registration_id}\n• Email: {student.email}\n• Phone: {student.mobile or 'Not registered'}\n• Enrolled Course: {student.course or 'Not assigned'}\n• Assigned Batch: {student.batch or 'Not assigned'}\n• Role: Student",
                "suggested_actions": ["Edit Profile", "View Attendance", "View Fees"]
            }
        elif role == "faculty" and faculty:
            return {
                "reply": f"👨‍🏫 Faculty Profile Overview:\n\n• Full Name: {faculty.name}\n• Employee ID: {faculty.employee_id}\n• Email: {faculty.email}\n• Department: {faculty.department or 'Academic'}\n• Specialization: {faculty.specialization or 'General'}\n• Role: Faculty",
                "suggested_actions": ["Edit Profile", "Faculty Directory"]
            }
        else:
            return {
                "reply": f"👤 Logged in as: {username}\n• Role: {role.capitalize()}\n• Access Level: Institutional Portal User",
                "suggested_actions": ["Dashboard", "My Profile"]
            }

    # --- CERTIFICATES INTENT ---
    if any(w in query for w in ["certificate", "diploma", "graduation", "degree certificate", "credentials"]):
        if role == "student" and student:
            return {
                "reply": f"🎓 Certificates & Diplomas: You can view, verify, and print your official Course Completion Certificate from the 'Certificates' tab in the navigation menu.",
                "suggested_actions": ["View Certificates", "Academic Report"]
            }
        else:
            return {
                "reply": "Authorized administrators can generate and issue verifiable institutional completion certificates from the 'Certificates' module.",
                "suggested_actions": ["Certificates Module", "Students Directory"]
            }

    # --- CONTACT & INSTITUTIONAL POLICY INTENT ---
    if any(w in query for w in ["contact", "help", "support", "address", "phone", "email of institute", "location", "dean", "office"]):
        return {
            "reply": "🏛️ AI Smart Institute of Technology & Management:\n\n• Academic Year: 2026 Session\n• Support Helpdesk: support@institute.edu\n• Administrative Office: Block A, Central Campus\n• Portal Operational Hours: 24/7 Online Access\n• Minimum Attendance Required: 75%",
            "suggested_actions": ["Dashboard", "Notices Board", "Browse Courses"]
        }

    # --- GENERAL DEFAULT / ASSISTANT GREETING ---
    user_greet = student.name if student else username
    return {
        "reply": f"Hello {user_greet}! I am your AI Institute Assistant. I can assist you with:\n\n• Attendance scores & session percentages\n• Fee dues, payments & receipts\n• Exam marks, grades & scorecards\n• Available courses & batch timings\n• Official notices & circulars\n• Course applications & certificates\n\nWhat would you like to know?",
        "suggested_actions": ["What is my attendance?", "How much fee is pending?", "What are my marks?", "Show latest notices"]
    }
