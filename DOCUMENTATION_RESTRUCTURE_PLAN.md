# Documentation Restructure Plan

## Current Situation
- 59 .md files in the root directory
- Difficult to navigate and find relevant documentation
- Mix of guides, fixes, summaries, and implementation notes

## Proposed Structure

```
docs/
├── README.md                          # Documentation index
├── deployment/                        # Deployment guides
│   ├── DEPLOYMENT_GUIDE_v1.0.0.md
│   ├── QUICK_DEPLOYMENT_REFERENCE.md
│   ├── EC2_INSTANCE_RECOMMENDATIONS.md
│   ├── EBS_VOLUME_SIZING_GUIDE.md
│   ├── M5D_INSTANCE_ANALYSIS.md
│   ├── DNS_CONFIGURATION_GUIDE.md
│   └── BRANCH_SETUP_GUIDE.md
├── features/                          # Feature implementation guides
│   ├── questionnaire/
│   │   ├── QUESTIONNAIRE_API_IMPLEMENTATION.md
│   │   ├── QUESTIONNAIRE_DATABASE_IMPLEMENTATION.md
│   │   ├── QUESTIONNAIRE_IMPLEMENTATION_COMPLETE.md
│   │   ├── QUESTIONNAIRE_COMPLETE_FLOW_IMPLEMENTATION.md
│   │   ├── QUESTIONNAIRE_RESULT_DISPLAY_EXAMPLE.md
│   │   ├── QUESTIONNAIRE_SCORING_EXPLANATION.md
│   │   ├── QUESTIONNAIRE_TO_REPORT_INTEGRATION.md
│   │   └── QUESTIONNAIRE_DEPLOYMENT_GUIDE.md
│   ├── psychology-report/
│   │   ├── PSYCHOLOGY_REPORT_INTEGRATION_GUIDE.md
│   │   ├── PSYCHOLOGY_REPORT_INTEGRATION_COMPLETE.md
│   │   ├── PSYCHOLOGY_REPORT_DOCX_IMPLEMENTATION.md
│   │   ├── PSYCHOLOGY_REPORT_DOWNLOAD_GUIDE.md
│   │   ├── DOCX_REPORT_GENERATION_EXPLAINED.md
│   │   ├── DOCX_REPORT_SUMMARY.md
│   │   ├── MARKDOWN_REPORT_IMPLEMENTATION.md
│   │   ├── MARKDOWN_REPORT_COMPLETE.md
│   │   ├── MARKDOWN_REPORT_DISPLAY_IMPLEMENTATION.md
│   │   ├── MARKDOWN_REPORT_DISPLAY_COMPLETE.md
│   │   ├── REPORT_GENERATION_FLOW.md
│   │   └── TASK_6_MARKDOWN_REPORT_SUCCESS.md
│   ├── inner-doodling/
│   │   ├── INNER_DOODLING_UPLOAD_IMPLEMENTATION.md
│   │   ├── INNER_DOODLING_DEPLOYMENT_GUIDE.md
│   │   └── INNER_DOODLING_COMPLETION_SUMMARY.md
│   └── modules/
│       ├── MODULE_COMPLETION_DATABASE_GUIDE.md
│       └── MODULE_DATA_FLOW_DIAGRAM.md
├── troubleshooting/                   # Bug fixes and troubleshooting
│   ├── backend/
│   │   ├── BACKEND_RESTART_REQUIRED.md
│   │   ├── ERROR_500_TROUBLESHOOTING.md
│   │   ├── FOREIGN_KEY_CONSTRAINT_FIX.md
│   │   ├── REPORT_GENERATION_FIXES.md
│   │   └── MATPLOTLIB_BACKEND_FIX.md
│   ├── frontend/
│   │   ├── EMOTIONAL_FIRST_AID_BUTTON_FIX.md
│   │   ├── QUESTIONNAIRE_UI_FIX.md
│   │   └── UI_FLOW_GUIDE.md
│   ├── database/
│   │   ├── QUESTIONNAIRE_BACKEND_FIX.md
│   │   ├── QUESTIONNAIRE_SESSION_ID_FIX.md
│   │   ├── QUESTIONNAIRE_TO_ASSESSMENT_FIX.md
│   │   └── QUESTIONNAIRE_DUPLICATE_FIX.md
│   ├── fonts/
│   │   ├── CHINESE_FONT_FIX.md
│   │   └── DOCX_HORIZONTAL_RULE_FIX.md
│   └── debugging/
│       ├── QUESTIONNAIRE_DEBUGGING_GUIDE.md
│       ├── QUESTIONNAIRE_COMPLETE_FIX_SUMMARY.md
│       └── QUESTIONNAIRE_SELECTION_UPDATE.md
├── maintenance/                       # Maintenance and operations
│   ├── CLEANUP_LARGE_FILES.md
│   ├── RESTART_BACKEND_AND_RELOAD_QUESTIONNAIRES.md
│   └── AI_CHAT_API_PACKAGE_VERIFICATION.md
├── releases/                          # Release notes and summaries
│   ├── GIT_TAG_DEPLOYMENT_SUMMARY.md
│   ├── GIT_COMMIT_SUCCESS_SUMMARY.md
│   ├── GIT_PUSH_SUCCESS_SUMMARY.md
│   ├── INTEGRATION_COMPLETE.md
│   ├── SESSION_SUMMARY.md
│   └── REBASE_FIXES_SUMMARY.md
└── archive/                           # Old/deprecated docs
    └── (move old versions here)
```

