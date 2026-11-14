#!/usr/bin/env bash
# Фаза 7: AI-ассистент, локальный поиск, Worker
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }

grep -q '"minisearch"' package.json && ok "minisearch" || bad "minisearch"
[ -f scripts/build-kb.mjs ] && ok "build-kb.mjs" || bad "build-kb.mjs"
grep -q "build-kb" package.json && ok "kb в сборке" || bad "kb в сборке"
[ -f public/kb-index.json ] && ok "kb-index.json собран" || bad "kb-index.json собран"
grep -rqi "assistant\|чат" src/components/Assistant 2>/dev/null && ok "UI ассистента" || bad "UI ассистента"
grep -rqi "open-ai-chat" src 2>/dev/null && ok "событие из Cmd+K" || bad "событие из Cmd+K"
[ -d worker ] && ok "worker/" || bad "worker/"
grep -rqi "rate\|limit" worker 2>/dev/null && ok "лимит запросов" || bad "лимит запросов"
exit $fails
