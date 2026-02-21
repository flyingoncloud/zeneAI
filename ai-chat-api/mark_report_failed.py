#!/usr/bin/env python3
"""Mark report 48 as failed to stop UI polling"""

from src.database import models
from src.database import progress_models
from src.database import psychology_models
from src.database.database import SessionLocal

db = SessionLocal()
report = db.query(psychology_models.PsychologyReport).filter(
    psychology_models.PsychologyReport.id == 48
).first()

if report:
    report.generation_status = 'failed'
    report.error_message = 'Report generation interrupted. Please restart the test.'
    db.commit()
    print(f'Report 48 marked as failed')
else:
    print('Report 48 not found')

db.close()
