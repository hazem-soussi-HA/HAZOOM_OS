import json
import re
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_active_user
# from app.core.config import settings
from app.core.config import get_settings

settings = get_settings()
from app.core.ai_providers import get_ai_provider, AIProviderType
from app.core.database import get_db
from app.models.quiz import Quiz as QuizModel, Question as QuestionModel
from app.models.user import User
from app.schemas.quiz import QuizCreate, QuizUpdate, Quiz as QuizSchema, QuestionCreate, Question as QuestionSchema

router = APIRouter()


def get_provider():
    """Get the configured AI provider based on settings"""
    if settings.DEFAULT_AI_PROVIDER == "openai":
        if not settings.OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        return get_ai_provider(
            AIProviderType.OPENAI,
            api_key=settings.OPENAI_API_KEY,
            model=settings.DEFAULT_MODEL
        )
    elif settings.DEFAULT_AI_PROVIDER == "gemini":
        if not settings.GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        return get_ai_provider(
            AIProviderType.GEMINI,
            api_key=settings.GEMINI_API_KEY,
            model=settings.DEFAULT_MODEL
        )
    elif settings.DEFAULT_AI_PROVIDER == "ollama":
        return get_ai_provider(
            AIProviderType.OLLAMA,
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.DEFAULT_MODEL
        )
    else:
        raise HTTPException(status_code=500, detail=f"Unsupported AI provider: {settings.DEFAULT_AI_PROVIDER}")


@router.get("/", response_model=List[QuizSchema])
def read_quizzes(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
) -> Any:

    return db.query(QuizModel).filter(QuizModel.user_id == current_user.id).all()


@router.post("/", response_model=QuizSchema)
def create_quiz(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    quiz_in: QuizCreate
) -> Any:
    """
    Create new quiz.
    """
    quiz = QuizModel(
        title=quiz_in.title,
        subject=quiz_in.subject,
        user_id=current_user.id
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    if quiz_in.questions:
        for q in quiz_in.questions:
            question = QuestionModel(
                question_text=q.question_text,
                options=q.options,
                correct_answer=q.correct_answer,
                quiz_id=quiz.id
            )
            db.add(question)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/{quiz_id}", response_model=QuizSchema)
def read_quiz(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    quiz_id: int
) -> Any:
    """
    Get quiz by ID.
    """
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id, QuizModel.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.put("/{quiz_id}", response_model=QuizSchema)
def update_quiz(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    quiz_id: int,
    quiz_in: QuizUpdate
) -> Any:
    """
    Update a quiz.
    """
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id, QuizModel.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    update_data = quiz_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(quiz, field, value)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.delete("/{quiz_id}")
def delete_quiz(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    quiz_id: int
) -> Any:
    """
    Delete a quiz.
    """
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id, QuizModel.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}


@router.post("/{quiz_id}/questions", response_model=QuestionSchema)
def create_question(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    quiz_id: int,
    question_in: QuestionCreate
) -> Any:
    """
    Create a question for a quiz.
    """
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id, QuizModel.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    question = QuestionModel(
        question_text=question_in.question_text,
        options=json.dumps(question_in.options),
        correct_answer=question_in.correct_answer,
        quiz_id=quiz_id,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/{quiz_id}/questions", response_model=List[QuestionSchema])
def read_questions(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    quiz_id: int
) -> Any:
    """
    Get questions for a quiz.
    """
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id, QuizModel.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return db.query(QuestionModel).filter(QuestionModel.quiz_id == quiz_id).all()


@router.post("/generate", response_model=QuizSchema)
def generate_quiz(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    subject: str,
    num_questions: int = 5
) -> Any:
    """
    Generate a quiz using AI provider (OpenAI, Gemini, or Ollama).
    """
    provider = get_provider()

    prompt = f"Generate a quiz with {num_questions} multiple-choice questions on the subject: {subject}. Each question should have 4 options (A, B, C, D) and one correct answer. Format as JSON with structure: {{'title': 'Quiz Title', 'questions': [{{'question': 'Question text', 'options': ['A. option1', 'B. option2', 'C. option3', 'D. option4'], 'correct_answer': 'A'}}]}}"

    try:
        response = provider.generate_completion(
            prompt=prompt,
            max_tokens=2000,
            temperature=0.7
        )

        if not response:
            raise HTTPException(status_code=500, detail="No response from AI")
        
        # Extract JSON from response if needed (in case of extra text)
        # Look for JSON between curly braces
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            quiz_data = json.loads(json_match.group())
        else:
            quiz_data = json.loads(response.strip())
        
        # Create quiz
        quiz = QuizModel(
            title=quiz_data.get('title', f"{subject} Quiz"),
            subject=subject,
            user_id=current_user.id
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        for q_data in quiz_data.get('questions', []):
            question = QuestionModel(
                question_text=q_data['question'],
                options=json.dumps(q_data['options']),
                correct_answer=q_data['correct_answer'],
                quiz_id=quiz.id
            )
            db.add(question)
        db.commit()
        db.refresh(quiz)
        return quiz
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON response from AI provider")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")