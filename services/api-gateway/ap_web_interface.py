#!/usr/bin/env python3
"""
Alpha Pony Web Interface
Flask-based neural interface for web browser access
"""

from flask import Flask, render_template, jsonify, request
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from neural_bridge import NeuralBridge
from knowledge_system import KnowledgeSystem

app = Flask(__name__, 
            template_folder='ui/templates',
            static_folder='ui/static')

bridge = NeuralBridge()
knowledge = KnowledgeSystem()
bridge.initialize()
knowledge.load()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/think', methods=['POST'])
def think():
    data = request.json
    query = data.get('query', '')
    result = bridge.think(query)
    return jsonify(result)

@app.route('/api/deep', methods=['POST'])
def deep_analyze():
    data = request.json
    query = data.get('query', '')
    result = bridge.deep_analyze(query)
    return jsonify(result)

@app.route('/api/learn', methods=['POST'])
def learn():
    data = request.json
    info = data.get('info', '')
    knowledge.learn(info)
    knowledge.save()
    return jsonify({'status': 'learned', 'info': info})

@app.route('/api/remember', methods=['POST'])
def remember():
    data = request.json
    query = data.get('query', '')
    result = knowledge.remember(query)
    return jsonify(result)

@app.route('/api/status')
def status():
    return jsonify({
        'bridge': bridge.get_status(),
        'knowledge': knowledge.get_system_status()
    })

@app.route('/api/evolve', methods=['POST'])
def evolve():
    result = {
        'status': 'evolved',
        'message': 'System patterns strengthened'
    }
    return jsonify(result)

if __name__ == '__main__':
    print("Alpha Pony Web Interface starting...")
    print("Open http://localhost:5000 in your browser")
    app.run(host='0.0.0.0', port=5000, debug=True)
