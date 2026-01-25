#!/bin/bash
# Documentation Restructure Script
# This script reorganizes all .md files into a logical directory structure

set -e  # Exit on error

echo "=========================================="
echo "Documentation Restructure Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Create directory structure
echo -e "${BLUE}Step 1: Creating directory structure...${NC}"
mkdir -p docs/{deployment,features/{questionnaire,psychology-report,inner-doodling,modules},troubleshooting/{backend,frontend,database,fonts,debugging},maintenance,releases,archive}
echo -e "${GREEN}✓ Directory structure created${NC}"
echo ""

# Step 2: Move deployment docs
echo -e "${BLUE}Step 2: Moving deployment documentation...${NC}"
git mv EC2_INSTANCE_RECOMMENDATIONS.md docs/deployment/ 2>/dev/null || mv EC2_INSTANCE_RECOMMENDATIONS.md docs/deployment/
git mv EBS_VOLUME_SIZING_GUIDE.md docs/deployment/ 2>/dev/null || mv EBS_VOLUME_SIZING_GUIDE.md docs/deployment/
git mv M5D_INSTANCE_ANALYSIS.md docs/deployment/ 2>/dev/null || mv M5D_INSTANCE_ANALYSIS.md docs/deployment/
git mv DNS_CONFIGURATION_GUIDE.md docs/deployment/ 2>/dev/null || mv DNS_CONFIGURATION_GUIDE.md docs/deployment/
git mv BRANCH_SETUP_GUIDE.md docs/deployment/ 2>/dev/null || mv BRANCH_SETUP_GUIDE.md docs/deployment/
echo -e "${GREEN}✓ Deployment docs moved${NC}"
echo ""

# Step 3: Move questionnaire docs
echo -e "${BLUE}Step 3: Moving questionnaire documentation...${NC}"
for file in QUESTIONNAIRE_API_IMPLEMENTATION.md \
            QUESTIONNAIRE_DATABASE_IMPLEMENTATION.md \
            QUESTIONNAIRE_IMPLEMENTATION_COMPLETE.md \
            QUESTIONNAIRE_COMPLETE_FLOW_IMPLEMENTATION.md \
            QUESTIONNAIRE_RESULT_DISPLAY_EXAMPLE.md \
            QUESTIONNAIRE_SCORING_EXPLANATION.md \
            QUESTIONNAIRE_TO_REPORT_INTEGRATION.md \
            QUESTIONNAIRE_DEPLOYMENT_GUIDE.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/features/questionnaire/ 2>/dev/null || mv "$file" docs/features/questionnaire/
    fi
done
echo -e "${GREEN}✓ Questionnaire docs moved${NC}"
echo ""

# Step 4: Move psychology report docs
echo -e "${BLUE}Step 4: Moving psychology report documentation...${NC}"
for file in PSYCHOLOGY_REPORT_INTEGRATION_GUIDE.md \
            PSYCHOLOGY_REPORT_INTEGRATION_COMPLETE.md \
            PSYCHOLOGY_REPORT_DOCX_IMPLEMENTATION.md \
            PSYCHOLOGY_REPORT_DOWNLOAD_GUIDE.md \
            DOCX_REPORT_GENERATION_EXPLAINED.md \
            DOCX_REPORT_SUMMARY.md \
            MARKDOWN_REPORT_IMPLEMENTATION.md \
            MARKDOWN_REPORT_COMPLETE.md \
            MARKDOWN_REPORT_DISPLAY_IMPLEMENTATION.md \
            MARKDOWN_REPORT_DISPLAY_COMPLETE.md \
            REPORT_GENERATION_FLOW.md \
            TASK_6_MARKDOWN_REPORT_SUCCESS.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/features/psychology-report/ 2>/dev/null || mv "$file" docs/features/psychology-report/
    fi
done
echo -e "${GREEN}✓ Psychology report docs moved${NC}"
echo ""

# Step 5: Move inner doodling docs
echo -e "${BLUE}Step 5: Moving inner doodling documentation...${NC}"
for file in INNER_DOODLING_UPLOAD_IMPLEMENTATION.md \
            INNER_DOODLING_DEPLOYMENT_GUIDE.md \
            INNER_DOODLING_COMPLETION_SUMMARY.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/features/inner-doodling/ 2>/dev/null || mv "$file" docs/features/inner-doodling/
    fi
done
echo -e "${GREEN}✓ Inner doodling docs moved${NC}"
echo ""

