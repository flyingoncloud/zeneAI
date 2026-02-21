#!/usr/bin/env python3
"""Check report status from database"""
import sys

from src.database import models
from src.database import progress_models
from src.database import psychology_models
from src.database.database import SessionLocal

if len(sys.argv) < 2:
    print("Usage: python check_report_status.py <report_id>")
    sys.exit(1)

report_id = int(sys.argv[1])

db = SessionLocal()
report = db.query(psychology_models.PsychologyReport).filter(
    psychology_models.PsychologyReport.id == report_id
).first()

if report:
    print(f'Report {report_id}:')
    print(f'  Status: {report.generation_status}')
    print(f'  Error: {report.error_message}')
    print(f'  Assessment ID: {report.assessment_id}')
    print(f'  Requested: {report.requested_at}')
    print(f'  Generated: {report.generated_at}')
    print(f'  Has report_data: {report.report_data is not None and len(str(report.report_data)) > 10}')
else:
    print(f'Report {report_id} not found')

db.close()
