import datetime


def send_email(
    to_email: str,
    subject: str,
    message: str
):
    try:
        print("=" * 60)
        print("[EMAIL DISPATCH SIMULATOR / SMTP]")
        print(f"Timestamp : {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"To        : {to_email}")
        print(f"Subject   : {subject}")
        print("-" * 60)
        print(message)
        print("=" * 60)
    except Exception as e:
        print(f"[Email Log Error (non-blocking)]: {e}")
    return True


def send_student_credentials_email(
    student_email: str,
    student_name: str,
    registration_id: str,
    password: str,
    institute_name: str,
    institute_code: str,
    course_name: str = None,
    course_duration: str = None,
    course_fee: float = 0.0,
    parent_email: str = None
):
    subject = f"Welcome to {institute_name} [{institute_code}] - Your Student Portal Login Credentials"
    
    fee_str = f"INR {course_fee:,.2f}" if course_fee else "As per schedule"
    duration_str = course_duration or "Standard Academic Term"
    course_str = course_name or "General Enrolled Course"

    body = f"""
Dear {student_name},

Congratulations! You have been successfully enrolled at {institute_name}.
Your student profile has been created and your login account is now active.

------------------------------------------------------------
YOUR LOGIN CREDENTIALS
------------------------------------------------------------
* Institute Name    : {institute_name}
* Institute Code    : {institute_code}
* Enrollment / ID   : {registration_id}
* Temporary Password: {password}

------------------------------------------------------------
ACADEMIC & COURSE DETAILS
------------------------------------------------------------
* Enrolled Course   : {course_str}
* Course Duration   : {duration_str}
* Total Course Fees : {fee_str}

------------------------------------------------------------
HOW TO ACCESS YOUR STUDENT DASHBOARD
------------------------------------------------------------
1. Open the Student Portal: http://localhost:5173/login
2. Enter your Enrollment ID: {registration_id}
3. Enter your Password: {password}
4. Click 'Sign In' to access your schedule, assignments, attendance, fee records, and notices.

Please keep your credentials secure. You may change your password anytime from your profile settings.

Warm regards,
Academic Administration & Admissions Office
{institute_name} ({institute_code})
"""

    send_email(to_email=student_email, subject=subject, message=body)

    if parent_email and parent_email.strip() and parent_email != student_email:
        parent_subject = f"Enrollment Confirmation for {student_name} - {institute_name} [{institute_code}]"
        parent_body = f"""
Dear Parent/Guardian,

This is to confirm that {student_name} has been officially registered at {institute_name} under Institute Code {institute_code}.

* Student Enrollment ID : {registration_id}
* Program / Course      : {course_str}
* Program Duration      : {duration_str}
* Total Course Fee      : {fee_str}

Portal access credentials have been delivered to your ward's email ({student_email}).

Sincerely,
Admissions & Student Affairs
{institute_name}
"""
        send_email(to_email=parent_email, subject=parent_subject, message=parent_body)

    return True


def send_fee_notification_email(
    recipient_email: str,
    recipient_name: str,
    student_name: str,
    registration_id: str,
    institute_name: str,
    institute_code: str,
    course_name: str,
    total_fee: float,
    paid_fee: float,
    pending_fee: float,
    custom_note: str = None
):
    subject = f"Fee Notice & Statement: {student_name} [{registration_id}] - {institute_name}"
    
    note_text = f"\nInstitute Admin Note:\n\"{custom_note}\"\n" if custom_note else ""

    body = f"""
Dear {recipient_name},

This is an official fee notification and statement from {institute_name} ({institute_code}) for student {student_name} ({registration_id}).

------------------------------------------------------------
ACADEMIC FEE BREAKDOWN
------------------------------------------------------------
* Enrolled Course    : {course_name or 'Enrolled Academic Program'}
* Total Course Fee   : INR {total_fee:,.2f}
* Total Amount Paid  : INR {paid_fee:,.2f}
* Balance Pending Due: INR {pending_fee:,.2f}
{note_text}
------------------------------------------------------------
PAYMENT INSTRUCTIONS
------------------------------------------------------------
Please clear the balance due amount at your earliest convenience through the institutional finance counter or the online portal.
View your complete transaction history on the student portal: http://localhost:5173/login

Thank you for your prompt attention.

Accounts & Finance Department
{institute_name} [{institute_code}]
"""
    send_email(to_email=recipient_email, subject=subject, message=body)
    return True