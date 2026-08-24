# demo_server.py — Ornith Demo Chat Proxy
from flask import Flask, render_template, request, jsonify, Response
import requests
import json
import os

app = Flask(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

@app.route('/')
def index():
    return render_template('demo_chat.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get("messages", [])
    model = data.get("model", "ornith:35b")

    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }

    def generate():
        try:
            with requests.post(f"{OLLAMA_URL}/api/chat", json=payload, stream=True, timeout=300) as r:
                r.raise_for_status()
                for line in r.iter_lines():
                    if line:
                        chunk = json.loads(line)
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            yield f"data: {json.dumps({'token': token})}\n\n"
                        if chunk.get("done", False):
                            yield f"data: {json.dumps({'done': True})}\n\n"
                            break
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/models', methods=['GET'])
def models():
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        r.raise_for_status()
        names = [m["name"] for m in r.json().get("models", [])]
        return jsonify({"models": names, "status": "online"})
    except:
        return jsonify({"models": [], "status": "offline"}), 503

if __name__ == '__main__':
    print("=" * 45)
    print("  ORNITH DEMO CHAT")
    print(f"  Ollama: {OLLAMA_URL}")
    print(f"  Open:   http://127.0.0.1:5001")
    print("=" * 45)
    app.run(host='0.0.0.0', port=5001, debug=False)
