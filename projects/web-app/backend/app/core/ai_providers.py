"""
AI Provider Abstraction Layer
Supports multiple AI services like OpenAI, Google Gemini, Ollama, etc.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from enum import Enum


class AIProviderType(Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    OLLAMA = "ollama"


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    def chat(self, message: str, system_prompt: str = None, **kwargs) -> str:
        """Send a chat message to the AI provider"""
        pass
    
    @abstractmethod
    def generate_completion(self, prompt: str, **kwargs) -> str:
        """Generate a completion based on the prompt"""
        pass


class OpenAIProvider(AIProvider):
    """OpenAI provider implementation"""
    
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model = model
    
    def chat(self, message: str, system_prompt: str = None, **kwargs) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": message})
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            **kwargs
        )
        
        content = response.choices[0].message.content
        if not content:
            raise Exception("No response from OpenAI")
        return content
    
    def generate_completion(self, prompt: str, **kwargs) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            **kwargs
        )
        
        content = response.choices[0].message.content
        if not content:
            raise Exception("No response from OpenAI")
        return content


class GeminiProvider(AIProvider):
    """Google Gemini provider implementation"""
    
    def __init__(self, api_key: str, model: str = "gemini-pro"):
        try:
            import google.generativeai as genai
            self.model_name = model
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model)
        except ImportError:
            raise ImportError("google-generativeai package is required for Gemini provider. Install with: pip install google-generativeai")
    
    def chat(self, message: str, system_prompt: str = None, **kwargs) -> str:
        # Build the prompt with system message if provided
        if system_prompt:
            prompt = f"System: {system_prompt}\n\nUser: {message}"
        else:
            prompt = message
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def generate_completion(self, prompt: str, **kwargs) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")


class OllamaProvider(AIProvider):
    """Ollama provider implementation for local models"""
    
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama2"):
        self.base_url = base_url
        self.model = model
        # Import requests here so it's not required for other providers
        import requests
        self.requests = requests
    
    def chat(self, message: str, system_prompt: str = None, **kwargs) -> str:
        url = f"{self.base_url}/api/chat"
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": message})
        
        data = {
            "model": self.model,
            "messages": messages,
            "stream": False
        }
        data.update(kwargs)  # Add any additional parameters
        
        try:
            response = self.requests.post(url, json=data)
            response.raise_for_status()
            result = response.json()
            return result['message']['content']
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")
    
    def generate_completion(self, prompt: str, **kwargs) -> str:
        url = f"{self.base_url}/api/generate"
        
        data = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        data.update(kwargs)  # Add any additional parameters
        
        try:
            response = self.requests.post(url, json=data)
            response.raise_for_status()
            result = response.json()
            return result['response']
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")


def get_ai_provider(provider_type: AIProviderType, **config) -> AIProvider:
    """Factory function to create AI provider instances"""
    if provider_type == AIProviderType.OPENAI:
        return OpenAIProvider(
            api_key=config.get('api_key'),
            model=config.get('model', 'gpt-3.5-turbo')
        )
    elif provider_type == AIProviderType.GEMINI:
        return GeminiProvider(
            api_key=config.get('api_key'),
            model=config.get('model', 'gemini-pro')
        )
    elif provider_type == AIProviderType.OLLAMA:
        return OllamaProvider(
            base_url=config.get('base_url', 'http://localhost:11434'),
            model=config.get('model', 'llama2')
        )
    else:
        raise ValueError(f"Unsupported AI provider type: {provider_type}")