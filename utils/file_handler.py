import os


def save_file(
    file_path: str,
    content: bytes
):

    folder = os.path.dirname(file_path)

    if folder:
        os.makedirs(
            folder,
            exist_ok=True
        )

    with open(file_path, "wb") as file:
        file.write(content)

    return file_path