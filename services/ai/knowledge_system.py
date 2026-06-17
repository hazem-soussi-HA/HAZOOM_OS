#!/usr/bin/env python3
"""
Alpha Pony Knowledge Integration
Memory, Knowledge Graph, and Email Intelligence

Philosophy: "Everything is connected and nothing comes from nothing"
Using the shared Hazoom Philosophy module
"""

import json
import os
from datetime import datetime
from pathlib import Path

from hazoom_philosophy import (
    CREATOR, VERSION, SystemConfig, NeuralCoreParams,
    PRINCIPLES, LAWS, get_system_info
)

class KnowledgeGraph:
    def __init__(self):
        self.nodes = {}
        self.edges = []
        self.node_count = 0
        
    def add_node(self, concept, attributes=None):
        if concept not in self.nodes:
            self.nodes[concept] = {
                'id': concept,
                'attributes': attributes or {},
                'connections': [],
                'activation': 0.5,
                'created': datetime.now().isoformat()
            }
            self.node_count += 1
        return self.nodes[concept]
    
    def add_edge(self, source, target, weight=0.5):
        if source in self.nodes and target in self.nodes:
            edge = {
                'source': source,
                'target': target,
                'weight': weight,
                'created': datetime.now().isoformat()
            }
            self.edges.append(edge)
            self.nodes[source]['connections'].append(target)
            return True
        return False
    
    def get_neighbors(self, concept):
        if concept in self.nodes:
            return self.nodes[concept]['connections']
        return []
    
    def activate(self, concept, amount=0.1):
        if concept in self.nodes:
            self.nodes[concept]['activation'] = min(1.0, 
                self.nodes[concept]['activation'] + amount)
            for neighbor in self.get_neighbors(concept):
                self.activate(neighbor, amount * 0.5)
    
    def get_active_concepts(self, threshold=0.7):
        return [(k, v['activation']) for k, v in self.nodes.items() 
                if v['activation'] >= threshold]
    
    def decay(self, rate=0.01):
        for node in self.nodes.values():
            node['activation'] = max(0, node['activation'] - rate)
    
    def to_dict(self):
        return {
            'nodes': self.nodes,
            'edges': self.edges,
            'node_count': self.node_count
        }
    
    def from_dict(self, data):
        self.nodes = data.get('nodes', {})
        self.edges = data.get('edges', [])
        self.node_count = data.get('node_count', len(self.nodes))


class Memory:
    def __init__(self, max_memories=100):
        self.episodic = []
        self.semantic = KnowledgeGraph()
        self.working = []
        self.max_memories = max_memories
        
    def store_episode(self, event, context=None):
        memory = {
            'event': event,
            'context': context or {},
            'timestamp': datetime.now().isoformat()
        }
        self.episodic.append(memory)
        if len(self.episodic) > self.max_memories:
            self.episodic.pop(0)
        return memory
    
    def recall_recent(self, count=10):
        return self.episodic[-count:]
    
    def search(self, query):
        results = []
        query_lower = query.lower()
        for memory in self.episodic:
            if query_lower in memory['event'].lower():
                results.append(memory)
        return results
    
    def add_semantic(self, concept, attributes=None):
        return self.semantic.add_node(concept, attributes)
    
    def link_semantic(self, source, target, weight=0.5):
        return self.semantic.add_edge(source, target, weight)
    
    def get_knowledge(self):
        return self.semantic.to_dict()
    
    def decay_all(self):
        self.semantic.decay()
    
    def to_dict(self):
        return {
            'episodic': self.episodic,
            'semantic': self.semantic.to_dict(),
            'working': self.working
        }
    
    def from_dict(self, data):
        self.episodic = data.get('episodic', [])
        self.semantic.from_dict(data.get('semantic', {}))
        self.working = data.get('working', [])


class EmailIntelligence:
    def __init__(self):
        self.inbox = []
        self.important = []
        self.context = {}
        
    def process_email(self, email_data):
        processed = {
            'from': email_data.get('from', 'Unknown'),
            'subject': email_data.get('subject', ''),
            'body': email_data.get('body', ''),
            'timestamp': email_data.get('timestamp', datetime.now().isoformat()),
            'importance': self.assess_importance(email_data),
            'topics': self.extract_topics(email_data),
            'entities': self.extract_entities(email_data),
            'sentiment': self.analyze_sentiment(email_data)
        }
        self.inbox.append(processed)
        return processed
    
    def assess_importance(self, email):
        score = 0.5
        subject = email.get('subject', '').lower()
        if any(word in subject for word in ['urgent', 'important', 'asap', 'critical']):
            score += 0.3
        if any(word in subject for word in ['meeting', 'deadline', 'action']):
            score += 0.2
        return min(1.0, score)
    
    def extract_topics(self, email):
        body = email.get('body', '').lower()
        topics = []
        topic_keywords = {
            'work': ['project', 'task', 'deadline', 'meeting', 'report'],
            'personal': ['family', 'friend', 'home', 'health'],
            'finance': ['payment', 'invoice', 'money', 'budget'],
            'tech': ['code', 'bug', 'deploy', 'server', 'api']
        }
        for topic, keywords in topic_keywords.items():
            if any(word in body for word in keywords):
                topics.append(topic)
        return topics
    
    def extract_entities(self, email):
        return {
            'senders': [email.get('from', 'Unknown')],
            'mentioned_dates': [],
            'mentioned_tasks': []
        }
    
    def analyze_sentiment(self, email):
        body = email.get('body', '').lower()
        positive = sum(1 for w in ['thanks', 'great', 'good', 'excellent', 'appreciate'] if w in body)
        negative = sum(1 for w in ['sorry', 'issue', 'problem', 'delay', 'concern'] if w in body)
        if positive > negative:
            return 'positive'
        elif negative > positive:
            return 'negative'
        return 'neutral'
    
    def get_context(self):
        return {
            'total_emails': len(self.inbox),
            'important_count': len([e for e in self.inbox if e['importance'] > 0.7]),
            'topics': list(set(t for e in self.inbox for t in e['topics'])),
            'recent_sender': self.inbox[-1]['from'] if self.inbox else None
        }
    
    def to_dict(self):
        return {
            'inbox': self.inbox,
            'context': self.context
        }


