"""
One-time migration: make session_id and user_id nullable on pos_order.
Run once, then delete this file.
"""
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("Altering pos_order.session_id to be nullable...")
    conn.execute(text("ALTER TABLE pos_order ALTER COLUMN session_id DROP NOT NULL"))
    print("Altering pos_order.user_id to be nullable...")
    conn.execute(text("ALTER TABLE pos_order ALTER COLUMN user_id DROP NOT NULL"))
    conn.commit()
    print("Migration complete!")
