#!/usr/bin/env python3
"""Manually trigger report 48 generation"""

import sys
from src.api.psychology_report_routes import generate_report_background

# Trigger the background task directly
print("Triggering report generation for report_id=48, assessment_id=51...")
try:
    generate_report_background(
        report_id=48,
        assessment_id=51,
        user_id="197268ec-22bc-454b-819a-38e52d8a79eb",  # From the logs
        language='zh'
    )
    print("Report generation completed successfully!")
except Exception as e:
    print(f"Error during report generation: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
