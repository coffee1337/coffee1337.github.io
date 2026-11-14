#!/usr/bin/env bash
# brigade/run.sh <role.md> <model-id> [max-turns] [run-budget-seconds]
# Запускает роль как отдельный процесс Hermes с закреплённой моделью.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

ROLE="${1:?role file}"
MODEL="${2:?model id}"
TURNS="${3:-120}"
BUDGET="${4:-5400}"
NAME=$(basename "$ROLE" .md)
LOG="brigade/logs/${NAME}.$(date +%Y%m%d-%H%M%S).log"
mkdir -p brigade/logs

echo "role=$NAME model=$MODEL turns=$TURNS budget=${BUDGET}s log=$LOG"
hermes chat --query-file "$ROLE" \
  -m "$MODEL" --provider cheapvibecode \
  --oneshot -Q --max-turns "$TURNS" --run-budget "$BUDGET" \
  --in "$PWD" > "$LOG" 2>&1
code=$?
echo "exit=$code log=$LOG"
exit $code
