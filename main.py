import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database.database import Base, engine

# Import all models
import models

# Controllers
from controllers.auth_controller import router as auth_router
from controllers.student_controller import router as student_router
from controllers.faculty_controller import router as faculty_router
from controllers.admin_controller import router as admin_router
from controllers.institute_controller import router as institute_router
from controllers.course_controller import router as course_router
from controllers.batch_controller import router as batch_router
from controllers.attendance_controller import router as attendance_router
from controllers.fees_controller import router as fees_router
from controllers.assessment_controller import router as assessment_router
from controllers.notice_controller import router as notice_router
from controllers.report_controller import router as report_router
from controllers.certificate_controller import router as certificate_router
from models.course_application import CourseApplication
from controllers.course_application_controller import (
    router as course_application_router
)
from controllers.ai_controller import router as ai_router


app = FastAPI(
    title="AI Smart Institute Management System",
    description="Backend API for AI Smart Institute Management System with Multi-Tenant Architecture",
    version="2.0.0"
)


# Allow website/mobile app to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables
Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {
        "message": "AI Smart Institute Management System Backend",
        "portal_url": "/portal/index.html",
        "docs_url": "/docs",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "Backend is running"
    }


# Routes
app.include_router(auth_router)
app.include_router(institute_router)
app.include_router(student_router)
app.include_router(faculty_router)
app.include_router(admin_router)
app.include_router(course_router)
app.include_router(batch_router)
app.include_router(attendance_router)
app.include_router(fees_router)
app.include_router(assessment_router)
app.include_router(notice_router)
app.include_router(report_router)
app.include_router(certificate_router)
app.include_router(course_application_router)
app.include_router(ai_router)

# Mount Frontend Portal
portal_dir = os.path.join(os.path.dirname(__file__), "student_website")
if os.path.exists(portal_dir):
    app.mount("/portal", StaticFiles(directory=portal_dir, html=True), name="portal")