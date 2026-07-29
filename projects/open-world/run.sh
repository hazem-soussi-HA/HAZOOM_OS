#!/usr/bin/env bash
# Launch Open World on the real NVIDIA GPU (via Mesa Dozen/D3D12 on WSL).
# Falls back to llvmpipe automatically if dzn is ever unavailable.
set -e
cd "$(dirname "$0")"

DZN_ICD=/usr/share/vulkan/icd.d/dzn_icd.json

if [ -f "$DZN_ICD" ]; then
    export VK_ICD_FILENAMES="$DZN_ICD"
    echo "[run] GPU mode: NVIDIA RTX via Dozen/D3D12"
else
    echo "[run] WARNING: dzn ICD missing, falling back to software (llvmpipe)"
fi

export DISPLAY="${DISPLAY:-:0}"
export GODOT_SILENCE_ROOT_WARNING=1

exec ./engine/godot "${@:-res://Main.tscn}"
