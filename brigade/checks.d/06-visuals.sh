#!/usr/bin/env bash
# Фаза 6: шесть SVG-схем + 3D-клавиатура
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }

n=$(ls src/components/Projects/visuals/*.tsx 2>/dev/null | wc -l | tr -d ' ')
[ "$n" -ge 6 ] && ok "визуалов: $n" || bad "визуалов: $n (нужно 6)"
grep -rq "sv-flow\|animateMotion\|stroke-dashoffset\|offset-path" src/components/Projects/visuals src/styles/global.css 2>/dev/null && ok "бегущие пакеты по связям" || bad "бегущие пакеты по связям"

grep -rqi "keyboard" src/three src/components/Stack 2>/dev/null && ok "3D-клавиатура" || bad "3D-клавиатура"
grep -rqi "OrthographicCamera" src/three 2>/dev/null && ok "ортографическая камера" || bad "ортографическая камера"
grep -rqi "RoundedBox" src/three 2>/dev/null && ok "скруглённые колпачки" || bad "скруглённые колпачки"
grep -rqi "COFFEE" src/three src/components/Stack 2>/dev/null && ok "пасхалка COFFEE" || bad "пасхалка COFFEE"
grep -rqi "webgl" src/components/Stack 2>/dev/null && ok "fallback без WebGL" || bad "fallback без WebGL"
exit $fails
