from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from config import SECRET_KEY, ALGORITHM


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
# ADMIN / INSTITUTE AUTHORIZATION
# =========================================================

def require_admin(
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Institute Admin access required"
        )

    return current_user


# =========================================================
# FACULTY AUTHORIZATION
# =========================================================

def require_faculty(
    current_user: dict = Depends(get_current_user)
):
    role = current_user["role"].lower()
    if role not in ["faculty", "staff", "admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty, Staff or Admin access required"
        )

    return current_user


# =========================================================
# STUDENT AUTHORIZATION
# =========================================================

def require_student(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"].lower() != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )

    return current_user