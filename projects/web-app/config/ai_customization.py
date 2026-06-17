"""
Hazoom AI Response Customization Module
Implements customizable AI responses and behavior based on configuration
"""

from typing import Dict, List, Optional
import asyncio
import time
import random
from hazoom_config import ModelCustomization, default_config

class CustomizableAIResponder:
    """
    AI responder with customizable behavior based on configuration
    """
    
    def __init__(self, config: ModelCustomization = None):
        self.config = config or default_config
        self.context_history = []
    
    def determine_intent_category(self, message: str) -> str:
        """
        Determine intent category based on message content and configuration
        """
        message_lower = message.lower()
        
        # Check custom intents first
        for category, keywords in self.config.intent_recognition.custom_intents.items():
            for keyword in keywords:
                if keyword.lower() in message_lower:
                    return category
        
        # Check default intents
        for category, keywords in self.config.intent_recognition.intent_categories.items():
            for keyword in keywords:
                if keyword.lower() in message_lower:
                    return category
        
        return "default"
    
    def generate_response(self, message: str, user_id: str = None) -> str:
        """
        Generate a customized response based on the message and configuration
        """
        start_time = time.time()
        
        # Determine intent category
        intent_category = self.determine_intent_category(message)
        
        # Get response template based on intent
        response_template = self.config.response_templates.get(intent_category, 
                                                             self.config.response_templates["default"])
        
        # Apply customization based on response style
        response = self._customize_response(response_template, intent_category)
        
        # Add positive affirmation based on empathy and enthusiasm levels
        if random.random() < (self.config.response_style.empathy_level / 10.0):
            affirmation = random.choice(self.config.positive_affirmations)
            response += f" {affirmation}"
        
        # Add context awareness if enabled
        if self.config.intent_recognition.enable_context_awareness and self.context_history:
            recent_context = self.context_history[-self.config.intent_recognition.context_memory_size:]
            if recent_context and random.random() < 0.3:  # 30% chance to reference context
                context_item = random.choice(recent_context)
                response += f" Regarding our previous conversation about '{context_item[:50]}...', "
        
        # Add to context history
        self.context_history.append(message)
        if len(self.context_history) > self.config.intent_recognition.context_memory_size:
            self.context_history.pop(0)
        
        # Simulate quantum fast processing
        if self.config.interaction_settings.enable_quantum_responses:
            processing_time = 0.1 / self.config.interaction_settings.quantum_boost_factor
            time.sleep(min(processing_time, 0.1))  # Cap at 100ms for realism
        
        end_time = time.time()
        response_time = end_time - start_time
        
        return response
    
    def _customize_response(self, template: str, intent_category: str) -> str:
        """
        Apply customization to response based on configuration
        """
        response = template
        
        # Adjust formality based on configuration
        if self.config.response_style.formality_level < 5:
            # Make more casual
            replacements = {
                "I understand": "I get it",
                "Certainly": "Sure",
                "Furthermore": "Plus",
                "Additionally": "Also"
            }
            for formal, casual in replacements.items():
                response = response.replace(formal, casual)
        elif self.config.response_style.formality_level > 8:
            # Make more formal
            replacements = {
                "Sure": "Certainly",
                "I get it": "I understand",
                "Plus": "Furthermore",
                "Also": "Additionally"
            }
            for casual, formal in replacements.items():
                response = response.replace(casual, formal)
        
        # Adjust response length based on configuration
        if self.config.response_style.response_length == "short":
            # Truncate longer responses
            sentences = response.split('. ')
            if len(sentences) > 2:
                response = '. '.join(sentences[:2]) + '.'
        elif self.config.response_style.response_length == "long":
            # Add more detail
            if intent_category == "question":
                response += " This is a complex topic with multiple dimensions worth exploring."
            elif intent_category == "problem":
                response += " I recommend considering multiple approaches to address this effectively."
        
        # Adjust tone based on configuration
        if self.config.response_style.tone == "friendly":
            response += " I'm here to help you succeed!"
        elif self.config.response_style.tone == "professional":
            response += " I'm providing expert guidance on this matter."
        
        return response
    
    async def generate_response_async(self, message: str, user_id: str = None) -> str:
        """
        Asynchronously generate a customized response
        """
        # Simulate typing if enabled
        if self.config.interaction_settings.enable_typing_simulation:
            estimated_chars = len(message) * 0.7  # Estimate characters to type
            min_speed, max_speed = self.config.interaction_settings.typing_speed_range
            estimated_time = estimated_chars / random.uniform(min_speed, max_speed)
            
            # Cap typing simulation to max response time
            max_time = self.config.interaction_settings.max_response_time_ms / 1000.0
            await asyncio.sleep(min(estimated_time, max_time))
        
        return self.generate_response(message, user_id)
    
    def update_config(self, new_config: ModelCustomization):
        """
        Update the configuration for this responder
        """
        self.config = new_config
    
    def add_custom_intent(self, category: str, keywords: List[str]):
        """
        Add a custom intent category with keywords
        """
        self.config.intent_recognition.custom_intents[category] = keywords
    
    def get_response_statistics(self) -> Dict:
        """
        Get statistics about responses generated
        """
        return {
            "total_responses": len(self.context_history),
            "config_version": self.config.version,
            "response_style": {
                "tone": self.config.response_style.tone,
                "formality": self.config.response_style.formality_level,
                "empathy": self.config.response_style.empathy_level
            }
        }

