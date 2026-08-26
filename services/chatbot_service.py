import os
import re
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from security.auth import (
    normalize_role,
    is_admin_role,
    is_staff_role,
    is_student_role
)

from models.student import Student
from models.faculty import Faculty
from models.course import Course
from models.batch import Batch
from models.notice import Notice
from models.attendance import Attendance
from models.fees import Fee
from models.assessment import Assessment
from models.course_application import CourseApplication
from models.certificate import Certificate
from models.study_material import StudyMaterial
from models.institute import Institute

from services.attendance_service import get_attendance_percentage
from services.fee_service import get_fee_summary
from services.assessment_service import calculate_result


# =====================================================================
# MAIN DISPATCHER: DETECTS ROLE & ROUTES TO ROLE-SPECIFIC HANDLER
# =====================================================================

def process_chat_message(db: Session, current_user: dict, message: str) -> dict:
    """
    Secure, role-trained AI Institute Assistant query processor.
    Identifies whether the logged-in user is an Admin, Staff/Faculty, or Student,
    and dispatches to a dedicated role-trained intelligent handler.
    """
    query = (message or "").strip().lower()
    raw_role = current_user.get("role") or "student"
    role = normalize_role(raw_role)
    username = current_user.get("username", "")

    # Security / Privacy guardrails
    privacy_keywords = [
        "password of", "admin password", "secret key", "all passwords", 
        "drop table", "delete from", "select * from user", "hack"
    ]
    if any(pk in query for pk in privacy_keywords):
        return {
            "reply": "🔒 Security Notice: I cannot provide private personal credentials, security keys, or sensitive backend records. You may only access authorized institutional data for your role.",
            "suggested_actions": ["My Profile", "Dashboard", "Help & Guidance"]
        }

    # Dispatch based on detected user role
    if is_admin_role(role):
        return handle_admin_chat(db, current_user, query)
    elif is_staff_role(role):
        return handle_staff_chat(db, current_user, query)
    else:
        return handle_student_chat(db, current_user, query)


# =====================================================================
# 1. ADMIN AI ASSISTANT (TRAINED FOR INSTITUTIONAL MANAGEMENT)
# =====================================================================

