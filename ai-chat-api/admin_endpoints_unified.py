# ============================================================================
# Admin Question Management Endpoints (Using Unified assessment_questions Table)
# ============================================================================

from src.database.questionnaire_models import (
    AssessmentQuestion as DBQuestion,
    AssessmentQuestionnaire as DBQuestionnaire
)


class AdminQuestionCreate(BaseModel):
    questionNumber: int  # User-defined number (1-80)
    internalTitle: str
    template: str  # F1-F8
    stem: str
    subtitle: Optional[str] = None
    category: Optional[str] = None  # NEW: Category for scoring
    tags: List[str] = []
    options: List[Dict[str, Any]] = []
    mediaUrl: Optional[str] = None
    mediaType: Optional[str] = None
    templateSettings: Dict[str, Any] = {}
    validation: Dict[str, Any] = {"required": True}
    order: int = 0


class AdminQuestionUpdate(BaseModel):
    internalTitle: Optional[str] = None
    template: Optional[str] = None
    status: Optional[str] = None
    stem: Optional[str] = None
    subtitle: Optional[str] = None
    category: Optional[str] = None  # NEW: Category for scoring
    tags: Optional[List[str]] = None
    options: Optional[List[Dict[str, Any]]] = None
    mediaUrl: Optional[str] = None
    mediaType: Optional[str] = None
    templateSettings: Optional[Dict[str, Any]] = None
    validation: Optional[Dict[str, Any]] = None
    order: Optional[int] = None


@app.get("/api/admin/questions")
def get_admin_questions(db: Session = Depends(get_db)):
    """
    Get all admin-created questions from unified assessment_questions table
    Returns list of questions with all details
    """
    try:
        # Get only admin-created questions
        questions = db.query(DBQuestion).filter(
            DBQuestion.source_type == 'admin'
        ).order_by(DBQuestion.display_order).all()

        result = []
        for q in questions:
            result.append({
                "id": q.question_number,  # Use question_number as the ID for admin panel
                "internalTitle": q.internal_title or q.text[:50],
                "template": q.template or "F1",
                "status": q.status or "published",
                "stem": q.text,
                "subtitle": q.subtitle,
                "category": q.category,  # NEW: Include category
                "tags": q.tags or [],
                "options": q.options or [],
                "mediaUrl": q.media_url,
                "mediaType": q.media_type,
                "templateSettings": q.template_settings or {},
                "validation": q.validation or {"required": True},
                "order": q.display_order or 0,
                "createdAt": q.created_at.isoformat() if q.created_at else None,
                "updatedAt": q.updated_at.isoformat() if q.updated_at else None
            })

        logger.info(f"Returning {len(result)} admin questions")
        return {"ok": True, "questions": result}

    except Exception as e:
        logger.error(f"Error getting admin questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/questions/{question_number}")
