#!/usr/bin/env python3
"""Check report 48 status"""

# Import all models to avoid relationship resolution issues
from src.database import models
from src.database import progress_models
from src.database import psychology_models
from src.database.database import SessionLocal

db = SessionLocal()
report = db.query(psychology_models.PsychologyReport).filter(
    psychology_models.PsychologyReport.id == 48
).first()

if report:
    print(f'Report 48 generation_status: {report.generation_status}')
    print(f'Error: {report.error_message}')
    print(f'Assessment ID: {report.assessment_id}')
    print(f'Requested at: {report.requested_at}')
    print(f'Generated at: {report.generated_at}')
    print(f'Report data exists: {report.report_data is not None}')
else:
    print('Report 48 not found')

db.close()