# Step 6: Move module docs
echo -e "${BLUE}Step 6: Moving module documentation...${NC}"
for file in MODULE_COMPLETION_DATABASE_GUIDE.md \
            MODULE_DATA_FLOW_DIAGRAM.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/features/modules/ 2>/dev/null || mv "$file" docs/features/modules/
    fi
done
echo -e "${GREEN}✓ Module docs moved${NC}"
echo ""

# Step 7: Move troubleshooting docs - backend
echo -e "${BLUE}Step 7: Moving troubleshooting documentation...${NC}"
for file in BACKEND_RESTART_REQUIRED.md \
            ERROR_500_TROUBLESHOOTING.md \
            FOREIGN_KEY_CONSTRAINT_FIX.md \
            MATPLOTLIB_BACKEND_FIX.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/troubleshooting/backend/ 2>/dev/null || mv "$file" docs/troubleshooting/backend/
    fi
done

# Move troubleshooting docs - frontend
for file in EMOTIONAL_FIRST_AID_BUTTON_FIX.md \
            UI_FLOW_GUIDE.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/troubleshooting/frontend/ 2>/dev/null || mv "$file" docs/troubleshooting/frontend/
    fi
done

# Move troubleshooting docs - database
for file in QUESTIONNAIRE_BACKEND_FIX.md \
            QUESTIONNAIRE_SESSION_ID_FIX.md \
            QUESTIONNAIRE_TO_ASSESSMENT_FIX.md \
            QUESTIONNAIRE_DUPLICATE_FIX.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/troubleshooting/database/ 2>/dev/null || mv "$file" docs/troubleshooting/database/
    fi
done

# Move troubleshooting docs - fonts
for file in CHINESE_FONT_FIX.md \
            DOCX_HORIZONTAL_RULE_FIX.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/troubleshooting/fonts/ 2>/dev/null || mv "$file" docs/troubleshooting/fonts/
    fi
done

# Move troubleshooting docs - debugging
for file in QUESTIONNAIRE_DEBUGGING_GUIDE.md \
            QUESTIONNAIRE_COMPLETE_FIX_SUMMARY.md \
            QUESTIONNAIRE_SELECTION_UPDATE.md \
            QUESTIONNAIRE_UI_FIX.md \
            REPORT_GENERATION_FIXES.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/troubleshooting/debugging/ 2>/dev/null || mv "$file" docs/troubleshooting/debugging/
    fi
done
echo -e "${GREEN}✓ Troubleshooting docs moved${NC}"
echo ""

# Step 8: Move maintenance docs
echo -e "${BLUE}Step 8: Moving maintenance documentation...${NC}"
for file in CLEANUP_LARGE_FILES.md \
            RESTART_BACKEND_AND_RELOAD_QUESTIONNAIRES.md \
            AI_CHAT_API_PACKAGE_VERIFICATION.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/maintenance/ 2>/dev/null || mv "$file" docs/maintenance/
    fi
done
echo -e "${GREEN}✓ Maintenance docs moved${NC}"
echo ""

# Step 9: Move release docs
echo -e "${BLUE}Step 9: Moving release documentation...${NC}"
for file in GIT_COMMIT_SUCCESS_SUMMARY.md \
            GIT_PUSH_SUCCESS_SUMMARY.md \
            INTEGRATION_COMPLETE.md \
            SESSION_SUMMARY.md \
            REBASE_FIXES_SUMMARY.md; do
    if [ -f "$file" ]; then
        git mv "$file" docs/releases/ 2>/dev/null || mv "$file" docs/releases/
    fi
done
echo -e "${GREEN}✓ Release docs moved${NC}"
echo ""

# Step 10: Create documentation index
echo -e "${BLUE}Step 10: Creating documentation index...${NC}"
cat > docs/README.md << 'EOF'
# ZeneAI Documentation

Welcome to the ZeneAI documentation! This directory contains all project documentation organized by category.

## 📚 Documentation Structure

### 🚀 [Deployment](deployment/)
Guides for deploying ZeneAI to various environments:
- [EC2 Instance Recommendations](deployment/EC2_INSTANCE_RECOMMENDATIONS.md)
- [EBS Volume Sizing Guide](deployment/EBS_VOLUME_SIZING_GUIDE.md)
- [M5D Instance Analysis](deployment/M5D_INSTANCE_ANALYSIS.md)
- [DNS Configuration Guide](deployment/DNS_CONFIGURATION_GUIDE.md)
- [Branch Setup Guide](deployment/BRANCH_SETUP_GUIDE.md)

