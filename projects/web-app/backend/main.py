from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import uuid
import jwt

import time
import json
from datetime import datetime, timedelta
import secrets
import hashlib
import os

# Conditional imports for RAG system
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("sentence-transformers not available - RAG disabled")

try:
    from chromadb.config import Settings
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    print("chromadb not available - RAG disabled")

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("langchain not available - RAG disabled")

app = FastAPI(
    title="Hazoom Super Intelligence Cosmos & Freedom Educational Model",
    description="Super intelligent educational AI for cosmos and freedom studies with anti-hallucination capabilities and quantum-fast responses",
    version="4.0.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080,http://localhost:8002").split(","),  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import storage system
from storage import FileStorage
from config_loader import load_config, get_storage
from swiss_integration import SwissEdTechManager, SwissStudentRegistration, SwissMathHelpRequest

# Load config and initialize storage
config_path = os.getenv('CONFIG_PATH', os.path.join(os.path.dirname(__file__), '..', 'config.json'))
config = load_config(config_path)
storage = get_storage(config)

# Initialize Swiss EdTech manager
swiss_manager = SwissEdTechManager()

# Token storage using persistent storage
tokens_db = storage.load('tokens') or {}
# In-memory storage for active sessions (could also be persisted)
active_sessions = storage.load('active_sessions') or {}

def save_tokens():
    storage.save('tokens', tokens_db)

def save_sessions():
    storage.save('active_sessions', active_sessions)

# RAG (Retrieval-Augmented Generation) setup
RAG_ENABLED = os.getenv('RAG_ENABLED', 'false').lower() == 'true'  # Disabled by default for now
RAG_MODEL_NAME = os.getenv('RAG_MODEL_NAME', 'all-MiniLM-L6-v2')
RAG_TOP_K = int(os.getenv('RAG_TOP_K', '5'))
RAG_SCORE_THRESHOLD = float(os.getenv('RAG_SCORE_THRESHOLD', '0.5'))
RAG_DATA_PATH = os.getenv('RAG_DATA_PATH', os.path.join(os.path.dirname(__file__), '..', 'data'))
RAG_COLLECTION_NAME = os.getenv('RAG_COLLECTION_NAME', 'hazoom_rag')

# Initialize RAG components
rag_embedding_model = None
rag_chroma_client = None
rag_collection = None

def initialize_rag():
    """Initialize RAG components"""
    global rag_embedding_model, rag_chroma_client, rag_collection, RAG_ENABLED

    if not RAG_ENABLED:
        print("RAG system disabled - running in basic mode")
        return

    try:
        # Initialize embedding model
        from sentence_transformers import SentenceTransformer
        rag_embedding_model = SentenceTransformer(RAG_MODEL_NAME)

        # Initialize ChromaDB client
        import chromadb
        chroma_host = os.getenv('CHROMA_HOST', 'localhost')
        chroma_port = int(os.getenv('CHROMA_PORT', '8000'))

        rag_chroma_client = chromadb.HttpClient(host=chroma_host, port=chroma_port)

        # Get or create collection
        try:
            rag_collection = rag_chroma_client.get_collection(RAG_COLLECTION_NAME)
        except:
            rag_collection = rag_chroma_client.create_collection(RAG_COLLECTION_NAME)

        print(f"RAG initialized successfully with collection: {RAG_COLLECTION_NAME}")

    except Exception as e:
        print(f"Failed to initialize RAG: {str(e)}")
        RAG_ENABLED = False

# Initialize RAG on startup
initialize_rag()

# Auto-load educational datasets on startup
def load_educational_datasets_on_startup():
    """Load educational datasets into RAG on application startup"""
    import glob
    import os

    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    if not os.path.exists(data_dir):
        print("Data directory not found, skipping educational dataset loading")
        return

    pattern = os.path.join(data_dir, '**', '*.txt')
    txt_files = glob.glob(pattern, recursive=True)

    if not txt_files:
        print("No educational datasets found")
        return

    print(f"Loading {len(txt_files)} educational datasets...")

    for file_path in txt_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            relative_path = os.path.relpath(file_path, data_dir)
            subject = relative_path.split(os.sep)[0]

            metadata = {
                "subject": subject,
                "file_type": "educational_content",
                "source_type": "text_file",
                "topic": os.path.splitext(os.path.basename(file_path))[0].replace('_', ' ')
            }

            add_document_to_rag(file_path, content, metadata)
            print(f"OK: Loaded {os.path.basename(file_path)}")

        except Exception as e:
            print(f"ERROR: Error loading {file_path}: {str(e)}")

    print("Educational datasets loaded successfully!")

