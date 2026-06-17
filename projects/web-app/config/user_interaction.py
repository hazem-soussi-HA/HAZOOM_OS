"""
Hazoom User Interaction Customization
Customizable interaction patterns, UI elements, and communication styles
"""

from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
import asyncio
import random
from datetime import datetime
from hazoom_config import ModelCustomization, default_config

@dataclass
class UIElementCustomization:
    """Customization for UI elements and visual presentation"""
    theme_color_primary: str = "#1a2a6c"
    theme_color_secondary: str = "#b21f1f"
    theme_color_accent: str = "#00c6ff"
    background_style: str = "gradient"  # Options: gradient, solid, animated
    enable_quantum_particles: bool = True
    particle_count: int = 30
    animation_speed: float = 1.0  # Multiplier for animation speed
    font_family: str = "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
    message_bubble_user: str = "#0072ff"  # Color for user messages
    message_bubble_ai: str = "#ff7e5f"   # Color for AI messages
    enable_typing_indicator: bool = True
    typing_indicator_style: str = "dots"  # Options: dots, text, none

@dataclass
class CommunicationStyle:
    """Customization for communication patterns"""
    greeting_frequency: str = "always"  # Options: always, once_per_session, rarely
    use_nicknames: bool = False
    nickname_preference: str = "friendly"  # Options: friendly, professional, creative
    response_pacing: str = "balanced"  # Options: fast, balanced, thoughtful
    use_empathy_tokens: bool = True  # Add empathetic phrases
    empathy_token_frequency: float = 0.7  # 0.0 to 1.0 probability
    use_humor: bool = True
    humor_frequency: float = 0.3  # 0.0 to 1.0 probability
    use_metaphors: bool = True
    metaphor_frequency: float = 0.4  # 0.0 to 1.0 probability
    ask_follow_up_questions: bool = True
    follow_up_frequency: float = 0.5  # 0.0 to 1.0 probability

@dataclass
class SessionManagement:
    """Customization for session handling"""
    enable_session_persistence: bool = True
    session_timeout_minutes: int = 30
    enable_user_profiles: bool = True
    profile_data_fields: List[str] = field(default_factory=lambda: [
        "name", "preferences", "interaction_history", "goals"
    ])
    enable_context_memory: bool = True
    context_retention_minutes: int = 120
    enable_interaction_analytics: bool = True

