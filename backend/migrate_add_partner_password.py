"""
Migration: add missing 'password' column to res_partner table.
Run once to fix the UndefinedColumn error.
"""
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Adding 'password' column to res_partner (if missing)...")
    conn.execute(text("""
        ALTER TABLE res_partner
        ADD COLUMN IF NOT EXISTS password VARCHAR NULL
    """))
    conn.commit()
    print("Migration complete!")
