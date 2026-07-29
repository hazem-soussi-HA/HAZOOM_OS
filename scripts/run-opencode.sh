#!/bin/bash

# 1. Point OpenCode to your local LiteLLM proxy
export OPENAI_BASE_URL="http://0.0.0.0:4000"

# 2. OpenCode needs *some* key to start, but the proxy ignores it 
# (because the proxy already holds your real OpenRouter key)
export OPENAI_API_KEY="sk-dummy-key"

# 3. Give OpenCode a generic model name so it bypasses the whitelist. 
# The proxy will silently switch this to CoBuddy!
MODEL_ID="gpt-3.5-turbo" 

echo "🚀 Booting OpenCode through local proxy..."
echo "🧠 Disguised as: $MODEL_ID (Actually routing to baidu/cobuddy:free)"

# 4. Launch opencode
opencode --model "$MODEL_ID" "$@"
