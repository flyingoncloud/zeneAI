#!/usr/bin/env python3
"""
Migrate guest conversations to authenticated user

This script updates conversations that were created with a guest UUID
to be associated with the authenticated user's email-based user_id.

Usage:
    python migrate_guest_to_user.py <guest_uuid> <email_user_id>

Example:
    python migrate_guest_to_user.py 9a445158-8c77-4dca-8fbd-3acb2b1e362b email_ad6268c680f1ab5224724afb2dd6469f
"""

import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = "postgresql://chat_user:chat_pass@localhost:5432/chat_db"

def migrate_conversations(guest_uuid: str, email_user_id: str, dry_run: bool = True):
    """
    Migrate conversations from guest UUID to email user_id

    Args:
        guest_uuid: The guest UUID to migrate from
        email_user_id: The email-based user_id to migrate to
        dry_run: If True, only show what would be updated without making changes
    """
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Find conversations with guest UUID
        result = session.execute(
            text("""
                SELECT id, session_id, user_id, created_at,
                       (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
                FROM conversations
                WHERE user_id = :guest_uuid
                ORDER BY created_at DESC
            """),
            {"guest_uuid": guest_uuid}
        )

        conversations = result.fetchall()

        if not conversations:
            print(f"❌ No conversations found with guest UUID: {guest_uuid}")
            return

        print(f"\n{'='*80}")
        print(f"Found {len(conversations)} conversation(s) to migrate:")
        print(f"{'='*80}\n")

        for conv in conversations:
            print(f"ID: {conv.id}")
            print(f"  Session ID: {conv.session_id}")
            print(f"  Current user_id: {conv.user_id}")
            print(f"  Created: {conv.created_at}")
            print(f"  Messages: {conv.message_count}")
            print()

        if dry_run:
            print(f"{'='*80}")
            print(f"DRY RUN MODE - No changes made")
            print(f"{'='*80}")
            print(f"\nTo apply these changes, run:")
            print(f"  python {sys.argv[0]} {guest_uuid} {email_user_id} --apply")
            return

        # Apply migration
        print(f"{'='*80}")
        print(f"Applying migration...")
        print(f"{'='*80}\n")

        result = session.execute(
            text("""
                UPDATE conversations
                SET user_id = :email_user_id
                WHERE user_id = :guest_uuid
                RETURNING id, session_id
            """),
            {"email_user_id": email_user_id, "guest_uuid": guest_uuid}
        )

        updated = result.fetchall()
        session.commit()

        print(f"✅ Successfully migrated {len(updated)} conversation(s)")
        print(f"\nUpdated conversations:")
        for conv in updated:
            print(f"  - ID {conv.id}: {conv.session_id}")

        print(f"\n{'='*80}")
        print(f"Migration complete!")
        print(f"{'='*80}")
        print(f"\nNext steps:")
        print(f"1. Clear localStorage in browser: localStorage.removeItem('zeneme_user_id')")
        print(f"2. Refresh the page")
        print(f"3. Check '最近对话' sidebar - conversations should now appear")

    except Exception as e:
        session.rollback()
        print(f"❌ Error during migration: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python migrate_guest_to_user.py <guest_uuid> <email_user_id> [--apply]")
        print("\nExample:")
        print("  python migrate_guest_to_user.py 9a445158-8c77-4dca-8fbd-3acb2b1e362b email_ad6268c680f1ab5224724afb2dd6469f")
        print("\nAdd --apply flag to actually perform the migration (default is dry-run)")
        sys.exit(1)

    guest_uuid = sys.argv[1]
    email_user_id = sys.argv[2]
    apply_changes = "--apply" in sys.argv

    print(f"\n{'='*80}")
    print(f"Guest to User Migration Script")
    print(f"{'='*80}")
    print(f"Guest UUID: {guest_uuid}")
    print(f"Email User ID: {email_user_id}")
    print(f"Mode: {'APPLY CHANGES' if apply_changes else 'DRY RUN'}")
    print(f"{'='*80}\n")

    migrate_conversations(guest_uuid, email_user_id, dry_run=not apply_changes)
