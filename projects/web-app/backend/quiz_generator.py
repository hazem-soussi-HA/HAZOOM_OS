"""
Hazoom Quiz Generator Module
Integrates open-source LLM for intelligent quiz generation
"""

import json
import random
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from unified_model.unified_intelligent_model import UnifiedIntelligentModel, create_unified_model
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False

@dataclass
class QuizQuestion:
    """Represents a single quiz question"""
    question: str
    options: List[str]
    correct_answer: int  # Index of correct option
    explanation: str
    difficulty: str  # "easy", "medium", "hard"
    topic: str
    subtopic: str

@dataclass
class Quiz:
    """Represents a complete quiz"""
    id: str
    title: str
    description: str
    topic: str
    difficulty: str
    questions: List[QuizQuestion]
    time_limit: int  # minutes
    created_at: str
    total_points: int

class QuizGenerator:
    """Advanced quiz generator using LLM integration"""

    def __init__(self):
        self.llm_model = None
        if LLM_AVAILABLE:
            try:
                self.llm_model = create_unified_model("super_intelligent", "educational")
            except:
                self.llm_model = None

        # Pre-defined quiz templates for different subjects
        self.quiz_templates = {
            "cosmology": {
                "topics": ["Big Bang", "Black Holes", "Dark Matter", "Galaxies", "Cosmic Microwave Background"],
                "difficulty_levels": {
                    "easy": ["basic concepts", "simple explanations"],
                    "medium": ["intermediate theories", "mathematical relationships"],
                    "hard": ["advanced cosmology", "quantum gravity", "multiverse theory"]
                }
            },
            "freedom_studies": {
                "topics": ["Human Rights", "Critical Thinking", "Philosophy of Liberty", "Democracy", "Intellectual Freedom"],
                "difficulty_levels": {
                    "easy": ["basic definitions", "historical context"],
                    "medium": ["philosophical debates", "modern applications"],
                    "hard": ["advanced philosophy", "ethical dilemmas", "policy analysis"]
                }
            },
            "physics": {
                "topics": ["Quantum Mechanics", "Relativity", "Thermodynamics", "Electromagnetism"],
                "difficulty_levels": {
                    "easy": ["basic principles", "everyday applications"],
                    "medium": ["mathematical formulations", "experimental evidence"],
                    "hard": ["advanced theories", "unified field theory", "quantum gravity"]
                }
            },
            "philosophy": {
                "topics": ["Ethics", "Epistemology", "Metaphysics", "Political Philosophy"],
                "difficulty_levels": {
                    "easy": ["basic concepts", "famous philosophers"],
                    "medium": ["philosophical arguments", "thought experiments"],
                    "hard": ["advanced metaphysics", "philosophical paradoxes", "contemporary debates"]
                }
            }
        }

    async def generate_quiz(self, topic: str, difficulty: str = "medium",
                          num_questions: int = 10, time_limit: int = 15) -> Quiz:
        """Generate a complete quiz using LLM integration"""

        quiz_id = f"quiz_{topic}_{difficulty}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Generate quiz title and description
        title = await self._generate_quiz_title(topic, difficulty)
        description = await self._generate_quiz_description(topic, difficulty)

        # Generate questions
        questions = []
        for i in range(num_questions):
            question = await self._generate_question(topic, difficulty, i + 1)
            if question:
                questions.append(question)

        # Calculate total points
        total_points = sum(self._calculate_question_points(q.difficulty) for q in questions)

        return Quiz(
            id=quiz_id,
            title=title,
            description=description,
            topic=topic,
            difficulty=difficulty,
            questions=questions,
            time_limit=time_limit,
            created_at=datetime.now().isoformat(),
            total_points=total_points
        )

    async def _generate_quiz_title(self, topic: str, difficulty: str) -> str:
        """Generate an engaging quiz title"""
        if self.llm_model:
            prompt = f"Generate an engaging, educational title for a {difficulty} level quiz about {topic}. Make it inspiring and relevant to learning."
            try:
                response = self.llm_model.process_input(prompt, "quiz_generator")
                return response.get("response", f"{topic.title()} {difficulty.title()} Quiz")
            except:
                pass

        # Fallback titles
        titles = {
            "cosmology": {
                "easy": "Journey Through the Cosmos",
                "medium": "Exploring the Universe",
                "hard": "Advanced Cosmological Concepts"
            },
            "freedom_studies": {
                "easy": "Understanding Freedom",
                "medium": "Philosophy of Liberty",
                "hard": "Advanced Freedom Studies"
            }
        }

        return titles.get(topic, {}).get(difficulty, f"{topic.title()} {difficulty.title()} Quiz")

    async def _generate_quiz_description(self, topic: str, difficulty: str) -> str:
        """Generate quiz description"""
        descriptions = {
            "cosmology": {
                "easy": "Discover the wonders of the universe through fundamental concepts of cosmology and astronomy.",
                "medium": "Dive deeper into the mysteries of space, time, and cosmic phenomena.",
                "hard": "Challenge your understanding of advanced cosmological theories and quantum gravity."
            },
            "freedom_studies": {
                "easy": "Learn about the foundations of human freedom and democratic principles.",
                "medium": "Explore philosophical debates about liberty, rights, and societal organization.",
                "hard": "Analyze complex ethical dilemmas and policy implications of freedom in modern society."
            }
        }

        return descriptions.get(topic, {}).get(difficulty,
            f"Test your knowledge of {topic} at {difficulty} level.")

    async def _generate_question(self, topic: str, difficulty: str, question_num: int) -> Optional[QuizQuestion]:
        """Generate a single quiz question using LLM"""

        if self.llm_model:
            prompt = f"""Generate a {difficulty} level multiple-choice question about {topic}.
            Format as JSON with these fields:
            - question: the question text
            - options: array of 4 options (A, B, C, D)
            - correct_answer: index of correct option (0-3)
            - explanation: detailed explanation of the answer
            - subtopic: specific subtopic within {topic}

            Make it educational and accurate. Focus on key concepts."""

            try:
                response = self.llm_model.process_input(prompt, "quiz_generator")
                response_text = response.get("response", "")

                # Try to parse JSON from response
                try:
                    # Extract JSON from response (LLM might add extra text)
                    json_start = response_text.find('{')
                    json_end = response_text.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        json_str = response_text[json_start:json_end]
                        data = json.loads(json_str)

                        return QuizQuestion(
                            question=data.get("question", "Question not generated"),
                            options=data.get("options", ["A", "B", "C", "D"]),
                            correct_answer=data.get("correct_answer", 0),
                            explanation=data.get("explanation", "Explanation not provided"),
                            difficulty=difficulty,
                            topic=topic,
                            subtopic=data.get("subtopic", topic)
                        )
                except json.JSONDecodeError:
                    pass
            except:
                pass

        # Fallback: Generate question manually
        return self._generate_fallback_question(topic, difficulty, question_num)

    def _generate_fallback_question(self, topic: str, difficulty: str, question_num: int) -> QuizQuestion:
        """Generate fallback questions when LLM is not available"""

        questions = {
            "cosmology": {
                "easy": [
                    {
                        "question": "What is the approximate age of the universe?",
                        "options": ["4.5 billion years", "13.8 billion years", "100 billion years", "1 trillion years"],
                        "correct_answer": 1,
                        "explanation": "The universe is approximately 13.8 billion years old, as determined by measurements of the cosmic microwave background radiation.",
                        "subtopic": "Big Bang"
                    }
                ],
                "medium": [
                    {
                        "question": "What phenomenon provides evidence for the Big Bang theory?",
                        "options": ["Solar flares", "Cosmic microwave background", "Black holes", "Dark energy"],
                        "correct_answer": 1,
                        "explanation": "The cosmic microwave background (CMB) is the afterglow of the Big Bang, providing strong evidence for the theory.",
                        "subtopic": "Cosmic Microwave Background"
                    }
                ]
            },
            "freedom_studies": {
                "easy": [
                    {
                        "question": "What is the basic definition of freedom?",
                        "options": ["Ability to do anything", "Absence of constraints", "Personal liberty with responsibility", "Government control"],
                        "correct_answer": 2,
                        "explanation": "Freedom involves personal liberty while respecting the rights of others and societal responsibilities.",
                        "subtopic": "Human Rights"
                    }
                ]
            }
        }

        topic_questions = questions.get(topic, {}).get(difficulty, [])
        if topic_questions:
            question_data = random.choice(topic_questions)
            return QuizQuestion(
                question=question_data["question"],
                options=question_data["options"],
                correct_answer=question_data["correct_answer"],
                explanation=question_data["explanation"],
                difficulty=difficulty,
                topic=topic,
                subtopic=question_data["subtopic"]
            )

        # Ultimate fallback
        return QuizQuestion(
            question=f"Sample question {question_num} about {topic}",
            options=["Option A", "Option B", "Option C", "Option D"],
            correct_answer=0,
            explanation="This is a sample explanation.",
            difficulty=difficulty,
            topic=topic,
            subtopic=topic
        )

    def _calculate_question_points(self, difficulty: str) -> int:
        """Calculate points for a question based on difficulty"""
        points = {"easy": 10, "medium": 15, "hard": 20}
        return points.get(difficulty, 10)

    async def generate_topic_quiz(self, topic: str, subtopics: Optional[List[str]] = None) -> Quiz:
        """Generate a quiz covering specific subtopics"""
        # Implementation for topic-specific quiz generation
        if subtopics is None:
            subtopics = []

        # Generate quiz with specific subtopics
        quiz = await self.generate_quiz(topic, "medium", 10, 20)
        return quiz

    def save_quiz(self, quiz: Quiz, filename: Optional[str] = None) -> str:
        """Save quiz to JSON file"""
        if not filename:
            filename = f"quiz_{quiz.id}.json"

        quiz_data = {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "topic": quiz.topic,
            "difficulty": quiz.difficulty,
            "time_limit": quiz.time_limit,
            "total_points": quiz.total_points,
            "created_at": quiz.created_at,
            "questions": [
                {
                    "question": q.question,
                    "options": q.options,
                    "correct_answer": q.correct_answer,
                    "explanation": q.explanation,
                    "difficulty": q.difficulty,
                    "topic": q.topic,
                    "subtopic": q.subtopic
                }
                for q in quiz.questions
            ]
        }

        filepath = os.path.join(os.path.dirname(__file__), "quizzes", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(quiz_data, f, indent=2, ensure_ascii=False)

        return filepath

    def load_quiz(self, quiz_id: str) -> Optional[Quiz]:
        """Load quiz from file"""
        filepath = os.path.join(os.path.dirname(__file__), "quizzes", f"quiz_{quiz_id}.json")

        if not os.path.exists(filepath):
            return None

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        questions = [
            QuizQuestion(**q) for q in data["questions"]
        ]

        return Quiz(
            id=data["id"],
            title=data["title"],
            description=data["description"],
            topic=data["topic"],
            difficulty=data["difficulty"],
            questions=questions,
            time_limit=data["time_limit"],
            created_at=data["created_at"],
            total_points=data["total_points"]
        )

# Global quiz generator instance
quiz_generator = QuizGenerator()

# Example usage
if __name__ == "__main__":
    async def test_quiz_generation():
        print("Testing Quiz Generation...")

        # Generate a cosmology quiz
        quiz = await quiz_generator.generate_quiz("cosmology", "medium", 5)
        print(f"Generated quiz: {quiz.title}")
        print(f"Questions: {len(quiz.questions)}")
        print(f"Total points: {quiz.total_points}")

        # Save the quiz
        filepath = quiz_generator.save_quiz(quiz)
        print(f"Quiz saved to: {filepath}")

        # Test loading
        loaded_quiz = quiz_generator.load_quiz(quiz.id)
        if loaded_quiz:
            print(f"Successfully loaded quiz: {loaded_quiz.title}")

    asyncio.run(test_quiz_generation())