# AlphaPony Local AI Agent
# Using local Ollama model as intelligent agent

import requests
import json
import sys
from typing import Optional

class AlphaAgent:
    def __init__(self, model: str = "deepseek-coder:6.7b"):
        self.model = model
        self.ollama_url = "http://localhost:11434"
        self.system_prompt = """You are an expert software developer. 
Solve tasks by analyzing code, creating fixes, and testing.
Always complete with: echo COMPLETE_TASK_AND_SUBMIT_FINAL_OUTPUT"""
        
    def chat(self, prompt: str, stream: bool = False) -> str:
        """Send chat to local model"""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
            "stream": stream
        }
        
        try:
            resp = requests.post(
                f"{self.ollama_url}/api/chat",
                json=payload,
                timeout=120
            )
            if resp.status_code == 200:
                return resp.json()["message"]["content"]
            else:
                return f"Error: {resp.status_code}"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def run_task(self, task: str) -> str:
        """Run a task"""
        return self.chat(task)

if __name__ == "__main__":
    agent = AlphaAgent()
    
    if len(sys.argv) > 1:
        task = " ".join(sys.argv[1:])
    else:
        task = "Hello"
    
    print(f"Running with {agent.model}...")
    print(agent.run_task(task))