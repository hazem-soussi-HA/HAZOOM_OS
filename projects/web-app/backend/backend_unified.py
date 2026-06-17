from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import asyncio
import uuid
import time
import json
from datetime import datetime, timedelta
import secrets
import hashlib
from typing import Optional, List, Dict, Any
import sys
import os

# Add the unified model to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'unified_model'))

from unified_model.unified_intelligent_model import UnifiedIntelligentModel, create_unified_model, UnifiedModelConfig
from unified_model.frontend_focused_model import frontend_api

app = FastAPI(
    title="Hazoom Unified Model Backend",
    description="Super intelligent model with all customization features integrated",
    version="3.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the unified model API routes
for route in frontend_api.app.router.routes:
    app.routes.append(route)

# Serve static files from unified model
app.mount("/unified", StaticFiles(directory="unified_model"), name="unified")

# Main API endpoints for the unified model
class UserIntent:
    def __init__(self, message: str, user_id: str = None, context: dict = None, token: str = None):
        self.message = message
        self.user_id = user_id or f"web_user_{secrets.token_hex(4)}"
        self.context = context or {}
        self.token = token

class AIResponse:
    def __init__(self, response: str, tokens_used: int, response_time: float, 
                 intent_understanding: str, session_id: str, confidence: float = 0.8):
        self.response = response
        self.tokens_used = tokens_used
        self.response_time = response_time
        self.intent_understanding = intent_understanding
        self.session_id = session_id
        self.confidence = confidence

# Initialize the unified model
unified_model = create_unified_model("balanced", "friendly")

@app.get("/")
async def root():
    return {"message": "Welcome to Hazoom Unified Model - Super Intelligent AI with Quantum Fast Processing"}

@app.get("/unified-model")
async def unified_model_interface():
    """Serve the unified model interface"""
    with open("unified_model/unified_model_interface.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.post("/api/unified/process")
async def process_unified_intent(request: Request):
    """
    Process user intent using the unified intelligent model
    """
    try:
        data = await request.json()
        message = data.get("message", "")
        user_id = data.get("user_id", f"web_user_{secrets.token_hex(4)}")
        context = data.get("context", {})
        
        # Process with unified model
        start_time = time.time()
        result = unified_model.process_input(message, user_id)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        return {
            "response": result["response"],
            "tokens_used": result["tokens_used"],
            "response_time": response_time,
            "intent_understanding": result["intent_understanding"],
            "session_id": str(uuid.uuid4()),
            "confidence": result["confidence"],
            "performance_metrics": unified_model.get_performance_metrics()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing intent: {str(e)}")

@app.post("/api/unified/process-stream")
async def process_unified_intent_stream(request: Request):
    """
    Process user intent with streaming response
    """
    try:
        data = await request.json()
        message = data.get("message", "")
        user_id = data.get("user_id", f"web_user_{secrets.token_hex(4)}")
        
        # Process with unified model
        start_time = time.time()
        result = await unified_model.process_input_async(message, user_id)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # Simulate streaming response
        response_parts = result["response"].split()
        stream_response = []
        
        for i, part in enumerate(response_parts):
            stream_response.append({
                "part": part + (" " if i < len(response_parts) - 1 else ""),
                "index": i,
                "total_parts": len(response_parts),
                "response_time": response_time,
                "progress": (i + 1) / len(response_parts)
            })
        
        return {
            "stream": stream_response,
            "response_time": response_time,
            "tokens_used": result["tokens_used"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing stream: {str(e)}")

@app.get("/api/unified/config")
async def get_unified_config():
    """
    Get current unified model configuration
    """
    return {
        "config": {
            "model_name": unified_model.config.model_name,
            "version": unified_model.config.version,
            "ai_response_style": unified_model.config.ai_response_style,
            "interaction_template": unified_model.config.interaction_template,
            "enable_context_awareness": unified_model.config.enable_context_awareness,
            "quantum_boost_factor": unified_model.config.quantum_boost_factor
        },
        "performance": unified_model.get_performance_metrics()
    }

@app.put("/api/unified/config")
async def update_unified_config(request: Request):
    """
    Update unified model configuration
    """
    try:
        data = await request.json()
        
        # Create new config from data
        new_config = UnifiedModelConfig()
        
        for key, value in data.items():
            if hasattr(new_config, key):
                setattr(new_config, key, value)
        
        # Update the model
        unified_model.update_config(new_config)
        
        return {
            "message": "Configuration updated successfully",
            "config": {
                "model_name": unified_model.config.model_name,
                "version": unified_model.config.version,
                "ai_response_style": unified_model.config.ai_response_style,
                "interaction_template": unified_model.config.interaction_template
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating config: {str(e)}")

@app.get("/api/unified/performance")
async def get_performance_metrics():
    """
    Get performance metrics for the unified model
    """
    return unified_model.get_performance_metrics()

@app.get("/api/unified/user-profile/{user_id}")
async def get_user_profile(user_id: str):
    """
    Get user profile information
    """
    profile = unified_model.get_user_profile(user_id)
    return profile

@app.websocket("/ws/unified")
async def websocket_unified_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for unified model real-time communication
    """
    await websocket.accept()
    client_id = str(uuid.uuid4())
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            message = message_data.get("message", "")
            user_id = message_data.get("user_id", f"ws_user_{client_id}")
            
            # Process the message with the unified model
            result = await unified_model.process_input_async(message, user_id)
            
            # Send response back to client
            response = {
                "type": "response",
                "response": result["response"],
                "response_time": result["response_time"],
                "tokens_used": result["tokens_used"],
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "intent_understanding": result["intent_understanding"],
                "confidence": result["confidence"]
            }
            
            await websocket.send_text(json.dumps(response))
    except WebSocketDisconnect:
        print(f"Unified WebSocket client {client_id} disconnected")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        error_response = {
            "type": "error",
            "message": f"Connection error: {str(e)}"
        }
        await websocket.send_text(json.dumps(error_response))

@app.get("/api/unified/health")
async def unified_health_check():
    """
    Health check for the unified model
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "model_version": unified_model.config.version,
        "active_interactions": unified_model.total_interactions,
        "model_loaded": True
    }

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include the frontend API routes
for route in frontend_api.app.router.routes:
    # Avoid duplicate routes
    if not any(route.path == existing.path for existing in app.routes):
        app.routes.append(route)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)