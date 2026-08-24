from fastapi import Depends, HTTPException, status

from security.auth import get_current_user


def require_admin(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


def require_student(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )

    return current_user


def require_faculty(
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    if role not in ["faculty", "staff", "admin", "institute", "institute_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty or Staff access required"
        )

    return current_user