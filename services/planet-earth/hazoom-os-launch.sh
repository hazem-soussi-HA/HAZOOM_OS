#!/usr/bin/env bash
# =============================================================================
#  HAZOOM OS  --  ONE SCRIPT LAUNCH
#  Assembles + launches the fullstack of Hazem Soussi's projects as ONE unit.
#
#  Local-first. Loopback-only (127.0.0.1). No LAN exposure. After the first
#  bootstrap (while internet is up) every service runs with ZERO network egress
#  -- it survives coupures d'electricite and blackouts by design.
#
#  Mission (mon ami): discover the real Earth, watch the climate + atmosphere
#  from satellites + CPU collaboration, protect people and nature, and let the
#  birds speak. Everything connected.  -- alpha pony stars.
#
#  Usage:
#    ./hazoom-os-launch.sh          # launch everything (default: start)
#    ./hazoom-os-launch.sh start
#    ./hazoom-os-launch.sh stop
#    ./hazoom-os-launch.sh restart
#    ./hazoom-os-launch.sh status
#
#  Each service is detached (setsid) and tracked by a PID file so it survives
#  this terminal closing. Logs live in .hazoom-os/logs/.
# =============================================================================
set -uo pipefail

# --- where this project root lives (PLANET EARTH dir on Windows-side) -------
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME="$ROOT/.hazoom-os"
LOGDIR="$RUNTIME/logs"
PIDDIR="$RUNTIME/pids"
mkdir -p "$LOGDIR" "$PIDDIR"

# Linux-side project (HAZOOM_OS)
HAZOOM_OS_DIR="/home/hazem/HAZOOM_OS"
HAZOOM_POD_DIR="/home/hazem/hazoom"

# Python interpreters
PEN_VENV="$ROOT/planet_earth_news/.venv"
PEN_PY="$PEN_VENV/bin/python"
PY="$ROOT/.venv_omni/bin/python"   # shared env for CollaborativeBeat (created if missing)
SYS_PY="/root/.main_env/bin/python3"

# -----------------------------------------------------------------------------
#  SERVICE TABLE  (name  dir  kind  cmd  port  proto  logfile  pidfile)
#  kind: node | python | pyvenv | managed
# -----------------------------------------------------------------------------
declare -a S_NAME=()
declare -a S_DIR=()
declare -a S_KIND=()
declare -a S_CMD=()
declare -a S_PORT=()
declare -a S_PROTO=()
declare -a S_LOG=()
declare -a S_PID=()
declare -a S_URL=()

add_service() { # name dir kind cmd port proto url
  S_NAME+=("$1"); S_DIR+=("$2"); S_KIND+=("$3"); S_CMD+=("$4")
  S_PORT+=("$5"); S_PROTO+=("$6"); S_URL+=("$7")
  S_LOG+=("$LOGDIR/$1.log"); S_PID+=("$PIDDIR/$1.pid")
}

# 1) Planet Earth -- offline WebGL globe (8080)
add_service "planet_earth"  "$ROOT"                                  python \
  "$SYS_PY $ROOT/server.py"  8080 http "http://127.0.0.1:8080/"

# 2) Planet Earth News -- sovereign local news (8000, https)
#    Run directly from its venv (NOT serve.sh, whose inner supervisor can loop
#    on a crash and self-report "running" while the port stays closed).
add_service "planet_earth_news" "$ROOT/planet_earth_news" pyvenv \
  "$PEN_PY serve.py" 8000 https "https://127.0.0.1:8000/"

# 3) Birds Encyclopedia + Birds of Africa 3D atlas (4100; atlas at /atlas)
add_service "birds_encyclopedia" "$ROOT/birds-encyclopedia" node \
  "node server/server.js" 4100 http "http://127.0.0.1:4100/  (atlas: /atlas/)"

# 4) Hazoom POD platform (4000)
add_service "hazoom_pod" "$HAZOOM_POD_DIR" node \
  "node server/server.js" 4000 http "http://127.0.0.1:4000/"

# 5) HAZOOM OS simulation desktop (3000)
add_service "hazoom_os" "$HAZOOM_OS_DIR" node \
  "node server.js" 3000 http "http://127.0.0.1:3000/  (os: /os.html)"

# 6) CollaborativeBeat -- local-first neural core (5000)
add_service "collaborative_beat" "$ROOT/deepseek/CollaborativeBeat.py" python \
  "$PY collaborative_beat_v4.py" 5000 http "http://127.0.0.1:5000/"

