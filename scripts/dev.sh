#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PIDS=()

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

echo "[dev] API   (NestJS)    -> http://localhost:3002"
echo "[dev] Web   (Next.js)   -> http://localhost:3000"
echo "[dev] ML    (FastAPI)   -> http://localhost:8000"

pnpm --filter @mausamnet/api run start:dev &
PIDS+=("$!")
pnpm --filter @mausamnet/web run dev &
PIDS+=("$!")
(
  cd services/ml && uvicorn main:app --reload --host 0.0.0.0 --port 8000
) &
PIDS+=("$!")

wait