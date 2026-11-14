#!/usr/bin/env bash
# Фаза 9: приёмка
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }

[ -f brigade/logs/09-qa.report.md ] && ok "отчёт QA" || bad "отчёт QA"
grep -rqi "prefers-reduced-motion" src 2>/dev/null && ok "reduced-motion учтён" || bad "reduced-motion учтён"
n=$(grep -rl "aria-" src/components 2>/dev/null | wc -l | tr -d ' ')
[ "$n" -ge 5 ] && ok "aria в $n компонентах" || bad "aria только в $n компонентах"
exit $fails