# Load educational datasets on startup (moved to after function definitions)
# load_educational_datasets_on_startup()

def add_document_to_rag(file_path: str, content: str, metadata: dict = None):
    """Add a document to the RAG system"""
    if not RAG_ENABLED or not rag_collection or not SENTENCE_TRANSFORMERS_AVAILABLE or not LANGCHAIN_AVAILABLE:
        return

    try:
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(content)

        # Generate embeddings and add to collection
        embeddings = rag_embedding_model.encode(chunks).tolist()

        # Create IDs and metadata
        ids = [f"{file_path}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": file_path, "chunk_index": i, **(metadata or {})} for i in range(len(chunks))]

        rag_collection.add(
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )

        print(f"Added {len(chunks)} chunks from {file_path} to RAG")

    except Exception as e:
        print(f"Failed to add document to RAG: {str(e)}")

def query_rag(query: str, top_k: int = None) -> List[dict]:
    """Query the RAG system for relevant documents"""
    if not RAG_ENABLED or not rag_collection or not rag_embedding_model or not SENTENCE_TRANSFORMERS_AVAILABLE:
        return []

    try:
        top_k = top_k or RAG_TOP_K
        query_embedding = rag_embedding_model.encode([query]).tolist()[0]

        results = rag_collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=['documents', 'metadatas', 'distances']
        )

        # Filter by score threshold and format results
        filtered_results = []
        for i, (doc, metadata, distance) in enumerate(zip(
            results['documents'][0],
            results['metadatas'][0],
            results['distances'][0]
        )):
            score = 1 - distance  # Convert distance to similarity score
            if score >= RAG_SCORE_THRESHOLD:
                filtered_results.append({
                    "content": doc,
                    "metadata": metadata,
                    "score": score,
                    "source": metadata.get("source", "unknown")
                })

        return filtered_results

    except Exception as e:
        print(f"Failed to query RAG: {str(e)}")
        return []

class UserIntent(BaseModel):
    message: str
    user_id: Optional[str] = None
    token: Optional[str] = None

class AIResponse(BaseModel):
    response: str
    tokens_used: int
    response_time: float
    intent_understanding: str
    session_id: str

class TokenRequest(BaseModel):
    purpose: str
    user_id: Optional[str] = None
    permissions: Optional[List[str]] = []

class TokenResponse(BaseModel):
    token: str
    expires_at: datetime
    purpose: str
    permissions: List[str]
    token_type: str = "Bearer"

class TokenValidationResponse(BaseModel):
    valid: bool
    purpose: Optional[str] = None
    user_id: Optional[str] = None
    permissions: Optional[List[str]] = []
    expires_at: Optional[datetime] = None



@app.get("/")
async def root():
    return {"message": "Welcome to Hazoom - Super Intelligence Cosmos & Freedom Educational Model. Ready to explore the universe and expand human freedom through knowledge!"}

