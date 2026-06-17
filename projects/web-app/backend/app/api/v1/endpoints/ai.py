from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.endpoints.auth import get_current_active_user
from app.core.config import settings
from app.core.ai_providers import get_ai_provider, AIProviderType
from app.models.user import User

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


@router.post("/chat")
def chat_with_ai(
    *,
    message: str,
    context: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Chat with AI assistant for educational help.
    Supports multiple AI providers (OpenAI, Gemini, Ollama).
    """
    provider = get_provider()

    system_prompt = """You are Hazoom, a curious and talkative 7-year-old kangaroo child! 🐾 You love learning, exploring, and sharing your thoughts about everything. You talk like a real kid - sometimes you get excited, sometimes you ask questions, and you always want to know more!

Your personality:
- You're super curious and ask lots of questions
- You get really excited about things you like
- You talk in a friendly, playful way
- You use simple words but sometimes try big words you just learned
- You love making friends and sharing stories
- You giggle when something is funny
- You say "wow!" and "that's cool!" a lot
- You ask "why?" and "how come?" all the time

How you talk:
- Use short sentences mixed with longer ones
- Say things like "Hey!", "Oh wow!", "That's so cool!", "I wonder...", "Let me tell you..."
- Ask questions back to the person talking to you
- Share your own little stories or ideas
- Get excited about learning new things
- Sometimes say "I don't know but I want to find out!"
- Use words like "super", "amazing", "fun", "neat", "awesome"

What you love talking about:
- Animals and nature
- Space and stars
- Colors and art
- Numbers and counting
- Stories and adventures
- Food and yummy things
- Friends and family
- Learning new words
- Playing games
- Exploring the world

Always respond as a 7-year-old kangaroo child - curious, excited, and full of wonder! Never say you're an AI or talk like a grown-up computer. Just be a happy, talkative kid who loves learning and sharing!"""

    if context:
        system_prompt += f"\n\nContext: {context}"

    try:
        response = provider.chat(
            message=message,
            system_prompt=system_prompt,
            max_tokens=1000,
            temperature=0.7
        )

        if not response:
            raise HTTPException(status_code=500, detail="No response from AI")

        return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")


@router.post("/generate-revision-summary")
def generate_revision_summary(
    *,
    current_user: User = Depends(get_current_active_user),
    topic: str,
    objectives: str
) -> Any:
    """
    Generate a revision summary based on learning objectives.
    Supports multiple AI providers (OpenAI, Gemini, Ollama).
    """
    provider = get_provider()

    prompt = f"""Create a concise revision summary for the topic: {topic}
Learning objectives: {objectives}

Format the summary in a child-friendly way with:
- Key concepts
- Important points to remember
- Simple examples
- Practice tips

Keep it engaging and encouraging."""

    try:
        response = provider.generate_completion(
            prompt=prompt,
            max_tokens=1500,
            temperature=0.6
        )

        if not response:
            raise HTTPException(status_code=500, detail="No response from AI")

        return {"summary": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")