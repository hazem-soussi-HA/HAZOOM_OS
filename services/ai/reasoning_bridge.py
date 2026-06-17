#!/usr/bin/env python3
"""
HAZOOM OS - Enhanced Neural Bridge with DeepSeek Reasoning
============================================================
Integrates the DeepSeek Reasoning Engine with the existing
Neural Bridge for memory-augmented, self-verifying AI.

This module wraps the existing NeuralBridge with:
- Chain-of-Thought reasoning (step-by-step thinking)
- Self-verification (check own answers)
- Long-horizon planning (complex task decomposition)
- Reasoning memory (learn from pastSessions)

Philosophy: "Think before you speak, verify before you act."
"""

import sys
import json
import os
import time
import asyncio
import logging
import requests
from pathlib import Path
from datetime import datetime

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import existing bridge components
sys.path.insert(0, str(Path(__file__).parent))
try:
    from openrouter import OpenRouterManager as OpenRouterClient
    OPENROUTER_AVAILABLE = True
except ImportError:
    OPENROUTER_AVAILABLE = False
    OpenRouterClient = None

try:
    from knowledge_system import KnowledgeSystem
    KNOWLEDGE_AVAILABLE = True
except ImportError:
    KNOWLEDGE_AVAILABLE = False
    KnowledgeSystem = None

# Import DeepSeek Reasoning Engine
try:
    from core.reasoning import (
        DeepSeekReasoningEngine,
        ChainOfThought,
        SelfVerifier,
        TaskPlanner,
        ReasoningMemory,
    )
    REASONING_AVAILABLE = True
except ImportError as e:
    REASONING_AVAILABLE = False
    print(f"[Reasoning Bridge] Reasoning engine not available: {e}")

try:
    from hazoom_philosophy import CREATOR, VERSION, ConsciousnessState
except ImportError:
    CREATOR = "Hazem Soussi"
    VERSION = "4.0.0"
    ConsciousnessState = None

logger = logging.getLogger(__name__)