async def validate_token_from_header(request: Request) -> Optional[dict]:
    """Validate token from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]  # Remove "Bearer " prefix
    if token not in tokens_db:
        return None

    token_data = tokens_db[token]
    expires_at = datetime.fromisoformat(token_data["expires_at"])

    if datetime.utcnow() > expires_at:
        del tokens_db[token]  # Remove expired token
        save_tokens()
        return None

    return token_data

async def process_user_intent(intent: UserIntent) -> AIResponse:
    start_time = time.time()

    # Validate token if provided
    if intent.token:
        if intent.token not in tokens_db:
            raise HTTPException(status_code=401, detail="Invalid token")

        token_data = tokens_db[intent.token]
        expires_at = datetime.fromisoformat(token_data["expires_at"])

        if datetime.utcnow() > expires_at:
            del tokens_db[intent.token]  # Remove expired token
            raise HTTPException(status_code=401, detail="Token expired")

    # Use unified model if available, otherwise fall back to basic processing
    if UNIFIED_MODEL_AVAILABLE and unified_model:
        # Enhance with RAG context if available
        enhanced_message = intent.message
        rag_context = ""

        if RAG_ENABLED:
            rag_results = query_rag(intent.message)
            if rag_results:
                # Add relevant context from RAG
                context_parts = []
                for result in rag_results[:3]:  # Use top 3 results
                    context_parts.append(f"Context from {result['source']}: {result['content'][:500]}...")
                rag_context = "\n\n".join(context_parts)
                enhanced_message = f"{intent.message}\n\nAdditional Context:\n{rag_context}"

        # Process with unified model using enhanced message
        result = await unified_model.process_input_async(enhanced_message, intent.user_id or "default_user")

        # Add RAG metadata to result
        if rag_context:
            result["rag_context_used"] = True
            result["rag_sources"] = [r["source"] for r in rag_results[:3]]
        else:
            result["rag_context_used"] = False

        end_time = time.time()
        response_time = end_time - start_time

        # Generate a session ID for tracking
        session_id = result.get("session_id", str(uuid.uuid4()))

        # Store session info
        active_sessions[session_id] = {
            "user_id": intent.user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "response_time": result["response_time"]
        }

        return AIResponse(
            response=result["response"],
            tokens_used=result["tokens_used"],
            response_time=result["response_time"],
            intent_understanding=result["intent_understanding"],
            session_id=session_id
        )
    else:
        # Enhanced super intelligence responses with educational focus
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

        # Determine intent category with enhanced logic
        message_lower = intent.message.lower()
        if "hello" in message_lower or "hi" in message_lower or "hey" in message_lower:
            intent_category = "greeting"
        elif "help" in message_lower or "assist" in message_lower:
            intent_category = "help"
        elif "?" in message_lower:
            # Check for cosmos or freedom specific questions
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

        response_text = super_intelligence_responses.get(intent_category, super_intelligence_responses["default"])

        end_time = time.time()
        response_time = end_time - start_time

        # Generate a session ID for tracking
        session_id = str(uuid.uuid4())

        # Store session info
        active_sessions[session_id] = {
            "user_id": intent.user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "response_time": response_time
        }
        save_sessions()

        return AIResponse(
            response=response_text,
            tokens_used=len(intent.message.split()) * 2,  # Rough token estimation
            response_time=response_time,
            intent_understanding=intent_category,
            session_id=session_id
        )

@app.post("/api/process", response_model=AIResponse)
async def process_intent(intent: UserIntent):
    """
    Process user intent and return a positive, intelligent response
    """
    try:
        response = await process_user_intent(intent)
        return response
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing intent: {str(e)}")

# Streaming chat endpoint for progressive responses
class StreamingChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None

class StreamingChatResponse(BaseModel):
    stream: List[dict]
    response_time: float
    tokens_used: int

@app.post("/api/chat/stream", response_model=StreamingChatResponse)
async def process_chat_stream(chat_request: StreamingChatRequest):
    """
    Process a chat message and return a streaming response with progressive parts
    """
    try:
        start_time = time.time()

        # Create intent object
        intent = UserIntent(
            message=chat_request.message,
            user_id=chat_request.user_id
        )

        # Get the full response
        response = await process_user_intent(intent)

        # Split response into parts for streaming effect
        response_parts = response.response.split()
        stream_response = []

        for i, part in enumerate(response_parts):
            stream_response.append({
                "part": part + (" " if i < len(response_parts) - 1 else ""),
                "index": i,
                "total_parts": len(response_parts),
                "response_time": response.response_time,
                "progress": (i + 1) / len(response_parts)
            })

        end_time = time.time()
        total_response_time = end_time - start_time

        return StreamingChatResponse(
            stream=stream_response,
            response_time=total_response_time,
            tokens_used=response.tokens_used
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing streaming chat: {str(e)}")

@app.post("/api/generate-token", response_model=TokenResponse)
async def generate_token(request: TokenRequest):
    """
    Generate a new token for API access
    """
    token = secrets.token_urlsafe(64)  # Larger token for security
    expires_at = datetime.utcnow() + timedelta(days=30)  # Token expires in 30 days

    tokens_db[token] = {
        "purpose": request.purpose,
        "user_id": request.user_id,
        "permissions": request.permissions or [],
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "last_used": None
    }
    save_tokens()

    return TokenResponse(
        token=token,
        expires_at=expires_at,
        purpose=request.purpose,
        permissions=request.permissions or []
    )

@app.get("/api/validate-token/{token}", response_model=TokenValidationResponse)
async def validate_token(token: str):
    """
    Validate an existing token
    """
    if token not in tokens_db:
        return TokenValidationResponse(valid=False)

    token_data = tokens_db[token]
    expires_at = datetime.fromisoformat(token_data["expires_at"])

    if datetime.utcnow() > expires_at:
        del tokens_db[token]  # Remove expired token
        return TokenValidationResponse(valid=False)

    # Update last used time
    tokens_db[token]["last_used"] = datetime.utcnow().isoformat()
    save_tokens()

    return TokenValidationResponse(
        valid=True,
        purpose=token_data["purpose"],
        user_id=token_data.get("user_id"),
        permissions=token_data.get("permissions", []),
        expires_at=expires_at
    )

@app.get("/api/sessions")
async def get_active_sessions(request: Request):
    """
    Get information about active sessions
    """
    token_data = await validate_token_from_header(request)
    if not token_data or "read_sessions" not in token_data.get("permissions", []):
        raise HTTPException(status_code=401, detail="Insufficient permissions")

    return {"sessions": active_sessions, "count": len(active_sessions)}

@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str, request: Request):
    """
    Delete a specific session
    """
    token_data = await validate_token_from_header(request)
    if not token_data or "manage_sessions" not in token_data.get("permissions", []):
        raise HTTPException(status_code=401, detail="Insufficient permissions")

    if session_id in active_sessions:
        del active_sessions[session_id]
        save_sessions()
        return {"message": f"Session {session_id} deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

# Conversation history management
class ConversationHistoryResponse(BaseModel):
    history: List[dict]
    total_count: int

@app.get("/api/conversation/history/{user_id}", response_model=ConversationHistoryResponse)
async def get_conversation_history(user_id: str, request: Request):
    """
    Get conversation history for a user
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Get conversation history from storage
    conversation_key = f"conversation_{user_id}"
    history = storage.load(conversation_key) or []

    return ConversationHistoryResponse(
        history=history[-20:],  # Return last 20 interactions
        total_count=len(history)
    )

