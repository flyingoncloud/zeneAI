#!/usr/bin/env python3
"""
Check questionnaire progress for a specific session
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database.database import get_db
from src.database.progress_models import UserQuestionnaireProgress
from src.database.models import Conversation

def check_progress():
    db = next(get_db())

    # The session from the logs
    session_id = "session_1772244018272_xs6exntmt"

    print(f"\n=== Checking Progress for Session: {session_id} ===\n")

    # 1. Check if conversation exists
    conversation = db.query(Conversation).filter(
        Conversation.session_id == session_id
    ).first()

    if conversation:
        print(f"✓ Conversation found:")
        print(f"  - ID: {conversation.id}")
        print(f"  - Session ID: {conversation.session_id}")
        print(f"  - User ID: {conversation.user_id}")
        print(f"  - Created: {conversation.created_at}")
    else:
        print(f"✗ No conversation found for session_id={session_id}")
        return

    print("\n" + "="*60 + "\n")

    # 2. Check progress by session_id
    progress_by_session = db.query(UserQuestionnaireProgress).filter(
        UserQuestionnaireProgress.session_id == session_id,
        UserQuestionnaireProgress.questionnaire_id == 'admin_created'
    ).all()

    print(f"Progress records by session_id: {len(progress_by_session)}")
    for p in progress_by_session:
        print(f"  - Progress ID: {p.id}")
        print(f"    Status: {p.status}")
        print(f"    Questions: {p.current_question_index}/{p.total_questions}")
        print(f"    Completed at: {p.completed_at}")
        print(f"    Report ID: {p.report_id}")
        print(f"    Session ID: {p.session_id}")
        print(f"    User ID: {p.user_id}")
        print()

    # 3. Check progress by user_id (if exists)
    if conversation.user_id:
        progress_by_user = db.query(UserQuestionnaireProgress).filter(
            UserQuestionnaireProgress.user_id == conversation.user_id,
            UserQuestionnaireProgress.questionnaire_id == 'admin_created'
        ).all()

        print(f"Progress records by user_id={conversation.user_id}: {len(progress_by_user)}")
        for p in progress_by_user:
            print(f"  - Progress ID: {p.id}")
            print(f"    Status: {p.status}")
            print(f"    Questions: {p.current_question_index}/{p.total_questions}")
            print(f"    Completed at: {p.completed_at}")
            print(f"    Report ID: {p.report_id}")
            print(f"    Session ID: {p.session_id}")
            print(f"    User ID: {p.user_id}")
            print()

    # 4. Check ALL progress records for this questionnaire (to see if it exists elsewhere)
    all_progress = db.query(UserQuestionnaireProgress).filter(
        UserQuestionnaireProgress.questionnaire_id == 'admin_created'
    ).order_by(UserQuestionnaireProgress.last_updated_at.desc()).limit(10).all()

    print(f"\n=== Last 10 Progress Records (any session) ===\n")
    for p in all_progress:
        print(f"Progress ID: {p.id}")
        print(f"  Status: {p.status}")
        print(f"  Questions: {p.current_question_index}/{p.total_questions}")
        print(f"  Session ID: {p.session_id}")
        print(f"  User ID: {p.user_id}")
        print(f"  Completed at: {p.completed_at}")
        print(f"  Report ID: {p.report_id}")
        print(f"  Last updated: {p.last_updated_at}")
        print()

if __name__ == "__main__":
    check_progress()
