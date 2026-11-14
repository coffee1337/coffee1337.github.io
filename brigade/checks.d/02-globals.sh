#!/usr/bin/env bash
# Фаза 2: шапка-пилюля, ScrambleHeading, Cmd+K, тосты, футер (§3.1, 3.2, 3.3, 3.5, 3.6)
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }

grep -q '"framer-motion"' package.json && ok "framer-motion" || bad "framer-motion"
grep -q '"cmdk"' package.json && ok "cmdk" || bad "cmdk"

grep -rqi "ScrambleHeading" src && ok "ScrambleHeading существует" || bad "ScrambleHeading существует"
n=$(grep -rli "ScrambleHeading" src/components 2>/dev/null | wc -l | tr -d ' ')
[ "$n" -ge 1 ] && ok "ScrambleHeading используется" || bad "ScrambleHeading используется"

grep -rq "layoutId" src && ok "layoutId (бегущий индикатор)" || bad "layoutId (бегущий индикатор)"
grep -rqi "backdrop-blur\|backdropFilter" src && ok "шапка с blur" || bad "шапка с blur"
grep -rqi "scrollspy\|useScrollSpy" src && ok "scroll-spy" || bad "scroll-spy"
grep -rq "metaKey\|ctrlKey" src && ok "хоткей Cmd/Ctrl+K" || bad "хоткей Cmd/Ctrl+K"

grep -rqi "toast" src && ok "тосты" || bad "тосты"
grep -rqi "toLocaleTimeString\|Intl.DateTimeFormat" src && ok "часы в футере" || bad "часы в футере"
grep -rq "COFFEE1337" src && ok "водяной знак COFFEE1337" || bad "водяной знак COFFEE1337"
grep -rq "OPEN TO WORK\|ОТКРЫТ К НАЙМУ" src/content && ok "бейдж статуса" || bad "бейдж статуса"
grep -rqi "llms.txt" src && ok "ссылка на llms.txt" || bad "ссылка на llms.txt"
exit $fails
