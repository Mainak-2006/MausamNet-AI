#!/usr/bin/env bash
# Start every MausamNet-AI service together:
#   API (NestJS) -> Web (Next.js) -> ML (FastAPI) -> Spark (PySpark, if a Kafka broker is reachable)
# No Docker required. If a Kafka broker is running on localhost:9092 the API
# publishes weather snapshots to it and the Spark streaming job consumes them;
# otherwise jobs run in-process.
# Usage: scripts/start-all.sh [--no-spark] [--no-kafka]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_KAFKA=1
WITH_SPARK=1

for arg in "$@"; do
  case "$arg" in
    --no-kafka) WITH_KAFKA=0 ;;
    --no-spark) WITH_SPARK=0 ;;
    -h | --help)
      echo "Usage: $0 [--no-kafka] [--no-spark]"
      echo "  --no-kafka  don't look for a Kafka broker; API runs jobs in-process"
      echo "  --no-spark  skip the PySpark streaming job"
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg (see --help)" >&2
      exit 1
      ;;
  esac
done

PIDS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

say() { printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }

check_port() {
  local host="$1" port="$2"
  (exec 3<>/dev/tcp/"$host"/"$port") >/dev/null 2>&1 && exec 3>&- 3<&- || return 1
  return 0
}

KAFKA_ENABLED=false
if [[ "$WITH_KAFKA" -eq 1 ]] && check_port localhost 9092; then
  KAFKA_ENABLED=true
  say "Kafka broker detected on localhost:9092 -> API will publish snapshots"
else
  say "No Kafka broker on localhost:9092 -> API runs weather sync in-process"
fi

say "Starting API (NestJS) -> http://localhost:3002"
(
  export KAFKA_ENABLED="$KAFKA_ENABLED"
  pnpm --filter @mausamnet/api run start:dev
) &
PIDS+=("$!")

say "Starting Web (Next.js) -> http://localhost:3000"
pnpm --filter @mausamnet/web run dev &
PIDS+=("$!")

say "Starting ML (FastAPI) -> http://localhost:8000"
(
  if [[ -x "$ROOT/services/ml/.venv/bin/uvicorn" ]]; then
    cd "$ROOT/services/ml"
    "$ROOT/services/ml/.venv/bin/uvicorn" main:app --host 127.0.0.1 --port 8000
  elif command -v uvicorn >/dev/null 2>&1; then
    cd "$ROOT/services/ml"
    uvicorn main:app --host 127.0.0.1 --port 8000
  else
    echo "ML: uvicorn not found. Run: cd services/ml && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
    exit 1
  fi
) &
PIDS+=("$!")

if [[ "$WITH_SPARK" -eq 1 ]] && [[ "$KAFKA_ENABLED" == "true" ]]; then
  if command -v java >/dev/null 2>&1 && python3 -c "import pyspark" >/dev/null 2>&1; then
    say "Starting Spark streaming (from Kafka topic mausamnet.weather.snapshot)"
    (
      cd "$ROOT/services/spark"
      python3 main.py
    ) &
    PIDS+=("$!")
  else
    say "Skipping Spark: pyspark or java not installed (pip install -r services/spark/requirements.txt)"
  fi
else
  say "Skipping Spark (no Kafka broker detected)"
fi

say "All services launched. Press Ctrl+C to stop everything."
echo
echo "  web    : http://localhost:3000"
echo "  api    : http://localhost:3002"
echo "  ml     : http://localhost:8000"
echo

wait