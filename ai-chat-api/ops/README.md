# Operations & Debugging Scripts

This folder contains operational scripts for database management, migrations, and debugging.

## Database Backup & Restore

### `export_database.sh`
Exports the PostgreSQL database to a timestamped backup file.

**Usage:**
```bash
./export_database.sh
```

**Output:** Creates `db_backup/chat_db_backup_YYYYMMDD_HHMMSS.dump`

### `import_database.sh`
Imports a PostgreSQL database backup file.

**Usage:**
```bash
./import_database.sh db_backup/chat_db_backup_20260213_184010.dump
```

**Warning:** This will replace all data in the database!

## Database Setup & Initialization

### `setup_database.sh`
Sets up the PostgreSQL database from scratch.

### `init_database.py`
Initializes database tables and schema.

## Migration Scripts

### `migrate_to_unified_questions.py`
Migrates questions to the unified assessment_questions table.

### `add_file_hash_column.py`
Adds file_hash column to media_files table for duplicate detection.

## Data Cleanup Scripts

### `cleanup_old_questionnaires.py`
Removes old/unused questionnaire data.

### `cleanup_duplicate_questionnaires.py`
Removes duplicate questionnaire entries.

### `reset_my_progress.py`
Resets questionnaire progress for the current user.

### `reset_questionnaire_progress.py`
Resets questionnaire progress for specified users or all users.

## Data Update Scripts

### `update_categories_to_dimensions.py`
Updates question categories to use dimension names.

### `update_question_categories_to_dimensions.py`
Maps section codes (2.1, 2.5.1) to dimension names for scoring.

### `assign_question_categories.py`
Assigns categories to questions.

## Debugging & Inspection Scripts

### `check_categories.py`
Checks and displays question categories in the database.

### `check_media_files.py`
Inspects media files stored in the database.

### `admin_endpoints_unified.py`
Unified admin endpoints for testing/debugging.

## Test Scripts

### `test_chinese_fonts.py`
Tests Chinese font rendering in PDF reports.

### `test_db_connection.py`
Tests PostgreSQL database connection.

### `test_markdown_generator.py`
Tests markdown generation functionality.

## Notes

- All scripts assume PostgreSQL connection: `postgresql://chat_user:chat_pass@localhost:5432/chat_db`
- Backup files are stored in `../db_backup/` directory
- Scripts are cross-platform (macOS/Linux compatible)
