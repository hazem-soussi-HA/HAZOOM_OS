import requests
import json
from typing import Optional, Dict

class LocalModelClient:
    def __init__(self, host: str = "http://localhost:11434",
model_name: str = "llama2"):
        self.host = host
        self.model_name = model_name
        self.base_url = f"{self.host}/api"

    def chat(self, prompt: str, system_prompt: Optional[str] = None)
-> str:
        """Send a chat request to the local model."""
        payload = {
            "model": self.model_name,
            "messages": [],
            "stream": False  # Set to True for streaming responses
        }

        if system_prompt:
            payload["messages"].append({"role": "system", "content":
system_prompt})

        payload["messages"].append({"role": "user", "content":
prompt})

        try:
            response = requests.post(f"{self.base_url}/chat",
json=payload, timeout=60)
            response.raise_for_status()
            result = response.json()
            return result.get("message", {}).get("content", "No
content returned.")

        except requests.exceptions.RequestException as e:
            return f"Error connecting to local API: {e}"

    def list_models(self):
        """List available models."""
        try:
            response = requests.get(f"{self.base_url}/tags")
            response.raise_for_status()
            return [m["name"] for m in response.json().get("models",
[])]
        except Exception as e:
            return f"Error listing models: {e}"

# Usage Example
if __name__ == "__main__":
    # Ensure your local API (e.g., Ollama) is running
    client = LocalModelClient(host="http://localhost:11434",
model_name="llama2")

    print("Available Models:", client.list_models())

    response = client.chat(
        prompt="Explain the concept of agentic coding in one
sentence.",
        system_prompt="You are a helpful coding assistant."
    )
    print("\nModel Response:")
    print(response)
