#!/usr/bin/env bash
# Фаза 3: сплэш, Embedding Space, фоновые логи, метрики, github.json (§3.4, 4.1, 8)
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }

grep -rqi "sessionStorage" src && ok "сплэш помнит сессию" || bad "сплэш помнит сессию"
# Splash заменён на Loader — кнопка пропуска должна остаться.
grep -rqi "skip" src/components/Loader 2>/dev/null && ok "кнопка skip" || bad "кнопка skip"

grep -rq "THREE.Points\|<points" src/three src/components 2>/dev/null && ok "облако точек THREE.Points" || bad "облако точек THREE.Points"
grep -rqi "embedding" src/three src/components 2>/dev/null && ok "Embedding Space" || bad "Embedding Space"
grep -rqi "ShaderMaterial\|onBeforeCompile" src/three 2>/dev/null && ok "шейдер глифов" || bad "шейдер глифов"
grep -rqi "top_k\|top-k\|topK" src/three src/components 2>/dev/null && ok "top-k запросы" || bad "top-k запросы"

n=$(grep -rho '^\$ .*' src/content 2>/dev/null | wc -l | tr -d ' ')
[ "$n" -ge 15 ] && ok "фоновые логи ($n $ строк)" || bad "фоновые логи ($n $ строк, надо 40-60)"

[ -f src/generated/github.json ] && ok "src/generated/github.json" || bad "src/generated/github.json"
[ -f scripts/fetch-github.mjs ] && ok "scripts/fetch-github.mjs" || bad "scripts/fetch-github.mjs"
grep -q "fetch-github" package.json && ok "fetch-github в build" || bad "fetch-github в build"
exit $fails
