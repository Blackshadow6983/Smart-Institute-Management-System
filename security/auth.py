from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from config import SECRET_KEY, ALGORITHM


ADMIN_ROLES = {"admin", "institute", "institute_admin"}
STAFF_ROLES = {"faculty", "staff"}
ATTENDANCE_ROLES = ADMIN_ROLES | STAFF_ROLES
STUDENT_ROLES = {"student"}


def normalize_role(role: str | None) -> str:
    return (role or "").strip().lower()


def is_admin_role(role: str | None) -> bool:
    return normalize_role(role) in ADMIN_ROLES


def is_staff_role(role: str | None) -> bool:
    return normalize_role(role) in STAFF_ROLES


def can_manage_attendance_role(role: str | None) -> bool:
    return normalize_role(role) in ATTENDANCE_ROLES


def is_student_role(role: str | None) -> bool:
    return normalize_role(role) in STUDENT_ROLES


# =========================================================
# HTTP BEARER SECURITY
# =========================================================

security = HTTPBearer()


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")
        username = payload.get("username")
        role = payload.get("role")
        institute_code = payload.get("institute_code")

        # Check required token information
        if user_id is None or username is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        return {
            "id": int(user_id),
            "username": username,
            "role": role,
            "institute_code": institute_code
        }

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


# =========================================================
# AUTHORIZATION DEPENDENCIES
# =========================================================

def require_admin(
    current_user: dict = Depends(get_current_user)
):
    if not is_admin_role(current_user.get("role")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Institute Admin access required"
        )

    return current_user


def require_attendance_permission(
    current_user: dict = Depends(get_current_user)
):
    if not can_manage_attendance_role(current_user.get("role")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty, Staff or Admin access required"
        )

    return current_user


# Alias for backward compatibility
require_faculty = require_attendance_permission


def require_student(
    current_user: dict = Depends(get_current_user)
):
    if not is_student_role(current_user.get("role")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )

    return current_user