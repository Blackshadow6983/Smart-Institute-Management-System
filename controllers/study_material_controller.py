import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import (
    get_current_user,
    require_admin,
    is_admin_role,
    is_staff_role,
    is_student_role,
    normalize_role
)
from models.study_material import StudyMaterial
from models.course import Course
from models.batch import Batch
from models.student import Student
from models.faculty import Faculty
from models.course_application import CourseApplication

router = APIRouter(
    prefix="/study-materials",
    tags=["Study Materials"]
)

ALLOWED_EXTENSIONS = {".pdf", ".ppt", ".pptx", ".doc", ".docx", ".txt"}


# =========================================================
# UPLOAD STUDY MATERIAL (Staff & Admin)
# =========================================================
@router.post("/upload")
def upload_study_material(
    title: str = Form(...),
    description: str | None = Form(None),
    course_id: int | None = Form(None),
    batch_id: int | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = normalize_role(current_user.get("role"))
    if not (is_admin_role(role) or is_staff_role(role)):
        raise HTTPException(
            status_code=403,
            detail="Only Faculty, Staff, and Admins can upload study materials."
        )

    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Material title is required.")

    # Staff course/batch assignment authorization check
    if is_staff_role(role) and not is_admin_role(role):
        username = current_user.get("username", "")
        faculty_obj = db.query(Faculty).filter(
            (Faculty.employee_id == username) | (Faculty.email == current_user.get("email"))
        ).first()

        faculty_name = faculty_obj.name if faculty_obj else username
        authorized = False

        if course_id:
            c_obj = db.query(Course).filter(Course.id == course_id).first()
            if c_obj:
                c_title = getattr(c_obj, 'name', getattr(c_obj, 'title', ''))
                assigned_batches = db.query(Batch).filter(
                    (Batch.course == c_title) &
                    ((Batch.faculty == faculty_name) | (Batch.faculty == username))
                ).all()
                spec_match = faculty_obj and (
                    (faculty_obj.specialization and c_title.lower() in faculty_obj.specialization.lower()) or
                    (faculty_obj.department and c_title.lower() in faculty_obj.department.lower())
                )
                if assigned_batches or spec_match or not faculty_obj:
                    authorized = True

        if batch_id:
            b_obj = db.query(Batch).filter(Batch.id == batch_id).first()
            if b_obj:
                if (b_obj.faculty == faculty_name or b_obj.faculty == username) or not faculty_obj:
                    authorized = True
                else:
                    authorized = False

        if not course_id and not batch_id:
            authorized = True

        if not authorized:
            raise HTTPException(
                status_code=403,
                detail="Faculty member is not assigned to this course or batch."
            )

    filename = file.filename or "file.pdf"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, PPT, PPTX, DOC, DOCX, TXT."
        )

    # Sanitize & Generate safe filename
    safe_filename = f"sm_{uuid.uuid4().hex[:10]}{ext}"
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "study_materials")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, safe_filename)

    # Copy file to storage
    file_size = 0
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(file_path)

    # Max size check: 25MB
    if file_size > 25 * 1024 * 1024:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 25 MB.")

    inst_code = current_user.get("institute_code") or "DEFAULT"
    c_name = None
    b_name = None

    if course_id:
        c_obj = db.query(Course).filter(Course.id == course_id).first()
        if c_obj:
            c_name = getattr(c_obj, 'name', getattr(c_obj, 'title', 'Course'))


    if batch_id:
        b_obj = db.query(Batch).filter(Batch.id == batch_id).first()
        if b_obj:
            b_name = b_obj.name

    file_type_label = ext.replace(".", "").upper()

    material = StudyMaterial(
        institute_code=inst_code,
        title=title.strip(),
        description=description.strip() if description else None,
        file_name=filename,
        file_path=file_path,
        file_type=file_type_label,
        file_size=file_size,
        course_id=course_id,
        course_name=c_name,
        batch_id=batch_id,
        batch_name=b_name,
        uploaded_by=current_user.get("username", "staff")
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    return {
        "message": "Study material uploaded successfully!",
        "material": {
            "id": material.id,
            "title": material.title,
            "description": material.description,
            "file_name": material.file_name,
            "file_type": material.file_type,
            "file_size": material.file_size,
            "course_id": material.course_id,
            "course_name": material.course_name,
            "batch_id": material.batch_id,
            "batch_name": material.batch_name,
            "uploaded_by": material.uploaded_by,
            "uploaded_at": str(material.uploaded_at)
        }
    }


# =========================================================
# LIST STUDY MATERIALS (FILTERED BY ENROLLED COURSE FOR STUDENTS)
# =========================================================
@router.get("/")
def list_study_materials(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = normalize_role(current_user.get("role"))
    inst_code = current_user.get("institute_code")

    query = db.query(StudyMaterial)
    if inst_code:
        query = query.filter(StudyMaterial.institute_code == inst_code)

    if is_student_role(role):
        # Filter materials for student's enrolled courses/batches
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student:
            return []

        # Get all enrolled course IDs & course names for student
        apps = db.query(CourseApplication).filter(CourseApplication.student_id == student.id).all()
        enrolled_course_ids = [a.course_id for a in apps if a.course_id]
        
        # Also check student.course string matching
        student_course_str = student.course or ""

        materials = query.all()
        filtered = []
        for m in materials:
            # Match by course_id OR course_name string OR unassigned general materials
            match_id = m.course_id and m.course_id in enrolled_course_ids
            match_name = m.course_name and student_course_str and m.course_name.lower() in student_course_str.lower()
            general_material = not m.course_id and not m.course_name

            if match_id or match_name or general_material:
                filtered.append(m)

        materials = filtered
    else:
        materials = query.order_by(StudyMaterial.id.desc()).all()

    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "file_name": m.file_name,
            "file_type": m.file_type,
            "file_size": m.file_size,
            "course_id": m.course_id,
            "course_name": m.course_name,
            "batch_id": m.batch_id,
            "batch_name": m.batch_name,
            "uploaded_by": m.uploaded_by,
            "uploaded_at": str(m.uploaded_at) if m.uploaded_at else None
        }
        for m in materials
    ]