@app.delete("/api/conversation/history/{user_id}")
async def clear_conversation_history(user_id: str, request: Request):
    """
    Clear conversation history for a user
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    conversation_key = f"conversation_{user_id}"
    storage.save(conversation_key, [])
    unified_model.reset_context(user_id)

    return {"message": f"Conversation history cleared for user {user_id}"}

# User preferences management
class UserPreferences(BaseModel):
    theme: Optional[str] = "dark"
    ai_personality: Optional[str] = "balanced"
    interaction_style: Optional[str] = "friendly"
    enable_animations: Optional[bool] = True
    typing_speed: Optional[str] = "medium"

@app.get("/api/users/preferences/{user_id}")
async def get_user_preferences(user_id: str, request: Request):
    """
    Get user preferences for frontend customization
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Load preferences from storage
    prefs_key = f"preferences_{user_id}"
    preferences = storage.load(prefs_key) or {
        "theme": "dark",
        "ai_personality": "balanced",
        "interaction_style": "friendly",
        "enable_animations": True,
        "typing_speed": "medium"
    }

    return preferences

@app.put("/api/users/preferences/{user_id}")
async def update_user_preferences(user_id: str, preferences: UserPreferences, request: Request):
    """
    Update user preferences for frontend customization
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Save preferences to storage
    prefs_key = f"preferences_{user_id}"
    prefs_dict = preferences.dict(exclude_unset=True)
    storage.save(prefs_key, prefs_dict)

    # Update model configuration if personality changed
    if "ai_personality" in prefs_dict or "interaction_style" in prefs_dict:
        # This would update the unified model configuration
        pass

    return {
        "message": "Preferences updated successfully",
        "preferences": prefs_dict
    }

def validate_token_from_header_mock(token: str) -> Optional[dict]:
    """Mock function for token validation in session management"""
    if not token or token not in tokens_db:
        return None

    token_data = tokens_db[token]
    expires_at = datetime.fromisoformat(token_data["expires_at"])

    if datetime.utcnow() > expires_at:
        del tokens_db[token]  # Remove expired token
        return None

    return token_data

# Flutter-specific API endpoints
class FlutterMessage(BaseModel):
    text: str
    user_id: str
    conversation_id: Optional[str] = None
    metadata: Optional[dict] = {}

class FlutterResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = {}
    conversation_id: Optional[str] = None
    response_time_ms: float

class FlutterTokenRequest(BaseModel):
    user_id: str
    app_name: str
    permissions: List[str] = ["read", "write"]

class ConversationRequest(BaseModel):
    user_id: str
    conversation_id: Optional[str] = None
    messages: List[dict] = []

class ConversationResponse(BaseModel):
    success: bool
    conversation_id: str
    messages: List[dict]
    message: str

@app.post("/flutter/process-message", response_model=FlutterResponse)
async def flutter_process_message(msg: FlutterMessage):
    """
    Specialized endpoint for Flutter app integration
    """
    try:
        start_time = time.time()

        # Process the message using the same logic as the main endpoint
        intent = UserIntent(
            message=msg.text,
            user_id=msg.user_id,
            context=msg.metadata or {}
        )

        response = await process_user_intent(intent)

        end_time = time.time()
        response_time_ms = (end_time - start_time) * 1000

        return FlutterResponse(
            success=True,
            message=response.response,
            data={
                "tokens_used": response.tokens_used,
                "intent_understanding": response.intent_understanding,
                "session_id": response.session_id
            },
            conversation_id=msg.conversation_id,
            response_time_ms=response_time_ms
        )
    except Exception as e:
        return FlutterResponse(
            success=False,
            message=f"Error processing message: {str(e)}",
            response_time_ms=0
        )

@app.post("/flutter/generate-token", response_model=FlutterResponse)
async def flutter_generate_token(req: FlutterTokenRequest):
    """
    Token generation endpoint optimized for Flutter
    """
    try:
        token = secrets.token_urlsafe(64)
        expires_at = datetime.utcnow() + timedelta(days=30)

        tokens_db[token] = {
            "purpose": f"Flutter app - {req.app_name}",
            "user_id": req.user_id,
            "permissions": req.permissions,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "last_used": None
        }

        return FlutterResponse(
            success=True,
            message="Token generated successfully",
            data={
                "token": token,
                "expires_at": expires_at.isoformat(),
                "permissions": req.permissions
            },
            response_time_ms=0
        )
    except Exception as e:
        return FlutterResponse(
            success=False,
            message=f"Error generating token: {str(e)}",
            response_time_ms=0
        )

@app.get("/flutter/health", response_model=FlutterResponse)
async def flutter_health_check():
    """
    Health check endpoint for Flutter app
    """
    return FlutterResponse(
        success=True,
        message="Hazoom backend is healthy",
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "version": "4.0.0"
        },
        response_time_ms=0
    )

@app.post("/api/conversation/save", response_model=ConversationResponse)
async def save_conversation(conv_req: ConversationRequest, request: Request):
    """
    Save conversation history
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    conversation_id = conv_req.conversation_id or str(uuid.uuid4())
    storage_key = f"conversation_{conv_req.user_id}_{conversation_id}"

    storage.save(storage_key, conv_req.messages)

    return ConversationResponse(
        success=True,
        conversation_id=conversation_id,
        messages=conv_req.messages,
        message="Conversation saved successfully"
    )

