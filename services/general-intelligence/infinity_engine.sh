#!/bin/bash
# ==============================================================================
# ♾️ PROTOCOLE "INFINITY ENGINE" - ASSEMBLING POWER (V2 SÉCURISÉE) ♾️
# Brise les limites de tokens. Génération continue, streaming en temps réel.
# ==============================================================================

set -e
OLLAMA_HOST="http://127.0.0.1:11434"

MODEL="qwen2.5-coder:3b"

echo "♾️ INITIALISATION DU MOTEUR D'INFINI..."
echo "🎯 Modèle cible : $MODEL"
echo "⚠️  Appuyez sur CTRL+C à tout moment pour interrompre le flux."
echo "========================================================================"

read -p "🚀 Capitaine, entrez la mission : " USER_PROMPT

# Construction SÉCURISÉE du JSON avec jq. 
# Cela échappe automatiquement tous les guillemets et caractères spéciaux de votre prompt.
PAYLOAD=$(jq -n \
  --arg model "$MODEL" \
  --arg prompt "$USER_PROMPT" \
  '{
    model: $model,
    prompt: ($prompt + "\n\nINSTRUCTION: Génère une réponse complète et détaillée sans limite de longueur. Ne t'arrête pas prématurément."),
    stream: true,
    options: {
      num_predict: -1,
      temperature: 0.7,
      top_p: 0.9,
      num_ctx: 8192
    }
  }')

echo ""
echo "🌊 DÉMARRAGE DU FLUX DE DONNÉES (STREAMING INFINI)..."
echo "------------------------------------------------------------------------"

# curl avec --no-buffer pour le streaming temps réel
curl -s -N -X POST "$OLLAMA_HOST/api/generate" \
     -H "Content-Type: application/json" \
     -d "$PAYLOAD" | \
     jq --unbuffered -r '.response' | \
     tr -d '\r'

echo ""
echo "------------------------------------------------------------------------"
echo "✅ FLUX TERMINÉ. Le modèle a atteint sa conclusion naturelle."
echo "💾 Astuce : Pour sauvegarder la sortie dans un fichier, lancez : ./infinity_engine.sh > sortie.txt"
echo "========================================================================"
