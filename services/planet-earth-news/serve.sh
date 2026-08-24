#!/usr/bin/env bash
# Planet Earth News — supervised background service launcher.
#
# Starts serve.py under waitress, detached from the terminal (setsid), with an
# auto-restart watchdog so the platform stays up. Logs go to logs/pen.out.
#
# Usage:
#   ./serve.sh start    # (default) launch detached, keep alive
#   ./serve.sh stop     # stop the running service
#   ./serve.sh restart  # stop + start
#   ./serve.sh status   # is it running?
#
# Security: HOST is pinned to 127.0.0.1 here; LIFO-bind to loopback only.
# Do NOT set PEN_HOST=0.0.0.0 — the app also refuses non-loopback at import.
# TLS: by default the service serves HTTPS on loopback (self-signed cert in
# certs/, generated on first run). Set PEN_TLS=0 (or server.tls: false) for
# plain HTTP. Either way it stays on 127.0.0.1.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$ROOT/.venv"
PIDFILE="$ROOT/.pen.pid"
LOGFILE="$ROOT/logs/pen.out"
HOST="${PEN_HOST:-127.0.0.1}"
PORT="${PEN_PORT:-8000}"
THREADS="${PEN_THREADS:-8}"
TLS="${PEN_TLS:-1}"

mkdir -p "$ROOT/logs"

# Ensure the minified frontend bundles exist (idempotent; cheap if present).
ensure_assets() {
  if [[ ! -f "$ROOT/static/app.min.js" || ! -f "$ROOT/static/style.min.css" ]]; then
    echo "Frontend bundles missing — building them (scripts/build_assets.sh)…"
    "$ROOT/scripts/build_assets.sh" || echo "WARN: asset build failed; / may 404 JS" >&2
  fi
}

# Ensure the TLS cert exists when TLS is enabled (idempotent).
ensure_cert() {
  [[ "$TLS" == "1" ]] || return 0
  if [[ ! -f "$ROOT/certs/pen.local.pem" || ! -f "$ROOT/certs/pen.local.key" ]]; then
    echo "TLS cert missing — generating localhost self-signed cert…"
    "$ROOT/scripts/gen_cert.sh" || { echo "WARN: cert generation failed" >&2; }
  fi
}

is_running() { [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; }

start() {
  if is_running; then
    echo "PEN already running (pid $(cat "$PIDFILE"))."
    return 0
  fi
  ensure_assets
  ensure_cert
  if [[ "$TLS" == "1" ]]; then SCHEME="https://"; else SCHEME="http://"; fi
  echo "Starting Planet Earth News on ${SCHEME}$HOST:$PORT ..."
  # setsid detaches from the controlling terminal; the while-loop is a watchdog.
  setsid bash -c "
    source '$VENV/bin/activate'
    while true; do
      echo \"[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PEN starting (pid \$$)\" >> '$LOGFILE'
      PEN_HOST='$HOST' PEN_PORT='$PORT' PEN_THREADS='$THREADS' PEN_TLS='$TLS' \
        python '$ROOT/serve.py' >> '$LOGFILE' 2>&1
      echo \"[$(date -u +%Y-%m-%dT%H:%M:%SZ)] PEN exited (\$?); restarting in 2s\" >> '$LOGFILE'
      sleep 2
    done
  " >/dev/null 2>&1 &
  # the setsid child re-parents; record its pid for stop()
  echo $! > "$PIDFILE"
  # give it a moment, then confirm
  sleep 2
  if is_running; then
    echo "PEN launched (supervisor pid $(cat "$PIDFILE")). Tail: tail -f logs/pen.out"
  else
    echo "PEN failed to start — see logs/pen.out" >&2
    return 1
  fi
}

stop() {
  if ! is_running; then
    echo "PEN not running."
    rm -f "$PIDFILE"
    return 0
  fi
  PID="$(cat "$PIDFILE")"
  echo "Stopping PEN (supervisor pid $PID) ..."
  # kill the supervisor; pkill the waitress/serve workers too
  kill "$PID" 2>/dev/null || true
  pkill -f "$ROOT/serve.py" 2>/dev/null || true
  sleep 1
  rm -f "$PIDFILE"
  echo "PEN stopped."
}

status() {
  if is_running; then
    echo "PEN RUNNING (supervisor pid $(cat "$PIDFILE"))."
  else
    echo "PEN NOT running."
    rm -f "$PIDFILE" 2>/dev/null || true
  fi
}

case "${1:-start}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; start ;;
  status)  status ;;
  build)   "$ROOT/scripts/build_assets.sh" ;;
  cert)    "$ROOT/scripts/gen_cert.sh" ;;
  *) echo "usage: $0 {start|stop|restart|status|build|cert}"; exit 2 ;;
esac
