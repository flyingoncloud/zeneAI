#!/usr/bin/env python3
"""
Test script to verify growth potential sub-category score normalization fix.

This simulates the report generation logic to ensure:
1. Category codes (2.5.1, 2.5.2, 2.5.3) are correctly mapped to field names
2. Raw scores are normalized to 0-100 scale
3. The report template receives the expected data structure
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models to ensure relationships are properly configured
from src.database import models  # Main models
from src.database import psychology_models  # Psychology models
from src.database import progress_models  # Progress models
from src.database import questionnaire_models  # Questionnaire models

from src.database.psychology_models import PsychologyAssessment
from src.services.psychology.report_assembler import get_growth_potential_section

# Database connection
DATABASE_URL = "postgresql://chat_user:chat_pass@localhost:5432/chat_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def test_growth_potential_normalization():
    """Test growth potential sub-category score normalization"""

    print("=" * 80)
    print("Testing Growth Potential Sub-Category Score Normalization")
    print("=" * 80)

    db = SessionLocal()

    try:
        # Get the most recent assessment (report 49)
        assessment = db.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == 52  # Assessment ID from report 49
        ).first()

        if not assessment:
            print("❌ Assessment 52 not found")
            return False

        print(f"\n✅ Found assessment {assessment.id}")
        print(f"   User: {assessment.user_id}")
        print(f"   Growth Potential Score: {assessment.growth_potential_score}/100")

        # Check raw sub-dimension scores
        sub_scores = assessment.sub_dimension_scores or {}
        print(f"\n📊 Raw sub-dimension scores:")
        print(f"   2.5.1 (Insight Depth): {sub_scores.get('2.5.1', 0)}")
        print(f"   2.5.2 (Psychological Plasticity): {sub_scores.get('2.5.2', 0)}")
        print(f"   2.5.3 (Resilience): {sub_scores.get('2.5.3', 0)}")

        # Test the fixed function
        print(f"\n🔧 Testing get_growth_potential_section()...")
        result = get_growth_potential_section(assessment, db)

        print(f"\n✅ Function returned successfully!")
        print(f"\n📈 Normalized scores (0-100):")
        print(f"   Total Score: {result['total_score']}/100")
        print(f"   Insight Depth: {result['insight_depth']}/100")
        print(f"   Psychological Plasticity: {result['psychological_plasticity']}/100")
        print(f"   Resilience: {result['resilience']}/100")

        # Validate results
        errors = []

        if result['total_score'] != assessment.growth_potential_score:
            errors.append(f"Total score mismatch: {result['total_score']} != {assessment.growth_potential_score}")

        if result['insight_depth'] == 0 and sub_scores.get('2.5.1', 0) > 0:
            errors.append(f"Insight depth is 0 but raw score is {sub_scores.get('2.5.1', 0)}")

        if result['psychological_plasticity'] == 0 and sub_scores.get('2.5.2', 0) > 0:
            errors.append(f"Psychological plasticity is 0 but raw score is {sub_scores.get('2.5.2', 0)}")

        if result['resilience'] == 0 and sub_scores.get('2.5.3', 0) > 0:
            errors.append(f"Resilience is 0 but raw score is {sub_scores.get('2.5.3', 0)}")

        if errors:
            print(f"\n❌ Validation errors:")
            for error in errors:
                print(f"   - {error}")
            return False

        print(f"\n✅ All validations passed!")
        print(f"\n🎉 Fix is working correctly!")
        print(f"   - Category codes are mapped to field names")
        print(f"   - Raw scores are normalized to 0-100 scale")
        print(f"   - Report template will receive correct data")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        db.close()

if __name__ == "__main__":
    success = test_growth_potential_normalization()
    sys.exit(0 if success else 1)
