import requests
import json
import sys

print("♾️ INITIALISATION DU MOTEUR D'INFINI (PYTHON EDITION) ♾️")
print("========================================================================")

prompt = input("🚀 Capitaine, entrez la mission : ")

payload = {
    "model": "qwen2.5-coder:3b",
    "prompt": prompt + "\n\nINSTRUCTION: Génère une réponse complète et détaillée sans limite de longueur. Ne t'arrête pas prématurément.",
    "stream": True,
    "options": {
        "num_predict": -1,
        "temperature": 0.7,
        "top_p": 0.9,
        "num_ctx": 8192
    }
}

print("\n🌊 DÉMARRAGE DU FLUX DE DONNÉES (STREAMING INFINI)...")
print("------------------------------------------------------------------------")

try:
    with requests.post("http://127.0.0.1:11434/api/generate", json=payload, stream=True) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if line:
                data = json.loads(line.decode('utf-8'))
                if 'response' in data:
                    sys.stdout.write(data['response'])
                    sys.stdout.flush()
                    
    print("\n------------------------------------------------------------------------")
    print("✅ FLUX TERMINÉ. Le modèle a atteint sa conclusion naturelle.")
except Exception as e:
    print(f"\n❌ ERREUR: {e}")
