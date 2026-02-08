# Admin Questionnaire Management Integration

## Overview
Integrate the questionnaire admin management system from `26_02_07_ZeneWe_Admin` into the main `zeneme-next` application to enable questionnaire CRUD operations.

## User Stories

### 1. Admin Authentication
**As an** administrator
**I want to** log in to the admin panel
**So that** I can manage questionnaires securely

**Acceptance Criteria:**
- 1.1 Admin login page with email/password authentication
- 1.2 Session management for admin users
- 1.3 Protected admin routes that require authentication
- 1.4 Logout functionality

### 2. Questionnaire List Management
**As an** administrator
**I want to** view all questionnaires in a list
**So that** I can see what questionnaires exist and their status

**Acceptance Criteria:**
- 2.1 Display list of all questionnaires with ID, title, template type, and status
- 2.2 Search functionality to filter questionnaires by title or tags
- 2.3 Sort by ID or custom order
- 2.4 Show question count for each questionnaire
- 2.5 Visual indicators for draft vs published status
- 2.6 Warning banner when approaching 80 question limit

### 3. Questionnaire Creation
**As an** administrator
**I want to** create new questionnaires using templates
**So that** I can add new assessment tools

**Acceptance Criteria:**
- 3.1 Template picker modal with 8 template types (F1-F8)
- 3.2 Each template shows name, description, required fields, and icon
- 3.3 Create questionnaire with selected template and default settings
- 3.4 New questionnaires start in draft status
- 3.5 Cannot create more than 80 questionnaires total

### 4. Questionnaire Editing
**As an** administrator
**I want to** edit questionnaire details
**So that** I can update questions and settings

**Acceptance Criteria:**
- 4.1 Full editor with form fields for all questionnaire properties
- 4.2 Template-specific settings (Likert endpoints, ranking topN, etc.)
- 4.3 Options management (add, edit, delete, reorder)
- 4.4 Media URL support for images and videos
- 4.5 Live preview panel showing how questionnaire will appear
- 4.6 Validation rules (required, min/max)
- 4.7 Tags management
- 4.8 Save changes with updated timestamp

### 5. Questionnaire Publishing
**As an** administrator
**I want to** publish questionnaires
**So that** they become available to users

**Acceptance Criteria:**
- 5.1 Change status from draft to published
- 5.2 Published questionnaires appear in user-facing questionnaire list
- 5.3 Publish action is logged with timestamp and user
- 5.4 Cannot publish incomplete questionnaires (missing required fields)

### 6. Questionnaire Duplication
**As an** administrator
**I want to** duplicate existing questionnaires
**So that** I can create variations quickly

**Acceptance Criteria:**
- 6.1 Duplicate button creates copy with "(副本)" suffix
- 6.2 Duplicated questionnaire starts in draft status
- 6.3 All settings, options, and media URLs are copied
- 6.4 New unique ID is assigned

### 7. Questionnaire Deletion
**As an** administrator
**I want to** delete questionnaires
**So that** I can remove outdated or incorrect assessments

**Acceptance Criteria:**
- 7.1 Delete button with confirmation dialog
- 7.2 Deleted questionnaires are removed from database
- 7.3 Cannot delete if questionnaire has user responses (optional safety check)

### 8. Media Library
**As an** administrator
**I want to** manage media assets
**So that** I can use images and videos in questionnaires

**Acceptance Criteria:**
- 8.1 View all uploaded media with thumbnails
- 8.2 Filter by type (image/video)
- 8.3 Upload new media files
- 8.4 Copy media URL for use in questionnaires
- 8.5 Delete unused media

### 9. Template Types Support
**As an** administrator
**I want to** use different question templates
**So that** I can create diverse assessment types

**Acceptance Criteria:**
- 9.1 F1: Likert 5-point scale with customizable endpoints
- 9.2 F2: Single choice text options (2-8 options)
- 9.3 F3: Single choice with stem image
- 9.4 F4: Image cards (A-D) with image + text
- 9.5 F5: Image grid (2x3, up to 6 items)
- 9.6 F6: Ranking top N with configurable N value
- 9.7 F7: Direction dial (0-360 degrees) with scene items
- 9.8 F8: Video + single choice options

### 10. Backend API Integration
**As a** developer
**I want to** connect admin UI to backend APIs
**So that** changes persist to database

**Acceptance Criteria:**
- 10.1 GET /admin/questionnaires - List all questionnaires
- 10.2 GET /admin/questionnaires/:id - Get questionnaire details
- 10.3 POST /admin/questionnaires - Create new questionnaire
- 10.4 PUT /admin/questionnaires/:id - Update questionnaire
- 10.5 DELETE /admin/questionnaires/:id - Delete questionnaire
- 10.6 POST /admin/questionnaires/:id/publish - Publish questionnaire
- 10.7 POST /admin/questionnaires/:id/duplicate - Duplicate questionnaire
- 10.8 GET /admin/media - List media files
- 10.9 POST /admin/media - Upload media file
- 10.10 DELETE /admin/media/:id - Delete media file

## Technical Constraints

1. Must use existing admin components from `26_02_07_ZeneWe_Admin`
2. Must integrate with existing `zeneme-next` routing structure
3. Must use existing backend database models (`questionnaire_models.py`)
4. Must maintain backward compatibility with existing questionnaire API
5. Admin routes must be protected with authentication
6. Must support both Chinese and English languages

## Out of Scope

- User role management (only single admin role)
- Advanced permissions (all admins have full access)
- Questionnaire versioning
- Response analytics in admin panel
- Bulk operations (import/export)

## Dependencies

- Existing questionnaire database models
- Existing questionnaire API endpoints
- Admin components from `26_02_07_ZeneWe_Admin`
- Authentication system for admin users

## Success Metrics

- Admin can create, edit, publish, and delete questionnaires
- All 8 template types work correctly
- Changes persist to database
- Published questionnaires appear in user-facing list
- No data loss during operations
- Admin panel is accessible only to authenticated users
