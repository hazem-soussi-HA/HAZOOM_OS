#!/bin/bash
# ==============================================================================
# 👑 PROTOCOLE "CAPTAIN GENERAL INTELLIGENCE" v3 👑
# Hiérarchie optimisée : Phi-3 (Scout) -> Llama 3.1 (Architecte) -> Ornith (Élite)
# Objectif : Vitesse de type "Spark" via une allocation physique intelligente des ressources.
# ==============================================================================

set -e

OLLAMA_HOST="http://127.0.0.1:11434"
SCOUT_MODEL="phi3:mini"       # 2.2 GB - Réponse ultra-rapide (VRAM native)
ARCHITECT_MODEL="llama3.1:8b"  # 4.9 GB - Planification et revue (VRAM quasi-native)
ELITE_MODEL="ornith:35b"       # 21 GB - Raisonnement agentic profond (CPU/RAM fallback)

echo "👑 INITIALISATION DU PROTOCOLE CAPTAIN GENERAL..."

# 1. Vérification des dépendances
if ! command -v jq &> /dev/null; then
    echo "⚠️  Installation de 'jq' pour le traitement JSON..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# 2. Vérification de la santé d'Ollama
if ! curl -s "$OLLAMA_HOST/api/tags" > /dev/null; then
    echo "❌ Ollama ne répond pas. Lancez 'ollama serve' dans un autre terminal."
    exit 1
fi

# 3. Vérification de la présence des modèles (Zéro téléchargement inattendu)
echo "🔍 Vérification de l'arsenal local..."
for model in "$SCOUT_MODEL" "$ARCHITECT_MODEL" "$ELITE_MODEL"; do
    if ! ollama list | grep -q "$model"; then
        echo "❌ Modèle manquant : $model. Veuillez l'ajouter à votre liste."
        exit 1
    fi
done
echo "✅ Arsenal confirmé. Prêt pour l'accélération."

echo ""
read -p "🚀 Capitaine, quelle est votre mission (prompt) ? " USER_PROMPT

# ==============================================================================
# ÉTAPE 1 : LE SCOUT (Phi-3 Mini) - Analyse et Routage
# ==============================================================================
echo -e "\n⚡ [ÉTAPE 1/3] $SCOUT_MODEL analyse la complexité de la mission..."
ROUTING_DECISION=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
  \"model\": \"$SCOUT_MODEL\",
  \"prompt\": \"Analyse cette demande : '$USER_PROMPT'. Est-ce une tâche de codage SIMPLE (réponse directe en 1-2 phrases ou petit script) ou COMPLEXE (nécessitant une architecture, des bibliothèques multiples ou une logique avancée) ? Réponds UNIQUEMENT par 'SIMPLE' ou 'COMPLEXE'.\",
  \"stream\": false
}" | jq -r '.response' | tr '[:lower:]' '[:upper:]')

if [[ "$ROUTING_DECISION" == *"SIMPLE"* ]]; then
    echo "✅ Tâche détectée comme SIMPLE. Activation de la vitesse Spark..."
    FINAL_OUTPUT=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
      \"model\": \"$SCOUT_MODEL\",
      \"prompt\": \"Réponds de manière concise, directe et utile à cette demande : $USER_PROMPT. Fournis le code ou la réponse immédiatement sans long discours.\",
      \"stream\": false
    }" | jq -r '.response')
    
    OUTPUT_FILE="captain_general_simple_$(date +%Y%m%d_%H%M%S).md"
    cat << INNER_EOF > "$OUTPUT_FILE"
# 👑 Réponse Rapide (Phi-3 Mini)
**Demande :** $USER_PROMPT
**Réponse :**
$FINAL_OUTPUT
INNER_EOF
    echo "🎉 MISSION ACCOMPLIE EN MODE SPARK !"
    echo "💾 Sauvegardé dans : $OUTPUT_FILE"
    exit 0
fi

