#!/bin/bash
# ==============================================================================
# 👑 PROTOCOLE "SPARK VELOCITY" - CAPTAIN GENERAL v4 👑
# Optimisé pour 100% VRAM (RTX 3050 Ti 4GB) : Zéro swapping, vitesse maximale.
# ==============================================================================

set -e
OLLAMA_HOST="http://127.0.0.1:11434"

# HIÉRARCHIE 100% COMPATIBLE VRAM (3.3 GB libres)
SCOUT_MODEL="phi3:mini"             # 2.2 GB (100% VRAM)
CODER_MODEL="qwen2.5-coder:3b"      # 1.9 GB (100% VRAM) - Vitesse de génération maximale
ARCHITECT_MODEL="llama3.1:8b"       # 4.9 GB (Majoritairement VRAM) - Pour la logique complexe

echo "👑 INITIALISATION DU PROTOCOLE SPARK VELOCITY..."

if ! command -v jq &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y jq
fi

if ! curl -s "$OLLAMA_HOST/api/tags" > /dev/null; then
    echo "❌ Ollama ne répond pas. Lancez 'ollama serve'."
    exit 1
fi

echo "🔍 Vérification de l'arsenal VRAM-Optimisé..."
for model in "$SCOUT_MODEL" "$CODER_MODEL" "$ARCHITECT_MODEL"; do
    if ! ollama list | grep -q "$model"; then
        echo "❌ Modèle manquant : $model"
        exit 1
    fi
done
echo "✅ Arsenal confirmé. Prêt pour la vitesse de l'éclair."

echo ""
read -p "🚀 Capitaine, quelle est votre mission ? " USER_PROMPT

# ÉTAPE 1 : Analyse du Scout
echo -e "\n⚡ [1/3] $SCOUT_MODEL analyse la demande..."
COMPLEXITY=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
  \"model\": \"$SCOUT_MODEL\",
  \"prompt\": \"Cette demande est-elle SIMPLE (script court, réponse directe) ou COMPLEXE (architecture, logique avancée) ? Réponds UNIQUEMENT 'SIMPLE' ou 'COMPLEXE'.\\n\\nDemande: $USER_PROMPT\",
  \"stream\": false
}" | jq -r '.response' | tr '[:lower:]' '[:upper:]')

if [[ "$COMPLEXITY" == *"SIMPLE"* ]]; then
    echo "✅ Mode Spark activé. Réponse immédiate..."
    RESULT=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
      \"model\": \"$SCOUT_MODEL\",
      \"prompt\": \"Réponds de manière concise et directe avec le code ou la solution. Pas de discours.\\n\\nDemande: $USER_PROMPT\",
      \"stream\": false
    }" | jq -r '.response')
    
    OUTPUT_FILE="spark_simple_$(date +%Y%m%d_%H%M%S).md"
    echo -e "# ⚡ Réponse Spark (Phi-3 Mini)\n\n**Demande:** $USER_PROMPT\n\n**Réponse:**\n$RESULT" > "$OUTPUT_FILE"
    echo "🎉 TERMINÉ EN MODE SPARK ! Fichier : $OUTPUT_FILE"
    exit 0
fi

# ÉTAPE 2 : Planification de l'Architecte
echo -e "🧠 [2/3] $ARCHITECT_MODEL établit le plan..."
PLAN=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
  \"model\": \"$ARCHITECT_MODEL\",
  \"prompt\": \"Fournis un plan technique CONCIS pour un prototype Python. Recommande UNE seule bibliothèque simple.\\n\\nDemande: $USER_PROMPT\",
  \"stream\": false
}" | jq -r '.response')

# ÉTAPE 3 : Génération par l'Artisan (Vitesse VRAM Pure)
echo -e "💻 [3/3] $CODER_MODEL génère le code (Chargement 100% VRAM, vitesse maximale)..."
CODE=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
  \"model\": \"$CODER_MODEL\",
  \"prompt\": \"Écris un script Python COMPLET et EXÉCUTABLE basé sur ce plan. Utilise la bibliothèque recommandée. Code propre et commenté.\\n\\nPlan: $PLAN\",
  \"stream\": false
}" | jq -r '.response')

# ÉTAPE 4 : Revue Rapide
echo -e "🔍 [4/4] Revue de sécurité..."
REVIEW=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
  \"model\": \"$ARCHITECT_MODEL\",
  \"prompt\": \"Revue rapide de ce code : erreurs de syntaxe ou imports manquants ? Sinon, dis 'Code valide'.\\n\\nCode: $CODE\",
  \"stream\": false
}" | jq -r '.response')

OUTPUT_FILE="spark_mission_$(date +%Y%m%d_%H%M%S).md"
cat << INNER_EOF > "$OUTPUT_FILE"
# 👑 RAPPORT DE MISSION : SPARK VELOCITY

## 🎯 Objectif
$USER_PROMPT

## 🧠 Plan (Llama 3.1 8B)
$PLAN

## 💻 Code Généré (Qwen2.5-Coder 3B - 100% VRAM)
\`\`\`python
$CODE
\`\`\`

## 🔍 Revue (Llama 3.1 8B)
$REVIEW
INNER_EOF

echo "========================================================================"
echo "👑 MISSION ACCOMPLIE À LA VITESSE DE L'ÉCLAIR, CAPITAINE SOUSSI."
echo "💾 Rapport : ./$OUTPUT_FILE"
echo "========================================================================"
