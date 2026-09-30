#!/usr/bin/env python3
"""Jev 1.13 Mock Server — contextual responses for HAZOOM terminal integration."""
import json
import random
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class JevHandler(BaseHTTPRequestHandler):
    server_version = "JevConsole/1.13"
    
    def log_message(self, *a):
        pass

    def _send(self, code, obj):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _get_body(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length) if length else b"{}"
            return json.loads(raw.decode("utf-8")) if raw else {}
        except:
            return {}

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/status":
            return self._send(200, {
                "local": {"engine": "local-jev-clone", "vocab": 116, "configured": True},
                "cloud": {"engine": "jev-latest", "configured": True, "key_source": "server-side"}
            })
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        body = self._get_body()
        state = body.get("state", "")
        questions = body.get("questions", {})
        
        if path in ("/api/local/decide", "/api/cloud/decide"):
            answers = {}
            for qid, qspec in questions.items():
                qtype = qspec.get("type", "noul")
                instruction = qspec.get("instructions", "")
                text = (state + " " + instruction).lower()
                
                if qtype == "noul":
                    prob = self._compute_prob(text)
                    answer = "yes" if prob > 0.5 else "no"
                    answers[qid] = {
                        "type": "noul",
                        "noul": prob,
                        "confidence": round(random.uniform(0.5, 0.95), 2),
                        "answer": answer,
                        "text": self._gen_noul(text, prob, instruction)
                    }
                elif qtype == "choice":
                    opts = qspec.get("criteria", qspec.get("options", ["option_a", "option_b"]))
                    if isinstance(opts, str):
                        opts = [opts]
                    pick = random.choice(opts) if opts else "option_a"
                    probs = {}
                    for o in opts:
                        probs[o] = round(random.uniform(0.1, 0.5), 2)
                    # normalize
                    tot = sum(probs.values()) or 1
                    for k in probs: probs[k] = round(probs[k]/tot, 2)
                    answers[qid] = {
                        "type": "choice",
                        "choice": pick,
                        "probabilities": probs,
                        "confidence": round(random.uniform(0.5, 0.9), 2),
                        "text": f"Selected '{pick}' from {len(opts)} options based on analysis of the state."
                    }
                elif qtype == "score":
                    levels = qspec.get("criteria", qspec.get("levels", ["low", "medium", "high"]))
                    if isinstance(levels, str):
                        levels = [levels]
                    val = random.choice(levels)
                    answers[qid] = {
                        "type": "score",
                        "score": val,
                        "value": round(random.uniform(1, 10), 1),
                        "confidence": round(random.uniform(0.5, 0.9), 2),
                        "text": f"Scored '{val}' for: {instruction}"
                    }
                else:
                    answers[qid] = {"type": qtype, "value": None, "text": "Unknown question type"}
            
            return self._send(200, {
                "engine": "local-jev-clone",
                "answers": answers,
                "ms": round(random.uniform(5, 50), 1),
                "state_processed": state[:200]
            })
        
        return self._send(404, {"error": "not found"})

    def _compute_prob(self, text):
        """Compute probability based on text content."""
        text = text.lower()
        positive = ["yes", "true", "good", "great", "working", "help", "ready", "success",
                     "ok", "fine", "correct", "right", "love", "best", "awesome", "improve",
                     "fix", "solved", "integrate", "complete", "done", "hi", "hello", "hey",
                     "thanks", "thank", "nice", "cool", "love", "happy", "good"]
        negative = ["no", "false", "bad", "broken", "fail", "error", "bug", "wrong",
                     "never", "won", "can", "impossible", "no"]
        
        pos = sum(1 for w in positive if w in text)
        neg = sum(1 for w in negative if w in text)
        
        seed = int(hashlib.md5(text.encode()).hexdigest()[:8], 16)
        random.seed(seed)
        base = 0.5 + (pos - neg) * 0.12
        noise = random.uniform(-0.15, 0.15)
        return max(0.05, min(0.95, base + noise))

    def _gen_noul(self, text, prob, instruction):
        if prob > 0.7:
            return f"Strongly affirmative. The evidence supports: {instruction}"
        elif prob > 0.55:
            return f"Leaning yes on: {instruction}. Data aligns with this assessment."
        elif prob > 0.45:
            return f"Neutral assessment on: {instruction}. Mixed signals detected."
        elif prob > 0.3:
            return f"Leaning no on: {instruction}. Evidence is weak."
        else:
            return f"Negative on: {instruction}. Not supported by current data."


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("127.0.0.1", 8323), JevHandler)
    print("Jev 1.13 Mock Console on http://127.0.0.1:8323")
    srv.serve_forever()
