def analyze_student_performance(
    attendance_percentage: float,
    average_marks: float
):

    if attendance_percentage < 75:
        attendance_message = (
            "Student attendance is low."
        )
    else:
        attendance_message = (
            "Student attendance is good."
        )

    if average_marks < 40:
        marks_message = (
            "Student needs academic improvement."
        )
    elif average_marks < 60:
        marks_message = (
            "Student performance is average."
        )
    else:
        marks_message = (
            "Student performance is good."
        )

    return {
        "attendance_analysis":
            attendance_message,
        "academic_analysis":
            marks_message
    }