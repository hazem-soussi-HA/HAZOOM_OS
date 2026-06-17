#!/usr/bin/env python3
"""
Alpha Pony OpenRouter Integration
Secure AI model connection with Bitcoin token pricing logic
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path

class OpenRouterManager:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.config_file = self.base_dir / 'security' / 'openrouter_config.json'
        self.api_key = None
        self.model = 'anthropic/claude-3-haiku'
        self.max_tokens = 1000
        self.temperature = 0.7
        
        # BTC/USD rate (rough estimate - user can update)
        self.btc_usd_rate = 65000.0
        
        # Token pricing per 1M tokens (USD) - Updated pricing
        self.model_pricing_usd = {
            'anthropic/claude-3-haiku': {'input': 0.25, 'output': 1.25},
            'anthropic/claude-3-sonnet': {'input': 3.0, 'output': 15.0},
            'anthropic/claude-3-opus': {'input': 15.0, 'output': 75.0},
            'anthropic/claude-3.5-sonnet': {'input': 3.0, 'output': 15.0},
            'openai/gpt-4o': {'input': 5.0, 'output': 15.0},
            'openai/gpt-4o-mini': {'input': 0.15, 'output': 0.60},
            'openai/gpt-4-turbo': {'input': 10.0, 'output': 30.0},
            'meta-llama/llama-3-8b-instruct': {'input': 0.0, 'output': 0.0},
            'meta-llama/llama-3-70b-instruct': {'input': 0.65, 'output': 2.75},
            'meta-llama/llama-3.1-8b-instruct': {'input': 0.0, 'output': 0.0},
            'meta-llama/llama-3.1-70b-instruct': {'input': 0.65, 'output': 2.75},
            'google/gemini-pro': {'input': 0.125, 'output': 0.375},
            'google/gemini-flash': {'input': 0.0, 'output': 0.0},
            'mistralai/mistral-7b-instruct': {'input': 0.0, 'output': 0.0},
            'mistralai/mixtral-8x7b-instruct': {'input': 0.24, 'output': 0.24},
            'deepseek/deepseek-chat': {'input': 0.0, 'output': 0.0},
            'deepseek/deepseek-coder': {'input': 0.0, 'output': 0.0},
            'openrouter/elephant-alpha': {'input': 0.0, 'output': 0.0},
        }
        
        # Budget in satoshis (1 BTC = 100,000,000 sats)
        # Default: 5000 sats (~0.00005 BTC = ~$3.25)
        self.daily_limit_sats = 5000
        self.daily_spent_sats = 0
        self.last_reset = datetime.now().date()
        
        self.load_config()
    
    def usd_to_sats(self, usd_amount):
        """Convert USD to satoshis"""
        btc_amount = usd_amount / self.btc_usd_rate
        return int(btc_amount * 100_000_000)
    
    def sats_to_btc(self, sats):
        """Convert satoshis to BTC"""
        return sats / 100_000_000
    
    def sats_to_usd(self, sats):
        """Convert satoshis to USD"""
        return self.sats_to_btc(sats) * self.btc_usd_rate
    
    def load_config(self):
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    self.api_key = config.get('api_key', '')
                    self.model = config.get('model', self.model)
                    self.max_tokens = config.get('max_tokens', self.max_tokens)
                    self.temperature = config.get('temperature', self.temperature)
                    self.daily_limit_sats = config.get('daily_limit_sats', self.daily_limit_sats)
                    self.daily_spent_sats = config.get('daily_spent_sats', 0)
                    self.btc_usd_rate = config.get('btc_usd_rate', self.btc_usd_rate)
                    
                    if datetime.now().date() > self.last_reset:
                        self.daily_spent_sats = 0
                        self.last_reset = datetime.now().date()
                        
                    return True
            except:
                pass
        return False
    
    def save_config(self):
        self.config_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_file, 'w') as f:
            json.dump({
                'api_key': self.api_key,
                'model': self.model,
                'max_tokens': self.max_tokens,
                'temperature': self.temperature,
                'daily_limit_sats': self.daily_limit_sats,
                'daily_spent_sats': self.daily_spent_sats,
                'btc_usd_rate': self.btc_usd_rate,
                'last_reset': str(self.last_reset)
            }, f, indent=2)
    
    def set_api_key(self, key):
        self.api_key = key.strip()
        self.save_config()
        return True
    
    def set_model(self, model):
        if model in self.model_pricing_usd:
            self.model = model
            self.save_config()
            return True
        return False
    
    def set_daily_limit(self, sats):
        self.daily_limit_sats = sats
        self.save_config()
    
    def get_models(self):
        return list(self.model_pricing_usd.keys())
    
    def get_free_models(self):
        return [m for m, p in self.model_pricing_usd.items() 
                if p['input'] == 0 and p['output'] == 0]
    
    def calculate_cost_sats(self, input_tokens, output_tokens):
        if self.model not in self.model_pricing_usd:
            return 0
        pricing = self.model_pricing_usd[self.model]
        cost_usd = (input_tokens / 1_000_000 * pricing['input'] +
                output_tokens / 1_000_000 * pricing['output'])
        return self.usd_to_sats(cost_usd)
    
    def can_afford(self, estimated_tokens=1000):
        estimated_cost = self.calculate_cost_sats(estimated_tokens, estimated_tokens)
        return (self.daily_spent_sats + estimated_cost) <= self.daily_limit_sats
    
    def track_spent(self, input_tokens, output_tokens):
        cost = self.calculate_cost_sats(input_tokens, output_tokens)
        self.daily_spent_sats += cost
        self.save_config()
        return cost
    
    def get_status(self):
        return {
            'api_key_set': bool(self.api_key),
            'api_key_preview': self.api_key[:8] + '...' + self.api_key[-4:] if self.api_key else None,
            'model': self.model,
            'pricing_usd': self.model_pricing_usd.get(self.model, {}),
            'daily_limit_sats': self.daily_limit_sats,
            'daily_limit_btc': self.sats_to_btc(self.daily_limit_sats),
            'daily_spent_sats': self.daily_spent_sats,
            'daily_spent_btc': self.sats_to_btc(self.daily_spent_sats),
            'daily_remaining_sats': self.daily_limit_sats - self.daily_spent_sats,
            'daily_remaining_btc': self.sats_to_btc(self.daily_limit_sats - self.daily_spent_sats),
            'btc_usd_rate': self.btc_usd_rate,
            'can_afford': self.can_afford()
        }
    
    async def chat(self, messages, model=None):
        if not self.api_key:
            return {'error': 'API key not set', 'code': 'NO_API_KEY'}
        
        if not self.can_afford():
            return {'error': 'Daily budget exceeded', 'code': 'BUDGET_EXCEEDED'}
        
        if model:
            self.model = model
        
        try:
            import urllib.request
            import urllib.error
            
            url = "https://openrouter.ai/api/v1/chat/completions"
            
            data = {
                'model': self.model,
                'messages': messages,
                'max_tokens': self.max_tokens,
                'temperature': self.temperature
            }
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://alphapony.local',
                'X-Title': 'Alpha Pony Neural Interface'
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(data).encode('utf-8'),
                headers=headers,
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                if 'choices' in result and len(result['choices']) > 0:
                    choice = result['choices'][0]
                    message = choice.get('message', {})
                    content = message.get('content', '')
                    
                    usage = result.get('usage', {})
                    input_tokens = usage.get('prompt_tokens', 0)
                    output_tokens = usage.get('completion_tokens', 0)
                    cost_sats = self.track_spent(input_tokens, output_tokens)
                    
                    return {
                        'success': True,
                        'content': content,
                        'model': self.model,
                        'usage': {
                            'input_tokens': input_tokens,
                            'output_tokens': output_tokens,
                            'cost_sats': cost_sats,
                            'cost_btc': self.sats_to_btc(cost_sats)
                        },
                        'status': self.get_status()
                    }
                else:
                    return {'error': 'Invalid response', 'code': 'INVALID_RESPONSE'}
                    
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else '{}'
            try:
                error_data = json.loads(error_body)
                error_msg = error_data.get('error', {}).get('message', str(e))
            except:
                error_msg = str(e)
            return {'error': error_msg, 'code': 'HTTP_ERROR', 'status_code': e.code}
            
        except Exception as e:
            return {'error': str(e), 'code': 'EXCEPTION'}


def chat_sync(messages, model=None):
    manager = OpenRouterManager()
    return manager.chat(messages, model)


def main():
    manager = OpenRouterManager()
    import sys
    
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        
        if cmd == 'status':
            print(json.dumps(manager.get_status(), indent=2))
        elif cmd == 'models':
            print("Available models (pricing in satoshis):")
            for m in manager.get_models():
                p = manager.model_pricing_usd[m]
                cost_usd = p['input'] + p['output']
                cost_sats = manager.usd_to_sats(cost_usd) if cost_usd > 0 else 0
                free = "FREE" if cost_usd == 0 else f"{cost_sats} sats/1M"
                print(f"  {m}: {free}")
        elif cmd == 'free':
            print("Free models:")
            for m in manager.get_free_models():
                print(f"  {m}")
        elif cmd == 'set-key':
            if len(sys.argv) > 2:
                manager.set_api_key(sys.argv[2])
                print("API key saved!")
        elif cmd == 'set-model':
            if len(sys.argv) > 2:
                if manager.set_model(sys.argv[2]):
                    print(f"Model set to {sys.argv[2]}")
                else:
                    print("Unknown model")
        elif cmd == 'set-limit':
            if len(sys.argv) > 2:
                sats = int(sys.argv[2])
                manager.set_daily_limit(sats)
                print(f"Daily limit set to {sats} sats ({manager.sats_to_btc(sats)} BTC)")
    else:
        status = manager.get_status()
        print(f"""
Alpha Pony OpenRouter Status
============================
API Key: {'Set' if status['api_key_set'] else 'Not set'}
Model: {status['model']}
BTC/USD Rate: ${status['btc_usd_rate']:,.2f}
Daily Limit: {status['daily_limit_sats']} sats ({status['daily_limit_btc']:.8f} BTC)
Daily Spent: {status['daily_spent_sats']} sats ({status['daily_spent_btc']:.8f} BTC)
Remaining: {status['daily_remaining_sats']} sats ({status['daily_remaining_btc']:.8f} BTC)
""")


if __name__ == '__main__':
    main()