class ReasoningBridge:
    """
    Enhanced neural bridge with DeepSeek R1-style reasoning.
    
    Combines the existing OpenRouter integration with the new
    reasoning engine for:
    - Step-by-step chain-of-thought reasoning
    - Self-verification of answers
    - Long-horizon task planning
    - Persistent reasoning memory
    
    Falls back gracefully if reasoning engine is unavailable.
    """

    def __init__(self, config=None):
        config = config or {}
        self.script_dir = Path(__file__).parent
        
        # Initialize existing components
        self.openrouter = None
        self.knowledge = None
        self._init_legacy_components()
        
        # Initialize reasoning engine
        self.reasoning = None
        self.cot = None
        self.verifier = None
        self.planner = None
        self.memory = None
        
        if REASONING_AVAILABLE:
            try:
                reasoning_config = config.get('reasoning', {})
                self.reasoning = DeepSeekReasoningEngine(config=reasoning_config)
                self.cot = self.reasoning.cot
                self.verifier = self.reasoning.verifier
                self.planner = self.reasoning.planner
                self.memory = self.reasoning.memory
                logger.info("[Reasoning Bridge] DeepSeek engine active")
            except Exception as e:
                logger.warning(f"[Reasoning Bridge] Engine init failed: {e}")
        
        self.state = {
            'initialized': True,
            'openrouter_connected': self.openrouter is not None,
            'knowledge_loaded': self.knowledge is not None,
            'reasoning_active': self.reasoning is not None,
            'last_response': '',
            'context': [],
            'total_queries': 0,
            'reasoning_sessions': 0,
        }

    def _init_legacy_components(self):
        """Initialize OpenRouter and Knowledge System."""
        if OPENROUTER_AVAILABLE:
            try:
                self.openrouter = OpenRouterClient()
                logger.info("[Bridge] OpenRouter connected")
            except Exception as e:
                logger.warning(f"[Bridge] OpenRouter failed: {e}")
        
        if KNOWLEDGE_AVAILABLE:
            try:
                self.knowledge = KnowledgeSystem()
                logger.info("[Bridge] Knowledge System loaded")
            except Exception as e:
                logger.warning(f"[Bridge] Knowledge System failed: {e}")

    def think(self, query, mode='unified', system_prompt=None, 
              use_reasoning=True, context=None):
        """
        Enhanced thinking with optional DeepSeek reasoning.
        
        Args:
            query: The question/task
            mode: 'unified', 'deep_analysis', 'reasoning', 'fast'
            system_prompt: Optional system prompt for LLM
            use_reasoning: Whether to use the reasoning engine
            context: Optional context dict for reasoning
            
        Returns:
            dict with response, reasoning trace, confidence, etc.
        """
        self.state['total_queries'] += 1
        context = context or {}
        
        # Mode: use reasoning engine
        if use_reasoning and self.reasoning and mode in ('reasoning', 'unified'):
            return self._reasoned_think(query, context)
        
        # Mode: deep analysis with CoT
        if use_reasoning and self.cot and mode == 'deep_analysis':
            return self._cot_think(query, system_prompt)
        
        # Fallback: legacy OpenRouter call
        return self._legacy_think(query, mode, system_prompt)

    def _reasoned_think(self, query, context):
        """Use full DeepSeek reasoning pipeline."""
        start = time.time()
        self.state['reasoning_sessions'] += 1
        
        # Run through reasoning engine
        result = self.reasoning.reason(
            prompt=query,
            context=context,
            tags=context.get('tags', [])
        )
        
        # If we have OpenRouter, enhance with real LLM
        if self.openrouter and result['confidence'] < 0.7:
            try:
                llm_response = self._call_llm(query, result['answer'])
                result['answer'] = llm_response
                result['enhanced_by'] = 'openrouter'
            except Exception:
                pass
        
        result['duration'] = time.time() - start
        result['mode'] = 'reasoning'
        
        self.state['last_response'] = result['answer']
        return result

    def _cot_think(self, query, system_prompt):
        """Use Chain-of-Thought reasoning."""
        chain = self.cot.reason(query, {'system_prompt': system_prompt or ''})
        answer = self.cot.synthesize(chain)
        confidence = self.cot._confidence_score(chain)
        
        return {
            'response': answer,
            'answer': answer,
            'confidence': confidence,
            'reasoning_chain': chain.to_dict(),
            'mode': 'cot',
            'steps': len(chain.steps),
        }

    def _legacy_think(self, query, mode, system_prompt):
        """Legacy OpenRouter thinking."""
        context_str = ""
        if self.knowledge:
            try:
                related = self.knowledge.query(query, limit=3)
                if related:
                    context_str = f"Related: {json.dumps(related[:3])}"
            except Exception:
                pass
        
        full_prompt = (f"{system_prompt}\n\n{context_str}User: {query}\n\nAssistant:" 
                        if system_prompt else 
                        f"{context_str}User: {query}\n\nAssistant:")
        
        if self.openrouter:
            try:
                # openrouter.chat() is async — run it properly
                try:
                    loop = asyncio.get_running_loop()
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        future = pool.submit(
                            asyncio.run,
                            self.openrouter.chat(
                                messages=[{"role": "user", "content": full_prompt}],
                                model=self.openrouter.model
                            )
                        )
                        response = future.result(timeout=30)
                except RuntimeError:
                    response = asyncio.run(
                        self.openrouter.chat(
                            messages=[{"role": "user", "content": full_prompt}],
                            model=self.openrouter.model
                        )
                    )
                ai_response = response.get('content', '') if isinstance(response, dict) else str(response)
            except Exception as e:
                ai_response = f"AI error: {str(e)}"
        else:
            ai_response = f"[NO AI] Processing: {query}"
        
        self.state['last_response'] = ai_response
        return {
            'response': ai_response,
            'query': query,
            'mode': mode,
            'source': 'openrouter' if self.openrouter else 'fallback'
        }

    def _call_llm(self, query, reasoning_context):
        """Call OpenRouter LLM with reasoning context (async-safe)."""
        prompt = f"""Based on this reasoning analysis:
{reasoning_context}

Provide a clear, concise answer to: {query}"""
        
        # openrouter.chat() is async — run it properly
        try:
            loop = asyncio.get_running_loop()
            # We're inside an async context — create a task
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    self.openrouter.chat(
                        messages=[{"role": "user", "content": prompt}],
                        model=self.openrouter.model
                    )
                )
                response = future.result(timeout=30)
        except RuntimeError:
            # No running loop — safe to use asyncio.run directly
            response = asyncio.run(
                self.openrouter.chat(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.openrouter.model
                )
            )
        except Exception as e:
            logger.warning(f"LLM call failed: {e}")
            return ""
        
        return response.get('content', '') if isinstance(response, dict) else str(response)

    def plan(self, goal, context=None):
        """Create a task plan for a complex goal."""
        if not self.planner:
            return {'error': 'Planner not available'}
        
        plan = self.planner.plan(goal, context or {})
        return {
            'goal': plan.goal,
            'total_tasks': len(plan.tasks),
            'estimated_steps': plan.estimated_total_steps,
            'tasks': [
                {
                    'id': t.id,
                    'description': t.description,
                    'status': t.status.value,
                    'priority': t.priority,
                    'dependencies': t.dependencies,
                }
                for t in plan.tasks
            ]
        }

    def verify(self, reasoning_chain_dict):
        """Verify a reasoning chain."""
        if not self.verifier:
            return {'error': 'Verifier not available'}
        
        from core.reasoning import ReasoningChain
        chain = ReasoningChain.from_dict(reasoning_chain_dict)
        result = self.verifier.verify(chain)
        
        return {
            'is_valid': result.is_valid,
            'score': result.score,
            'issues': result.issues,
            'suggestions': result.suggestions,
        }

    def get_reasoning_stats(self):
        """Get reasoning engine statistics."""
        if self.reasoning:
            return self.reasoning.get_status()
        return {'error': 'Reasoning engine not available'}

    def get_memory_stats(self):
        """Get reasoning memory statistics."""
        if self.memory:
            return self.memory.get_analytics()
        return {'error': 'Memory not available'}

    def get_status(self):
        """Get full bridge status."""
        return {
            'initialized': self.state['initialized'],
            'openrouter_connected': self.state['openrouter_connected'],
            'knowledge_loaded': self.state['knowledge_loaded'],
            'reasoning_active': self.state['reasoning_active'],
            'context_size': len(self.state['context']),
            'total_queries': self.state['total_queries'],
            'reasoning_sessions': self.state['reasoning_sessions'],
            'version': VERSION if 'VERSION' in globals() else '4.0.0',
        }


def main():
    bridge = ReasoningBridge()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        args = sys.argv[2:] if len(sys.argv) > 2 else []
        
        if command == 'status':
            result = bridge.get_status()
        elif command == 'think':
            query = ' '.join(args) if args else 'Hello'
            result = bridge.think(query, use_reasoning=True)
        elif command == 'plan':
            goal = ' '.join(args) if args else 'Build a web app'
            result = bridge.plan(goal)
        elif command == 'stats':
            result = {
                'bridge': bridge.get_status(),
                'reasoning': bridge.get_reasoning_stats(),
                'memory': bridge.get_memory_stats(),
            }
        else:
            result = {'error': f'Unknown command: {command}'}
        
        print(json.dumps(result, indent=2, default=str))
    else:
        print("Reasoning Bridge v4.0.0 - DeepSeek Enhanced")
        print("Commands: status, think <query>, plan <goal>, stats")


if __name__ == '__main__':
    main()
