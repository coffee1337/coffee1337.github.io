#!/usr/bin/env bash
# Фаза 1: дизайн-система (§2), шрифты с кириллицей, баги §10.1 и §10.2.
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }
g(){ grep -qF -- "$2" "$1" 2>/dev/null; }

T=src/styles/tokens.css
g "$T" "#c4562a" && ok "accent dark #c4562a" || bad "accent dark #c4562a"
g "$T" "#b34a22" && ok "accent light #b34a22" || bad "accent light #b34a22"
g "$T" "#d9a066" && ok "accent-2 карамель" || bad "accent-2 карамель"
g "$T" "--ink" && ok "--ink" || bad "--ink"
g "$T" "--dot" && ok "--dot сетка" || bad "--dot сетка"
g "$T" "--ok" && ok "--ok статус" || bad "--ok статус"
g "$T" "--accent-glow" && ok "--accent-glow" || bad "--accent-glow"

F=src/styles/fonts.css
grep -qi "onest" "$F" && ok "Onest подключён" || bad "Onest подключён"
grep -qi "bricolage" "$F" && ok "Bricolage подключён" || bad "Bricolage подключён"
grep -qi "epilogue" "$F" && ok "Epilogue подключён" || bad "Epilogue подключён"
grep -qi "jetbrains" "$F" && ok "JetBrains Mono подключён" || bad "JetBrains Mono подключён"
grep -qi "cyrillic" "$F" && ok "кириллические сабсеты" || bad "кириллические сабсеты"

grep -q "@fontsource-variable/onest" package.json && ok "пакет onest" || bad "пакет onest"
grep -q "@fontsource-variable/bricolage-grotesque" package.json && ok "пакет bricolage" || bad "пакет bricolage"
grep -q "@fontsource-variable/epilogue" package.json && ok "пакет epilogue" || bad "пакет epilogue"

grep -q "fontFamily" tailwind.config.js && ok "tailwind fontFamily" || bad "tailwind fontFamily"
grep -q "var(--ink)" tailwind.config.js && ok "tailwind читает токены" || bad "tailwind читает токены"

# §10.1 — reveal не прячет контент без JS
grep -rq "classList.add(\"js\")\|classList.add('js')" src && ok "html.js ставится" || bad "html.js ставится (main.tsx)"
grep -rq "html\.js" src/styles/global.css && ok "html.js guard в CSS" || bad "html.js guard в CSS"
grep -rq "fonts.ready" src && ok "ScrollTrigger.refresh после fonts.ready" || bad "ScrollTrigger.refresh после fonts.ready"
grep -rq "ScrollTrigger.refresh\|ScrollTrigger\.refresh" src && ok "ScrollTrigger.refresh вызывается" || bad "ScrollTrigger.refresh вызывается"

# §10.2 — нумерация не захардкожена
grep -rq "project.index" src && bad "breadcrumb использует project.index (захардкожено)" || ok "breadcrumb без project.index"

# old palette must be gone from the active token file
grep -q "#8b6cff" "$T" && bad "старый фиолетовый акцент остался в tokens.css" || ok "старый акцент убран"

exit $fails
