#!/usr/bin/env bash
# brigade/gate.sh — детерминированный гейт фазы. exit 0 = фаза зелёная.
#
# Использование:
#   ./brigade/gate.sh          # основной гейт: сборка + проверки всех фаз <= PHASE
#   ./brigade/gate.sh --fast   # без сборки (быстрая итерация, не считается приёмкой)
#
# Текущая фаза лежит в brigade/PHASE (1..7). Проверки фазы N подключаются из
# brigade/checks.d/NN-*.sh — каждый скрипт возвращает непустой список провалов или 0.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 2
FAST=0
[ "${1:-}" = "--fast" ] && FAST=1

PHASE=$(tr -dc '0-9' < brigade/PHASE 2>/dev/null || echo 1)
[ -z "$PHASE" ] && PHASE=1

mkdir -p brigade/logs
FAILS=0
ok()   { printf '  ok   %s\n' "$*"; }
bad()  { FAILS=$((FAILS+1)); printf '  FAIL %s\n' "$*"; }
head_() { printf '\n== %s\n' "$*"; }

# ── 1. Сборка ────────────────────────────────────────────────────────────────
head_ "build (tsc + vite + ssr + prerender)"
if [ "$FAST" = "1" ]; then
  printf '  skip (--fast)\n'
else
  if npm run build > brigade/logs/build.log 2>&1; then
    ok "npm run build"
  else
    bad "npm run build — см. brigade/logs/build.log"
    tail -30 brigade/logs/build.log | sed 's/^/       /'
  fi
fi

# ── 2. Инварианты, которые держатся всегда ────────────────────────────────────
head_ "invariants"

check_contains() { # file, pattern, label
  if [ -f "$1" ] && grep -qF -- "$2" "$1"; then ok "$3"; else bad "$3 ($1)"; fi
}

if [ "$FAST" = "0" ]; then
  check_contains dist/index.html "Trefilov" "prerender EN hero"
  check_contains dist/ru/index.html "Трефилов" "prerender RU hero"

  n=$(grep -c "<loc>" dist/sitemap.xml 2>/dev/null || echo 0)
  [ "$n" -ge 12 ] && ok "sitemap ($n urls)" || bad "sitemap: $n urls < 12"

  [ -f dist/404.html ] && ok "dist/404.html" || bad "dist/404.html missing"

  # пререндер не должен содержать невидимых reveal-блоков
  if grep -q 'opacity: 0' dist/ru/index.html 2>/dev/null; then
    bad "prerender содержит inline opacity:0 (reveal-баг из §10.1)"
  else
    ok "нет inline opacity:0 в пререндере"
  fi
fi

# запрещённое ТЗ
for pat in 'three-globe' 'THREE.Globe' 'GlobeScene' 'glitch' 'terminal-mode'; do
  if grep -rq -- "$pat" src 2>/dev/null; then bad "запрещено ТЗ: $pat в src/"; else ok "нет $pat"; fi
done

# одна каретка на весь сайт
n=$(grep -rn 'data-caret' src 2>/dev/null | wc -l | tr -d ' ')
[ "$n" -le 2 ] && ok "каретка: $n вхождений (<=2: hero + компонент)" || bad "каретка: $n вхождений (должна быть одна)"

# ── 3. Проверки фаз ──────────────────────────────────────────────────────────
for f in brigade/checks.d/*.sh; do
  [ -e "$f" ] || continue
  num=$(basename "$f" | tr -dc '0-9' | cut -c1-2)
  [ "${num:-99}" -le "$PHASE" ] || continue
  head_ "checks: $(basename "$f")"
  # shellcheck disable=SC1090
  if ! bash "$f"; then bad "$(basename "$f")"; fi
done

# ── Итог ─────────────────────────────────────────────────────────────────────
printf '\n'
if [ "$FAILS" -eq 0 ]; then
  printf 'GATE GREEN (phase %s)\n' "$PHASE"
  exit 0
fi
printf 'GATE RED: %s провалов (phase %s)\n' "$FAILS" "$PHASE"
exit 1
