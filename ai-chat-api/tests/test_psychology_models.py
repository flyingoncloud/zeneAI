"""
Test Psychology Database Models

Tests for all new psychology assessment models
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.database.psychology_models import (
    Base,
    UserProfile,
    PsychologyAssessment,
    Questionnaire,
    QuestionnaireQuestion,
    QuestionnaireResponse,
    IFSPartsDetection,
    CognitivePatternsDetection,
    AttachmentStyle,
    NarrativeIdentity,
    PersonalityStyle,
    AnalysisText,
    PsychologyReport
)


# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def db_session():
    """Create a test database session"""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    yield session

    session.close()
    Base.metadata.drop_all(engine)


def test_create_user_profile(db_session):
    """Test creating a user profile"""
    user = UserProfile(
        user_id="test_user_001",
        username="Test User",
        email="test@example.com",
        age=25,
        gender="女",
        language_preference="zh"
    )

    db_session.add(user)
    db_session.commit()

    # Verify
    retrieved = db_session.query(UserProfile).filter_by(user_id="test_user_001").first()
    assert retrieved is not None
    assert retrieved.username == "Test User"
    assert retrieved.age == 25
    print("✓ User profile creation test passed")


def test_create_psychology_assessment(db_session):
    """Test creating a psychology assessment"""
    # Create user first
    user = UserProfile(user_id="test_user_002", username="Test User 2")
    db_session.add(user)
    db_session.commit()

    # Create assessment
    assessment = PsychologyAssessment(
        user_id="test_user_002",
        assessment_type="combined",
        emotional_regulation_score=52,
        cognitive_flexibility_score=61,
        relationship_sensitivity_score=70,
        internal_conflict_score=67,
        growth_potential_score=78,
        emotional_regulation_confidence=0.92,
        cognitive_flexibility_confidence=0.88,
        questionnaire_contribution=60,
        conversation_contribution=40,
        completion_percentage=75
    )

    db_session.add(assessment)
    db_session.commit()

    # Verify
    retrieved = db_session.query(PsychologyAssessment).filter_by(user_id="test_user_002").first()
    assert retrieved is not None
    assert retrieved.emotional_regulation_score == 52
    assert retrieved.completion_percentage == 75
    print("✓ Psychology assessment creation test passed")


def test_create_questionnaire(db_session):
    """Test creating a questionnaire"""
    questionnaire = Questionnaire(
        questionnaire_code="emotional_insight",
        name_en="Emotional Insight Analysis",
        name_zh="情绪觉察",
        target_dimensions=["emotional_regulation"],
        total_questions=10,
        estimated_duration_minutes=5
    )

    db_session.add(questionnaire)
    db_session.commit()

    # Verify
    retrieved = db_session.query(Questionnaire).filter_by(questionnaire_code="emotional_insight").first()
    assert retrieved is not None
    assert retrieved.name_zh == "情绪觉察"
    assert retrieved.total_questions == 10
    print("✓ Questionnaire creation test passed")


def test_create_questionnaire_response(db_session):
    """Test creating a questionnaire response"""
    # Create user and questionnaire
    user = UserProfile(user_id="test_user_003")
    questionnaire = Questionnaire(
        questionnaire_code="test_q",
        name_en="Test",
        name_zh="测试",
        target_dimensions=["emotional_regulation"],
        total_questions=5
    )
    db_session.add(user)
    db_session.add(questionnaire)
    db_session.commit()

    # Create response
    response = QuestionnaireResponse(
        user_id="test_user_003",
        questionnaire_id=questionnaire.id,
        status="completed",
        responses={
            "2.1": {
                "1": {"answer": 4, "timestamp": "2025-01-18T10:25:00Z"},
                "2": {"answer": 3, "timestamp": "2025-01-18T10:25:30Z"}
            }
        },
        dimension_scores={
            "emotional_regulation": 55
        },
        total_questions=5,
        answered_questions=5,
        completion_percentage=100
    )

    db_session.add(response)
    db_session.commit()

    # Verify
    retrieved = db_session.query(QuestionnaireResponse).filter_by(user_id="test_user_003").first()
    assert retrieved is not None
    assert retrieved.status == "completed"
    assert retrieved.dimension_scores["emotional_regulation"] == 55
    print("✓ Questionnaire response creation test passed")


def test_create_ifs_parts_detection(db_session):
    """Test creating IFS parts detection"""
    # Create user and assessment
    user = UserProfile(user_id="test_user_004")
    assessment = PsychologyAssessment(
        user_id="test_user_004",
        assessment_type="questionnaire"
    )
    db_session.add(user)
    db_session.add(assessment)
    db_session.commit()

    # Create IFS part detection
    ifs_part = IFSPartsDetection(
        user_id="test_user_004",
        assessment_id=assessment.id,
        source_type="questionnaire",
        source_id=1,
        ifs_category="managers",
        category_score=18,
        part_id="inner_critic",
        part_name_en="Inner Critic",
        part_name_zh="内在批评者",
        detected=True,
        confidence_score=0.92,
        detection_count=1,
        evidence_text="High self-criticism pattern"
    )

    db_session.add(ifs_part)
    db_session.commit()

    # Verify
    retrieved = db_session.query(IFSPartsDetection).filter_by(part_id="inner_critic").first()
    assert retrieved is not None
    assert retrieved.part_name_zh == "内在批评者"
    assert float(retrieved.confidence_score) == 0.92
    print("✓ IFS parts detection creation test passed")


def test_create_cognitive_pattern_detection(db_session):
    """Test creating cognitive pattern detection"""
    # Create user and assessment
    user = UserProfile(user_id="test_user_005")
    assessment = PsychologyAssessment(
        user_id="test_user_005",
        assessment_type="questionnaire"
    )
    db_session.add(user)
    db_session.add(assessment)
    db_session.commit()

    # Create cognitive pattern detection
    pattern = CognitivePatternsDetection(
        user_id="test_user_005",
        assessment_id=assessment.id,
        source_type="questionnaire",
        pattern_id="catastrophizing",
        pattern_name_en="Catastrophizing",
        pattern_name_zh="灾难化",
        detected=True,
        confidence_score=0.78,
        detection_count=3,
        evidence_examples=[
            {"text": "Everything will fall apart", "timestamp": "2025-01-18T10:30:00Z"}
        ]
    )

    db_session.add(pattern)
    db_session.commit()

    # Verify
    retrieved = db_session.query(CognitivePatternsDetection).filter_by(pattern_id="catastrophizing").first()
    assert retrieved is not None
    assert retrieved.pattern_name_zh == "灾难化"
    assert len(retrieved.evidence_examples) == 1
    print("✓ Cognitive pattern detection creation test passed")


def test_create_attachment_style(db_session):
    """Test creating attachment style"""
    # Create user and assessment
    user = UserProfile(user_id="test_user_006")
    assessment = PsychologyAssessment(
        user_id="test_user_006",
        assessment_type="questionnaire"
    )
    db_session.add(user)
    db_session.add(assessment)
    db_session.commit()

    # Create attachment style
    attachment = AttachmentStyle(
        user_id="test_user_006",
        assessment_id=assessment.id,
        source_type="questionnaire",
        secure_score=12,
        anxious_score=18,
        avoidant_score=10,
        disorganized_score=15,
        secure_detected=True,
        anxious_detected=True,
        avoidant_detected=False,
        disorganized_detected=True,
        dominant_style="anxious",
        dominant_confidence=0.85
    )

    db_session.add(attachment)
    db_session.commit()

    # Verify
    retrieved = db_session.query(AttachmentStyle).filter_by(user_id="test_user_006").first()
    assert retrieved is not None
    assert retrieved.dominant_style == "anxious"
    assert retrieved.anxious_detected is True
    print("✓ Attachment style creation test passed")


def test_create_narrative_identity(db_session):
    """Test creating narrative identity"""
    # Create user and assessment
    user = UserProfile(user_id="test_user_007")
    assessment = PsychologyAssessment(
        user_id="test_user_007",
        assessment_type="questionnaire"
    )
    db_session.add(user)
    db_session.add(assessment)
    db_session.commit()

    # Create narrative identity
    narrative = NarrativeIdentity(
        user_id="test_user_007",
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

    db_session.add(narrative)
    db_session.commit()

    # Verify
    retrieved = db_session.query(NarrativeIdentity).filter_by(user_id="test_user_007").first()
    assert retrieved is not None
    assert retrieved.dominant_narrative == "explorer"
    assert retrieved.explorer_score == 15
    print("✓ Narrative identity creation test passed")


def test_create_personality_style(db_session):
    """Test creating personality style"""
    # Create user and assessment
    user = UserProfile(user_id="test_user_008")
    assessment = PsychologyAssessment(
        user_id="test_user_008",
        assessment_type="combined"
    )
    db_session.add(user)
    db_session.add(assessment)
    db_session.commit()

    # Create personality style
    personality = PersonalityStyle(
        user_id="test_user_008",
        assessment_id=assessment.id,
        style_type="emotion_dominant",
        style_name_en="Emotion-Dominant Type",
        style_name_zh="感性驱动型人格",
        confidence=0.85,
        classification_basis={
            "emotional_regulation": 52,
            "relationship_sensitivity": 70,
            "dominant_dimension": "relationship_sensitivity"
        },
        description_zh="你的人格特征显示出较强的情感驱动倾向..."
    )

    db_session.add(personality)
    db_session.commit()

    # Verify
    retrieved = db_session.query(PersonalityStyle).filter_by(user_id="test_user_008").first()
    assert retrieved is not None
    assert retrieved.style_type == "emotion_dominant"
    assert retrieved.style_name_zh == "感性驱动型人格"
    print("✓ Personality style creation test passed")


def test_create_analysis_text(db_session):
    """Test creating analysis text"""
    # Create user and assessment
    user = UserProfile(user_id="test_user_009")
    assessment = PsychologyAssessment(
        user_id="test_user_009",
        assessment_type="combined"
    )
    db_session.add(user)
    db_session.add(assessment)
    db_session.commit()

    # Create analysis text
    analysis = AnalysisText(
        user_id="test_user_009",
        assessment_id=assessment.id,
        analysis_type="ifs_impact",
        analysis_category="cognitive",
        related_entity_type="ifs_part",
        related_entity_id="inner_critic",
        text_zh="你目前的内在家庭系统状态显示出较强的内在批评者特征...",
        generated_by="ai",
        model_version="gpt-4",
        confidence=0.88
    )

    db_session.add(analysis)
    db_session.commit()

    # Verify
    retrieved = db_session.query(AnalysisText).filter_by(analysis_type="ifs_impact").first()
    assert retrieved is not None
    assert retrieved.related_entity_id == "inner_critic"
    assert "内在批评者" in retrieved.text_zh
    print("✓ Analysis text creation test passed")


def test_create_psychology_report(db_session):
    """Test creating psychology report"""
    # Create user and assessment
    user = UserProfile(user_id="test_user_010")
    assessment = PsychologyAssessment(
        user_id="test_user_010",
        assessment_type="combined",
        is_complete=True
    )
    db_session.add(user)
    db_session.add(assessment)
    db_session.commit()

    # Create report
    report = PsychologyReport(
        user_id="test_user_010",
        assessment_id=assessment.id,
        report_type="comprehensive",
        language="zh",
        format="pdf",
        report_data={
            "user_info": {"name": "Test User", "age": 25},
            "mind_indices": {
                "emotional_regulation": 52,
                "cognitive_flexibility": 61
            }
        },
        generation_status="completed",
        file_url="https://example.com/reports/test_report.pdf"
    )

    db_session.add(report)
    db_session.commit()

    # Verify
    retrieved = db_session.query(PsychologyReport).filter_by(user_id="test_user_010").first()
    assert retrieved is not None
    assert retrieved.generation_status == "completed"
    assert retrieved.report_data["mind_indices"]["emotional_regulation"] == 52
    print("✓ Psychology report creation test passed")


def test_relationships(db_session):
    """Test relationships between models"""
    # Create user
    user = UserProfile(user_id="test_user_011")
    db_session.add(user)
    db_session.commit()

    # Create assessment
    assessment = PsychologyAssessment(
        user_id="test_user_011",
        assessment_type="combined"
    )
    db_session.add(assessment)
    db_session.commit()

    # Create related records
    ifs_part = IFSPartsDetection(
        user_id="test_user_011",
        assessment_id=assessment.id,
        source_type="questionnaire",
        part_id="pleaser",
        part_name_zh="迎合者",
        detected=True,
        confidence_score=0.85
    )

    pattern = CognitivePatternsDetection(
        user_id="test_user_011",
        assessment_id=assessment.id,
        source_type="conversation",
        pattern_id="self_blame",
        pattern_name_zh="自我责备",
        detected=True,
        confidence_score=0.78
    )

    db_session.add(ifs_part)
    db_session.add(pattern)
    db_session.commit()

    # Test relationships
    retrieved_assessment = db_session.query(PsychologyAssessment).filter_by(user_id="test_user_011").first()
    assert len(retrieved_assessment.ifs_parts) == 1
    assert len(retrieved_assessment.cognitive_patterns) == 1
    assert retrieved_assessment.ifs_parts[0].part_id == "pleaser"
    assert retrieved_assessment.cognitive_patterns[0].pattern_id == "self_blame"

    print("✓ Relationships test passed")


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("Running Psychology Models Tests")
    print("="*60 + "\n")

    # Create test session
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    try:
        test_create_user_profile(session)
        session.rollback()

        test_create_psychology_assessment(session)
        session.rollback()

        test_create_questionnaire(session)
        session.rollback()

        test_create_questionnaire_response(session)
        session.rollback()

        test_create_ifs_parts_detection(session)
        session.rollback()

        test_create_cognitive_pattern_detection(session)
        session.rollback()

        test_create_attachment_style(session)
        session.rollback()

        test_create_narrative_identity(session)
        session.rollback()

        test_create_personality_style(session)
        session.rollback()

        test_create_analysis_text(session)
        session.rollback()

        test_create_psychology_report(session)
        session.rollback()

        test_relationships(session)
        session.rollback()

        print("\n" + "="*60)
        print("✓ All tests passed successfully!")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        raise
    finally:
        session.close()
        Base.metadata.drop_all(engine)


if __name__ == "__main__":
    run_all_tests()