class KnowledgeSystem:
    def __init__(self, data_dir=None):
        if data_dir is None:
            data_dir = Path(__file__).parent / 'knowledge'
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        self.memory = Memory()
        self.email = EmailIntelligence()
        self.knowledge_graph = self.memory.semantic
        
    def learn(self, information, context=None):
        self.memory.store_episode(information, context)
        
        words = information.split()
        for word in words:
            if len(word) > 4:
                self.memory.add_semantic(word)
        
        for i in range(len(words) - 1):
            if len(words[i]) > 4 and len(words[i+1]) > 4:
                self.memory.link_semantic(words[i], words[i+1])
                
        return True
    
    def remember(self, query):
        episodic = self.memory.search(query)
        semantic_results = self.knowledge_graph.get_neighbors(query)
        return {
            'episodic': episodic,
            'semantic': semantic_results
        }

    def query(self, query, limit=5):
        """Search knowledge base for related information."""
        results = []
        # Search episodic memory
        episodic = self.memory.search(query)
        for ep in episodic[:limit]:
            results.append({'type': 'episodic', 'event': ep.get('event', ''), 'timestamp': ep.get('timestamp', '')})
        # Search semantic graph
        neighbors = self.knowledge_graph.get_neighbors(query)
        for n in neighbors[:limit]:
            results.append({'type': 'semantic', 'concept': n})
        # Search knowledge graph nodes
        for concept, node in self.knowledge_graph.nodes.items():
            if query.lower() in concept.lower():
                results.append({'type': 'concept', 'name': concept, 'activation': node.get('activation', 0)})
        return results[:limit]

    def clear(self):
        """Clear all knowledge."""
        self.memory = Memory()
        self.email = EmailIntelligence()
    
    def think(self, topic):
        self.knowledge_graph.activate(topic, 0.3)
        active = self.knowledge_graph.get_active_concepts(0.6)
        return {
            'focus': topic,
            'active_concepts': active,
            'associations': self.knowledge_graph.get_neighbors(topic)
        }
    
    def process_email_intelligence(self, email_data):
        result = self.email.process_email(email_data)
        self.learn(f"Email from {result['from']}: {result['subject']}", 
                  context={'topics': result['topics'], 'importance': result['importance']})
        return result
    
    def get_system_status(self):
        self.memory.decay_all()
        return {
            'episodic_memories': len(self.memory.episodic),
            'knowledge_concepts': self.knowledge_graph.node_count,
            'knowledge_connections': len(self.knowledge_graph.edges),
            'email_context': self.email.get_context(),
            'active_knowledge': self.knowledge_graph.get_active_concepts(0.5)
        }
    
    def save(self):
        state = {
            'memory': self.memory.to_dict(),
            'email': self.email.to_dict(),
            'saved_at': datetime.now().isoformat()
        }
        path = self.data_dir / 'knowledge_state.json'
        with open(path, 'w') as f:
            json.dump(state, f, indent=2)
        return str(path)
    
    def load(self):
        path = self.data_dir / 'knowledge_state.json'
        if path.exists():
            with open(path, 'r') as f:
                state = json.load(f)
            self.memory.from_dict(state.get('memory', {}))
            self.email = EmailIntelligence()
            self.email.context = state.get('email', {}).get('context', {})
            return True
        return False


def main():
    system = KnowledgeSystem()
    system.load()
    
    print("Alpha Pony Knowledge System v3.0.0")
    print(f"Loaded {system.knowledge_graph.node_count} concepts")
    print(f"Have {len(system.memory.episodic)} memories")
    
    system.learn("Alpha Pony neural interface initialized")
    system.learn("Aether engine flowing with harmony")
    
    print("\nSystem Status:")
    status = system.get_system_status()
    for key, value in status.items():
        print(f"  {key}: {value}")
    
    system.save()
    print("\nKnowledge state saved.")


if __name__ == '__main__':
    main()