# 7) ChatDev / Ornith -- loopback-only offline chatbox to local Ollama (5055)
#    Reuses ChatDev's own run_ornith.sh (sets 127.0.0.1 bind + keep_alive).
#    NOTE: defaults to ornith:35b which is DEAD on CPU-only hw (0 tokens/120s).
#    On this box set ORNITH_MODEL to a small responsive model, e.g.:
#      ORNITH_MODEL=tinyllama:1.1b bash hazoom-os-launch.sh start
add_service "chatdev" "/home/hazem/chatdev" node \
  "bash run_ornith.sh" 5055 http "http://127.0.0.1:5055/  (Ornith offline chatbox)"

# -----------------------------------------------------------------------------
#  helpers
# -----------------------------------------------------------------------------
log()  { printf '\033[36m[hazoom-os]\033[0m %s\n' "$*"; }
ok()   { printf '\033[32m[ok]\033[0m %s\n' "$*"; }
warn() { printf '\033[33m[warn]\033[0m %s\n' "$*"; }
err()  { printf '\033[31m[FAIL]\033[0m %s\n' "$*"; }

is_running() { local pf="$1"; [[ -f "$pf" ]] && kill -0 "$(cat "$pf")" 2>/dev/null; }

wait_for_port() { # port timeout
  local port="$1" timeout="$2" i=0
  while ! (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; do
    exec 3>&- 2>/dev/null || true
    (( i++ >= timeout )) && return 1
    sleep 1
  done
  exec 3>&- 2>/dev/null || true
  return 0
}

# Ensure the shared Python env for CollaborativeBeat (flask/numpy/scipy/dotenv).
# Runs only if missing; succeeds offline if wheels are already cached/present.
ensure_cb_env() {
  if [[ -x "$PY" ]] && "$PY" -c "import flask,numpy,scipy,dotenv" 2>/dev/null; then
    return 0
  fi
  log "Creating shared Python env for CollaborativeBeat ($PY) ..."
  if ! "$SYS_PY" -m venv "$ROOT/.venv_omni" 2>/dev/null; then
    warn "Could not create venv; falling back to system Python for CollaborativeBeat."
    PY="$SYS_PY"
  fi
  grep -qE "ollama|numpy|scipy|flask|dotenv" /dev/null 2>/dev/null || true
  if ! "$PY" -c "import flask,numpy,scipy,dotenv" 2>/dev/null; then
    log "Installing CollaborativeBeat deps (needs internet ONCE; offline-safe after)..."
    if "$PY" -m pip install --quiet --disable-pip-version-check \
        flask numpy scipy python-dotenv 2>>"$LOGDIR/pip.log"; then
      ok "CollaborativeBeat deps installed."
    else
      warn "Offline or install failed. CollaborativeBeat needs flask/numpy/scipy to start."
      warn "Run while online:  $PY -m pip install flask numpy scipy python-dotenv"
      return 1
    fi
  fi
  return 0
}

# Ollama / local LLM status (honest: never claims the model 'thinks' unless present)
report_llm() {
  if command -v ollama >/dev/null 2>&1; then
    if ollama list 2>/dev/null | grep -q "ornith"; then
      ok "Local LLM ornith:35b present -> CollaborativeBeat uses the real reasoning core."
    else
      warn "ollama is installed but ornith:35b is NOT pulled. CollaborativeBeat runs its"
      warn "built-in heuristic NeuralCore (by design). To enable the real LLM (needs ~20GB + net):"
      warn "    ollama pull ornith:35b   # or: ollama create ornith -f Modelfile.ornith-optimized"
    fi
  else
    warn "ollama not found on PATH; CollaborativeBeat runs heuristic core only."
  fi
}

# -----------------------------------------------------------------------------
#  start one service
# -----------------------------------------------------------------------------
start_one() { # idx
  local i="$1" name="${S_NAME[$i]}" dir="${S_DIR[$i]}" kind="${S_KIND[$i]}"
  local cmd="${S_CMD[$i]}" port="${S_PORT[$i]}" pf="${S_PID[$i]}" lf="${S_LOG[$i]}"
  if is_running "$pf"; then
    ok "$name already running (pid $(cat "$pf"))."
    return 0
  fi
  ( cd "$dir" || { err "cannot cd $dir"; return 1; }
    case "$kind" in
      managed) # self-detaching (e.g. PEN serve.sh writes its own pid)
        eval "$cmd" >"$lf" 2>&1 &
        echo $! > "$pf"
        ;;
      node)
        PORT="$port" setsid bash -c "exec $cmd" >"$lf" 2>&1 &
        echo $! > "$pf"
        ;;
      python|pyvenv)
        setsid bash -c "exec $cmd" >"$lf" 2>&1 &
        echo $! > "$pf"
        ;;
    esac
  )
  # give it a beat, then verify the port opened
  sleep 1
  if wait_for_port "$port" 25; then
    ok "$name up on :$port  ->  ${S_URL[$i]}"
  else
    err "$name did NOT bind :$port in time. tail: tail -n 20 ${S_LOG[$i]}"
  fi
}

