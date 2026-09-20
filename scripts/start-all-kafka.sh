#!/usr/bin/env bash
# Start MausamNet-AI with the standalone Kafka broker (no Docker required).
#   Boots the local KRaft broker on localhost:9092 (if not already running),
#   waits for it, then launches the full app stack via start-all.sh.
#   On Ctrl+C the apps AND any broker we started are shut down together.
#
# Usage: scripts/start-all-kafka.sh [--no-kafka] [--no-spark]
# Env:   KAFKA_HOME (defaults to ~/apps/kafka)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

KAFKA_HOME="${KAFKA_HOME:-$HOME/apps/kafka}"
KAFKA_CONFIG="$KAFKA_HOME/config/mausamnet-combined.properties"
KAFKA_LOG_DIR="$ROOT/services/kafka"
KAFKA_LOG="$KAFKA_LOG_DIR/kafka.log"
KAFKA_PORT="${KAFKA_PORT:-9092}"
KAFKA_PID=""
KAFKA_STARTED_BY_US=0
KAFKA_UP=0

say() { printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }

check_port() {
  local host="$1" port="$2"
  (exec 3<>/dev/tcp/"$host"/"$port") >/dev/null 2>&1 && { exec 3>&- 3<&-; return 0; } || return 1
}

cleanup() {
  say "Shutting down..."
  if [[ "$KAFKA_STARTED_BY_US" -eq 1 && -n "$KAFKA_PID" ]]; then
    kill "$KAFKA_PID" 2>/dev/null || true
    say "Kafka stopped (pid $KAFKA_PID)"
  fi
}
trap cleanup EXIT INT TERM

mkdir -p "$KAFKA_LOG_DIR"

say "Kafka home: $KAFKA_HOME"

# 1. Kafka broker ------------------------------------------------------------
if check_port localhost "$KAFKA_PORT"; then
  say "Existing Kafka broker detected on localhost:$KAFKA_PORT -> reusing it"
elif [[ -x "$KAFKA_HOME/bin/kafka-server-start.sh" && -f "$KAFKA_CONFIG" ]]; then
  log_dirs="$(grep -E '^log\.dirs=' "$KAFKA_CONFIG" | cut -d= -f2-)"
  if [[ -n "$log_dirs" && ! -f "$log_dirs/meta.properties" ]]; then
    say "Formatting KRaft storage ($log_dirs) -> first run after cleanup"
    "$KAFKA_HOME/bin/kafka-storage.sh" format --standalone \
      -t "$("$KAFKA_HOME/bin/kafka-storage.sh" random-uuid)" \
      -c "$KAFKA_CONFIG" >> "$KAFKA_LOG" 2>&1
  fi
  say "Starting Kafka broker (KRaft standalone) -> log: $KAFKA_LOG"
  nohup "$KAFKA_HOME/bin/kafka-server-start.sh" "$KAFKA_CONFIG" \
    > "$KAFKA_LOG" 2>&1 &
  KAFKA_PID=$!
  KAFKA_STARTED_BY_US=1
  for i in $(seq 1 60); do
    if check_port localhost "$KAFKA_PORT"; then
      KAFKA_UP=1
      say "Kafka broker UP on localhost:$KAFKA_PORT (pid $KAFKA_PID)"
      break
    fi
    sleep 1
  done
  if [[ "$KAFKA_UP" -ne 1 ]]; then
    say "Kafka failed to start within 60s -> see $KAFKA_LOG" >&2
    exit 1
  fi
else
  say "Kafka not found at $KAFKA_HOME (expected bin/kafka-server-start.sh)." >&2
  say "Install it (download apache kafka tgz -> extract to ~/apps/kafka) and re-run." >&2
  exit 1
fi

# 2. Full app stack ----------------------------------------------------------
# start-all.sh auto-detects the broker on 9092 -> exports KAFKA_ENABLED=true
if [[ "$*" == *"--no-kafka"* ]]; then
  say "Skipping Kafka wiring for apps (--no-kafka passed)"
fi
"$ROOT/scripts/start-all.sh" "$@"