### ✨ [Features](features/)
Implementation guides for major features:

#### [Questionnaire System](features/questionnaire/)
- [API Implementation](features/questionnaire/QUESTIONNAIRE_API_IMPLEMENTATION.md)
- [Database Implementation](features/questionnaire/QUESTIONNAIRE_DATABASE_IMPLEMENTATION.md)
- [Complete Flow Implementation](features/questionnaire/QUESTIONNAIRE_COMPLETE_FLOW_IMPLEMENTATION.md)
- [Scoring Explanation](features/questionnaire/QUESTIONNAIRE_SCORING_EXPLANATION.md)
- [Deployment Guide](features/questionnaire/QUESTIONNAIRE_DEPLOYMENT_GUIDE.md)

#### [Psychology Report](features/psychology-report/)
- [Integration Guide](features/psychology-report/PSYCHOLOGY_REPORT_INTEGRATION_GUIDE.md)
- [DOCX Implementation](features/psychology-report/PSYCHOLOGY_REPORT_DOCX_IMPLEMENTATION.md)
- [Download Guide](features/psychology-report/PSYCHOLOGY_REPORT_DOWNLOAD_GUIDE.md)
- [Markdown Report Implementation](features/psychology-report/MARKDOWN_REPORT_IMPLEMENTATION.md)
- [Report Generation Flow](features/psychology-report/REPORT_GENERATION_FLOW.md)

#### [Inner Doodling](features/inner-doodling/)
- [Upload Implementation](features/inner-doodling/INNER_DOODLING_UPLOAD_IMPLEMENTATION.md)
- [Deployment Guide](features/inner-doodling/INNER_DOODLING_DEPLOYMENT_GUIDE.md)
- [Completion Summary](features/inner-doodling/INNER_DOODLING_COMPLETION_SUMMARY.md)

#### [Modules](features/modules/)
- [Module Completion Database Guide](features/modules/MODULE_COMPLETION_DATABASE_GUIDE.md)
- [Module Data Flow Diagram](features/modules/MODULE_DATA_FLOW_DIAGRAM.md)

### 🔧 [Troubleshooting](troubleshooting/)
Bug fixes and troubleshooting guides:

#### [Backend Issues](troubleshooting/backend/)
- [Backend Restart Required](troubleshooting/backend/BACKEND_RESTART_REQUIRED.md)
- [Error 500 Troubleshooting](troubleshooting/backend/ERROR_500_TROUBLESHOOTING.md)
- [Foreign Key Constraint Fix](troubleshooting/backend/FOREIGN_KEY_CONSTRAINT_FIX.md)
- [Matplotlib Backend Fix](troubleshooting/backend/MATPLOTLIB_BACKEND_FIX.md)

#### [Frontend Issues](troubleshooting/frontend/)
- [Emotional First Aid Button Fix](troubleshooting/frontend/EMOTIONAL_FIRST_AID_BUTTON_FIX.md)
- [UI Flow Guide](troubleshooting/frontend/UI_FLOW_GUIDE.md)

#### [Database Issues](troubleshooting/database/)
- [Questionnaire Backend Fix](troubleshooting/database/QUESTIONNAIRE_BACKEND_FIX.md)
- [Session ID Fix](troubleshooting/database/QUESTIONNAIRE_SESSION_ID_FIX.md)
- [Assessment Fix](troubleshooting/database/QUESTIONNAIRE_TO_ASSESSMENT_FIX.md)
- [Duplicate Fix](troubleshooting/database/QUESTIONNAIRE_DUPLICATE_FIX.md)

#### [Font Issues](troubleshooting/fonts/)
- [Chinese Font Fix](troubleshooting/fonts/CHINESE_FONT_FIX.md)
- [DOCX Horizontal Rule Fix](troubleshooting/fonts/DOCX_HORIZONTAL_RULE_FIX.md)

#### [Debugging Guides](troubleshooting/debugging/)
- [Questionnaire Debugging Guide](troubleshooting/debugging/QUESTIONNAIRE_DEBUGGING_GUIDE.md)
- [Complete Fix Summary](troubleshooting/debugging/QUESTIONNAIRE_COMPLETE_FIX_SUMMARY.md)
- [Report Generation Fixes](troubleshooting/debugging/REPORT_GENERATION_FIXES.md)

