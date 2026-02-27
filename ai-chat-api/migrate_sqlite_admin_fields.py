#!/usr/bin/env python3
"""
SQLite migration script to add admin panel fields to assessment_questions table
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
print(f"Starting migration for: {db_path}")
print(f"{'='*80}\n")

# Check current columns
cursor.execute("PRAGMA table_info(assessment_questions)")
existing_columns = [col[1] for col in cursor.fetchall()]
print(f"Existing columns: {', '.join(existing_columns)}\n")

# Define new columns to add
new_columns = [
    ("template", "VARCHAR(10)"),
    ("status", "VARCHAR(20) DEFAULT 'published'"),
    ("internal_title", "VARCHAR(255)"),
    ("subtitle", "VARCHAR(500)"),
    ("media_url", "VARCHAR(500)"),
    ("media_type", "VARCHAR(20)"),
    ("template_settings", "JSON"),
    ("validation", "JSON DEFAULT '{\"required\": true}'"),
    ("tags", "JSON DEFAULT '[]'"),
    ("display_order", "INTEGER DEFAULT 0"),
    ("updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP"),
    ("source_type", "VARCHAR(20) DEFAULT 'legacy'"),
]

# Add columns that don't exist
added_count = 0
for col_name, col_type in new_columns:
    if col_name not in existing_columns:
        try:
            print(f"Adding column: {col_name} ({col_type})")
            cursor.execute(f"ALTER TABLE assessment_questions ADD COLUMN {col_name} {col_type}")
            conn.commit()
            print(f"✓ Added {col_name}")
            added_count += 1
        except Exception as e:
            print(f"✗ Failed to add {col_name}: {e}")
            conn.rollback()
    else:
        print(f"⊘ Column {col_name} already exists, skipping")

print(f"\n{'-'*80}")
print(f"Added {added_count} new columns")
print(f"{'-'*80}\n")

# Update existing questions with defaults
print("Setting defaults for existing questions...")

try:
    # Set internal_title from text for existing questions
    cursor.execute("""
        UPDATE assessment_questions
        SET internal_title = SUBSTR(text, 1, 100)
        WHERE internal_title IS NULL AND text IS NOT NULL
    """)

    # Set source_type to 'legacy' for existing questions
    cursor.execute("""
        UPDATE assessment_questions
        SET source_type = 'legacy'
        WHERE source_type IS NULL
    """)

    # Set status to 'published' for existing questions
    cursor.execute("""
        UPDATE assessment_questions
        SET status = 'published'
        WHERE status IS NULL
    """)

    conn.commit()
    print("✓ Defaults set for existing questions\n")
except Exception as e:
    print(f"✗ Failed to set defaults: {e}\n")
    conn.rollback()

# Verify migration
print(f"{'='*80}")
print("Current assessment_questions schema:")
print(f"{'='*80}\n")

cursor.execute("PRAGMA table_info(assessment_questions)")
columns = cursor.fetchall()

for col in columns:
    cid, name, type, notnull, default, pk = col
    nullable = "NOT NULL" if notnull else "NULL"
    default_str = f", default={default}" if default else ""
    print(f"  {name}: {type} ({nullable}{default_str})")

# Count questions by source type
print(f"\n{'='*80}")
print("Question counts by source:")
print(f"{'='*80}\n")

cursor.execute("""
    SELECT source_type, COUNT(*)
    FROM assessment_questions
    GROUP BY source_type
""")

for row in cursor.fetchall():
    source_type, count = row
    print(f"  {source_type}: {count} questions")

print(f"\n{'='*80}")
print("✓ Migration completed successfully!")
print(f"{'='*80}\n")

conn.close()