# =========================================================
# SECURE FILE DOWNLOAD ENDPOINT
# =========================================================
@router.get("/{material_id}/download")
def download_study_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = normalize_role(current_user.get("role"))
    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")

    if not os.path.exists(material.file_path):
        raise HTTPException(status_code=404, detail="Physical material file missing from server storage.")

    # Access Authorization Check
    if is_student_role(role):
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student:
            raise HTTPException(status_code=403, detail="Student profile not found.")

        apps = db.query(CourseApplication).filter(CourseApplication.student_id == student.id).all()
        enrolled_course_ids = [a.course_id for a in apps if a.course_id]
        student_course_str = (student.course or "").lower()

        match_id = material.course_id and material.course_id in enrolled_course_ids
        match_name = material.course_name and student_course_str and material.course_name.lower() in student_course_str
        general_material = not material.course_id and not material.course_name

        if not (match_id or match_name or general_material):
            raise HTTPException(
                status_code=403,
                detail="Access denied. You are not enrolled in the course for this study material."
            )

    return FileResponse(
        path=material.file_path,
        filename=material.file_name,
        media_type="application/octet-stream"
    )


# =========================================================
# DELETE STUDY MATERIAL (Staff Owner & Admin)
# =========================================================
@router.delete("/{material_id}")
def delete_study_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = normalize_role(current_user.get("role"))
    if is_student_role(role):
        raise HTTPException(status_code=403, detail="Students are not authorized to delete study materials.")

    material = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")

    # Check staff ownership
    if is_staff_role(role) and material.uploaded_by != current_user.get("username"):
        raise HTTPException(status_code=403, detail="You can only delete study materials uploaded by yourself.")

    # Remove physical file
    if os.path.exists(material.file_path):
        try:
            os.remove(material.file_path)
        except Exception as err:
            print("File cleanup note:", err)

    db.delete(material)
    db.commit()

    return {"message": "Study material deleted successfully."}
