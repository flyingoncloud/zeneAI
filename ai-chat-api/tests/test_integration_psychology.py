"""
Integration Test for Psychology Models

Tests the complete workflow with actual database
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database.psychology_models import (
    Base,
    UserProfile,
    PsychologyAssessment,
    IFSPartsDetection,
    CognitivePatternsDetection,
    AttachmentStyle,
    NarrativeIdentity
)

# Use the actual database
DATABASE_URL = "sqlite:///./chat.db"


def test_complete_workflow():
    """Test a complete psychology assessment workflow"""
    print("\n" + "="*60)
    print("Integration Test: Complete Psychology Assessment Workflow")
    print("="*60 + "\n")

    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    try:
        # Step 1: Create a test user
        print("Step 1: Creating test user...")
        user = UserProfile(
            user_id="integration_test_user_001",
            username="Integration Test User",
            email="test@integration.com",
            age=28,
            gender="女",
            language_preference="zh"
        )
        session.add(user)
        session.commit()
        print(f"✓ User created: {user.user_id}")

        # Step 2: Create psychology assessment
        print("\nStep 2: Creating psychology assessment...")
        assessment = PsychologyAssessment(
            user_id=user.user_id,
            assessment_type="combined",
            emotional_regulation_score=52,
            cognitive_flexibility_score=61,
            relationship_sensitivity_score=70,
            internal_conflict_score=67,
            growth_potential_score=78,
            emotional_regulation_confidence=0.92,
            cognitive_flexibility_confidence=0.88,
            relationship_sensitivity_confidence=0.85,
            internal_conflict_confidence=0.90,
            growth_potential_confidence=0.87,
            questionnaire_contribution=60,
            conversation_contribution=40,
            completion_percentage=85,
            sub_dimension_scores={
                "emotional_regulation": {
                    "emotional_awareness": 55,
                    "emotional_expression": 48,
                    "emotional_management": 53
                }
            },
            ifs_metrics={
                "total_parts_detected": 5,
                "dominant_category": "managers"
            }
        )
        session.add(assessment)
        session.commit()
        print(f"✓ Assessment created: ID={assessment.id}")

        # Step 3: Add IFS parts detection
        print("\nStep 3: Adding IFS parts detections...")
        ifs_parts = [
            IFSPartsDetection(
                user_id=user.user_id,
                assessment_id=assessment.id,
                source_type="questionnaire",
                ifs_category="managers",
                category_score=18,
                part_id="inner_critic",
                part_name_en="Inner Critic",
                part_name_zh="内在批评者",
                detected=True,
                confidence_score=0.92,
                evidence_text="High self-criticism pattern detected"
            ),
            IFSPartsDetection(
                user_id=user.user_id,
                assessment_id=assessment.id,
                source_type="conversation",
                ifs_category="firefighters",
                category_score=15,
                part_id="distractor",
                part_name_en="Distractor",
                part_name_zh="分散注意者",
                detected=True,
                confidence_score=0.78,
                evidence_text="Avoidance behavior patterns"
            )
        ]
        session.add_all(ifs_parts)
        session.commit()
        print(f"✓ Added {len(ifs_parts)} IFS parts")

        # Step 4: Add cognitive patterns
        print("\nStep 4: Adding cognitive patterns...")
        patterns = [
            CognitivePatternsDetection(
                user_id=user.user_id,
                assessment_id=assessment.id,
                source_type="questionnaire",
                pattern_id="catastrophizing",
                pattern_name_en="Catastrophizing",
                pattern_name_zh="灾难化",
                detected=True,
                confidence_score=0.85,
                detection_count=3
            ),
            CognitivePatternsDetection(
                user_id=user.user_id,
                assessment_id=assessment.id,
                source_type="conversation",
                pattern_id="self_blame",
                pattern_name_en="Self-Blame",
                pattern_name_zh="自我责备",
                detected=True,
                confidence_score=0.82,
                detection_count=5
            )
        ]
        session.add_all(patterns)
        session.commit()
        print(f"✓ Added {len(patterns)} cognitive patterns")

        # Step 5: Add attachment style
        print("\nStep 5: Adding attachment style...")
        attachment = AttachmentStyle(
            user_id=user.user_id,
            assessment_id=assessment.id,
            source_type="questionnaire",
            secure_score=12,
            anxious_score=18,
            avoidant_score=10,
            disorganized_score=15,
            secure_detected=True,
            anxious_detected=True,
            dominant_style="anxious",
            dominant_confidence=0.85
        )
        session.add(attachment)
        session.commit()
        print(f"✓ Attachment style added: {attachment.dominant_style}")

        # Step 6: Add narrative identity
        print("\nStep 6: Adding narrative identity...")
        narrative = NarrativeIdentity(
            user_id=user.user_id,
            assessment_id=assessment.id,
            source_type="questionnaire",
            hero_score=8,
            victim_score=12,
            rebel_score=6,
            lost_score=10,
            explorer_score=15,
            dominant_narrative="explorer",
            dominant_confidence=0.82
        )
        session.add(narrative)
        session.commit()
        print(f"✓ Narrative identity added: {narrative.dominant_narrative}")

        # Step 7: Verify relationships
        print("\nStep 7: Verifying relationships...")
        retrieved_assessment = session.query(PsychologyAssessment).filter_by(
            user_id=user.user_id
        ).first()

        assert retrieved_assessment is not None
        assert len(retrieved_assessment.ifs_parts) == 2
        assert len(retrieved_assessment.cognitive_patterns) == 2
        assert retrieved_assessment.attachment_style is not None
        assert retrieved_assessment.narrative_identity is not None

        print(f"✓ Assessment has {len(retrieved_assessment.ifs_parts)} IFS parts")
        print(f"✓ Assessment has {len(retrieved_assessment.cognitive_patterns)} cognitive patterns")
        print(f"✓ Assessment has attachment style: {retrieved_assessment.attachment_style.dominant_style}")
        print(f"✓ Assessment has narrative: {retrieved_assessment.narrative_identity.dominant_narrative}")

        # Step 8: Query and display summary
        print("\n" + "="*60)
        print("Assessment Summary")
        print("="*60)
        print(f"User: {user.username} ({user.user_id})")
        print(f"Assessment Type: {assessment.assessment_type}")
        print(f"Completion: {assessment.completion_percentage}%")
        print(f"\nCore Dimensions:")
        print(f"  - Emotional Regulation: {assessment.emotional_regulation_score} (confidence: {assessment.emotional_regulation_confidence})")
        print(f"  - Cognitive Flexibility: {assessment.cognitive_flexibility_score} (confidence: {assessment.cognitive_flexibility_confidence})")
        print(f"  - Relationship Sensitivity: {assessment.relationship_sensitivity_score} (confidence: {assessment.relationship_sensitivity_confidence})")
        print(f"  - Internal Conflict: {assessment.internal_conflict_score} (confidence: {assessment.internal_conflict_confidence})")
        print(f"  - Growth Potential: {assessment.growth_potential_score} (confidence: {assessment.growth_potential_confidence})")
        print(f"\nData Sources:")
        print(f"  - Questionnaire: {assessment.questionnaire_contribution}%")
        print(f"  - Conversation: {assessment.conversation_contribution}%")
        print(f"\nDetected Elements:")
        print(f"  - IFS Parts: {len(retrieved_assessment.ifs_parts)}")
        for part in retrieved_assessment.ifs_parts:
            print(f"    • {part.part_name_zh} ({part.ifs_category}) - confidence: {part.confidence_score}")
        print(f"  - Cognitive Patterns: {len(retrieved_assessment.cognitive_patterns)}")
        for pattern in retrieved_assessment.cognitive_patterns:
            print(f"    • {pattern.pattern_name_zh} - confidence: {pattern.confidence_score}")
        print(f"  - Attachment Style: {retrieved_assessment.attachment_style.dominant_style}")
        print(f"  - Narrative Identity: {retrieved_assessment.narrative_identity.dominant_narrative}")

        print("\n" + "="*60)
        print("✓ Integration test completed successfully!")
        print("="*60 + "\n")

        # Cleanup
        print("Cleaning up test data...")
        session.delete(user)
        session.commit()
        print("✓ Test data cleaned up")

    except Exception as e:
        print(f"\n✗ Integration test failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    test_complete_workflow()
