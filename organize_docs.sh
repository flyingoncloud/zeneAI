#!/bin/bash

# Documentation Reorganization Script
# Moves all root-level markdown files into organized docs/ structure

echo "📚 Organizing documentation files..."

# Create directory structure
mkdir -p docs/admin
mkdir -p docs/features/questionnaire
mkdir -p docs/features/media-library
mkdir -p docs/deployment
mkdir -p docs/troubleshooting/fixes
mkdir -p docs/sessions

# Admin Panel Documentation
echo "Moving admin panel docs..."
mv ADMIN_INTEGRATION_COMPLETE.md docs/admin/
mv ADMIN_LOGIN_FIX.md docs/admin/
mv ADMIN_PANEL_STATUS_COMPLETE.md docs/admin/
mv ADMIN_QUESTIONNAIRE_REPORT_GENERATION.md docs/admin/
mv ADMIN_QUICK_START.md docs/admin/
mv TEST_ADMIN_APIS.md docs/admin/

# Questionnaire Feature Documentation
echo "Moving questionnaire docs..."
mv QUESTIONNAIRE_COMPLETION_FLOW.md docs/features/questionnaire/
mv QUESTIONNAIRE_REFACTOR_DESIGN.md docs/features/questionnaire/
mv F1_LIKERT_SCALE_FIX.md docs/features/questionnaire/
mv UNIFIED_QUESTIONS_MIGRATION_GUIDE.md docs/features/questionnaire/
mv MIGRATION_COMPLETE_SUMMARY.md docs/features/questionnaire/
mv FINAL_UNIFIED_MIGRATION_STATUS.md docs/features/questionnaire/

# Media Library Documentation
echo "Moving media library docs..."
mv MEDIA_DATABASE_IMPLEMENTATION.md docs/features/media-library/
mv MEDIA_LIBRARY_DEBUG_GUIDE.md docs/features/media-library/
mv MEDIA_PERSISTENCE_IMPLEMENTATION.md docs/features/media-library/
mv MEDIA_PICKER_COMPLETE.md docs/features/media-library/
mv MEDIA_PICKER_DEBUG_STEPS.md docs/features/media-library/
mv MEDIA_PICKER_FIX.md docs/features/media-library/
mv MEDIA_PICKER_FIX_SUMMARY.md docs/features/media-library/
mv MEDIA_PICKER_IMMEDIATE_TEST.md docs/features/media-library/
mv MEDIA_PICKER_IMPLEMENTATION.md docs/features/media-library/
mv MEDIA_PICKER_PORTAL_FIX.md docs/features/media-library/
mv MEDIA_STORAGE_SOLUTION.md docs/features/media-library/
mv MEDIA_UPLOAD_IMPLEMENTATION.md docs/features/media-library/

# Deployment Documentation
echo "Moving deployment docs..."
mv DEPLOYMENT_FIX_CHECKLIST.md docs/deployment/
mv DEPLOYMENT_GUIDE_v1.0.0.md docs/deployment/
mv GIT_TAG_DEPLOYMENT_SUMMARY.md docs/deployment/
mv QUICK_DEPLOYMENT_REFERENCE.md docs/deployment/

# Troubleshooting & Fixes
echo "Moving troubleshooting docs..."
mv CONTEXT_TRANSFER_ISSUES_RESOLVED.md docs/troubleshooting/fixes/

# Session Summaries
echo "Moving session summaries..."
mv SESSION_SUMMARY_2026-02-07.md docs/sessions/

# Create index files
echo "Creating index files..."

cat > docs/admin/README.md << 'EOF'
# Admin Panel Documentation

Documentation for the ZeneMe admin panel features.

## Quick Start
- [Admin Quick Start Guide](ADMIN_QUICK_START.md)
- [Admin Panel Status](ADMIN_PANEL_STATUS_COMPLETE.md)

## Features
- [Admin Integration](ADMIN_INTEGRATION_COMPLETE.md)
- [Questionnaire Report Generation](ADMIN_QUESTIONNAIRE_REPORT_GENERATION.md)

## Troubleshooting
- [Admin Login Fix](ADMIN_LOGIN_FIX.md)
- [Test Admin APIs](TEST_ADMIN_APIS.md)
EOF

cat > docs/features/questionnaire/README.md << 'EOF'
# Questionnaire System Documentation

Documentation for the questionnaire and assessment system.

## Design & Architecture
- [Questionnaire Refactor Design](QUESTIONNAIRE_REFACTOR_DESIGN.md) - **NEW ARCHITECTURE**
- [Questionnaire Completion Flow](QUESTIONNAIRE_COMPLETION_FLOW.md)

## Implementation
- [Unified Questions Migration Guide](UNIFIED_QUESTIONS_MIGRATION_GUIDE.md)
- [Migration Complete Summary](MIGRATION_COMPLETE_SUMMARY.md)
- [Final Unified Migration Status](FINAL_UNIFIED_MIGRATION_STATUS.md)