def handle_admin_chat(db: Session, current_user: dict, query: str) -> dict:
    inst_code = current_user.get("institute_code") or "BIT-001"
    admin_name = current_user.get("name") or current_user.get("username") or "Administrator"

    # Fetch Institute Meta
    inst = db.query(Institute).filter(Institute.institute_code == inst_code).first()
    inst_title = inst.name if inst else "AI Smart Institute"

    # --- INTENT: FEES, FINANCIAL HEALTH & PAYMENT REVENUE ---
    if any(w in query for w in ["fee", "financial", "revenue", "collection", "accounts", "dues", "balance", "ledger", "money"]):
        all_fees = db.query(Fee).all()
        total_collected = sum(f.amount for f in all_fees if f.status in ["Paid", "Paid / Successful"])
        pending_verifications = db.query(Fee).filter(Fee.status == "Pending Verification").count()
        total_students = db.query(Student).count()

        return {
            "reply": (
                f"🏛️ **Institutional Financial & Accounts Overview** ({inst_title}):\n\n"
                f"• **Total Revenue Collected:** ₹{total_collected:,.2f}\n"
                f"• **Payments Awaiting Verification:** {pending_verifications} pending UTR transactions\n"
                f"• **Total Active Students Enrolled:** {total_students}\n\n"
                f"💡 **Admin Actions:**\n"
                f"1. Go to **Fees & Accounts → Payment Verification** to approve or reject pending UTRs.\n"
                f"2. Go to **Payment Configuration** to update official UPI ID, QR Code, and Bank Account details."
            ),
            "suggested_actions": ["Pending Payment Verifications", "Payment Configuration Settings", "Admission Applications", "Student Directory"]
        }

    # --- INTENT: PAYMENT VERIFICATION / UTR REVIEWS ---
    if any(w in query for w in ["verify", "verification", "pending payment", "utr", "approve payment", "reject payment"]):
        pending_list = db.query(Fee).filter(Fee.status == "Pending Verification").limit(5).all()
        if not pending_list:
            return {
                "reply": "✅ **Payment Verification Queue:**\n\nThere are currently **0 pending payments** requiring verification. All submitted student transactions have been processed.",
                "suggested_actions": ["Payment Configuration Settings", "Total Revenue & Accounts", "Enrollment Applications"]
            }

        items = []
        for p in pending_list:
            stu = db.query(Student).filter(Student.id == p.student_id).first()
            s_name = stu.name if stu else f"Student #{p.student_id}"
            items.append(f"• **{s_name}** | Amount: ₹{p.amount:,.2f} | Mode: {p.payment_method} | UTR: `{p.transaction_reference or 'N/A'}`")

        items_str = "\n".join(items)
        return {
            "reply": (
                f"📋 **Pending Payment Verification Queue ({len(pending_list)} pending):**\n\n"
                f"{items_str}\n\n"
                f"👉 **How to process:** Navigate to **Fees & Accounts → Payment Verification** tab to click **Approve** or **Reject with Reason**."
            ),
            "suggested_actions": ["Payment Configuration Settings", "Admission Applications", "Student Directory"]
        }

    # --- INTENT: PAYMENT CONFIGURATION & UPI SETTINGS ---
    if any(w in query for w in ["upi", "qr", "bank account", "ifsc", "payment setting", "payment configuration", "configure payment"]):
        upi_id = inst.payment_upi_id if inst and inst.payment_upi_id else "institute.billing@okicici (Default)"
        upi_no = inst.payment_upi_number if inst and inst.payment_upi_number else "9876543210"
        bank_name = inst.payment_bank_name if inst and inst.payment_bank_name else "HDFC Bank Ltd"
        acc_no = inst.payment_account_number if inst and inst.payment_account_number else "50100987654321"
        ifsc = inst.payment_ifsc_code if inst and inst.payment_ifsc_code else "HDFC0001234"
        qr_status = "Uploaded & Active" if (inst and inst.payment_qr_code_url) else "Default / Not Set"


        return {
            "reply": (
                f"⚙️ **Institute Payment Gateway Configuration**:\n\n"
                f"• **Official UPI ID:** `{upi_id}`\n"
                f"• **Official UPI Number:** `{upi_no}`\n"
                f"• **Bank Name:** {bank_name}\n"
                f"• **Account Number:** `{acc_no}`\n"
                f"• **IFSC Code:** `{ifsc}`\n"
                f"• **QR Code Status:** {qr_status}\n\n"
                f"💡 You can update these details anytime in **Fees & Accounts → Payment Configuration**."
            ),
            "suggested_actions": ["Pending Payment Verifications", "Total Revenue & Accounts", "Faculty Directory"]
        }

    # --- INTENT: COURSE APPLICATIONS & ENROLLMENTS ---
    if any(w in query for w in ["application", "applicant", "admission", "enroll", "enrollment", "pending approval"]):
        total_apps = db.query(CourseApplication).count()
        pending_apps = db.query(CourseApplication).filter(CourseApplication.status == "Submitted").count()
        approved_apps = db.query(CourseApplication).filter(CourseApplication.status == "Approved").count()
        rejected_apps = db.query(CourseApplication).filter(CourseApplication.status == "Rejected").count()

        return {
            "reply": (
                f"📝 **Course Applications & Admissions Overview**:\n\n"
                f"• **Total Applications:** {total_apps}\n"
                f"• **Pending Review:** {pending_apps}\n"
                f"• **Approved Enrolled:** {approved_apps}\n"
                f"• **Rejected:** {rejected_apps}\n\n"
                f"👉 Open the **Applications** tab from the sidebar to review incoming admissions and assign student batches."
            ),
            "suggested_actions": ["Pending Payment Verifications", "Manage Students", "Faculty Directory"]
        }

    # --- INTENT: FACULTY & STAFF MANAGEMENT ---
    if any(w in query for w in ["faculty", "staff", "teacher", "professor", "employee", "instructor"]):
        faculty_list = db.query(Faculty).all()
        count = len(faculty_list)
        f_names = [f"• **{f.name}** ({f.employee_id}) — {f.department or 'Academic'} | {f.specialization or 'Faculty'}" for f in faculty_list[:5]]
        f_str = "\n".join(f_names) if f_names else "No faculty registered yet."

        return {
            "reply": (
                f"👨‍🏫 **Faculty & Staff Directory ({count} Registered Staff)**:\n\n"
                f"{f_str}\n\n"
                f"👉 Go to **Faculty Management** to add new faculty members, update designations, or assign departments."
            ),
            "suggested_actions": ["Manage Students", "Admission Applications", "Certificates Registry"]
        }

    # --- INTENT: STUDENTS MANAGEMENT ---
    if any(w in query for w in ["student", "students", "roster", "directory", "learners"]):
        students = db.query(Student).all()
        count = len(students)
        s_names = [f"• **{s.name}** (`{s.registration_id}`) — {s.course or 'Course Enrolled'}" for s in students[:5]]
        s_str = "\n".join(s_names) if s_names else "No students registered yet."

        return {
            "reply": (
                f"🎓 **Student Directory ({count} Total Students)**:\n\n"
                f"{s_str}\n\n"
                f"👉 Go to **Students Directory** to manage registrations, edit profiles, or inspect individual ledgers."
            ),
            "suggested_actions": ["Pending Payment Verifications", "Faculty Directory", "Attendance Overview"]
        }

    # --- INTENT: CERTIFICATES ISSUANCE & VERIFICATION ---
    if any(w in query for w in ["certificate", "certificates", "diploma", "issue certificate", "verify certificate"]):
        cert_count = db.query(Certificate).count()
        return {
            "reply": (
                f"📜 **Institutional Certificates Registry ({cert_count} Issued Certificates)**:\n\n"
                f"• Certificates are automatically claimable by students once **Course Progress reaches 100%** and **Payment is Verified Paid**.\n"
                f"• As Admin, you can also issue **Manual Course Completion Certificates**.\n\n"
                f"👉 Navigate to **Certificates & Verification** in the sidebar to issue certificates or use the public authenticity lookup."
            ),
            "suggested_actions": ["Issue Certificate", "Pending Payment Verifications", "Admission Applications"]
        }

    # --- INTENT: STUDY MATERIALS ---
    if any(w in query for w in ["study material", "notes", "slides", "documents", "resources"]):
        sm_count = db.query(StudyMaterial).count()
        return {
            "reply": (
                f"📚 **Study Materials Library ({sm_count} Files Uploaded)**:\n\n"
                f"• Faculty and Admins can upload lecture slides, PDF textbooks, and assignments.\n"
                f"• Materials can be targeted to specific Courses, Batches, or All Enrolled Students.\n\n"
                f"👉 Manage study materials under the **Study Materials** sidebar module."
            ),
            "suggested_actions": ["Study Materials Library", "Faculty Directory", "Manage Courses"]
        }

    # --- INTENT: NOTICES & CIRCULARS ---
    if any(w in query for w in ["notice", "notices", "circular", "announcement", "post notice"]):
        notices = db.query(Notice).order_by(Notice.id.desc()).limit(3).all()
        n_str = "\n\n".join([f"📌 **{n.title}**\n{n.message}" for n in notices]) if notices else "No active notices."
        return {
            "reply": (
                f"📢 **Institutional Notice Board**:\n\n"
                f"{n_str}\n\n"
                f"👉 Publish new campus announcements directly from **Notices & Suggestions**."
            ),
            "suggested_actions": ["Publish Notice", "Student Directory", "Dashboard"]
        }

    # --- DEFAULT ADMIN GREETING & HELP ---
    pending_utrs = db.query(Fee).filter(Fee.status == "Pending Verification").count()
    total_students = db.query(Student).count()
    total_courses = db.query(Course).count()

    return {
        "reply": (
            f"👑 **Welcome, Administrator {admin_name}!**\n\n"
            f"I am your **Executive AI Management Assistant** for **{inst_title}**.\n\n"
            f"📊 **Live Campus Snapshot:**\n"
            f"• 💰 **Pending Payment Verifications:** {pending_utrs} awaiting review\n"
            f"• 🎓 **Registered Students:** {total_students}\n"
            f"• 📚 **Active Courses:** {total_courses}\n\n"
            f"How can I assist you with institutional management today?"
        ),
        "suggested_actions": [
            "Pending Payment Verifications",
            "Payment Configuration Settings",
            "Admission Applications",
            "Faculty & Staff Directory",
            "Institutional Revenue & Fees"
        ]
    }


