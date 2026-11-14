#!/usr/bin/env bash
# brigade/stage.sh <phase> <role.md> <model-id> [max-turns] [budget]
# Поднимает фазу, гоняет роль, затем гейт. Возвращает код гейта.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2
PHASE="${1:?phase}"; ROLE="${2:?role}"; MODEL="${3:?model}"
printf '%s' "$PHASE" > brigade/PHASE
echo "── phase $PHASE / $(basename "$ROLE" .md) / $MODEL"
bash brigade/run.sh "$ROLE" "$MODEL" "${4:-150}" "${5:-5400}"
rc=$?
echo "── роль завершилась с кодом $rc, гейт:"
./brigade/gate.sh
g=$?
echo "── gate exit=$g phase=$PHASE"
exit $g