### 🛠️ [Maintenance](maintenance/)
Maintenance and operations guides:
- [Cleanup Large Files](maintenance/CLEANUP_LARGE_FILES.md)
- [Restart Backend and Reload Questionnaires](maintenance/RESTART_BACKEND_AND_RELOAD_QUESTIONNAIRES.md)
- [AI Chat API Package Verification](maintenance/AI_CHAT_API_PACKAGE_VERIFICATION.md)

### 📦 [Releases](releases/)
Release notes and summaries:
- [Git Commit Success Summary](releases/GIT_COMMIT_SUCCESS_SUMMARY.md)
- [Git Push Success Summary](releases/GIT_PUSH_SUCCESS_SUMMARY.md)
- [Integration Complete](releases/INTEGRATION_COMPLETE.md)
- [Session Summary](releases/SESSION_SUMMARY.md)
- [Rebase Fixes Summary](releases/REBASE_FIXES_SUMMARY.md)

## 🔍 Quick Links

### Getting Started
1. [Quick Deployment Reference](../QUICK_DEPLOYMENT_REFERENCE.md) - Fast setup guide
2. [Deployment Guide v1.0.0](../DEPLOYMENT_GUIDE_v1.0.0.md) - Complete deployment instructions
3. [EC2 Instance Recommendations](deployment/EC2_INSTANCE_RECOMMENDATIONS.md) - Choose the right instance

### Common Tasks
- **Setting up database**: See [maintenance/RESTART_BACKEND_AND_RELOAD_QUESTIONNAIRES.md](maintenance/RESTART_BACKEND_AND_RELOAD_QUESTIONNAIRES.md)
- **Fixing Chinese fonts**: See [troubleshooting/fonts/CHINESE_FONT_FIX.md](troubleshooting/fonts/CHINESE_FONT_FIX.md)
- **Report generation issues**: See [troubleshooting/debugging/REPORT_GENERATION_FIXES.md](troubleshooting/debugging/REPORT_GENERATION_FIXES.md)
- **Questionnaire problems**: See [troubleshooting/debugging/QUESTIONNAIRE_DEBUGGING_GUIDE.md](troubleshooting/debugging/QUESTIONNAIRE_DEBUGGING_GUIDE.md)

### Feature Implementation
- **Questionnaire System**: Start with [features/questionnaire/QUESTIONNAIRE_API_IMPLEMENTATION.md](features/questionnaire/QUESTIONNAIRE_API_IMPLEMENTATION.md)
- **Psychology Reports**: Start with [features/psychology-report/PSYCHOLOGY_REPORT_INTEGRATION_GUIDE.md](features/psychology-report/PSYCHOLOGY_REPORT_INTEGRATION_GUIDE.md)
- **Inner Doodling**: Start with [features/inner-doodling/INNER_DOODLING_DEPLOYMENT_GUIDE.md](features/inner-doodling/INNER_DOODLING_DEPLOYMENT_GUIDE.md)

## 📝 Contributing to Documentation

When adding new documentation:
1. Place it in the appropriate category folder
2. Use descriptive filenames with UPPERCASE_WITH_UNDERSCORES.md format
3. Update this README.md with a link to your new document
4. Include a clear title and overview at the top of your document

## 🆘 Need Help?

If you can't find what you're looking for:
1. Check the [troubleshooting](troubleshooting/) section
2. Search for keywords in the documentation
3. Check the [releases](releases/) section for recent changes
4. Contact the development team

---

**Last Updated**: January 25, 2026
**Documentation Version**: 1.0.0
EOF
echo -e "${GREEN}✓ Documentation index created${NC}"
echo ""

# Step 11: Show summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Documentation restructure completed!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Created organized directory structure"
echo "  - Moved 50+ documentation files"
echo "  - Created comprehensive documentation index"
echo ""
echo "Next steps:"
echo "  1. Review the new structure: cd docs && ls -R"
echo "  2. Check the documentation index: cat docs/README.md"
echo "  3. Commit changes: git add -A && git commit -m 'docs: Restructure documentation into organized folders'"
echo "  4. Push to remote: git push origin ai-chat-api-v2"
echo ""
echo "Root directory now contains only:"
echo "  - README.md (main project README)"
echo "  - QUICK_DEPLOYMENT_REFERENCE.md (quick start)"
echo "  - DEPLOYMENT_GUIDE_v1.0.0.md (current deployment guide)"
echo "  - GIT_TAG_DEPLOYMENT_SUMMARY.md (latest release info)"
echo "  - docs/ (all other documentation)"
echo ""
