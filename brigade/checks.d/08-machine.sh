#!/usr/bin/env bash
# Фаза 8: llms.txt, JSON-LD, Actions, ссылки
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }

[ -f dist/llms.txt ] && ok "dist/llms.txt" || bad "dist/llms.txt"
[ -f dist/llms-full.txt ] && ok "dist/llms-full.txt" || bad "dist/llms-full.txt"
grep -q "application/ld+json" dist/index.html 2>/dev/null && ok "JSON-LD на главной" || bad "JSON-LD на главной"
[ -f .github/workflows/deploy.yml ] && ok "workflow deploy" || bad "workflow deploy"
grep -q "deploy-pages" .github/workflows/*.yml 2>/dev/null && ok "actions/deploy-pages" || bad "actions/deploy-pages"
grep -q "cron" .github/workflows/*.yml 2>/dev/null && ok "cron-пересборка" || bad "cron-пересборка"
[ -f scripts/check-links.mjs ] && ok "check-links.mjs" || bad "check-links.mjs"
exit $fails
