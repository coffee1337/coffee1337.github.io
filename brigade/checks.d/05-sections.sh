#!/usr/bin/env bash
# Фаза 5: §01 Entry, §02 About+Education, §04 Projects (дерево/карточка/аккордеон)
set -uo pipefail
fails=0
ok(){ printf '  ok   %s\n' "$*"; }
bad(){ fails=$((fails+1)); printf '  FAIL %s\n' "$*"; }

grep -rqi "С чем вы пришли\|With what you came\|Entry" src/components/Entry 2>/dev/null && ok "секция §01 Entry" || bad "секция §01 Entry"
[ -d src/components/Education ] && ok "карточка образования" || bad "карточка образования"
grep -rq 'role="tree"' src/components 2>/dev/null && ok "дерево role=tree" || bad "дерево role=tree"
grep -rq 'role="treeitem"' src/components 2>/dev/null && ok "treeitem" || bad "treeitem"
grep -rqi "ArrowDown\|key === \"Arrow" src/components/Projects 2>/dev/null && ok "клавиатура дерева" || bad "клавиатура дерева"
grep -rqi "PROBLEM\|ПРОБЛЕМА" src/content 2>/dev/null && ok "аккордеон PROBLEM/SOLUTION/RESULT" || bad "аккордеон PROBLEM/SOLUTION/RESULT"
grep -rq "git clone" src/components 2>/dev/null && ok "CLI-блок git clone" || bad "CLI-блок git clone"
grep -rq "#projects/" src/components 2>/dev/null && ok "хэш проекта" || bad "хэш проекта"
grep -rqE "§\{?[a-z0-9.]+\}?" src/components 2>/dev/null && ok "моно-лейблы §NN" || bad "моно-лейблы §NN"
exit $fails
