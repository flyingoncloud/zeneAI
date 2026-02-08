#!/usr/bin/env python3
"""Quick script to check media_files table contents"""

from src.database.database import SessionLocal
from src.database.models import MediaFile

def check_media_files():
    db = SessionLocal()
    try:
        # Query all media files (including soft-deleted)
        all_media = db.query(MediaFile).all()

        print(f"\n{'='*80}")
        print(f"Total records in media_files table: {len(all_media)}")
        print(f"{'='*80}\n")

        if len(all_media) == 0:
            print("❌ No records found in media_files table")
            print("\nThis means uploads before backend restart were not saved to database.")
            print("Only uploads AFTER restart will be saved.\n")
        else:
            print(f"{'ID':<5} {'URL':<40} {'Filename':<30} {'Size':<10} {'Deleted':<10}")
            print("-" * 100)

            for media in all_media:
                deleted = "✓" if media.deleted_at else ""
                size_kb = f"{media.file_size / 1024:.1f} KB"
                print(f"{media.id:<5} {media.url:<40} {media.original_filename or media.filename:<30} {size_kb:<10} {deleted:<10}")

            # Count non-deleted
            active = [m for m in all_media if not m.deleted_at]
            deleted = [m for m in all_media if m.deleted_at]

            print("\n" + "="*80)
            print(f"Active (not deleted): {len(active)}")
            print(f"Soft deleted: {len(deleted)}")
            print("="*80 + "\n")

    finally:
        db.close()

if __name__ == "__main__":
    check_media_files()
