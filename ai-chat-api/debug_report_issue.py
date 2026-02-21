#!/usr/bin/env python3
"""
Debug script to check report generation issues
"""
import sqlite3

db_path = '/Volumes/workplace/zeneAI/ai-chat-api/chat.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=== Psychology Assessments ===")
cursor.execute("SELECT id, user_id, completed_at, completion_percentage FROM psychology_assessments")
assessments = cursor.fetchall()
print(f"Total assessments: {len(assessments)}")
for a in assessments:
    print(f"  ID: {a[0]}, User: {a[1]}, Completed: {a[2]}, Progress: {a[3]}%")

print("\n=== Psychology Reports ===")
cursor.execute("SELECT id, assessment_id, generation_status, error_message FROM psychology_reports")
reports = cursor.fetchall()
print(f"Total reports: {len(reports)}")
for r in reports:
    print(f"  ID: {r[0]}, Assessment: {r[1]}, Status: {r[2]}")
    if r[3]:
        print(f"    Error: {r[3]}")

conn.close()

