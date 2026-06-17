#!/usr/bin/env python3
"""
AlphaPony Voice Server — Edge TTS with voice profile tuning
"""

import asyncio
import json
import os
import sys
import traceback
import edge_tts
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

VOICE_PROFILE = {
    "AlphaPony": {
        "voice": "en-US-AvaMultilingualNeural",
        "pitch": "+10Hz",
        "rate": "+0%",
    },
    "Narrator": {
        "voice": "en-US-GuyNeural",
        "pitch": "+0Hz",
        "rate": "+0%",
    },
    "NeuralFish": {
        "voice": "en-US-JennyNeural",
        "pitch": "+12Hz",
        "rate": "+10%",
    },
    "ShadowCreature": {
        "voice": "en-US-EricNeural",
        "pitch": "-10Hz",
        "rate": "-5%",
    },
    "CoreSpirit": {
        "voice": "en-US-AriaNeural",
        "pitch": "+5Hz",
        "rate": "-10%",
    },
}

CACHE_DIR = os.path.join(os.path.dirname(__file__), "voice_cache")
os.makedirs(CACHE_DIR, exist_ok=True)


def get_cache_key(character, text):
    import hashlib
    return hashlib.md5(f"{character}:{text}".encode()).hexdigest()


async def generate_speech(character, text):
    profile = VOICE_PROFILE.get(character, VOICE_PROFILE["Narrator"])
    voice = profile["voice"]
    pitch = profile["pitch"]
    rate = profile["rate"]

    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    return audio_data


class VoiceHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urlparse(self.path)

            if parsed.path == "/generate":
                params = parse_qs(parsed.query)
                character = params.get("character", ["Narrator"])[0]
                text = params.get("text", [""])[0]

                if not text:
                    self.send_json(400, {"error": "No text provided"})
                    return

                cache_key = get_cache_key(character, text)
                cache_file = os.path.join(CACHE_DIR, f"{cache_key}.mp3")

                if os.path.exists(cache_file):
                    with open(cache_file, "rb") as f:
                        audio = f.read()
                    print(f"[CACHE HIT] {character}: {text[:50]}...")
                else:
                    print(f"[GENERATING] {character}: {text[:50]}...")
                    audio = asyncio.run(generate_speech(character, text))
                    with open(cache_file, "wb") as f:
                        f.write(audio)

                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(len(audio)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(audio)

            elif parsed.path == "/voices":
                self.send_json(200, VOICE_PROFILE)

            elif parsed.path == "/health":
                self.send_json(200, {"status": "ok"})

            else:
                self.send_json(404, {"error": "Not found"})

        except BrokenPipeError:
            pass
        except Exception as e:
            print(f"[ERROR] {e}")
            traceback.print_exc()
            self.send_json(500, {"error": str(e)})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def send_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        print(f"[VOICE] {args[0]}")


def run_server(port=9003):
    server = HTTPServer(("0.0.0.0", port), VoiceHandler)
    print(f"AlphaPony Voice Server running on port {port}", flush=True)
    print(f"Voices: {json.dumps(VOICE_PROFILE, indent=2)}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    run_server()
