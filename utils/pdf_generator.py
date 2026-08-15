from reportlab.pdfgen import canvas


def create_simple_pdf(
    file_path: str,
    title: str,
    lines: list[str]
):

    pdf = canvas.Canvas(file_path)

    pdf.setFont(
        "Helvetica-Bold",
        18
    )

    pdf.drawString(
        50,
        800,
        title
    )

    y = 760

    pdf.setFont(
        "Helvetica",
        11
    )

    for line in lines:

        pdf.drawString(
            50,
            y,
            str(line)
        )

        y -= 25

    pdf.save()

    return file_path