#!/usr/bin/env bash
# Фаза 4: паритет RU/EN, никакой кириллицы в компонентах, отзывы, база знаний.
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }

if node brigade/parity.mjs src/content/en.ts src/content/ru.ts > brigade/logs/parity.log 2>&1; then
  ok "паритет ключей RU/EN"
else
  bad "паритет ключей RU/EN (см. brigade/logs/parity.log)"
  sed -n '1,6p' brigade/logs/parity.log | sed 's/^/       /'
fi

n=$(grep -rn "[А-Яа-я]" src/components --include='*.tsx' 2>/dev/null | grep -v '^\s*//' | wc -l | tr -d ' ')
[ "$n" -eq 0 ] && ok "нет кириллицы в компонентах" || bad "кириллица в компонентах: $n строк"

n=$(grep -rho '^\$ .*' src/content 2>/dev/null | wc -l | tr -d ' ')
[ "$n" -ge 40 ] && ok "фоновые логи: $n строк" || bad "фоновые логи: $n строк (ТЗ §4.1.7: 40-60)"

[ -f src/content/testimonials.ts ] && ok "testimonials.ts" || bad "testimonials.ts"
k=$(ls src/content/knowledge/*.md 2>/dev/null | wc -l | tr -d ' ')
[ "$k" -ge 8 ] && ok "knowledge: $k файлов" || bad "knowledge: $k файлов (нужно 8-10)"
exit $fails
