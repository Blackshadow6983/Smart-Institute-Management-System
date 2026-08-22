import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import engine
from sqlalchemy import text

tables = [
    'users',
    'institutes',
    'admins',
    'faculty',
    'students',
    'courses',
    'course_modules',
    'batches',
    'course_applications',
    'attendance',
    'fees',
    'assessments',
    'notices',
    'suggestions',
    'certificates'
]

with engine.connect() as conn:
    for tbl in tables:
        try:
            conn.execute(text(f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), COALESCE(MAX(id), 1)) FROM {tbl};"))
            conn.commit()
            print(f"Successfully synced sequence for table '{tbl}'")
        except Exception as e:
            print(f"Warning syncing '{tbl}': {e}")

print("Sequence fix complete!")
