#!/usr/bin/env python3
"""
Check media_files table for the specific image
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
print(f"Checking media_files table for: 1770760197957-1861541a.png")
print(f"{'='*80}\n")

# Check if the file exists in media_files
cursor.execute("""
    SELECT *
    FROM media_files
    WHERE file_path LIKE '%1770760197957-1861541a.png%'
""")

result = cursor.fetchone()

if result:
    # Get column names
    cursor.execute("PRAGMA table_info(media_files)")
    columns = [col[1] for col in cursor.fetchall()]

    print("Found the file in media_files table:\n")
    for i, col_name in enumerate(columns):
        print(f"{col_name}: {result[i]}")

    print(f"\n{'-'*80}\n")
else:
    print("File NOT found in media_files table\n")

# Check all media files with localhost
print(f"{'='*80}")
print("Checking ALL media files with localhost URLs...")
print(f"{'='*80}\n")

cursor.execute("""
    SELECT *
    FROM media_files
    WHERE file_path LIKE '%localhost%' OR file_path LIKE '%127.0.0.1%'
""")

localhost_files = cursor.fetchall()

if localhost_files:
    cursor.execute("PRAGMA table_info(media_files)")
    columns = [col[1] for col in cursor.fetchall()]

    print(f"Found {len(localhost_files)} file(s) with localhost URLs:\n")
    for file in localhost_files:
        for i, col_name in enumerate(columns):
            print(f"{col_name}: {file[i]}")
        print(f"{'-'*80}\n")
else:
    print("✅ No media files found with localhost URLs")

# Show all media files to understand the pattern
print(f"\n{'='*80}")
print("Sample of media files (first 5):")
print(f"{'='*80}\n")

cursor.execute("SELECT * FROM media_files LIMIT 5")
sample_files = cursor.fetchall()

if sample_files:
    cursor.execute("PRAGMA table_info(media_files)")
    columns = [col[1] for col in cursor.fetchall()]

    for file in sample_files:
        for i, col_name in enumerate(columns):
            print(f"{col_name}: {file[i]}")
        print(f"{'-'*80}\n")
else:
    print("No media files found in database")

conn.close()
