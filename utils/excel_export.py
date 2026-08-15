from openpyxl import Workbook


def create_excel(
    file_path: str,
    headers: list,
    rows: list
):

    workbook = Workbook()

    sheet = workbook.active

    sheet.append(headers)

    for row in rows:
        sheet.append(row)

    workbook.save(file_path)

    return file_path