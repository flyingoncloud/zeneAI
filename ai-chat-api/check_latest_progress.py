#!/usr/bin/env python3
"""
Check the latest questionnaire progress for the current user
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database.database import get_db
from src.database.progress_models import UserQuestionnaireProgress
from src.database.models import Conversation

def check_latest():
    db = next(get_db())

    user_id = "email_ad6268c680f1ab5224724afb2dd6469f"

    print(f"\n=== Latest Progress for User: {user_id} ===\n")

    # Get all progress records for this user
    all_progress = db.query(UserQuestionnaireProgress).filter(
        UserQuestionnaireProgress.user_id == user_id,
        UserQuestionnaireProgress.questionnaire_id == 'admin_created'
    ).order_by(UserQuestionnaireProgress.last_updated_at.desc()).all()

    print(f"Total progress records: {len(all_progress)}\n")

    for i, p in enumerate(all_progress, 1):
        print(f"Progress #{i}:")
        print(f"  ID: {p.id}")
        print(f"  Status: {p.status}")
        print(f"  Questions: {p.current_question_index}/{p.total_questions}")
        print(f"  Session ID: {p.session_id}")
        print(f"  User ID: {p.user_id}")
        print(f"  Completed at: {p.completed_at}")
        print(f"  Report ID: {p.report_id}")
        print(f"  Last updated: {p.last_updated_at}")
        print()

    # Check latest conversation
    print("\n=== Latest Conversations ===\n")
    conversations = db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).order_by(Conversation.created_at.desc()).limit(3).all()

    for conv in conversations:
        print(f"Conversation ID: {conv.id}")
        print(f"  Session ID: {conv.session_id}")
        print(f"  User ID: {conv.user_id}")
        print(f"  Created: {conv.created_at}")
        print(f"  Module status: {conv.extra_data.get('module_status') if conv.extra_data else None}")
        print()

if __name__ == "__main__":
    check_latest()
