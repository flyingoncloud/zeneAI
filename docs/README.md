# ZeneAI Documentation

Welcome to the ZeneAI documentation! This directory contains all project documentation organized by category.

## 📚 Documentation Structure

### 📋 [Documentation Meta](.)
- [Documentation Restructure Plan](DOCUMENTATION_RESTRUCTURE_PLAN.md)
- [Documentation Restructure Summary](DOCUMENTATION_RESTRUCTURE_SUMMARY.md)

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
- [Extension Guide](features/questionnaire/QUESTIONNAIRE_EXTENSION_GUIDE.md) - How to add new questionnaires
- [Media Support Guide](features/questionnaire/QUESTIONNAIRE_MEDIA_SUPPORT_GUIDE.md) - Images & animations support
- [Duplicate Fix 2](features/questionnaire/QUESTIONNAIRE_DUPLICATE_FIX_2.md)

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
- [Analyze Button Fix](features/inner-doodling/INNER_DOODLING_ANALYZE_BUTTON_FIX.md)
- [Image Display Fix](features/inner-doodling/INNER_DOODLING_IMAGE_DISPLAY_FIX.md)

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
- [Emotional First Aid Completion Fix](troubleshooting/frontend/EMOTIONAL_FIRST_AID_COMPLETION_FIX.md)
- [Emotional First Aid Debug Guide](troubleshooting/frontend/EMOTIONAL_FIRST_AID_DEBUG_GUIDE.md)
- [Emotional First Aid Fix Complete](troubleshooting/frontend/EMOTIONAL_FIRST_AID_FIX_COMPLETE.md)
- [Emotional First Aid Repeat Fix](troubleshooting/frontend/EMOTIONAL_FIRST_AID_REPEAT_FIX.md)
- [Emotional First Aid Status Explanation](troubleshooting/frontend/EMOTIONAL_FIRST_AID_STATUS_EXPLANATION.md)
- [Testing Emotional First Aid Fix](troubleshooting/frontend/TESTING_EMOTIONAL_FIRST_AID_FIX.md)

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