# Example custom responder classes for different personalities
class OptimisticResponder(CustomizableAIResponder):
    """
    A responder with extra optimistic personality
    """
    def __init__(self):
        super().__init__()
        # Override with optimistic settings
        self.config.response_style.tone = "positive"
        self.config.response_style.enthusiasm_level = 10
        self.config.positive_affirmations.extend([
            "This is exciting!",
            "I'm thrilled to help!",
            "Amazing perspective!",
            "You're going to do great!",
            "Fantastic approach!"
        ])
    
    def generate_response(self, message: str, user_id: str = None) -> str:
        response = super().generate_response(message, user_id)
        # Add extra optimism
        if random.random() < 0.5:  # 50% chance
            response += " I'm genuinely excited to help you with this!"
        return response

class ProfessionalResponder(CustomizableAIResponder):
    """
    A responder with professional, business-focused personality
    """
    def __init__(self):
        super().__init__()
        # Override with professional settings
        self.config.response_style.tone = "professional"
        self.config.response_style.formality_level = 9
        self.config.response_style.empathy_level = 7
        self.config.interaction_settings.greeting_message = (
            "Good day. I'm Hazoom, your professional AI assistant. "
            "Ready to provide expert guidance for your business objectives."
        )
        self.config.response_templates.update({
            "greeting": "Welcome. I'm prepared to offer professional assistance with your goals.",
            "help": "I'm ready to provide expert guidance. How may I assist with your objectives?",
            "question": "That's an insightful question. Let me provide you with a comprehensive answer.",
            "goal": "I appreciate your business objectives. Here's a strategic approach to achieve them.",
            "problem": "I understand your business challenge. Let's develop a strategic solution.",
            "default": "I'm here to provide professional guidance and strategic insights."
        })

class CreativeResponder(CustomizableAIResponder):
    """
    A responder with creative, innovative personality
    """
    def __init__(self):
        super().__init__()
        # Override with creative settings
        self.config.response_style.tone = "friendly"
        self.config.response_style.enthusiasm_level = 9
        self.config.response_style.empathy_level = 8
        self.config.positive_affirmations.extend([
            "Creative thinking!",
            "Innovative approach!",
            "Great imagination!",
            "Wonderful creativity!",
            "Brilliant ideas!"
        ])
        self.config.response_templates.update({
            "greeting": "Hey there, creative mind! Ready to explore amazing possibilities together?",
            "help": "I'm here to spark creativity and help you innovate!",
            "question": "What an interesting creative challenge! Let's think outside the box.",
            "goal": "Your creative goals inspire me! Let's craft something amazing together.",
            "problem": "Every creative challenge is a chance for innovation. Let's brainstorm!",
            "default": "I'm here to nurture your creativity and support your innovative journey."
        })

# Factory function to create responders with different personalities
def create_responder(personality: str = "default") -> CustomizableAIResponder:
    """
    Factory function to create responders with different personalities
    """
    if personality == "optimistic":
        return OptimisticResponder()
    elif personality == "professional":
        return ProfessionalResponder()
    elif personality == "creative":
        return CreativeResponder()
    else:
        return CustomizableAIResponder()

# Example usage
if __name__ == "__main__":
    # Create different responder personalities
    default_responder = create_responder("default")
    optimistic_responder = create_responder("optimistic")
    professional_responder = create_responder("professional")
    creative_responder = create_responder("creative")
    
    # Test messages
    test_messages = [
        "Hello, how are you?",
        "I need help with my project",
        "What do you think about artificial intelligence?",
        "I'm having trouble with my goals",
        "Can you help me achieve success?"
    ]
    
    print("=== Default Responder ===")
    for msg in test_messages:
        response = default_responder.generate_response(msg)
        print(f"Q: {msg}")
        print(f"A: {response}\n")
    
    print("=== Optimistic Responder ===")
    for msg in test_messages[:2]:  # Just test a couple
        response = optimistic_responder.generate_response(msg)
        print(f"Q: {msg}")
        print(f"A: {response}\n")
    
    print("=== Professional Responder ===")
    for msg in test_messages[:2]:  # Just test a couple
        response = professional_responder.generate_response(msg)
        print(f"Q: {msg}")
        print(f"A: {response}\n")
    
    print("=== Creative Responder ===")
    for msg in test_messages[:2]:  # Just test a couple
        response = creative_responder.generate_response(msg)
        print(f"Q: {msg}")
        print(f"A: {response}\n")