## Root Directory (Keep Only Essential Files)
```
/
├── README.md                          # Main project README
├── QUICK_DEPLOYMENT_REFERENCE.md     # Quick start guide
├── DEPLOYMENT_GUIDE_v1.0.0.md        # Current deployment guide
└── docs/                              # All other documentation
```

## Migration Commands

### Step 1: Create directory structure
```bash
mkdir -p docs/{deployment,features/{questionnaire,psychology-report,inner-doodling,modules},troubleshooting/{backend,frontend,database,fonts,debugging},maintenance,releases,archive}
```

### Step 2: Move deployment docs
```bash
mv EC2_INSTANCE_RECOMMENDATIONS.md docs/deployment/
mv EBS_VOLUME_SIZING_GUIDE.md docs/deployment/
mv M5D_INSTANCE_ANALYSIS.md docs/deployment/
mv DNS_CONFIGURATION_GUIDE.md docs/deployment/
mv BRANCH_SETUP_GUIDE.md docs/deployment/
```

### Step 3: Move questionnaire docs
```bash
mv QUESTIONNAIRE_*.md docs/features/questionnaire/
```

### Step 4: Move psychology report docs
```bash
mv PSYCHOLOGY_REPORT_*.md docs/features/psychology-report/
mv DOCX_REPORT_*.md docs/features/psychology-report/
mv MARKDOWN_REPORT_*.md docs/features/psychology-report/
mv REPORT_GENERATION_*.md docs/features/psychology-report/
mv TASK_6_MARKDOWN_REPORT_SUCCESS.md docs/features/psychology-report/
```

### Step 5: Move inner doodling docs
```bash
mv INNER_DOODLING_*.md docs/features/inner-doodling/
```

### Step 6: Move module docs
```bash
mv MODULE_*.md docs/features/modules/
```

### Step 7: Move troubleshooting docs
```bash
mv BACKEND_RESTART_REQUIRED.md docs/troubleshooting/backend/
mv ERROR_500_TROUBLESHOOTING.md docs/troubleshooting/backend/
mv FOREIGN_KEY_CONSTRAINT_FIX.md docs/troubleshooting/backend/
mv MATPLOTLIB_BACKEND_FIX.md docs/troubleshooting/backend/

mv EMOTIONAL_FIRST_AID_BUTTON_FIX.md docs/troubleshooting/frontend/
mv QUESTIONNAIRE_UI_FIX.md docs/troubleshooting/frontend/
mv UI_FLOW_GUIDE.md docs/troubleshooting/frontend/

mv CHINESE_FONT_FIX.md docs/troubleshooting/fonts/
mv DOCX_HORIZONTAL_RULE_FIX.md docs/troubleshooting/fonts/
```

### Step 8: Move maintenance docs
```bash
mv CLEANUP_LARGE_FILES.md docs/maintenance/
mv RESTART_BACKEND_AND_RELOAD_QUESTIONNAIRES.md docs/maintenance/
mv AI_CHAT_API_PACKAGE_VERIFICATION.md docs/maintenance/
```

### Step 9: Move release docs
```bash
mv GIT_*.md docs/releases/
mv INTEGRATION_COMPLETE.md docs/releases/
mv SESSION_SUMMARY.md docs/releases/
mv REBASE_FIXES_SUMMARY.md docs/releases/
```

## Benefits

1. **Better Organization**: Logical grouping by category
2. **Easier Navigation**: Clear hierarchy
3. **Cleaner Root**: Only essential files in root
4. **Scalability**: Easy to add new docs
5. **Maintainability**: Clear where to put new documentation
6. **Discoverability**: Easier to find relevant docs

## Implementation

Run the provided script: `restructure_docs.sh`

This will:
1. Create all directories
2. Move all files to appropriate locations
3. Create a documentation index
4. Update git tracking
5. Commit changes with descriptive message
