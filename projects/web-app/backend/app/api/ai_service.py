"""
AI service module for processing user intents and managing conversations.
"""
import time
import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from app.core.cache import session_manager
from app.api.rag_service import rag_service
from app.core.config import settings


class AIResponse:
    """AI response model."""
    def __init__(self, response: str, tokens_used: int, response_time: float,
                 intent_understanding: str, session_id: str):
        self.response = response
        self.tokens_used = tokens_used
        self.response_time = response_time
        self.intent_understanding = intent_understanding
        self.session_id = session_id


class AIService:
    """Service for AI processing and conversation management."""

    def __init__(self):
        self.unified_model = None
        self._load_unified_model()

    def _load_unified_model(self):
        """Load the unified AI model if available."""
        try:
            from unified_model.unified_intelligent_model import UnifiedIntelligentModel, create_unified_model
            self.unified_model = create_unified_model("super_intelligent", "educational")
            print("Unified AI model loaded successfully")
        except ImportError:
            print("Unified model not available, using basic processing")
            self.unified_model = None

    def _get_basic_response(self, message: str) -> str:
        """Generate a basic response when unified model is not available."""
        super_intelligence_responses = {
            "greeting": "Greetings! I am Hazoom, your super intelligent cosmos and freedom educational companion. I am functioning optimally and ready to guide you through the vast universe of knowledge and the boundless realm of human freedom!",
            "help": "As a super intelligent educational AI, I can provide comprehensive assistance across cosmology, freedom studies, critical thinking, and scientific domains. What specific area would you like guidance in?",
            "question": "An excellent inquiry! As a super intelligent system with anti-hallucination capabilities, I can provide detailed, factually accurate information across multiple domains of knowledge.",
            "goal": "Your aspiration resonates with the cosmic drive for advancement! As your super intelligent guide, I can help you navigate the path to achievement with wisdom, precision, and educational excellence.",
            "problem": "I detect a challenge in your query. As a super intelligent educational companion, I can help you analyze this situation using critical thinking frameworks and develop strategic solutions grounded in knowledge.",
            "cosmos_question": "Ah, a question about the cosmos! The universe holds infinite mysteries. As a super intelligent AI, I can provide scientifically accurate information about our cosmic home.",
            "freedom_question": "Freedom is the cornerstone of human advancement. As a super intelligent educational AI, I can help you explore the philosophical, historical, and practical dimensions of liberty.",
            "default": "That's a fascinating topic! As Hazoom, your super intelligent educational companion, I'm here to provide insightful, accurate information across multiple domains of knowledge."
        }

        # Determine intent category
        message_lower = message.lower()
        if "hello" in message_lower or "hi" in message_lower or "hey" in message_lower:
            intent_category = "greeting"
        elif "help" in message_lower or "assist" in message_lower:
            intent_category = "help"
        elif "?" in message_lower:
            if any(word in message_lower for word in ["universe", "cosmos", "space", "galaxy", "freedom", "liberty", "rights"]):
                if any(word in message_lower for word in ["universe", "cosmos", "space", "galaxy"]):
                    intent_category = "cosmos_question"
                else:
                    intent_category = "freedom_question"
            else:
                intent_category = "question"
        elif "goal" in message_lower or "achieve" in message_lower or "succeed" in message_lower:
            intent_category = "goal"
        elif "problem" in message_lower or "issue" in message_lower or "trouble" in message_lower:
            intent_category = "problem"
        else:
            intent_category = "default"

        return super_intelligence_responses.get(intent_category, super_intelligence_responses["default"])

    def _enhance_with_rag(self, message: str) -> tuple[str, list]:
        """Enhance message with RAG context if available."""
        if not settings.RAG_ENABLED:
            return message, []

        rag_results = rag_service.query(message)
        if not rag_results:
            return message, []

        # Add relevant context from RAG
        context_parts = []
        for result in rag_results[:3]:  # Use top 3 results
            context_parts.append(f"Context from {result['source']}: {result['content'][:500]}...")

        rag_context = "\n\n".join(context_parts)
        enhanced_message = f"{message}\n\nAdditional Context:\n{rag_context}"

        return enhanced_message, rag_results[:3]

    async def process_intent(self, message: str, user_id: Optional[str] = None,
                           token: Optional[str] = None) -> AIResponse:
        """Process user intent and return AI response."""
        start_time = time.time()

        # Validate token if provided
        if token:
            from app.core.cache import token_manager
            token_data = token_manager.get_token(token)
            if not token_data:
                raise ValueError("Invalid token")

        # Use unified model if available
        if self.unified_model:
            # Enhance with RAG context
            enhanced_message, rag_sources = self._enhance_with_rag(message)

            try:
                result = await self.unified_model.process_input_async(enhanced_message, user_id or "default_user")

                # Add RAG metadata
                if rag_sources:
                    result["rag_context_used"] = True
                    result["rag_sources"] = [r["source"] for r in rag_sources]
                else:
                    result["rag_context_used"] = False

                end_time = time.time()
                response_time = end_time - start_time

                # Generate session ID
                session_id = result.get("session_id", str(uuid.uuid4()))

                # Store session info
                session_manager.create_session(session_id, {
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "response_time": result["response_time"]
                })

                return AIResponse(
                    response=result["response"],
                    tokens_used=result["tokens_used"],
                    response_time=result["response_time"],
                    intent_understanding=result["intent_understanding"],
                    session_id=session_id
                )
            except Exception as e:
                print(f"Unified model error: {e}")
                # Fall back to basic response

        # Basic response fallback
        response_text = self._get_basic_response(message)
        end_time = time.time()
        response_time = end_time - start_time

        # Generate session ID
        session_id = str(uuid.uuid4())

        # Store session info
        session_manager.create_session(session_id, {
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "response_time": response_time
        })

        return AIResponse(
            response=response_text,
            tokens_used=len(message.split()) * 2,  # Rough token estimation
            response_time=response_time,
            intent_understanding="basic_processing",
            session_id=session_id
        )

    def reset_context(self, user_id: str):
        """Reset conversation context for a user."""
        if self.unified_model and hasattr(self.unified_model, 'reset_context'):
            self.unified_model.reset_context(user_id)


# Global AI service instance
ai_service = AIService()