def get_admin_question(question_number: int, db: Session = Depends(get_db)):
    """
    Get a specific admin question by question_number
    """
    try:
        question = db.query(DBQuestion).filter(
            DBQuestion.question_number == question_number,
            DBQuestion.source_type == 'admin'
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")

        return {
            "ok": True,
            "question": {
                "id": question.question_number,
                "internalTitle": question.internal_title or question.text[:50],
                "template": question.template or "F1",
                "status": question.status or "published",
                "stem": question.text,
                "subtitle": question.subtitle,
                "category": question.category,  # NEW: Include category
                "tags": question.tags or [],
                "options": question.options or [],
                "mediaUrl": question.media_url,
                "mediaType": question.media_type,
                "templateSettings": question.template_settings or {},
                "validation": question.validation or {"required": True},
                "order": question.display_order or 0,
                "createdAt": question.created_at.isoformat() if question.created_at else None,
                "updatedAt": question.updated_at.isoformat() if question.updated_at else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting admin question {question_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/questions")
def create_admin_question(question: AdminQuestionCreate, db: Session = Depends(get_db)):
    """
    Create a new admin question in unified assessment_questions table
    """
    try:
        # Check if question_number already exists for admin questions
        existing = db.query(DBQuestion).filter(
            DBQuestion.question_number == question.questionNumber,
            DBQuestion.source_type == 'admin'
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Question with number {question.questionNumber} already exists"
            )

        # Ensure admin_created questionnaire exists
        questionnaire_id = "admin_created"
        admin_questionnaire = db.query(DBQuestionnaire).filter(
            DBQuestionnaire.id == questionnaire_id
        ).first()

        if not admin_questionnaire:
            # Create admin_created questionnaire
            admin_questionnaire = DBQuestionnaire(
                id=questionnaire_id,
                section="admin",
                title="Admin Created Questions",
                marking_criteria={}
            )
            db.add(admin_questionnaire)
            db.flush()

        # Create question
        db_question = DBQuestion(
            questionnaire_id=questionnaire_id,
            question_number=question.questionNumber,
            text=question.stem,
            internal_title=question.internalTitle,
            template=question.template,
            status='draft',
            subtitle=question.subtitle,
            category=question.category,  # NEW: Set category
            options=question.options,
            media_url=question.mediaUrl,
            media_type=question.mediaType,
            template_settings=question.templateSettings,
            validation=question.validation,
            tags=question.tags,
            display_order=question.order,
            source_type='admin'
        )

        db.add(db_question)
        db.commit()
        db.refresh(db_question)

        logger.info(f"Created admin question with number {db_question.question_number}")

        return {
            "ok": True,
            "message": "Question created successfully",
            "question": {
                "id": db_question.question_number,
                "internalTitle": db_question.internal_title,
                "template": db_question.template,
                "status": db_question.status,
                "stem": db_question.text,
                "subtitle": db_question.subtitle,
                "category": db_question.category,  # NEW: Include category
                "tags": db_question.tags or [],
                "options": db_question.options or [],
                "mediaUrl": db_question.media_url,
                "mediaType": db_question.media_type,
                "templateSettings": db_question.template_settings or {},
                "validation": db_question.validation or {"required": True},
                "order": db_question.display_order,
                "createdAt": db_question.created_at.isoformat(),
                "updatedAt": db_question.updated_at.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating admin question: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/admin/questions/{question_number}")
def update_admin_question(
    question_number: int,
    updates: AdminQuestionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing admin question
    """
    try:
        question = db.query(DBQuestion).filter(
            DBQuestion.question_number == question_number,
            DBQuestion.source_type == 'admin'
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")

        # Update fields if provided
        if updates.internalTitle is not None:
            question.internal_title = updates.internalTitle
        if updates.template is not None:
            question.template = updates.template
        if updates.status is not None:
            question.status = updates.status
        if updates.stem is not None:
            question.text = updates.stem
        if updates.subtitle is not None:
            question.subtitle = updates.subtitle
        if updates.category is not None:
            question.category = updates.category  # NEW: Update category
        if updates.tags is not None:
            question.tags = updates.tags
        if updates.options is not None:
            question.options = updates.options
        if updates.mediaUrl is not None:
            question.media_url = updates.mediaUrl
        if updates.mediaType is not None:
            question.media_type = updates.mediaType
        if updates.templateSettings is not None:
            question.template_settings = updates.templateSettings
        if updates.validation is not None:
            question.validation = updates.validation
        if updates.order is not None:
            question.display_order = updates.order

        # Update timestamp
        question.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(question)

        logger.info(f"Updated admin question {question_number}")

        return {
            "ok": True,
            "message": "Question updated successfully",
            "question": {
                "id": question.question_number,
                "internalTitle": question.internal_title,
                "template": question.template,
                "status": question.status,
                "stem": question.text,
                "subtitle": question.subtitle,
                "category": question.category,  # NEW: Include category in response
                "tags": question.tags or [],
                "options": question.options or [],
                "mediaUrl": question.media_url,
                "mediaType": question.media_type,
                "templateSettings": question.template_settings or {},
                "validation": question.validation or {"required": True},
                "order": question.display_order,
                "createdAt": question.created_at.isoformat(),
                "updatedAt": question.updated_at.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating admin question {question_number}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/questions/{question_number}")
def delete_admin_question(question_number: int, db: Session = Depends(get_db)):
    """
    Delete an admin question
    """
    try:
        question = db.query(DBQuestion).filter(
            DBQuestion.question_number == question_number,
            DBQuestion.source_type == 'admin'
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")

        db.delete(question)
        db.commit()

        logger.info(f"Deleted admin question {question_number}")

        return {
            "ok": True,
            "message": "Question deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting admin question {question_number}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/questions/{question_number}/publish")
def publish_admin_question(question_number: int, db: Session = Depends(get_db)):
    """
    Publish an admin question (change status from draft to published)
    """
    try:
        question = db.query(DBQuestion).filter(
            DBQuestion.question_number == question_number,
            DBQuestion.source_type == 'admin'
        ).first()

        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_number} not found")

        question.status = 'published'
        question.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(question)

        logger.info(f"Published admin question {question_number}")

        return {
            "ok": True,
            "message": "Question published successfully",
            "question": {
                "id": question.question_number,
                "status": question.status
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error publishing admin question {question_number}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
