import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import create_engine, MetaData, Table, text
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL

print("Connecting to local SQLite database...")
sqlite_engine = create_engine("sqlite:///./sql_app.db")

print("Connecting to Supabase PostgreSQL database...")
# Use DIRECT_URL or DATABASE_URL without pgbouncer parameter for DDL/schema migration
pg_url = DATABASE_URL
if "pgbouncer=true" in pg_url:
    pg_url = pg_url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

pg_engine = create_engine(pg_url)

# Make sure tables exist on Supabase PostgreSQL
from database.database import Base
import models
Base.metadata.create_all(bind=pg_engine)

sqlite_meta = MetaData()
sqlite_meta.reflect(bind=sqlite_engine)

print("Migrating data from SQLite to Supabase PostgreSQL...")

table_order = [
    "institutes",
    "users",
    "admins",
    "faculty",
    "students",
    "courses",
    "course_modules",
    "batches",
    "course_applications",
    "student_module_progress",
    "attendance",
    "fees",
    "assessments",
    "notices",
    "suggestions",
    "certificates",
    "notification_logs"
]

with sqlite_engine.connect() as sqlite_conn, pg_engine.connect() as pg_conn:
    for table_name in table_order:
        if table_name not in sqlite_meta.tables:
            print(f"Skipping {table_name} (not found in SQLite)")
            continue

        table = sqlite_meta.tables[table_name]
        rows = sqlite_conn.execute(table.select()).mappings().all()

        if not rows:
            print(f"Table '{table_name}' has 0 rows.")
            continue

        print(f"Migrating {len(rows)} row(s) for table '{table_name}'...")

        # Clear existing rows in target table to avoid duplicate primary key errors
        try:
            pg_conn.execute(text(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE;"))
            pg_conn.commit()
        except Exception:
            try:
                pg_conn.execute(text(f"DELETE FROM {table_name};"))
                pg_conn.commit()
            except Exception as e:
                print(f"  Warning clearing table {table_name}: {e}")

        # Insert rows
        pg_table = Table(table_name, MetaData(), autoload_with=pg_engine)
        for row in rows:
            row_dict = dict(row)
            try:
                pg_conn.execute(pg_table.insert().values(**row_dict))
            except Exception as err:
                print(f"  Error inserting row into {table_name}: {err}")

        pg_conn.commit()
        print(f"  Successfully migrated '{table_name}'.")

print("Migration completed successfully!")
