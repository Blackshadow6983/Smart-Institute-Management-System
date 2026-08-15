def validate_mobile(mobile: str):

    return (
        mobile.isdigit()
        and len(mobile) >= 10
    )


def validate_password(password: str):

    return len(password) >= 6