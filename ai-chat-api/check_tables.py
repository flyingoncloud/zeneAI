#!/usr/bin/env python3
"""
Check all tables in the database
"""
import sqlite3
import os

# Database path
db_path = os.path.join(os.path.dirname(__file__), 'chat.db')

if not os.path.exists(db_path):
    print(f"Database not found at: {db_path}")
    exit(1)

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print(f"\n{'='*80}")
print(f"All tables in database: {db_path}")
print(f"{'='*80}\n")

# Get all tables
cursor.execute("""
    SELECT name FROM sqlite_master
    WHERE type='table'
    ORDER BY name
""")

tables = cursor.fetchall()

for table in tables:
    table_name = table[0]
    print(f"\nTable: {table_name}")
    print(f"{'-'*80}")

    # Get column info
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()

    for col in columns:
        cid, name, type, notnull, default, pk = col
        print(f"  {name} ({type})")

    # Get row count
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"  → {count} rows")

conn.close()
