import sys
sys.path.insert(0, '/Volumes/workplace/zeneAI/ai-chat-api')

from src.database.db_setup import get_db_session
from src.database.progress_models import PsychologyReport

db = next(get_db_session())
report = db.query(PsychologyReport).filter_by(id=45).first()

if report:
    print(f"Report 45 Status: {report.status}")
    print(f"Assessment ID: {report.assessment_id}")
    print(f"User ID: {report.user_id}")
    print(f"Error Message: {report.error_message}")
else:
    print("Report 45 not found")

db.close()
