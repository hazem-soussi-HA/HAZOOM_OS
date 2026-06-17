"""
Frontend-focused implementation for the Hazoom Unified Intelligent Model
This module provides the interface and API endpoints specifically designed for frontend integration
"""

import asyncio
import json
import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

import sys
import os
sys.path.append(os.path.dirname(__file__))

from unified_intelligent_model import UnifiedIntelligentModel, create_unified_model, UnifiedModelConfig


class FrontendAPI:
    """API class for frontend-focused interactions with the unified model"""
    
    def __init__(self):
        self.model = create_unified_model("balanced", "friendly")
        self.active_sessions = {}
        self.tokens_db = {}
        self.conversation_history = []
        self.user_preferences = {}
        
        # Initialize FastAPI app
        self.app = FastAPI(
            title="Hazoom Unified Model Frontend API",
            description="Frontend-focused API for the unified intelligent model",
            version="3.0.0"
        )
        
        # Add CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup API routes
        self._setup_routes()
    
    def _setup_routes(self):
        """Setup API routes for frontend integration"""
        
        @self.app.get("/")
        async def root():
            return {"message": "Hazoom Unified Model Frontend API", "version": "3.0.0"}
        
        @self.app.post("/api/chat")
        async def chat_endpoint(request: Request):
            """Main chat endpoint for frontend integration"""
            try:
                data = await request.json()
                message = data.get("message", "")
                user_id = data.get("user_id", f"web_user_{secrets.token_hex(4)}")
                session_id = data.get("session_id", str(uuid.uuid4()))
                
                # Process the message through the unified model
                result = self.model.process_input(message, user_id)
                
                # Store session info
                self.active_sessions[session_id] = {
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "last_message": message
                }
                
                return {
                    "response": result["response"],
                    "response_time": result["response_time"],
                    "tokens_used": result["tokens_used"],
                    "session_id": session_id,
                    "user_profile": result["user_profile"],
                    "performance_metrics": self.model.get_performance_metrics()
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")
        
        @self.app.post("/api/chat-stream")
        async def chat_stream_endpoint(request: Request):
            """Streaming chat endpoint for real-time frontend updates"""
            try:
                data = await request.json()
                message = data.get("message", "")
                user_id = data.get("user_id", f"web_user_{secrets.token_hex(4)}")
                
                # Process message with async support for streaming
                result = await self.model.process_input_async(message, user_id)
                
                # Simulate streaming response
                response_parts = result["response"].split()
                stream_response = []
                
                for i, part in enumerate(response_parts):
                    stream_response.append({
                        "part": part + (" " if i < len(response_parts) - 1 else ""),
                        "index": i,
                        "total_parts": len(response_parts),
                        "response_time": result["response_time"],
                        "progress": (i + 1) / len(response_parts)
                    })
                
                return {
                    "stream": stream_response,
                    "response_time": result["response_time"],
                    "tokens_used": result["tokens_used"]
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing stream: {str(e)}")
        
        @self.app.post("/api/generate-token")
        async def generate_token_endpoint(request: Request):
            """Generate API token for frontend authentication"""
            try:
                data = await request.json()
                purpose = data.get("purpose", "frontend_access")
                user_id = data.get("user_id", f"frontend_user_{secrets.token_hex(8)}")
                
                token = secrets.token_urlsafe(64)
                expires_at = datetime.utcnow() + timedelta(days=30)
                
                self.tokens_db[token] = {
                    "purpose": purpose,
                    "user_id": user_id,
                    "permissions": ["read", "write", "chat"],
                    "expires_at": expires_at.isoformat(),
                    "created_at": datetime.utcnow().isoformat()
                }
                
                return {
                    "token": token,
                    "expires_at": expires_at.isoformat(),
                    "user_id": user_id,
                    "purpose": purpose
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error generating token: {str(e)}")
        
        @self.app.get("/api/user-preferences/{user_id}")
        async def get_user_preferences(user_id: str):
            """Get user preferences for frontend customization"""
            if user_id not in self.user_preferences:
                # Create default preferences
                self.user_preferences[user_id] = {
                    "theme": "dark",
                    "ai_personality": "balanced",
                    "interaction_style": "friendly",
                    "enable_animations": True,
                    "typing_speed": "normal",
                    "notification_preferences": {
                        "sounds": True,
                        "visual": True,
                        "email": False
                    }
                }
            
            return self.user_preferences[user_id]
        
        @self.app.put("/api/user-preferences/{user_id}")
        async def update_user_preferences(user_id: str, request: Request):
            """Update user preferences for frontend customization"""
            try:
                data = await request.json()
                
                if user_id not in self.user_preferences:
                    self.user_preferences[user_id] = {}
                
                # Update preferences
                for key, value in data.items():
                    self.user_preferences[user_id][key] = value
                
                # Update model configuration if personality changed
                if "ai_personality" in data or "interaction_style" in data:
                    config = UnifiedModelConfig()
                    config.ai_response_style = self.user_preferences[user_id].get("ai_personality", "balanced")
                    config.interaction_template = self.user_preferences[user_id].get("interaction_style", "friendly")
                    self.model.update_config(config)
                
                return {
                    "message": "Preferences updated successfully",
                    "preferences": self.user_preferences[user_id]
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")
        
        @self.app.get("/api/model-config")
        async def get_model_config():
            """Get current model configuration for frontend"""
            return {
                "config": {
                    "model_name": self.model.config.model_name,
                    "version": self.model.config.version,
                    "ai_response_style": self.model.config.ai_response_style,
                    "interaction_template": self.model.config.interaction_template,
                    "enable_context_awareness": self.model.config.enable_context_awareness,
                    "quantum_boost_factor": self.model.config.quantum_boost_factor
                },
                "performance": self.model.get_performance_metrics()
            }
        
        @self.app.post("/api/model-config")
        async def update_model_config(request: Request):
            """Update model configuration from frontend"""
            try:
                data = await request.json()
                
                # Create new config from data
                new_config = UnifiedModelConfig()
                
                for key, value in data.items():
                    if hasattr(new_config, key):
                        setattr(new_config, key, value)
                
                # Update the model
                self.model.update_config(new_config)
                
                return {
                    "message": "Configuration updated successfully",
                    "config": {
                        "model_name": self.model.config.model_name,
                        "version": self.model.config.version,
                        "ai_response_style": self.model.config.ai_response_style,
                        "interaction_template": self.model.config.interaction_template
                    }
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error updating config: {str(e)}")
        
        @self.app.get("/api/conversation-history/{user_id}")
        async def get_conversation_history(user_id: str):
            """Get conversation history for a user"""
            user_history = [
                item for item in self.model.conversation_history 
                if item["user_id"] == user_id
            ]
            
            return {
                "history": user_history[-20:],  # Return last 20 interactions
                "total_count": len(user_history)
            }
        
        @self.app.delete("/api/conversation-history/{user_id}")
        async def clear_conversation_history(user_id: str):
            """Clear conversation history for a user"""
            self.model.conversation_history = [
                item for item in self.model.conversation_history 
                if item["user_id"] != user_id
            ]
            
            self.model.reset_context(user_id)
            
            return {"message": f"Conversation history cleared for user {user_id}"}
        
        @self.app.get("/api/active-sessions")
        async def get_active_sessions():
            """Get information about active sessions"""
            return {
                "sessions": self.active_sessions,
                "count": len(self.active_sessions),
                "active_users": len(set(session["user_id"] for session in self.active_sessions.values()))
            }
        
        @self.app.websocket("/ws/chat")
        async def websocket_chat_endpoint(websocket: WebSocket):
            """WebSocket endpoint for real-time chat"""
            await websocket.accept()
            client_id = str(uuid.uuid4())
            
            try:
                while True:
                    data = await websocket.receive_text()
                    message_data = json.loads(data)
                    
                    message = message_data.get("message", "")
                    user_id = message_data.get("user_id", f"ws_user_{client_id}")
                    
                    # Process the message
                    result = await self.model.process_input_async(message, user_id)
                    
                    # Send response back to client
                    response = {
                        "type": "response",
                        "response": result["response"],
                        "response_time": result["response_time"],
                        "tokens_used": result["tokens_used"],
                        "user_id": user_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    await websocket.send_text(json.dumps(response))
            except WebSocketDisconnect:
                print(f"WebSocket client {client_id} disconnected")
            except Exception as e:
                print(f"WebSocket error: {str(e)}")
                error_response = {
                    "type": "error",
                    "message": f"Connection error: {str(e)}"
                }
                await websocket.send_text(json.dumps(error_response))
        
        @self.app.websocket("/ws/model-updates")
        async def websocket_model_updates_endpoint(websocket: WebSocket):
            """WebSocket endpoint for real-time model updates"""
            await websocket.accept()
            client_id = str(uuid.uuid4())
            
            try:
                # Send initial model state
                initial_state = {
                    "type": "model_state",
                    "config": {
                        "model_name": self.model.config.model_name,
                        "version": self.model.config.version,
                        "ai_response_style": self.model.config.ai_response_style,
                        "interaction_template": self.model.config.interaction_template
                    },
                    "performance": self.model.get_performance_metrics()
                }
                await websocket.send_text(json.dumps(initial_state))
                
                while True:
                    # Wait for any updates (in a real implementation, this would be triggered by model changes)
                    await asyncio.sleep(10)  # Send periodic updates
                    
                    update = {
                        "type": "performance_update",
                        "performance": self.model.get_performance_metrics(),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    await websocket.send_text(json.dumps(update))
            except WebSocketDisconnect:
                print(f"Model updates WebSocket client {client_id} disconnected")
    
    def get_app(self):
        """Get the FastAPI application instance"""
        return self.app


# Create the frontend API instance
frontend_api = FrontendAPI()


# For direct usage without FastAPI
def get_unified_model():
    """Get the unified model instance for direct usage"""
    return frontend_api.model


def process_message_direct(message: str, user_id: str = "default_user"):
    """Process a message directly without HTTP overhead"""
    return frontend_api.model.process_input(message, user_id)


if __name__ == "__main__":
    # Example usage
    print("=== Hazoom Unified Model Frontend API ===")
    print("Starting server...")
    
    import uvicorn
    uvicorn.run(frontend_api.app, host="0.0.0.0", port=8001)