@app.get("/api/conversation/load/{user_id}/{conversation_id}", response_model=ConversationResponse)
async def load_conversation(user_id: str, conversation_id: str, request: Request):
    """
    Load conversation history
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    storage_key = f"conversation_{user_id}_{conversation_id}"
    messages = storage.load(storage_key) or []

    return ConversationResponse(
        success=True,
        conversation_id=conversation_id,
        messages=messages,
        message="Conversation loaded successfully"
    )

# Import the configuration system
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'config'))

try:
    from hazoom_config import ModelCustomization, default_config
    from ai_customization import CustomizableAIResponder
    from user_interaction import UserInteractionCustomizer, create_customized_interactor
    CONFIG_AVAILABLE = True
except ImportError:
    print("Configuration modules not found. Running in basic mode.")
    CONFIG_AVAILABLE = False
    # Define basic classes if config modules are not available
    class ModelCustomization:
        def __init__(self):
            self.model_name = "Hazoom Super Intelligent Model"
            self.version = "1.0.0"

    default_config = ModelCustomization()

# Import the unified intelligent model
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'unified_model'))

try:
    from unified_model.unified_intelligent_model import UnifiedIntelligentModel, create_unified_model
    from unified_model.frontend_focused_model import process_message_direct
    UNIFIED_MODEL_AVAILABLE = True
    unified_model = create_unified_model("super_intelligent", "educational")
except ImportError:
    print("Unified model not available. Running with basic configuration.")
    UNIFIED_MODEL_AVAILABLE = False
    unified_model = None

# Store active configurations (in production, use a database)
active_configs = {}

class ConfigRequest(BaseModel):
    config: dict
    user_id: Optional[str] = None
    session_id: Optional[str] = None

class ConfigResponse(BaseModel):
    success: bool
    config: Optional[dict] = None
    message: str = ""

class ConfigExportRequest(BaseModel):
    user_id: Optional[str] = None
    include_sensitive: bool = False

# Configuration management endpoints
@app.get("/api/config", response_model=ConfigResponse)
async def get_config(request: Request):
    """
    Retrieve current configuration for a user or session
    """
    if not CONFIG_AVAILABLE:
        return ConfigResponse(
            success=False,
            message="Configuration system not available"
        )

    # Get user ID from token or query parameter
    user_id = None
    token_data = await validate_token_from_header(request)
    if token_data:
        user_id = token_data.get("user_id")

    # If no token, check query parameter
    if not user_id:
        user_id = request.query_params.get("user_id")

    # Return default config if no user-specific config exists
    if user_id and user_id in active_configs:
        return ConfigResponse(
            success=True,
            config=active_configs[user_id].to_dict(),
            message="User configuration retrieved"
        )
    else:
        return ConfigResponse(
            success=True,
            config=default_config.to_dict(),
            message="Default configuration retrieved"
        )

@app.put("/api/config", response_model=ConfigResponse)
async def update_config(config_request: ConfigRequest, request: Request):
    """
    Update configuration settings
    """
    if not CONFIG_AVAILABLE:
        return ConfigResponse(
            success=False,
            message="Configuration system not available"
        )

    try:
        # Validate token if provided
        token_data = await validate_token_from_header(request)
        if not token_data and config_request.user_id:
            # If no token but user_id provided, allow for demo purposes
            # In production, require valid token for config updates
            pass
        elif not token_data:
            raise HTTPException(status_code=401, detail="Authentication required for configuration updates")

        user_id = config_request.user_id or token_data.get("user_id") or "default"

        # Create new config from the request
        new_config = ModelCustomization()
        new_config.from_dict(config_request.config)

        # Store the configuration
        active_configs[user_id] = new_config

        return ConfigResponse(
            success=True,
            config=new_config.to_dict(),
            message=f"Configuration updated for user {user_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating configuration: {str(e)}")

@app.post("/api/config/export", response_model=ConfigResponse)
async def export_config(export_request: ConfigExportRequest, request: Request):
    """
    Export current configuration
    """
    if not CONFIG_AVAILABLE:
        return ConfigResponse(
            success=False,
            message="Configuration system not available"
        )

    try:
        # Validate token if provided
        token_data = await validate_token_from_header(request)
        if not token_data and export_request.user_id:
            # If no token but user_id provided, allow for demo purposes
            pass
        elif not token_data:
            raise HTTPException(status_code=401, detail="Authentication required for configuration export")

        user_id = export_request.user_id or token_data.get("user_id") or "default"

        # Get the configuration to export
        if user_id in active_configs:
            config_to_export = active_configs[user_id]
        else:
            config_to_export = default_config

        # Remove sensitive data if not requested
        export_dict = config_to_export.to_dict()
        if not export_request.include_sensitive:
            # Remove any sensitive information from export
            pass

        return ConfigResponse(
            success=True,
            config=export_dict,
            message=f"Configuration exported for user {user_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting configuration: {str(e)}")

@app.post("/api/config/import", response_model=ConfigResponse)
async def import_config(config_request: ConfigRequest, request: Request):
    """
    Import configuration from file/data
    """
    if not CONFIG_AVAILABLE:
        return ConfigResponse(
            success=False,
            message="Configuration system not available"
        )

    try:
        # Validate token if provided
        token_data = await validate_token_from_header(request)
        if not token_data and config_request.user_id:
            # If no token but user_id provided, allow for demo purposes
            pass
        elif not token_data:
            raise HTTPException(status_code=401, detail="Authentication required for configuration import")

        user_id = config_request.user_id or token_data.get("user_id") or "default"

        # Validate and import the configuration
        new_config = ModelCustomization()
        new_config.from_dict(config_request.config)

        # Store the imported configuration
        active_configs[user_id] = new_config

        return ConfigResponse(
            success=True,
            config=new_config.to_dict(),
            message=f"Configuration imported for user {user_id}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing configuration: {str(e)}")

# Model configuration and performance endpoints
class ModelConfigResponse(BaseModel):
    config: dict
    performance: dict

class ModelConfigUpdate(BaseModel):
    model_name: Optional[str] = None
    version: Optional[str] = None
    ai_response_style: Optional[str] = None
    interaction_template: Optional[str] = None
    enable_context_awareness: Optional[bool] = None
    quantum_boost_factor: Optional[float] = None

@app.get("/api/model/config", response_model=ModelConfigResponse)
async def get_model_config(request: Request):
    """
    Get the current model configuration and performance metrics
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    return ModelConfigResponse(
        config={
            "model_name": default_config.model_name,
            "version": default_config.version,
            "ai_response_style": "balanced",  # Default
            "interaction_template": "friendly",  # Default
            "enable_context_awareness": True,
            "quantum_boost_factor": 3.0
        },
        performance=unified_model.get_performance_metrics() if unified_model else {}
    )