# =====================================================================
# 2. STAFF / FACULTY AI ASSISTANT (TRAINED FOR TEACHING & ATTENDANCE)
# =====================================================================

def handle_staff_chat(db: Session, current_user: dict, query: str) -> dict:
    username = current_user.get("username", "")
    faculty = db.query(Faculty).filter(
        (Faculty.employee_id == username) | (Faculty.email == current_user.get("email"))
    ).first()

    staff_name = faculty.name if faculty else username
    dept = faculty.department if faculty else "Academic"

    # --- INTENT: ATTENDANCE MANAGEMENT ---
    if any(w in query for w in ["attendance", "mark attendance", "present", "absent", "roster", "roll call"]):
        return {
            "reply": (
                f"📋 **Faculty Attendance Management Assistant**:\n\n"
                f"• You have full permission to record and update course-specific student attendance.\n"
                f"• **Mandatory Rule:** Students must maintain at least **75% attendance** to be eligible for examinations and certificates.\n\n"
                f"👉 **How to mark attendance:**\n"
                f"1. Click **Attendance** in the sidebar navigation.\n"
                f"2. Click the blue **+ Mark Attendance** button.\n"
                f"3. Select the Student, Course, Date, and Mark Status (Present/Absent)."
            ),
            "suggested_actions": ["My Assigned Batches", "Upload Study Materials", "Enter Assessment Marks", "Department Notices"]
        }

    # --- INTENT: ASSIGNED BATCHES & TIMETABLE ---
    if any(w in query for w in ["batch", "batches", "timing", "schedule", "timetable", "class time", "cohort"]):
        # Find batches assigned to this faculty
        assigned_batches = db.query(Batch).filter(
            (Batch.faculty == staff_name) | (Batch.faculty == username)
        ).all()

        if not assigned_batches:
            assigned_batches = db.query(Batch).limit(4).all()

        b_items = [f"• **{b.name}** | Course: *{b.course or 'General'}* | Timings: `{b.timing or 'Mon-Fri 10:00 AM'}`" for b in assigned_batches]
        b_str = "\n".join(b_items) if b_items else "No batches assigned yet."

        return {
            "reply": (
                f"⏰ **Your Assigned Teaching Batches & Cohort Timings**:\n\n"
                f"{b_str}\n\n"
                f"👉 Check the **Batches & Schedule** page to view complete cohort calendars."
            ),
            "suggested_actions": ["Mark Student Attendance", "Upload Study Materials", "View Assigned Courses"]
        }

    # --- INTENT: STUDY MATERIALS & LECTURE UPLOADS ---
    if any(w in query for w in ["study material", "study materials", "upload material", "upload notes", "slides", "notes", "lecture notes", "syllabus"]):
        my_materials = db.query(StudyMaterial).filter(StudyMaterial.uploaded_by == username).all()
        count = len(my_materials)
        m_items = [f"• **{m.title}** ({m.file_type}) — Course: {m.course_name or 'General'}" for m in my_materials[:4]]
        m_str = "\n".join(m_items) if m_items else "You have not uploaded any study materials yet."

        return {
            "reply": (
                f"📚 **Study Materials & Academic Documents ({count} Uploaded)**:\n\n"
                f"{m_str}\n\n"
                f"👉 **To upload new lecture notes or PDF slides:**\n"
                f"1. Navigate to **Study Materials** in the sidebar.\n"
                f"2. Click **Upload Study Material**.\n"
                f"3. Fill Title, select your Assigned Course/Batch, and attach PDF/PPT/DOC file (up to 25MB)."
            ),
            "suggested_actions": ["Upload Study Materials", "My Assigned Batches", "Mark Student Attendance"]
        }

    # --- INTENT: MARKS & EXAM EVALUATIONS ---
    if any(w in query for w in ["mark", "marks", "result", "exam", "grade", "assessment", "scorecard", "evaluation"]):
        return {
            "reply": (
                f"📝 **Student Assessment & Grading**:\n\n"
                f"• Faculty can record and publish test marks, mid-term evaluations, and final grades.\n"
                f"• **Grading scale:** A+ (>=85%), A (>=70%), B (>=55%), C (>=40%), Fail (<40%).\n\n"
                f"👉 Go to **Marks & Results** to select students and record scores."
            ),
            "suggested_actions": ["Enter Assessment Marks", "Mark Student Attendance", "My Assigned Batches"]
        }

    # --- INTENT: COURSES TAUGHT / SPECIALIZATION ---
    if any(w in query for w in ["course", "courses", "curriculum", "subject", "specialization"]):
        courses = db.query(Course).filter(Course.is_active == True).all()
        c_items = [f"• **{c.course_code}: {c.name}** (Duration: {c.duration or '6 Months'})" for c in courses[:5]]
        c_str = "\n".join(c_items)

        return {
            "reply": (
                f"📖 **Institutional Courses & Specializations**:\n\n"
                f"{c_str}\n\n"
                f"• Your Department: **{dept}**\n"
                f"• Your Specialization: **{faculty.specialization if faculty else 'General'}**"
            ),
            "suggested_actions": ["My Assigned Batches", "Upload Study Materials", "Mark Student Attendance"]
        }

    # --- INTENT: ROLE BOUNDARY REMINDER ---
    if any(w in query for w in ["approve fee", "verify payment", "fee config", "issue certificate", "delete course"]):
        return {
            "reply": (
                f"ℹ️ **Administrative Access Policy**:\n\n"
                f"• Fee payment verification, payment gateway configurations, and certificate issuance are managed by **Institute Administrators**.\n"
                f"• As Faculty/Staff, you have full access to: **Attendance Management**, **Study Materials Uploads**, **Marks & Results**, and **Cohort Schedules**."
            ),
            "suggested_actions": ["Mark Student Attendance", "Upload Study Materials", "My Assigned Batches"]
        }

    # --- INTENT: NOTICES ---
    if any(w in query for w in ["notice", "notices", "circular", "announcement"]):
        notices = db.query(Notice).order_by(Notice.id.desc()).limit(3).all()
        n_str = "\n\n".join([f"📌 **{n.title}**\n{n.message}" for n in notices]) if notices else "No active notices."
        return {
            "reply": f"📢 **Institutional & Faculty Circulars**:\n\n{n_str}",
            "suggested_actions": ["My Assigned Batches", "Mark Student Attendance", "Dashboard"]
        }

    # --- DEFAULT STAFF GREETING & HELP ---
    return {
        "reply": (
            f"👨‍🏫 **Welcome, Professor {staff_name}!**\n\n"
            f"I am your **Faculty AI Academic Assistant** for the **{dept}** Department.\n\n"
            f"✨ **How I can help you today:**\n"
            f"• 📋 **Mark & Review Student Attendance**\n"
            f"• ⏰ **Look Up Your Assigned Batches & Cohort Timings**\n"
            f"• 📚 **Upload & Share Lecture Slides / Study Materials**\n"
            f"• 📝 **Publish Student Test Marks & Exam Grades**\n\n"
            f"What task would you like to perform?"
        ),
        "suggested_actions": [
            "Mark Student Attendance",
            "My Assigned Batches & Schedule",
            "Upload Study Materials",
            "Enter Assessment Marks",
            "Department Notices"
        ]
    }