# -----------------------------------------------------------------------------
#  stop one service
# -----------------------------------------------------------------------------
stop_one() { # idx
  local i="$1" name="${S_NAME[$i]}" dir="${S_DIR[$i]}" kind="${S_KIND[$i]}"
  local pf="${S_PID[$i]}"
  if [[ "$kind" == "managed" ]]; then
    ( cd "$dir" && bash ./serve.sh stop >/dev/null 2>&1 ) || true
    rm -f "$pf"
    ok "$name stopped (self-managed)."
    return 0
  fi
  if is_running "$pf"; then
    local pid; pid="$(cat "$pf")"
    kill "$pid" 2>/dev/null || true
    # also catch child node/python if setsid reparented
    pkill -f "${S_CMD[$i]%% *}" 2>/dev/null || true
    sleep 1
    if is_running "$pf"; then kill -9 "$pid" 2>/dev/null || true; fi
    rm -f "$pf"
    ok "$name stopped."
  else
    rm -f "$pf"
    ok "$name was not running."
  fi
}

# -----------------------------------------------------------------------------
#  actions
# -----------------------------------------------------------------------------
do_start() {
  clear
  log "==================================================================="
  log "  HAZOOM OS -- ONE SCRIPT LAUNCH"
  log "  Creator: Hazem Soussi (HA)   (c) 2024-2026"
  log "  Local-first . Loopback-only . Blackout-resistant ."
  log "==================================================================="
  echo
  ensure_cb_env || warn "CollaborativeBeat may not start (see above)."
  echo
  local i
  for (( i=0; i<${#S_NAME[@]}; i++ )); do
    start_one "$i"
  done
  echo
  report_llm
  echo
  log "All services launched. Open these in your browser (127.0.0.1 only):"
  for (( i=0; i<${#S_NAME[@]}; i++ )); do
    printf '   \033[35m%-22s\033[0m %s\n' "${S_NAME[$i]}" "${S_URL[$i]}"
  done
  echo
  log "Logs: $LOGDIR   PIDs: $PIDDIR"
  log "Stop everything:  ./hazoom-os-launch.sh stop"
  log "Status:           ./hazoom-os-launch.sh status"
}

do_stop() {
  log "Stopping HAZOOM OS services ..."
  local i
  for (( i=${#S_NAME[@]}-1; i>=0; i-- )); do
    stop_one "$i"
  done
  ok "All stopped."
}

do_status() {
  log "HAZOOM OS service status:"
  local i
  for (( i=0; i<${#S_NAME[@]}; i++ )); do
    if is_running "${S_PID[$i]}"; then
      printf '   \033[32m%-22s\033[0m RUNNING  pid %s  :%s\n' \
        "${S_NAME[$i]}" "$(cat "${S_PID[$i]}")" "${S_PORT[$i]}"
    else
      printf '   \033[31m%-22s\033[0m DOWN\n' "${S_NAME[$i]}"
    fi
  done
  report_llm
}

do_restart() { do_stop; sleep 1; do_start; }

# -----------------------------------------------------------------------------
#  dispatch
# -----------------------------------------------------------------------------
case "${1:-start}" in
  start)   do_start ;;
  stop)    do_stop ;;
  restart) do_restart ;;
  status)  do_status ;;
  -h|--help|help)
    sed -n '1,40p' "${BASH_SOURCE[0]}" | grep -E '^\s*#\s' | sed 's/^ *# *//'
    ;;
  *) err "unknown command: $1 (use start|stop|restart|status)"; exit 2 ;;
esac