@app.put("/api/model/config")
async def update_model_config(config_update: ModelConfigUpdate, request: Request):
    """
    Update the model configuration
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Update unified model configuration if available
    if unified_model:
        new_config = unified_model.config
        update_data = config_update.dict(exclude_unset=True)

        for key, value in update_data.items():
            if hasattr(new_config, key):
                setattr(new_config, key, value)

        unified_model.update_config(new_config)

    return {
        "message": "Model configuration updated successfully",
        "config": config_update.dict(exclude_unset=True)
    }

@app.get("/api/model/performance")
async def get_model_performance(request: Request):
    """
    Get model performance metrics
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    return unified_model.get_performance_metrics() if unified_model else {}

# RAG document management endpoints
class DocumentUpload(BaseModel):
    filename: str
    content: str
    metadata: Optional[dict] = None

@app.post("/api/rag/documents")
async def add_rag_document(document: DocumentUpload, request: Request):
    """
    Add a document to the RAG system
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not RAG_ENABLED:
        raise HTTPException(status_code=503, detail="RAG system is not enabled")

    try:
        add_document_to_rag(document.filename, document.content, document.metadata or {})
        return {
            "message": f"Document '{document.filename}' added to RAG system successfully",
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add document: {str(e)}")

@app.get("/api/rag/query")
async def query_rag_endpoint(query: str, top_k: Optional[int] = None, request: Request = None):
    if request:
        token_data = await validate_token_from_header(request)
        if not token_data:
            raise HTTPException(status_code=401, detail="Authentication required")
    """
    Query the RAG system for relevant documents
    """
    if request:
        token_data = await validate_token_from_header(request)
        if not token_data:
            raise HTTPException(status_code=401, detail="Authentication required")

    if not RAG_ENABLED:
        raise HTTPException(status_code=503, detail="RAG system is not enabled")

    try:
        results = query_rag(query, top_k or RAG_TOP_K)
        return {
            "query": query,
            "results": results,
            "total_results": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query RAG: {str(e)}")

@app.get("/api/rag/status")
async def get_rag_status(request: Request):
    """
    Get RAG system status
    """
    token_data = await validate_token_from_header(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Authentication required")

    return {
        "enabled": RAG_ENABLED,
        "model_name": RAG_MODEL_NAME,
        "collection_name": RAG_COLLECTION_NAME,
        "top_k": RAG_TOP_K,
        "score_threshold": RAG_SCORE_THRESHOLD,
        "initialized": rag_collection is not None
    }

# WebSocket for real-time configuration updates
@app.websocket("/ws/config")
async def websocket_config_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                config_data = json.loads(data)

                # Process configuration update
                if config_data.get("type") == "config_update":
                    user_id = config_data.get("user_id", "default")
                    new_config_dict = config_data.get("config", {})

                    if CONFIG_AVAILABLE:
                        new_config = ModelCustomization()
                        new_config.from_dict(new_config_dict)
                        active_configs[user_id] = new_config

                        # Broadcast update to all connected clients
                        await websocket.send_text(json.dumps({
                            "type": "config_updated",
                            "user_id": user_id,
                            "config": new_config.to_dict(),
                            "timestamp": datetime.utcnow().isoformat()
                        }))
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "error": "Invalid JSON format"
                }))
    except WebSocketDisconnect:
        print("Configuration WebSocket disconnected")

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            intent_data = json.loads(data)

            # Create intent object from data
            intent = UserIntent(
                message=intent_data.get("message", ""),
                user_id=intent_data.get("user_id"),
                context=intent_data.get("context", {}),
                token=intent_data.get("token")
            )

            response = await process_user_intent(intent)
            await websocket.send_text(response.json())
    except WebSocketDisconnect:
        print("Client disconnected")
    except json.JSONDecodeError:
        error_response = {
            "error": "Invalid JSON format"
        }
        await websocket.send_text(json.dumps(error_response))
    except Exception as e:
        error_response = {
            "error": f"Server error: {str(e)}"
        }
        await websocket.send_text(json.dumps(error_response))

# Enhanced WebSocket endpoint for real-time chat
@app.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat with enhanced features."""
    await websocket.accept()
    client_id = str(uuid.uuid4())

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            message = message_data.get("message", "")
            user_id = message_data.get("user_id", f"ws_user_{client_id}")
            session_id = message_data.get("session_id", str(uuid.uuid4()))

            # Create intent object
            intent = UserIntent(
                message=message,
                user_id=user_id
            )

            # Process the message
            response = await process_user_intent(intent)

            # Send enhanced response
            chat_response = {
                "type": "response",
                "response": response.response,
                "response_time": response.response_time,
                "tokens_used": response.tokens_used,
                "session_id": session_id,
                "user_id": user_id,
                "intent_understanding": response.intent_understanding,
                "timestamp": datetime.utcnow().isoformat()
            }

            await websocket.send_text(json.dumps(chat_response))
    except WebSocketDisconnect:
        print(f"Chat WebSocket client {client_id} disconnected")
    except Exception as e:
        error_response = {
            "type": "error",
            "error": f"Server error: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_text(json.dumps(error_response))

# WebSocket endpoint for real-time model updates
@app.websocket("/ws/model-updates")
async def websocket_model_updates_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time model updates and metrics."""
    await websocket.accept()
    client_id = str(uuid.uuid4())

    try:
        # Send initial model state
        initial_state = {
            "type": "model_state",
            "config": {
                "model_name": default_config.model_name,
                "version": default_config.version,
                "ai_response_style": "balanced",
                "interaction_template": "friendly"
            },
            "performance": unified_model.get_performance_metrics() if unified_model else {},
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket.send_text(json.dumps(initial_state))

        # Send periodic updates
        while True:
            await asyncio.sleep(30)  # Update every 30 seconds

            update = {
                "type": "performance_update",
                "performance": unified_model.get_performance_metrics() if unified_model else {},
                "timestamp": datetime.utcnow().isoformat()
            }
            await websocket.send_text(json.dumps(update))
    except WebSocketDisconnect:
        print(f"Model updates WebSocket client {client_id} disconnected")

# Health check endpoint with memory monitoring
@app.get("/health")
async def health_check():
    import psutil
    memory = psutil.virtual_memory()
    process = psutil.Process()
    process_memory = process.memory_info()

    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "config_system": CONFIG_AVAILABLE,
        "memory": {
            "total": memory.total,
            "available": memory.available,
            "percent": memory.percent,
            "used": memory.used
        },
        "process_memory": {
            "rss": process_memory.rss,
            "vms": process_memory.vms
        }
    }

# ========================
# AUTHENTICATION & API SYSTEM
# ========================

# Import all modules
from app.api.v1.endpoints import auth, users, ai, pdf_processing, agendas, quizzes, analytics, themes
from app.api.v1.endpoints.progress import router as progress_router
from app.core.database import engine, Base
from app.models import user, agenda, quiz, progress, theme  # Import all models

# Create database tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")

# Include authentication routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])

# Include feature routers
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(pdf_processing.router, prefix="/api/v1/pdf_processing", tags=["pdf_processing"])
app.include_router(agendas.router, prefix="/api/v1/agendas", tags=["agendas"])
app.include_router(quizzes.router, prefix="/api/v1/quizzes", tags=["quizzes"])
app.include_router(progress_router, prefix="/api/v1/progress", tags=["progress"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(themes.router, prefix="/api/v1/themes", tags=["themes"])

# ========================
# END AUTHENTICATION & API SYSTEM
# ========================

# Load educational datasets on startup (after all functions are defined)
load_educational_datasets_on_startup()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', '8002'))  # Use 8002 as default
    uvicorn.run(app, host="0.0.0.0", port=port)

# Mock endpoint for demonstration purposes
@app.post("/api/mock_login")
async def mock_login(user_id: str = "default_user"):
    # In real implementation, authentication happens here

    # Generate a JWT token
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=30)  # Token expires in 30 minutes
    }
    jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    return {"token": jwt_token}

# ========================
# SWISS EDTECH INTEGRATION
# ========================

@app.post("/api/swiss/register")
async def swiss_register(reg: SwissStudentRegistration):
    '''Register a Swiss student (privacy-first)'''
    return swiss_manager.register_student(reg)

@app.post("/api/swiss/math-help")
async def swiss_math_help(request: SwissMathHelpRequest):
    '''Get Swiss curriculum-specific math help'''
    return swiss_manager.get_math_help(request)

@app.post("/api/swiss/gymi-prep")
async def swiss_gymi_prep(student_id: str, subject: str):
    '''Get Gymnasium preparation materials'''
    return swiss_manager.get_gymi_prep(student_id, subject)

@app.get("/api/swiss/health")
async def swiss_health():
    '''Swiss-compliant health check'''
    return {
        "status": "healthy",
        "service": "hazoom-swiss-vault",
        "privacy": "zero_knowledge",
        "hosting": "swiss",
        "compliance": "nFADP/revDSG",
        "cantons": ["ZH", "BE", "GE", "TI"]
    }

# ========================
# END SWISS EDTECH INTEGRATION
# ========================