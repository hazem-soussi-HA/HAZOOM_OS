"""
Test script for the Hazoom Unified Intelligent Model
"""

import asyncio
from unified_intelligent_model import create_unified_model

def test_unified_model():
    print("=== Testing Hazoom Unified Intelligent Model ===\n")
    
    # Create different model personalities
    balanced_model = create_unified_model("balanced", "friendly")
    optimistic_model = create_unified_model("optimistic", "friendly")
    professional_model = create_unified_model("professional", "professional")
    creative_model = create_unified_model("creative", "friendly")
    
    # Test messages
    test_messages = [
        "Hello, how are you?",
        "I need help with my project",
        "What do you think about artificial intelligence?",
        "I'm having trouble with my goals",
        "Can you help me achieve success?",
        "I achieved my goal!",
        "I'm feeling stressed",
        "How can I improve my productivity?"
    ]
    
    print("=== Balanced Model Responses ===")
    for msg in test_messages[:3]:
        result = balanced_model.process_input(msg, "test_user_1")
        print(f"Q: {msg}")
        print(f"A: {result['response']}")
        print(f"Response Time: {result['response_time']:.3f}s")
        print(f"Tokens Used: {result['tokens_used']}")
        print()
    
    print("=== Optimistic Model Responses ===")
    for msg in test_messages[3:5]:
        result = optimistic_model.process_input(msg, "test_user_2")
        print(f"Q: {msg}")
        print(f"A: {result['response']}")
        print(f"Response Time: {result['response_time']:.3f}s")
        print(f"Tokens Used: {result['tokens_used']}")
        print()
    
    print("=== Professional Model Responses ===")
    for msg in test_messages[5:7]:
        result = professional_model.process_input(msg, "test_user_3")
        print(f"Q: {msg}")
        print(f"A: {result['response']}")
        print(f"Response Time: {result['response_time']:.3f}s")
        print(f"Tokens Used: {result['tokens_used']}")
        print()
    
    print("=== Creative Model Responses ===")
    for msg in test_messages[7:]:
        result = creative_model.process_input(msg, "test_user_4")
        print(f"Q: {msg}")
        print(f"A: {result['response']}")
        print(f"Response Time: {result['response_time']:.3f}s")
        print(f"Tokens Used: {result['tokens_used']}")
        print()
    
    # Show performance metrics
    print("=== Performance Metrics ===")
    metrics = balanced_model.get_performance_metrics()
    for key, value in metrics.items():
        print(f"{key}: {value}")
    
    # Test configuration updates
    print("\n=== Testing Configuration Updates ===")
    from unified_intelligent_model import UnifiedModelConfig
    
    new_config = UnifiedModelConfig()
    new_config.ai_response_style = "optimistic"
    new_config.interaction_template = "professional"
    new_config.quantum_boost_factor = 3.0
    
    balanced_model.update_config(new_config)
    
    result = balanced_model.process_input("How are you doing now?", "test_user_5")
    print(f"Updated model response: {result['response']}")
    print(f"New configuration: {balanced_model.config.ai_response_style}, {balanced_model.config.interaction_template}")
    
    print("\n=== Test Complete ===")

def test_async_functionality():
    print("\n=== Testing Async Functionality ===")
    
    async def async_test():
        model = create_unified_model("balanced", "friendly")
        
        result = await model.process_input_async("Async test message", "async_test_user")
        print(f"Async response: {result['response']}")
        print(f"Async response time: {result['response_time']:.3f}s")
    
    asyncio.run(async_test())

if __name__ == "__main__":
    test_unified_model()
    test_async_functionality()