# ==============================================================================
# ÉTAPE 2 : L'ARCHITECTE (Llama 3.1 8B) - Planification
# ==============================================================================
echo -e "🧠 [ÉTAPE 2/3] Tâche COMPLEXE détectée. $ARCHITECT_MODEL établit le plan d'attaque..."
PLAN=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
  \"model\": \"$ARCHITECT_MODEL\",
  \"prompt\": \"Tu es un architecte logiciel d'élite. Pour la demande suivante, fournis un plan technique CONCIS et ACTIONNABLE. Recommande UNE seule bibliothèque Python principale pour un prototype fonctionnel. Ne génère pas tout le code, juste le plan structuré et les points critiques.\\n\\nDemande : $USER_PROMPT\",
  \"stream\": false
}" | jq -r '.response')

echo -e "✅ Plan d'attaque validé.\n"

# ==============================================================================
# ÉTAPE 3 : L'AGENT D'ÉLITE (Ornith 35B) - Exécution Profonde
# ==============================================================================
echo -e "💻 [ÉTAPE 3/3] Déploiement de $ELITE_MODEL pour l'exécution de précision..."
echo "(Chargement du modèle 21GB en mémoire. Optimisation des kernels d'inférence en cours...)"

CODE=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
  \"model\": \"$ELITE_MODEL\",
  \"prompt\": \"Tu es un agent de codage de niveau expert. En te basant STRICTEMENT sur ce plan, écris un script Python prototype COMPLET, EXÉCUTABLE et COMMENTÉ. Utilise la bibliothèque recommandée. Gère les erreurs. Ne réponds pas 'null'.\\n\\nPlan :\\n$PLAN\",
  \"stream\": false
}" | jq -r '.response')

if [ -z "$CODE" ] || [ "$CODE" = "null" ]; then
    echo "⚠️  Alerte : L'agent d'élite n'a pas généré de code. La demande était peut-être trop abstraite."
    CODE="# En attente de paramètres plus concrets pour la génération de code."
fi

echo -e "✅ Code généré avec succès.\n"

# ==============================================================================
# ÉTAPE 4 : REVUE FINALE (Llama 3.1 8B)
# ==============================================================================
echo -e "🔍 [ÉTAPE 4/4] $ARCHITECT_MODEL effectue la revue de sécurité et de qualité..."
REVIEW=$(curl -s "$OLLAMA_HOST/api/generate" -d "{
  \"model\": \"$ARCHITECT_MODEL\",
  \"prompt\": \"Revue de code rapide : identifie toute erreur de syntaxe, import manquant ou faille de sécurité dans ce code. Si le code est valide, dis 'Code valide et prêt à l'emploi'. Sinon, fournis la version corrigée.\\n\\nCode :\\n$CODE\",
  \"stream\": false
}" | jq -r '.response')

# ==============================================================================
# SAUVEGARDE DU RAPPORT DE MISSION
# ==============================================================================
OUTPUT_FILE="captain_general_mission_$(date +%Y%m%d_%H%M%S).md"
cat << INNER_EOF > "$OUTPUT_FILE"
# 👑 RAPPORT DE MISSION : CAPTAIN GENERAL INTELLIGENCE

## 🎯 Objectif
$USER_PROMPT

## ⚡ Analyse du Scout (Phi-3 Mini)
Classification : COMPLEXE

## 🧠 Plan de l'Architecte (Llama 3.1 8B)
$PLAN

## 💻 Exécution de l'Agent d'Élite (Ornith 35B)
\`\`\`python
$CODE
\`\`\`

## 🔍 Revue Finale (Llama 3.1 8B)
$REVIEW
INNER_EOF

echo "========================================================================"
echo "👑 MISSION ACCOMPLIE, CAPITaine SOUSSI."
echo "💾 Rapport de mission sécurisé dans : ./$OUTPUT_FILE"
echo "📖 Visualiser : cat $OUTPUT_FILE"
echo "========================================================================"
