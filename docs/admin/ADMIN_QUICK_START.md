# Admin Panel Quick Start Guide

## What Was Built

I've successfully integrated the complete questionnaire admin management system into your `zeneme-next` application. The admin panel is now ready to use!

## Access the Admin Panel

### Local Development
```bash
cd zeneme-next
npm run dev
```
Then open: `http://localhost:3000/admin`

### Production (after deployment)
Navigate to: `https://www.zeneme.ai/admin`

## Login Credentials

- **Email**: `admin@zeneme.com`
- **Password**: `admin123`

## Features Available Now

### 1. Question Management
- ✅ View all questionnaires in a list
- ✅ Search by ID, title, or content
- ✅ Filter by template type (F1-F8)
- ✅ Filter by status (draft/published)
- ✅ Sort by ID or custom order
- ✅ Create new questions from 8 templates
- ✅ Edit existing questions
- ✅ Duplicate questions
- ✅ Delete questions (with confirmation)
- ✅ Publish questions
- ✅ 80 question limit enforcement

### 2. Question Editor
- ✅ Full-featured editor with live preview
- ✅ Template-specific settings
- ✅ Options management (add, edit, delete, reorder)
- ✅ Media URL support (images and videos)
- ✅ Validation rules
- ✅ Tags management
- ✅ Save as draft or publish

### 3. Template Types (8 Total)
1. **F1: Likert 5** - 5-point scale with custom endpoints
2. **F2: Single Choice (Text)** - 2-8 text options
3. **F3: Single Choice + Image** - Question with image
4. **F4: Image Cards** - 4 image cards (A-D)
5. **F5: Image Grid** - Up to 6 images in grid
6. **F6: Ranking** - Select and rank top N items
7. **F7: Direction Dial** - 0-360° spatial selector
8. **F8: Video + Choice** - Video with options

### 4. Additional Features
- ✅ Template library browser
- ✅ Media library viewer
- ✅ Admin settings page
- ✅ Dark theme UI
- ✅ Responsive design
- ✅ Smooth animations

## How to Use

### Creating a New Question

1. Click "新增题目" (New Question) button
2. Select a template from the modal (F1-F8)
3. Fill in the question details:
   - Internal title (for admin reference)
   - Question stem (the actual question text)
   - Subtitle (optional)
   - Tags (comma-separated)
4. Configure template-specific settings:
   - **F1**: Left and right endpoint labels
   - **F6**: Top N value for ranking
   - **F7**: Center object, target object, default angle
   - etc.
5. Add options (if applicable):
   - Click "添加选项" to add options
   - Enter text, image URL (if needed), and score value
   - Reorder or delete options as needed
6. Set validation rules:
   - Toggle "必填" (required)
   - Set min/max for ranking questions
7. Preview your question in the right panel
8. Click "保存草稿" (Save Draft) or "发布" (Publish)

### Editing a Question

1. Click on any question in the list
2. Make your changes in the editor
3. Save as draft or publish

### Duplicating a Question

1. Hover over a question in the list
2. Click the copy icon
3. A duplicate will be created with "(副本)" suffix
4. Edit the duplicate as needed

### Deleting a Question

1. Hover over a question in the list
2. Click the trash icon
3. Confirm deletion in the modal
4. The question ID will be freed for reuse

### Publishing a Question

1. Open the question in the editor
2. Click "发布" (Publish) button
3. Confirm in the modal
4. Published questions appear in the user-facing questionnaire list

## Current Limitations

⚠️ **Important**: The admin panel currently uses **local state only**. This means:

- Changes are **not saved to the database**
- Data is **lost on page refresh**
- Questions are **not visible to users** yet

### Why?

The frontend is complete, but it needs to be connected to the backend API. This is the next step.

## Next Steps (Backend Integration)

To make the admin panel fully functional, you need to:

### 1. Create Backend API Endpoints

Add these endpoints to `ai-chat-api/src/api/app.py`:

```python
# GET /admin/questionnaires - List all questionnaires
# POST /admin/questionnaires - Create new questionnaire
# PUT /admin/questionnaires/{id} - Update questionnaire
# DELETE /admin/questionnaires/{id} - Delete questionnaire
# POST /admin/questionnaires/{id}/publish - Publish questionnaire
# POST /admin/questionnaires/{id}/duplicate - Duplicate questionnaire
# GET /admin/media - List media files
# POST /admin/media - Upload media file
# DELETE /admin/media/{id} - Delete media file
```

### 2. Update Database Models

Ensure `questionnaire_models.py` supports:
- All 8 template types
- Template-specific settings
- Media URLs
- Draft/published status
- Custom ordering

### 3. Connect Frontend to Backend

Update `useAdminStore.tsx` to:
- Load questions from API on mount
- Call API for all CRUD operations
- Handle loading and error states

### 4. Add Authentication

Implement proper admin authentication:
- JWT tokens or session-based auth
- Protected routes
- Role-based access control

## Testing the Admin Panel

Even without backend integration, you can test:

1. **Login**: Use admin@zeneme.com / admin123
2. **Create Questions**: Try all 8 templates
3. **Edit Questions**: Modify fields and see live preview
4. **Duplicate**: Create copies of questions
5. **Delete**: Remove questions (with confirmation)
6. **Search**: Search by ID, title, or content
7. **Filter**: Filter by template or status
8. **Sort**: Switch between ID and custom order
9. **Template Library**: Browse all templates
10. **Media Library**: View media files (empty for now)

## File Locations

```
zeneme-next/
├── src/
│   ├── app/
│   │   └── admin/
│   │       └── page.tsx                 # Admin route
│   ├── components/
│   │   └── admin/
│   │       ├── AdminLayout.tsx          # Main layout
│   │       ├── AdminLogin.tsx           # Login page
│   │       ├── QuestionsList.tsx        # Question list
│   │       ├── QuestionEditor.tsx       # Question editor
│   │       ├── TemplatePicker.tsx       # Template selector
│   │       ├── TemplateLibrary.tsx      # Template browser
│   │       ├── MediaLibrary.tsx         # Media manager
│   │       └── AdminSettings.tsx        # Settings page
│   └── hooks/
│       └── useAdminStore.tsx            # Admin state management
```

## Troubleshooting

### Admin page not loading?
- Check that you're at `/admin` route
- Check browser console for errors
- Verify all components are imported correctly

### Login not working?
- Use exact credentials: admin@zeneme.com / admin123
- Check that AdminProvider is wrapping the layout

### Changes not saving?
- This is expected! Backend integration is needed
- Changes are stored in local state only
- Will be lost on page refresh

### Build errors?
- Check that all imports are correct
- Verify lucide-react is installed
- Check motion/react is installed

## Support

For detailed information, see:
- **Full Implementation**: `ADMIN_INTEGRATION_COMPLETE.md`
- **Requirements Spec**: `.kiro/specs/admin-questionnaire-integration/requirements.md`
- **Deployment Guide**: `DEPLOYMENT_FIX_CHECKLIST.md`

## Summary

✅ **What's Done**:
- Complete admin UI with all features
- 8 template types supported
- Question CRUD operations
- Live preview
- Search, filter, sort
- Dark theme design

🔄 **What's Next**:
- Backend API endpoints
- Database integration
- Real authentication
- Data persistence

---

**Status**: Frontend Complete ✅
**Ready for**: Backend Integration
**Access**: http://localhost:3000/admin
**Login**: admin@zeneme.com / admin123
