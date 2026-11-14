# Роль: ФУНДАМЕНТ (фаза 1)

Прочитай в этом порядке: `AGENTS.md` → `docs/PROMPT.md` (разделы 2, 10 и критерии приёмки) →
`src/styles/tokens.css`, `src/styles/fonts.css`, `src/styles/global.css`, `tailwind.config.js`,
`src/main.tsx`, `src/hooks/useMotion.ts`, `src/components/Projects/ProjectPage.tsx`,
`src/content/projects.ts`.

Ты делаешь только фазу 1. Больше ничего не трогай.

## Задачи

1. **Токены (§2.1).** Переписать `src/styles/tokens.css` под палитры «Espresso» (dark, по
   умолчанию) и «Parchment» (light) ровно теми значениями, что в ТЗ: `--bg`, `--bg-2`, `--bg-3`,
   `--ink`, `--ink-dim`, `--ink-faint`, `--line`, `--line-2`, `--dot`, `--accent`, `--accent-2`,
   `--accent-glow`, `--ok`.
   Чтобы не переписывать полсотни компонентов сразу — оставь в конце файла блок совместимости:
   `--text: var(--ink); --muted: var(--ink-dim); --faint: var(--ink-faint);
    --surface: var(--bg-2); --surface-2: var(--bg-3); --accent-ink: #0c0a09;`
   Старые `--lime`, `--shadow`, `--noise`, `--header` удали, если они нигде не используются
   (`grep -rn` по каждому), иначе оставь с новым значением.
2. **Шрифты (§2.2).** Установи `@fontsource-variable/bricolage-grotesque`,
   `@fontsource-variable/epilogue`, `@fontsource-variable/jetbrains-mono`,
   `@fontsource-variable/onest`. Подключи self-hosted в `src/styles/fonts.css` с явным
   кириллическим сабсетом для Onest, `font-display: swap`. Пропиши в токенах `--font-display`
   (Bricolage → Onest → system-ui), `--font-body` (Epilogue → Onest → system-ui),
   `--font-mono` (JetBrains Mono). IBM Plex-файлы из `public/fonts` можно оставить как fallback,
   но новые шрифты обязаны быть основными. Проверь, что кириллица реально рисуется Onest:
   собери и посмотри вывод `dist/ru/index.html` (шрифт не должен быть системным).
3. **Tailwind.** В `tailwind.config.js` заведи `theme.extend.colors` (`bg`, `bg2`, `bg3`, `ink`,
   `inkDim`, `inkFaint`, `line`, `line2`, `accent`, `accent2`, `ok`) через `var(--…)` и
   `fontFamily` (`display`, `body`, `mono`).
4. **Фактура (§2.1).** Лёгкое SVG-зерно поверх фона (opacity 0.03–0.05) и точечная сетка
   `--dot` для hero — оба как переиспользуемые слои в `global.css`, не как инлайн-стили в
   компонентах. Оба уважают `prefers-reduced-motion` (зерно статично всегда).
5. **§10.1 — reveal-баг.** Сейчас `useReveal` ставит `opacity: 0` каждому элементу; при прямом
   заходе на `/projects/:id/` блоки остаются невидимыми. Исправь:
   - `main.tsx` добавляет `document.documentElement.classList.add("js")` до рендера;
   - в CSS скрытие применяется только под `html.js`;
   - `ScrollTrigger.refresh()` вызывается после инициализации Lenis, после `document.fonts.ready`
     и после загрузки изображений (`window.addEventListener("load")`);
   - элементы, которые уже в вьюпорте на момент инициализации, анимируются сразу, без ожидания
     скролла (проверяй `getBoundingClientRect().top < innerHeight`).
   Проверка приёмки: `curl`-подобная проверка пререндера — в `dist/projects/*/index.html` нет
   inline `opacity: 0`, а после загрузки в браузере контент виден без скролла.
6. **§10.2 — нумерация.** Хлебные крошки на странице проекта показывают `05 / 04`. Убери `index`
   из контента и считай позицию из массива: `index + 1` из `items.findIndex(...)`, всего —
   `items.length`, оба с ведущим нулём (`padStart(2, "0")`). Проверь все места, где используется
   `copy.index` и `project.index`.
7. **Контраст (§11).** Проверь AA для текста в обеих темах: `--ink` на `--bg`, `--ink-dim` на
   `--bg`, акцент на `--bg` только для крупного текста/иконок. Если контраст не проходит —
   скорректируй `--ink-dim`/`--ink-faint` на минимальные дельты и напиши об этом в отчёте.

## Приёмка фазы

- `./brigade/gate.sh` — exit 0 при `PHASE=1`.
- `npm run build` зелёный, пререндер всех 12 URL на месте.
- Обе темы, обе локали выглядят по новой системе (проверь руками: `npm run dev` и
  `curl -s http://localhost:5173/ru/ | head`).
- Баги §10.1 и §10.2 не воспроизводятся.

## Отчёт

`brigade/logs/01-foundation.report.md` по шаблону из `AGENTS.md`. В «Зелено» — вывод гейта,
в «Частично» — что осталось. Не пиши «готово», если гейт не проходил.
