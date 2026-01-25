# Questionnaire Media Support Guide

## Overview

This guide provides a comprehensive solution for adding **image** and **animation** support to the questionnaire system. The solution is designed to be backward-compatible, scalable, and easy to implement.

---

## Table of Contents

1. [Solution Architecture](#solution-architecture)
2. [Database Schema Changes](#database-schema-changes)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [JSON Structure Examples](#json-structure-examples)
6. [Media Storage Strategy](#media-storage-strategy)
7. [Implementation Steps](#implementation-steps)
8. [Best Practices](#best-practices)
9. [Example Use Cases](#example-use-cases)

---

## Solution Architecture

### Design Principles

1. **Backward Compatibility**: Existing questionnaires without media continue to work
2. **Flexible Media Types**: Support images, GIFs, videos, and future formats
3. **Multiple Media Per Question**: Allow multiple media items (e.g., before/after images)
4. **Responsive Design**: Media adapts to different screen sizes
5. **Performance**: Lazy loading and optimized delivery
6. **Accessibility**: Alt text and captions for all media

### Media Types Supported

- **Static Images**: PNG, JPG, WebP
- **Animated Images**: GIF, APNG
- **Videos**: MP4, WebM (for complex animations)
- **SVG**: For diagrams and illustrations
- **Future**: Interactive media, 3D models

---

## Database Schema Changes

### Option 1: Add Media Column to Questions Table (Recommended)

**Pros**: Simple, clean, keeps all question data together
**Cons**: Requires migration

```python
# ai-chat-api/src/database/questionnaire_models.py

class AssessmentQuestion(Base):
    """Individual questions"""
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    questionnaire_id = Column(String, ForeignKey("assessment_questionnaires.id"), nullable=False)
    question_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    category = Column(String)
    sub_section = Column(String)
    dimension = Column(String)
    options = Column(JSON)

    # NEW: Media support
    media = Column(JSON)  # Array of media objects
    # Example structure:
    # [
    #   {
    #     "type": "image",
    #     "url": "/static/questionnaires/2_1/q1_example.jpg",
    #     "alt": "Example of emotional expression",
    #     "caption": "识别这个人的情绪",
    #     "position": "above",  # above, below, left, right
    #     "size": "medium"  # small, medium, large, full
    #   }
    # ]

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships remain the same
    questionnaire = relationship("AssessmentQuestionnaire", back_populates="questions")
    answers = relationship("AssessmentAnswer", back_populates="question")
```

### Option 2: Use Existing JSON Column (No Migration Required)

Store media in the existing `options` JSON field or add to question text metadata.

**Pros**: No database migration needed
**Cons**: Less structured, harder to query

---

## Backend Implementation

### 1. Database Migration (if using Option 1)

```python
# ai-chat-api/src/database/migrations/add_media_to_questions.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

def upgrade():
    """Add media column to assessment_questions table"""
    op.add_column(
        'assessment_questions',
        sa.Column('media', JSON, nullable=True)
    )

def downgrade():
    """Remove media column"""
    op.drop_column('assessment_questions', 'media')
```

### 2. Update Seeding Script

```python
# ai-chat-api/src/database/questionnaire_seeding.py

def seed_questionnaire(db: Session, json_file_path: str):
    """Seed a questionnaire from JSON file with media support"""

    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questionnaire_id = f"questionnaire_{data['section']}"

    # Create or update questionnaire
    questionnaire = db.query(AssessmentQuestionnaire).filter_by(
        id=questionnaire_id
    ).first()

    if not questionnaire:
        questionnaire = AssessmentQuestionnaire(
            id=questionnaire_id,
            section=data['section'],
            title=data['title'],
            marking_criteria=data.get('marking_criteria', {})
        )
        db.add(questionnaire)
        db.flush()

    # Clear existing questions
    db.query(AssessmentQuestion).filter_by(
        questionnaire_id=questionnaire_id
    ).delete()

    # Add questions with media support
    for q_data in data['questions']:
        question = AssessmentQuestion(
            questionnaire_id=questionnaire_id,
            question_number=q_data['id'],
            text=q_data['text'],
            category=q_data.get('category'),
            sub_section=q_data.get('sub_section'),
            dimension=q_data.get('dimension'),
            options=q_data.get('options'),
            media=q_data.get('media')  # NEW: Media support
        )
        db.add(question)

    db.commit()
```

### 3. Static File Serving

```python
# ai-chat-api/src/api/app.py

from fastapi.staticfiles import StaticFiles
import os

# Mount static files directory for questionnaire media
QUESTIONNAIRE_MEDIA_DIR = os.path.join(
    os.path.dirname(__file__),
    '..',
    'resources',
    'questionnaire_media'
)

# Create directory if it doesn't exist
os.makedirs(QUESTIONNAIRE_MEDIA_DIR, exist_ok=True)

# Mount the directory
app.mount(
    "/static/questionnaires",
    StaticFiles(directory=QUESTIONNAIRE_MEDIA_DIR),
    name="questionnaire_media"
)
```

### 4. API Response (No Changes Needed)

The existing API endpoints already return the full question object, so media will be automatically included:

```python
# Existing endpoint already works!
@app.get("/questionnaires/{questionnaire_id}")
async def get_questionnaire(questionnaire_id: str):
    # ... existing code ...
    # Media is automatically included in the response
    return {
        "ok": True,
        "questionnaire": {
            "id": questionnaire.id,
            "questions": [
                {
                    "id": q.id,
                    "text": q.text,
                    "options": q.options,
                    "media": q.media  # Automatically included
                }
                for q in questionnaire.questions
            ]
        }
    }
```

---

## Frontend Implementation

### 1. Update TypeScript Types

```typescript
// zeneme-next/src/lib/api.ts

export type QuestionMedia = {
  type: 'image' | 'gif' | 'video' | 'svg';
  url: string;
  alt: string;
  caption?: string;
  position?: 'above' | 'below' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large' | 'full';
  autoplay?: boolean;  // For videos/GIFs
  loop?: boolean;      // For videos/GIFs
};

export type QuestionDetail = {
  id: number;
  text: string;
  category?: string;
  sub_section?: string;
  dimension?: string;
  options?: QuestionOption[];
  media?: QuestionMedia[];  // NEW
};
```

### 2. Create Media Component

```typescript
// zeneme-next/src/components/features/tools/QuestionMedia.tsx

import React, { useState } from 'react';
import { QuestionMedia } from '../../../lib/api';
import { ZoomIn, X } from 'lucide-react';

interface QuestionMediaProps {
  media: QuestionMedia[];
  position?: 'above' | 'below' | 'left' | 'right';
}

export const QuestionMediaDisplay: React.FC<QuestionMediaProps> = ({
  media,
  position = 'above'
}) => {
  const [selectedMedia, setSelectedMedia] = useState<QuestionMedia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMediaClick = (item: QuestionMedia) => {
    setSelectedMedia(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMedia(null);
  };

  const renderMediaItem = (item: QuestionMedia, index: number) => {
    const sizeClasses = {
      small: 'w-32 h-32',
      medium: 'w-64 h-64',
      large: 'w-96 h-96',
      full: 'w-full h-auto'
    };

    const sizeClass = sizeClasses[item.size || 'medium'];

    const commonClasses = `
      ${sizeClass}
      object-cover
      rounded-xl
      border-2
      border-white/10
      cursor-pointer
      hover:border-violet-500
      transition-all
      hover:scale-105
      shadow-lg
    `;

    switch (item.type) {
      case 'image':
      case 'gif':
      case 'svg':
        return (
          <div key={index} className="relative group">
            <img
              src={item.url}
              alt={item.alt}
              className={commonClasses}
              onClick={() => handleMediaClick(item)}
              loading="lazy"
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleMediaClick(item)}
                className="p-2 bg-black/50 rounded-full hover:bg-black/70"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
            </div>
            {item.caption && (
              <p className="text-sm text-slate-400 mt-2 text-center">
                {item.caption}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div key={index} className="relative">
            <video
              src={item.url}
              className={commonClasses}
              controls
              autoPlay={item.autoplay}
              loop={item.loop}
              muted={item.autoplay} // Autoplay requires muted
              playsInline
            >
              <track kind="captions" />
              您的浏览器不支持视频播放。
            </video>
            {item.caption && (
              <p className="text-sm text-slate-400 mt-2 text-center">
                {item.caption}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const containerClasses = {
    above: 'flex flex-col items-center gap-4 mb-6',
    below: 'flex flex-col items-center gap-4 mt-6',
    left: 'flex flex-row items-start gap-6',
    right: 'flex flex-row-reverse items-start gap-6'
  };

  return (
    <>
      <div className={containerClasses[position]}>
        {media.map((item, index) => renderMediaItem(item, index))}
      </div>

      {/* Full-screen Modal */}
      {isModalOpen && selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-6xl max-h-[90vh] overflow-auto">
            {selectedMedia.type === 'video' ? (
              <video
                src={selectedMedia.url}
                className="w-full h-auto rounded-lg"
                controls
                autoPlay
                loop={selectedMedia.loop}
              >
                <track kind="captions" />
              </video>
            ) : (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.alt}
                className="w-full h-auto rounded-lg"
              />
            )}
            {selectedMedia.caption && (
              <p className="text-white text-center mt-4 text-lg">
                {selectedMedia.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
```

### 3. Update Question Rendering

```typescript
// zeneme-next/src/components/features/tools/InnerQuickTest.tsx

import { QuestionMediaDisplay } from './QuestionMedia';

// Inside the render section, add media display:

<div className="max-w-2xl w-full space-y-12 backdrop-blur-sm p-8 rounded-3xl border border-white/5 bg-slate-900/20 shadow-2xl">
  <div className="space-y-4 text-center">
    <span className="text-violet-400 font-semibold tracking-widest text-xs uppercase">
      {t.test.question} {currentQIndex + 1} / {totalQuestions}
    </span>

    {/* NEW: Display media above question if position is 'above' or undefined */}
    {currentQuestion?.media && currentQuestion.media.length > 0 && (
      <QuestionMediaDisplay
        media={currentQuestion.media.filter(m => !m.position || m.position === 'above')}
        position="above"
      />
    )}

    <h3 className="text-3xl md:text-4xl font-medium text-white leading-tight drop-shadow-lg">
      {currentQuestion?.text}
    </h3>

    {/* NEW: Display media below question if position is 'below' */}
    {currentQuestion?.media && currentQuestion.media.length > 0 && (
      <QuestionMediaDisplay
        media={currentQuestion.media.filter(m => m.position === 'below')}
        position="below"
      />
    )}
  </div>

  {/* Rest of the question options... */}
</div>
```

---

## JSON Structure Examples

### Example 1: Question with Single Image

```json
{
  "section": "2.1",
  "title": "情绪识别测试",
  "questions": [
    {
      "id": 1,
      "text": "请识别图片中人物的情绪状态",
      "media": [
        {
          "type": "image",
          "url": "/static/questionnaires/2_1/emotion_happy.jpg",
          "alt": "A person showing happiness",
          "caption": "观察面部表情和肢体语言",
          "position": "above",
          "size": "medium"
        }
      ],
      "options": [
        {"label": "A", "text": "快乐", "score": 5},
        {"label": "B", "text": "悲伤", "score": 1},
        {"label": "C", "text": "愤怒", "score": 1},
        {"label": "D", "text": "恐惧", "score": 1}
      ]
    }
  ]
}
```

### Example 2: Question with Animation (GIF)

```json
{
  "id": 2,
  "text": "观察这个动画，判断情绪变化的过程",
  "media": [
    {
      "type": "gif",
      "url": "/static/questionnaires/2_1/emotion_transition.gif",
      "alt": "Emotion transition animation",
      "caption": "从平静到焦虑的情绪转变",
      "position": "above",
      "size": "large"
    }
  ]
}
```

### Example 3: Question with Video

```json
{
  "id": 3,
  "text": "观看视频后，评估你对这种情境的共情能力",
  "media": [
    {
      "type": "video",
      "url": "/static/questionnaires/2_1/empathy_scenario.mp4",
      "alt": "Empathy scenario video",
      "caption": "一个需要情感支持的场景",
      "position": "above",
      "size": "full",
      "autoplay": false,
      "loop": false
    }
  ]
}
```

### Example 4: Question with Multiple Images (Before/After)

```json
{
  "id": 4,
  "text": "比较两张图片，识别情绪的变化",
  "media": [
    {
      "type": "image",
      "url": "/static/questionnaires/2_1/before.jpg",
      "alt": "Before state",
      "caption": "之前",
      "position": "above",
      "size": "medium"
    },
    {
      "type": "image",
      "url": "/static/questionnaires/2_1/after.jpg",
      "alt": "After state",
      "caption": "之后",
      "position": "above",
      "size": "medium"
    }
  ]
}
```

### Example 5: Question with Side-by-Side Layout

```json
{
  "id": 5,
  "text": "哪个表情更能表达'失望'？",
  "media": [
    {
      "type": "image",
      "url": "/static/questionnaires/2_1/option_a.jpg",
      "alt": "Option A",
      "caption": "选项 A",
      "position": "left",
      "size": "small"
    },
    {
      "type": "image",
      "url": "/static/questionnaires/2_1/option_b.jpg",
      "alt": "Option B",
      "caption": "选项 B",
      "position": "right",
      "size": "small"
    }
  ]
}
```

---

## Media Storage Strategy

### Directory Structure

```
ai-chat-api/
└── src/
    └── resources/
        └── questionnaire_media/
            ├── 2_1/              # Questionnaire 2.1
            │   ├── q1_image.jpg
            │   ├── q2_animation.gif
            │   └── q3_video.mp4
            ├── 2_2/              # Questionnaire 2.2
            │   └── ...
            └── shared/           # Shared media across questionnaires
                └── ...
```

### URL Format

- **Relative URLs** (recommended): `/static/questionnaires/2_1/q1_image.jpg`
- **Absolute URLs** (for CDN): `https://cdn.example.com/questionnaires/2_1/q1_image.jpg`
- **External URLs**: `https://example.com/media/image.jpg`

### Storage Options

1. **Local Storage** (Development/Small Scale)
   - Store in `ai-chat-api/src/resources/questionnaire_media/`
   - Served via FastAPI StaticFiles
   - Simple, no external dependencies

2. **Cloud Storage** (Production/Large Scale)
   - AWS S3, Google Cloud Storage, Azure Blob
   - Better performance, scalability
   - CDN integration for faster delivery

3. **Hybrid Approach**
   - Small images: Local storage
   - Large videos: Cloud storage
   - Use URL prefix to determine source

---

## Implementation Steps

### Phase 1: Database & Backend (1-2 hours)

1. **Add media column to database**
   ```bash
   cd ai-chat-api
   # Create migration
   alembic revision -m "add_media_to_questions"
   # Edit migration file
   # Run migration
   alembic upgrade head
   ```

2. **Update seeding script**
   - Modify `questionnaire_seeding.py` to handle media field
   - Test with existing questionnaires (should still work)

3. **Setup static file serving**
   - Create `questionnaire_media` directory
   - Mount in FastAPI app
   - Test with sample image

### Phase 2: Frontend Components (2-3 hours)

1. **Create QuestionMedia component**
   - Implement image display
   - Add zoom/modal functionality
   - Add video support
   - Test responsive design

2. **Update TypeScript types**
   - Add `QuestionMedia` type
   - Update `QuestionDetail` type

3. **Integrate into InnerQuickTest**
   - Import component
   - Add conditional rendering
   - Test with mock data

### Phase 3: Content Creation (Ongoing)

1. **Prepare media assets**
   - Optimize images (WebP format, compressed)
   - Convert videos to web-friendly formats
   - Create GIF animations

2. **Update questionnaire JSONs**
   - Add media fields to questions
   - Test loading and display

3. **Reseed database**
   ```bash
   cd ai-chat-api
   python -c "from src.scripts.load_questionnaires import load_all_questionnaires; from src.database.database import SessionLocal; load_all_questionnaires(SessionLocal())"
   ```

### Phase 4: Testing & Optimization (1-2 hours)

1. **Test all media types**
   - Images (JPG, PNG, WebP)
   - GIFs
   - Videos (MP4, WebM)
   - SVG

2. **Test responsive design**
   - Mobile devices
   - Tablets
   - Desktop

3. **Performance optimization**
   - Lazy loading
   - Image compression
   - Video streaming

---

## Best Practices

### 1. Image Optimization

```bash
# Convert to WebP (better compression)
cwebp input.jpg -q 80 -o output.webp

# Resize for web
convert input.jpg -resize 800x600 -quality 85 output.jpg

# Create thumbnails
convert input.jpg -resize 200x200^ -gravity center -extent 200x200 thumbnail.jpg
```

### 2. Video Optimization

```bash
# Convert to web-friendly MP4
ffmpeg -i input.mov -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4

# Create WebM version (better compression)
ffmpeg -i input.mov -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm
```

### 3. Accessibility

- Always provide `alt` text for images
- Add captions for videos
- Ensure keyboard navigation works
- Test with screen readers

### 4. Performance

- Use lazy loading for images
- Compress all media files
- Consider using a CDN for production
- Implement progressive image loading

### 5. Backward Compatibility

- Make `media` field optional
- Existing questionnaires without media continue to work
- Gracefully handle missing media files

---

## Example Use Cases

### Use Case 1: Emotion Recognition Test

**Scenario**: Show facial expressions and ask users to identify emotions

**Implementation**:
- Use high-quality photos of facial expressions
- Position: Above question
- Size: Medium
- Include caption with context

### Use Case 2: Mindfulness Exercise

**Scenario**: Show breathing animation and ask about relaxation level

**Implementation**:
- Use looping GIF or video
- Autoplay with loop enabled
- Position: Above question
- Size: Large

### Use Case 3: Social Scenario Assessment

**Scenario**: Show video of social interaction, assess empathy

**Implementation**:
- Use MP4 video (30-60 seconds)
- No autoplay (user controls)
- Position: Above question
- Size: Full width

### Use Case 4: Visual Comparison

**Scenario**: Compare two images to assess perception

**Implementation**:
- Use two images side-by-side
- Position: Left and right
- Size: Small or medium
- Include captions

### Use Case 5: Progress Visualization

**Scenario**: Show before/after images for self-assessment

**Implementation**:
- Use multiple images
- Position: Above question
- Size: Medium
- Clear captions ("Before", "After")

---

## Migration Checklist

- [ ] Database migration created and tested
- [ ] Seeding script updated
- [ ] Static file serving configured
- [ ] Media directory created
- [ ] TypeScript types updated
- [ ] QuestionMedia component created
- [ ] InnerQuickTest component updated
- [ ] Sample media files prepared
- [ ] Test questionnaire JSON created
- [ ] Database reseeded
- [ ] Frontend tested with media
- [ ] Responsive design verified
- [ ] Performance optimized
- [ ] Documentation updated

---

## Troubleshooting

### Media Not Displaying

1. Check file path is correct
2. Verify static files are mounted correctly
3. Check browser console for 404 errors
4. Ensure media field is in database

### Performance Issues

1. Compress images/videos
2. Use lazy loading
3. Consider CDN
4. Reduce media file sizes

### Responsive Design Issues

1. Test on multiple devices
2. Use responsive size classes
3. Implement mobile-first design
4. Test with different screen orientations

---

## Future Enhancements

1. **Interactive Media**
   - Clickable hotspots on images
   - Interactive diagrams
   - 360° images

2. **Advanced Animations**
   - Lottie animations
   - CSS animations
   - Canvas-based animations

3. **Audio Support**
   - Audio clips for questions
   - Voice-over explanations
   - Sound-based assessments

4. **3D Content**
   - 3D models
   - VR/AR experiences
   - Interactive 3D scenes

5. **User-Generated Media**
   - Allow users to upload images
   - Sketch/drawing responses
   - Video responses

---

## Conclusion

This solution provides a flexible, scalable approach to adding media support to questionnaires. The implementation is:

- ✅ **Backward compatible**: Existing questionnaires work without changes
- ✅ **Flexible**: Supports multiple media types and layouts
- ✅ **Performant**: Lazy loading and optimization built-in
- ✅ **Accessible**: Alt text and captions for all media
- ✅ **Easy to use**: Simple JSON structure for content creators

Start with Phase 1 (database changes) and gradually implement the frontend components. Test thoroughly with sample media before rolling out to production questionnaires.