class UserInteractionCustomizer:
    """
    Class to handle customizable user interactions
    """
    
    def __init__(self, config: ModelCustomization = None):
        self.config = config or default_config
        self.ui_customization = UIElementCustomization()
        self.communication_style = CommunicationStyle()
        self.session_management = SessionManagement()
        self.user_profiles = {}
        self.active_sessions = {}
        self.interaction_history = []
        
    def set_ui_customization(self, ui_custom: UIElementCustomization):
        """Set UI customization settings"""
        self.ui_customization = ui_custom
    
    def set_communication_style(self, comm_style: CommunicationStyle):
        """Set communication style settings"""
        self.communication_style = comm_style
    
    def set_session_management(self, session_mgmt: SessionManagement):
        """Set session management settings"""
        self.session_management = session_mgmt
    
    def customize_greeting(self, user_id: str) -> str:
        """Generate a customized greeting based on user profile and settings"""
        # Check if this is a returning user
        is_returning = user_id in self.user_profiles
        
        if not is_returning:
            # First time user - use configured greeting
            greeting = self.config.interaction_settings.greeting_message
        else:
            # Returning user - customize based on profile
            user_profile = self.user_profiles[user_id]
            time_of_day = self._get_time_of_day()
            
            if self.communication_style.greeting_frequency == "always":
                greeting_templates = {
                    "morning": f"Good morning, {user_profile.get('name', 'friend')}! Ready to make today amazing?",
                    "afternoon": f"Good afternoon, {user_profile.get('name', 'friend')}! How can I assist you today?",
                    "evening": f"Good evening, {user_profile.get('name', 'friend')}! What can I help you with this evening?"
                }
                greeting = greeting_templates.get(time_of_day, self.config.interaction_settings.greeting_message)
            else:
                # Rare greeting frequency
                if random.random() < 0.3:  # 30% chance to greet
                    greeting = f"Hello again, {user_profile.get('name', 'friend')}!"
                else:
                    greeting = "How can I help you?"  # Minimal greeting
        
        return greeting
    
    def _get_time_of_day(self) -> str:
        """Get the current time of day"""
        hour = datetime.now().hour
        if 5 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        else:
            return "evening"
    
    def customize_response_with_comm_style(self, base_response: str, user_id: str) -> str:
        """Apply communication style customizations to a response"""
        response = base_response
        
        # Add empathetic tokens if enabled
        if self.communication_style.use_empathy_tokens:
            if random.random() < self.communication_style.empathy_token_frequency:
                empathy_tokens = [
                    "I understand how you feel.",
                    "That's completely valid.",
                    "I appreciate your perspective.",
                    "That's an important point.",
                    "I hear you."
                ]
                response = f"{random.choice(empathy_tokens)} {response}"
        
        # Add humor if enabled
        if self.communication_style.use_humor:
            if random.random() < self.communication_style.humor_frequency:
                humor_tokens = [
                    "As they say, 'AI is trying to be helpful, not funny' - but here's a smile anyway! ",
                    "In the world of AI, we call this a 'digital high-five'! ",
                    "If I had a smiley face button, I'd press it now! ",
                    "Consider this my digital thumbs up! "
                ]
                response = f"{random.choice(humor_tokens)}{response}"
        
        # Add metaphors if enabled
        if self.communication_style.use_metaphors:
            if random.random() < self.communication_style.metaphor_frequency:
                metaphor_tokens = [
                    "Think of this like planting seeds in a garden - it takes time and care to grow. ",
                    "It's like solving a puzzle - each piece fits together to form the complete picture. ",
                    "Consider this as navigating a ship - with the right direction, you'll reach your destination. ",
                    "This is similar to building blocks - each step creates a foundation for the next. "
                ]
                response = f"{random.choice(metaphor_tokens)}{response}"
        
        # Add follow-up question if enabled
        if self.communication_style.ask_follow_up_questions:
            if random.random() < self.communication_style.follow_up_frequency:
                follow_ups = [
                    "What are your thoughts on this?",
                    "How does this align with your goals?",
                    "Is there anything else you'd like to explore?",
                    "Would you like to dive deeper into this topic?"
                ]
                response += f" {random.choice(follow_ups)}"
        
        return response
    
    def get_custom_ui_settings(self) -> Dict[str, Any]:
        """Get UI customization settings as a dictionary"""
        return {
            "theme": {
                "primary": self.ui_customization.theme_color_primary,
                "secondary": self.ui_customization.theme_color_secondary,
                "accent": self.ui_customization.theme_color_accent
            },
            "background": self.ui_customization.background_style,
            "particles": {
                "enabled": self.ui_customization.enable_quantum_particles,
                "count": self.ui_customization.particle_count,
                "speed": self.ui_customization.animation_speed
            },
            "typography": {
                "fontFamily": self.ui_customization.font_family
            },
            "messages": {
                "userBubbleColor": self.ui_customization.message_bubble_user,
                "aiBubbleColor": self.ui_customization.message_bubble_ai
            },
            "typingIndicator": {
                "enabled": self.ui_customization.enable_typing_indicator,
                "style": self.ui_customization.typing_indicator_style
            }
        }
    
    def create_user_profile(self, user_id: str, name: str = None, preferences: Dict = None) -> Dict:
        """Create a profile for a new user"""
        profile = {
            "id": user_id,
            "name": name or f"User_{user_id[-4:]}",  # Use last 4 chars of ID as default name
            "created_at": datetime.now().isoformat(),
            "interaction_count": 0,
            "preferences": preferences or {},
            "last_interaction": None,
            "goals": [],
            "interests": []
        }
        
        self.user_profiles[user_id] = profile
        return profile
    
    def update_user_interaction(self, user_id: str):
        """Update user profile with latest interaction"""
        if user_id in self.user_profiles:
            self.user_profiles[user_id]["interaction_count"] += 1
            self.user_profiles[user_id]["last_interaction"] = datetime.now().isoformat()
        else:
            self.create_user_profile(user_id)
    
    def add_user_goal(self, user_id: str, goal: str):
        """Add a goal to user profile"""
        if user_id in self.user_profiles:
            if goal not in self.user_profiles[user_id]["goals"]:
                self.user_profiles[user_id]["goals"].append(goal)
    
    def add_user_interest(self, user_id: str, interest: str):
        """Add an interest to user profile"""
        if user_id in self.user_profiles:
            if interest not in self.user_profiles[user_id]["interests"]:
                self.user_profiles[user_id]["interests"].append(interest)
    
    def get_personalized_response(self, message: str, user_id: str) -> str:
        """Generate a response personalized to the user"""
        # Update interaction count
        self.update_user_interaction(user_id)
        
        # Get base response from AI customization
        from .ai_customization import CustomizableAIResponder
        responder = CustomizableAIResponder(self.config)
        base_response = responder.generate_response(message, user_id)
        
        # Apply communication style customizations
        personalized_response = self.customize_response_with_comm_style(base_response, user_id)
        
        # Add user-specific elements if profile exists
        if user_id in self.user_profiles:
            user_profile = self.user_profiles[user_id]
            
            # Use nickname if enabled
            if self.communication_style.use_nicknames:
                name = user_profile.get("name", "friend")
                if self.communication_style.nickname_preference == "friendly":
                    nicknames = [name, f"{name}!", f"Hey {name}", f"Hi {name}"]
                    personalized_response = f"{random.choice(nicknames)} {personalized_response}"
                elif self.communication_style.nickname_preference == "professional":
                    personalized_response = f"{name}, {personalized_response.lower()[:1].upper() + personalized_response[1:]}"
        
        # Add to interaction history
        self.interaction_history.append({
            "user_id": user_id,
            "message": message,
            "response": personalized_response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Trim history if too long
        if len(self.interaction_history) > 1000:  # Keep last 1000 interactions
            self.interaction_history = self.interaction_history[-500:]
        
        return personalized_response
    
    def get_interaction_analytics(self) -> Dict[str, Any]:
        """Get analytics about user interactions"""
        if not self.interaction_history:
            return {"message": "No interaction data available"}
        
        # Calculate analytics
        total_interactions = len(self.interaction_history)
        users_count = len(set(item["user_id"] for item in self.interaction_history))
        
        # Calculate average response length
        total_chars = sum(len(item["response"]) for item in self.interaction_history)
        avg_response_length = total_chars / total_interactions if total_interactions > 0 else 0
        
        # Time-based analytics
        first_interaction = datetime.fromisoformat(self.interaction_history[0]["timestamp"])
        last_interaction = datetime.fromisoformat(self.interaction_history[-1]["timestamp"])
        time_span_hours = (last_interaction - first_interaction).total_seconds() / 3600
        
        return {
            "total_interactions": total_interactions,
            "unique_users": users_count,
            "average_response_length": round(avg_response_length, 2),
            "time_span_hours": round(time_span_hours, 2),
            "interactions_per_user_avg": round(total_interactions / users_count, 2) if users_count > 0 else 0,
            "last_interaction": last_interaction.isoformat()
        }

# Predefined interaction style templates
INTERACTION_TEMPLATES = {
    "professional": {
        "communication_style": CommunicationStyle(
            greeting_frequency="once_per_session",
            use_nicknames=False,
            nickname_preference="professional",
            response_pacing="thoughtful",
            use_empathy_tokens=True,
            empathy_token_frequency=0.8,
            use_humor=False,
            humor_frequency=0.0,
            use_metaphors=True,
            metaphor_frequency=0.6,
            ask_follow_up_questions=True,
            follow_up_frequency=0.4
        ),
        "ui_customization": UIElementCustomization(
            theme_color_primary="#2c3e50",
            theme_color_secondary="#34495e",
            theme_color_accent="#3498db",
            background_style="solid",
            enable_quantum_particles=False,
            font_family="Arial, Helvetica, sans-serif",
            message_bubble_user="#3498db",
            message_bubble_ai="#ecf0f1",
            enable_typing_indicator=True,
            typing_indicator_style="text"
        )
    },
    "friendly": {
        "communication_style": CommunicationStyle(
            greeting_frequency="always",
            use_nicknames=True,
            nickname_preference="friendly",
            response_pacing="fast",
            use_empathy_tokens=True,
            empathy_token_frequency=0.6,
            use_humor=True,
            humor_frequency=0.4,
            use_metaphors=True,
            metaphor_frequency=0.3,
            ask_follow_up_questions=True,
            follow_up_frequency=0.6
        ),
        "ui_customization": UIElementCustomization(
            theme_color_primary="#1a2a6c",
            theme_color_secondary="#b21f1f",
            theme_color_accent="#00c6ff",
            background_style="gradient",
            enable_quantum_particles=True,
            particle_count=40,
            animation_speed=1.2,
            font_family="Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
            message_bubble_user="#0072ff",
            message_bubble_ai="#ff7e5f",
            enable_typing_indicator=True,
            typing_indicator_style="dots"
        )
    },
    "minimalist": {
        "communication_style": CommunicationStyle(
            greeting_frequency="rarely",
            use_nicknames=False,
            nickname_preference="professional",
            response_pacing="fast",
            use_empathy_tokens=False,
            empathy_token_frequency=0.1,
            use_humor=False,
            humor_frequency=0.0,
            use_metaphors=False,
            metaphor_frequency=0.0,
            ask_follow_up_questions=False,
            follow_up_frequency=0.1
        ),
        "ui_customization": UIElementCustomization(
            theme_color_primary="#ffffff",
            theme_color_secondary="#000000",
            theme_color_accent="#0000ff",
            background_style="solid",
            enable_quantum_particles=False,
            font_family="Helvetica, Arial, sans-serif",
            message_bubble_user="#e0e0e0",
            message_bubble_ai="#f5f5f5",
            enable_typing_indicator=False,
            typing_indicator_style="none"
        )
    }
}

def create_customized_interactor(template_name: str = "friendly", 
                               config: ModelCustomization = None) -> UserInteractionCustomizer:
    """
    Create an interactor with a predefined template
    """
    interactor = UserInteractionCustomizer(config)
    
    if template_name in INTERACTION_TEMPLATES:
        template = INTERACTION_TEMPLATES[template_name]
        interactor.set_communication_style(template["communication_style"])
        interactor.set_ui_customization(template["ui_customization"])
    else:
        # Use friendly as default
        template = INTERACTION_TEMPLATES["friendly"]
        interactor.set_communication_style(template["communication_style"])
        interactor.set_ui_customization(template["ui_customization"])
    
    return interactor

# Example usage
if __name__ == "__main__":
    print("=== Testing User Interaction Customization ===\n")
    
    # Create interactors with different templates
    friendly_interactor = create_customized_interactor("friendly")
    professional_interactor = create_customized_interactor("professional")
    minimalist_interactor = create_customized_interactor("minimalist")
    
    # Test user interaction
    test_user_id = "user_12345"
    test_message = "Hello, I need help with my project"
    
    print("Friendly Interactor:")
    print(f"Greeting: {friendly_interactor.customize_greeting(test_user_id)}")
    response = friendly_interactor.get_personalized_response(test_message, test_user_id)
    print(f"Response: {response}")
    print(f"UI Settings: {friendly_interactor.get_custom_ui_settings()}\n")
    
    print("Professional Interactor:")
    print(f"Greeting: {professional_interactor.customize_greeting(test_user_id)}")
    response = professional_interactor.get_personalized_response(test_message, test_user_id)
    print(f"Response: {response}")
    print(f"UI Settings: {professional_interactor.get_custom_ui_settings()}\n")
    
    print("Minimalist Interactor:")
    print(f"Greeting: {minimalist_interactor.customize_greeting(test_user_id)}")
    response = minimalist_interactor.get_personalized_response(test_message, test_user_id)
    print(f"Response: {response}")
    print(f"UI Settings: {minimalist_interactor.get_custom_ui_settings()}\n")
    
    # Show analytics
    print("Interaction Analytics:")
    analytics = friendly_interactor.get_interaction_analytics()
    print(analytics)