# =====================================================================
# 3. STUDENT AI ASSISTANT (TRAINED FOR LEARNING & PERSONAL METRICS)
# =====================================================================

def handle_student_chat(db: Session, current_user: dict, query: str) -> dict:
    username = current_user.get("username", "")
    student = db.query(Student).filter(Student.registration_id == username).first()
    student_name = student.name if student else username
    reg_id = student.registration_id if student else username

    # --- INTENT: PERSONAL ATTENDANCE METRICS ---
    if any(w in query for w in ["attendance", "present", "absent", "missed class", "my attendance", "attendance percentage"]):
        if student:
            percentage = get_attendance_percentage(db, student.id)
            records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
            total = len(records)
            present = sum(1 for r in records if r.status)
            absent = total - present

            status_badge = "✅ **On Track** (Above the mandatory 75% threshold)" if percentage >= 75 else "⚠️ **Low Attendance Warning** (Below 75% threshold. Please attend upcoming lectures)"

            return {
                "reply": (
                    f"📊 **Attendance Report for {student_name} ({reg_id})**:\n\n"
                    f"• **Overall Attendance Rate:** **{percentage}%**\n"
                    f"• **Attended Sessions:** {present} classes\n"
                    f"• **Absent Sessions:** {absent} classes\n"
                    f"• **Total Recorded Classes:** {total} sessions\n\n"
                    f"{status_badge}\n\n"
                    f"👉 Open the **Attendance** tab in the sidebar to view day-by-day course logs."
                ),
                "suggested_actions": ["Check Fee Statement", "View My Marks", "Download Study Materials", "My Enrolled Courses"]
            }
        else:
            return {
                "reply": "📊 The institute requires a mandatory minimum of **75% attendance** across all courses. Check the Attendance tab for your logs.",
                "suggested_actions": ["Check Fees", "Browse Courses"]
            }

    # --- INTENT: PERSONAL FEES, BALANCE & PAYMENT SUBMISSION ---
    if any(w in query for w in ["fee", "fees", "balance", "dues", "payment", "paid", "receipt", "upi", "qr", "how to pay"]):
        if student:
            summary = get_fee_summary(db, student.id)
            total_fee = summary.get("total_fee", 0.0)
            total_paid = summary.get("total_paid", 0.0)
            balance = summary.get("balance_due", 0.0)

            # Fetch latest payment record status
            latest_fee = db.query(Fee).filter(Fee.student_id == student.id).order_by(Fee.id.desc()).first()
            payment_status_note = ""
            if latest_fee:
                if latest_fee.status == "Pending Verification":
                    payment_status_note = f"\n⏳ **Payment Status:** Your payment of ₹{latest_fee.amount:,.2f} (UTR: `{latest_fee.transaction_reference or 'N/A'}`) is **Pending Admin Verification**."
                elif latest_fee.status in ["Paid / Successful", "Paid"]:
                    payment_status_note = f"\n✅ **Payment Status:** All verified payments are confirmed **Paid**."
                elif latest_fee.status == "Rejected":
                    payment_status_note = f"\n❌ **Payment Status:** Your previous payment was rejected (Reason: *{latest_fee.rejection_reason or 'Invalid UTR'}*). Please re-submit your payment."

            # Fetch payment configuration instructions
            inst = db.query(Institute).filter(Institute.institute_code == student.institute_code).first() if student.institute_code else None
            upi_id = inst.payment_upi_id if inst and inst.payment_upi_id else "institute.billing@okicici"
            bank_name = inst.payment_bank_name if inst and inst.payment_bank_name else "HDFC Bank"
            acc_no = inst.payment_account_number if inst and inst.payment_account_number else "50100987654321"


            due_msg = "🎉 **All tuition fees are fully cleared!**" if balance <= 0 else f"📌 **Outstanding Balance Due:** **₹{balance:,.2f}**"

            return {
                "reply": (
                    f"💳 **Fee Account Statement for {student_name} ({reg_id})**:\n\n"
                    f"• **Total Course Fee:** ₹{total_fee:,.2f}\n"
                    f"• **Total Amount Paid:** ₹{total_paid:,.2f}\n"
                    f"• **Pending Balance:** ₹{balance:,.2f}\n"
                    f"{due_msg}{payment_status_note}\n\n"
                    f"🏛️ **Official Payment Details:**\n"
                    f"• **UPI ID:** `{upi_id}`\n"
                    f"• **Bank:** {bank_name} | Acc: `{acc_no}`\n\n"
                    f"👉 To submit your payment receipt or UTR, open the **Fee Payments** module."
                ),
                "suggested_actions": ["Fee Payments & Receipts", "Check My Attendance", "My Marks & Grades", "Download Study Materials"]
            }

    # --- INTENT: MARKS, RESULTS & REPORT CARD ---
    if any(w in query for w in ["mark", "marks", "result", "results", "score", "grade", "report card", "exam"]):
        if student:
            result = calculate_result(db, student.id)
            assessments = db.query(Assessment).filter(Assessment.student_id == student.id).all()

            if not assessments:
                return {
                    "reply": f"📝 Assessment Record: No official examination scores have been published for `{reg_id}` yet. Check back once faculty evaluations conclude.",
                    "suggested_actions": ["Check Attendance", "Download Study Materials", "Check Notices"]
                }

            items = [f"• **{a.subject}** ({a.exam_type}): **{a.marks} / {a.total_marks}**" for a in assessments]
            items_str = "\n".join(items)
            pct = result.get("percentage", "N/A")
            grade = result.get("grade", "N/A")

            return {
                "reply": (
                    f"🏆 **Academic Scorecard for {student_name} ({reg_id})**:\n\n"
                    f"{items_str}\n\n"
                    f"• **Cumulative Percentage:** **{pct}%**\n"
                    f"• **Overall Conferred Grade:** **{grade}**\n\n"
                    f"👉 Open **Marks & Results** in the sidebar to review full subject breakdowns."
                ),
                "suggested_actions": ["View Marks Page", "Course Completion Certificate", "Download Study Materials"]
            }

    # --- INTENT: STUDY MATERIALS & NOTES DOWNLOAD ---
    if any(w in query for w in ["study material", "study materials", "download notes", "pdf", "slides", "notes", "textbook", "books"]):
        materials = db.query(StudyMaterial).all()
        m_items = [f"• **{m.title}** ({m.file_type}) — {m.course_name or 'All Enrolled'}" for m in materials[:5]]
        m_str = "\n".join(m_items) if m_items else "No study materials currently uploaded."

        return {
            "reply": (
                f"📚 **Available Study Materials & Lecture Notes**:\n\n"
                f"{m_str}\n\n"
                f"👉 Navigate to **Study Materials** from the sidebar to download PDF lecture notes directly to your device."
            ),
            "suggested_actions": ["Download Study Materials", "Check My Attendance", "My Enrolled Courses"]
        }

    # --- INTENT: CERTIFICATES & COURSE COMPLETION ---
    if any(w in query for w in ["certificate", "certificates", "diploma", "graduation", "claim certificate", "download certificate"]):
        if student:
            certs = db.query(Certificate).filter(Certificate.student_id == student.id).all()
            if certs:
                c_items = [f"• **{c.certificate_type}** | ID: `{c.certificate_number}` | Issued: {c.issue_date}" for c in certs]
                return {
                    "reply": (
                        f"🎓 **Your Conferred Official Certificates**:\n\n"
                        f"{chr(10).join(c_items)}\n\n"
                        f"👉 You can download your official PDF certificate anytime under **Certificates & Verification**."
                    ),
                    "suggested_actions": ["View Certificates", "Download Study Materials", "My Marks & Grades"]
                }
            else:
                return {
                    "reply": (
                        f"🎓 **Certificate Unlock Criteria**:\n\n"
                        f"1. **Course Progress:** Complete **100%** of course syllabus & modules.\n"
                        f"2. **Fee Settlement:** Course payment must be verified as **Paid** by Admin.\n\n"
                        f"Once both criteria are met, your Certificate unlocks automatically on your dashboard and Certificates page!"
                    ),
                    "suggested_actions": ["My Enrolled Courses", "Check Fee Statement", "View Certificates"]
                }

    # --- INTENT: ENROLLED COURSES & SYLLABUS PROGRESS ---
    if any(w in query for w in ["course", "courses", "enrolled", "syllabus", "modules", "progress"]):
        if student:
            apps = db.query(CourseApplication).filter(CourseApplication.student_id == student.id).all()
            if apps:
                app_items = []
                for a in apps:
                    c = db.query(Course).filter(Course.id == a.course_id).first()
                    c_title = c.name if c else "Course"
                    app_items.append(f"• **{c_title}** | Progress: **{a.completion_status or 0}%** | Payment: `{a.payment_status or 'Pending'}`")

                return {
                    "reply": (
                        f"📖 **Your Enrolled Courses & Progress**:\n\n"
                        f"{chr(10).join(app_items)}\n\n"
                        f"👉 Click **Course & Syllabus Details** on your Dashboard to track syllabus module completion."
                    ),
                    "suggested_actions": ["Download Study Materials", "Check Fee Statement", "Check My Attendance"]
                }

    # --- INTENT: BATCHES & TIMINGS ---
    if any(w in query for w in ["batch", "batches", "timing", "schedule", "class time"]):
        batch_name = student.batch if student and student.batch else "Assigned Cohort"
        return {
            "reply": (
                f"⏰ **Your Academic Batch Schedule**:\n\n"
                f"• **Assigned Batch:** {batch_name}\n"
                f"• **Enrolled Course:** {student.course if student else 'Computer Engineering'}\n\n"
                f"👉 Check the **Batches & Schedule** page in the sidebar for full timetables."
            ),
            "suggested_actions": ["Check My Attendance", "Download Study Materials", "Latest Notices"]
        }

    # --- INTENT: NOTICES & CIRCULARS ---
    if any(w in query for w in ["notice", "notices", "circular", "announcement"]):
        notices = db.query(Notice).order_by(Notice.id.desc()).limit(3).all()
        n_str = "\n\n".join([f"📌 **{n.title}**\n{n.message}" for n in notices]) if notices else "No active notices."
        return {
            "reply": f"📢 **Campus Announcements & Circulars**:\n\n{n_str}",
            "suggested_actions": ["Download Study Materials", "Check My Attendance", "Check Fee Statement"]
        }

    # --- DEFAULT STUDENT GREETING & HELP ---
    return {
        "reply": (
            f"👋 **Hello {student_name} ({reg_id})!**\n\n"
            f"I am your **Student AI Academic Assistant**.\n\n"
            f"✨ **Here is what I can look up for you instantly:**\n"
            f"• 📊 **Your Attendance Percentage & Session Logs**\n"
            f"• 💳 **Pending Fee Balance & Payment Instructions**\n"
            f"• 🏆 **Exam Marks, Subject Scores & Conferred Grade**\n"
            f"• 📚 **Download Course Study Materials & PDF Notes**\n"
            f"• 🎓 **Check Certificate Unlock & Progress Status**\n\n"
            f"What would you like to check right now?"
        ),
        "suggested_actions": [
            "What is my attendance?",
            "How much fee is pending?",
            "What are my marks?",
            "Download study materials",
            "Show latest notices"
        ]
    }