## UI Components
- [F1 Likert Scale Fix](F1_LIKERT_SCALE_FIX.md)
EOF

cat > docs/features/media-library/README.md << 'EOF'
# Media Library Documentation

Documentation for the media upload and management system.

## Architecture
- [Media Storage Solution](MEDIA_STORAGE_SOLUTION.md)
- [Media Database Implementation](MEDIA_DATABASE_IMPLEMENTATION.md)
- [Media Persistence Implementation](MEDIA_PERSISTENCE_IMPLEMENTATION.md)

## Features
- [Media Upload Implementation](MEDIA_UPLOAD_IMPLEMENTATION.md)
- [Media Picker Implementation](MEDIA_PICKER_IMPLEMENTATION.md)
- [Media Picker Complete](MEDIA_PICKER_COMPLETE.md)

## Troubleshooting
- [Media Library Debug Guide](MEDIA_LIBRARY_DEBUG_GUIDE.md)
- [Media Picker Fix](MEDIA_PICKER_FIX.md)
- [Media Picker Fix Summary](MEDIA_PICKER_FIX_SUMMARY.md)
- [Media Picker Portal Fix](MEDIA_PICKER_PORTAL_FIX.md)
- [Media Picker Debug Steps](MEDIA_PICKER_DEBUG_STEPS.md)
- [Media Picker Immediate Test](MEDIA_PICKER_IMMEDIATE_TEST.md)
EOF

cat > docs/deployment/README.md << 'EOF'
# Deployment Documentation

Documentation for deploying the ZeneMe application.

## Guides
- [Deployment Guide v1.0.0](DEPLOYMENT_GUIDE_v1.0.0.md)
- [Quick Deployment Reference](QUICK_DEPLOYMENT_REFERENCE.md)

## Troubleshooting
- [Deployment Fix Checklist](DEPLOYMENT_FIX_CHECKLIST.md)

## Release Notes
- [Git Tag Deployment Summary](GIT_TAG_DEPLOYMENT_SUMMARY.md)
EOF

# Update main docs README
cat > docs/README.md << 'EOF'
# ZeneMe Documentation

Complete documentation for the ZeneMe psychological assessment platform.

## 📁 Documentation Structure

### [Admin Panel](admin/)
Admin panel features, configuration, and troubleshooting.

### [Features](features/)
- [Questionnaire System](features/questionnaire/) - Assessment and questionnaire features
- [Media Library](features/media-library/) - Media upload and management
- [Inner Doodling](features/inner-doodling/) - Drawing and sketch analysis
- [Psychology Report](features/psychology-report/) - Report generation system
- [Modules](features/modules/) - Module completion tracking

### [Deployment](deployment/)
Deployment guides, configuration, and infrastructure setup.

### [Troubleshooting](troubleshooting/)
- [Backend](troubleshooting/backend/) - Backend issues and fixes
- [Database](troubleshooting/database/) - Database problems
- [Frontend](troubleshooting/frontend/) - UI and component issues
- [Debugging](troubleshooting/debugging/) - Debug guides
- [Fonts](troubleshooting/fonts/) - Font rendering issues
- [Fixes](troubleshooting/fixes/) - General fixes

### [Maintenance](maintenance/)
System maintenance, cleanup, and verification tasks.

### [Releases](releases/)
Release notes, summaries, and integration reports.

### [Sessions](sessions/)
Development session summaries and progress reports.

## 🚀 Quick Links

- [Admin Quick Start](admin/ADMIN_QUICK_START.md)
- [Questionnaire Refactor Design](features/questionnaire/QUESTIONNAIRE_REFACTOR_DESIGN.md)
- [Deployment Guide](deployment/DEPLOYMENT_GUIDE_v1.0.0.md)
- [Quick Deployment Reference](deployment/QUICK_DEPLOYMENT_REFERENCE.md)

## 📝 Recent Updates

- **2026-02-08**: Questionnaire system refactor design
- **2026-02-07**: F1 Likert scale fix, admin panel integration
- **2026-02-07**: Media library implementation complete

## 🔧 Development

See individual feature directories for detailed implementation guides and troubleshooting.
EOF

echo "✅ Documentation reorganization complete!"
echo ""
echo "📂 New structure:"
echo "  docs/"
echo "    ├── admin/              (Admin panel docs)"
echo "    ├── features/"
echo "    │   ├── questionnaire/  (Questionnaire system)"
echo "    │   ├── media-library/  (Media management)"
echo "    │   ├── inner-doodling/ (Drawing features)"
echo "    │   ├── psychology-report/ (Reports)"
echo "    │   └── modules/        (Module tracking)"
echo "    ├── deployment/         (Deployment guides)"
echo "    ├── troubleshooting/    (Fixes and debugging)"
echo "    ├── maintenance/        (Maintenance tasks)"
echo "    ├── releases/           (Release notes)"
echo "    └── sessions/           (Session summaries)"
echo ""
echo "📖 View main index: docs/README.md"
