# Questionnaire Selection Feature Update

## Summary
Updated the Inner Quick Test (内视快测) component to display all available questionnaires and allow users to select which one to complete, instead of always loading `questionnaire_2_1`.

## Changes Made

### Frontend: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`

**New Features:**
1. **Questionnaire Selection Screen**: Added a new view that displays all available questionnaires in a grid layout
2. **Dynamic Loading**: Fetches all questionnaires from backend on component mount
3. **User Choice**: Users can click on any questionnaire card to start that specific test
4. **Three-View System**:
   - `selection` - Choose a questionnaire
   - `test` - Complete the selected questionnaire
   - `result` - View results after completion

**UI Improvements:**
- Beautiful card-based layout for questionnaire selection
- Each card shows:
  - Section number (e.g., "2.1", "2.2")
  - Full title (e.g., "情绪觉察 (Emotional Insight Analysis)")
  - Number of questions
  - Hover effects with violet accent colors
- Consistent design with the rest of the application

**Technical Changes:**
- Changed from single questionnaire loading to list-based selection
- Added `view` state to manage three different screens
- Improved error handling for both list loading and individual questionnaire loading
- Maintained all existing functionality (answer submission, database saving, module completion)

## Available Questionnaires

The system now displays all 4 questionnaires:

1. **questionnaire_2_1**: 情绪觉察 (Emotional Insight Analysis) - 10 questions
2. **questionnaire_2_2**: 认知模式 (Cognitive Insight Analysis) - Multiple sub-sections
3. **questionnaire_2_3**: (Additional questionnaire)
4. **questionnaire_2_5**: (Additional questionnaire)

## User Flow

1. User opens Inner Quick Test module
2. **NEW**: Selection screen shows all available questionnaires
3. User clicks on a questionnaire card
4. Questionnaire loads and test begins
5. User completes all questions
6. Results are submitted to backend and saved to database
7. Module is marked as completed
8. Results screen is displayed
9. User can click "重新测试" to return to selection screen

## Backend API (No Changes Required)

The backend already supports this functionality:
- `GET /questionnaires` - Returns list of all questionnaires ✅
- `GET /questionnaires/{questionnaire_id}` - Returns specific questionnaire ✅
- `POST /conversations/{conversation_id}/questionnaires/submit` - Saves responses ✅

## Testing Recommendations

1. Verify all 4 questionnaires appear in the selection screen
2. Test selecting each questionnaire and completing it
3. Verify database saves the correct `questionnaire_id` for each submission
4. Test the "重新测试" button returns to selection screen
5. Verify module completion tracking works for all questionnaires

## Benefits

- **User Choice**: Users can now choose which assessment they want to complete
- **Better UX**: Clear overview of all available assessments
- **Scalability**: Easy to add more questionnaires in the future
- **Flexibility**: Users can complete multiple different questionnaires over time
- **Data Tracking**: Backend correctly tracks which specific questionnaire was completed

## Files Modified

- `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` - Complete rewrite with selection feature

## Files Created

- `QUESTIONNAIRE_SELECTION_UPDATE.md` - This documentation file
