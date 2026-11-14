## Итог: сделано

Коммиты: 94d1771 `phase 1: токены Espresso/Parchment, variable-шрифты (Onest cyrillic fallback), зерно/сетка, фиксы reveal §10.1 и нумерации §10.2`

Зелено:
- `./brigade/gate.sh` — exit 0, `GATE GREEN (phase 1)`: сборка (tsc + vite + ssr + prerender), все 12 URL в sitemap, 404 на месте, пререндер EN/RU содержит контент, inline `opacity: 0` в dist нет, все 26 проверок `01-foundation.sh` зелёные.
- Токены §2.1: палитры Espresso/Parchment ровно по ТЗ (`--bg…--ok`, `--accent-glow`, `--dot`), блок совместимости (`--text/--muted/--faint/--surface/--surface-2/--accent-ink`). `--lime`/`--lime-ink` оставлены алиасами на акцент (24 использования в старых компонентах), `--header` и `--line-strong` пересчитаны на новые базы, `--shadow`/`--noise` удалены (не использовались нигде).
- Шрифты §2.2: установлены 4 пакета `@fontsource-variable/*`; `fonts.css` — 12 self-hosted `@font-face` (woff2 в `public/fonts/`), у Onest явные cyrillic + cyrillic-ext сабсеты с unicode-range, у JetBrains Mono тоже кириллица, везде `font-display: swap`. Проверено в браузере: `document.fonts.check('16px "Onest Variable"', 'Трефилов') === true`, body-стек `Epilogue Variable → Onest Variable`, h1-стек `Bricolage Grotesque Variable → Onest Variable` — кириллица рисуется Onest, не системным.
- Tailwind: `theme.extend.colors` (bg/bg2/bg3/ink/inkDim/inkFaint/line/line2/dot/accent/accent2/ok) и `fontFamily` (display/body/mono) через `var(--…)`.
- Фактура §2.1: SVG-зерно (opacity 0.04 dark / 0.05 light, статично) и `.dot-grid` (сетка из `--dot`) — переиспользуемые слои в `global.css`.
- §10.1: `main.tsx` ставит `html.js` до рендера; скрытие `[data-reveal]` только под `html.js`; `ScrollTrigger.refresh()` — после init Lenis, после `document.fonts.ready`, после `window load` (`src/lib/scrollRefresh.ts`); Lenis дёргает `ScrollTrigger.update()` на скролл; элементы в вьюпорте анимируются сразу (`getBoundingClientRect().top < innerHeight` → `tween.play(0)`). Проверено в браузере: прямой заход на `/ru/projects/knn/` — из 18 reveal-элементов 17 видимы сразу (1 ниже фолда — по скроллу доигрывает), после скролла скрытых 0; на `/` и `/ru/` скрытых в вьюпорте 0 из 153.
- §10.2: `index` убран из `ProjectContent`/`projectMeta`; позиция = `findIndex + 1`, всего = `items.length`, оба `padStart(2, "0")`. Проверено в dist: knn `05 / 05` (было `05 / 04`), mentor `01 / 05`. Все места (`ProjectPage`, `Projects`, `ProjectVisual`, `Resume`) переведены на вычисляемую позицию; `ProjectVisual` получает `position` пропом.
- Контраст §11 (расчёт WCAG): ink/bg 17.2 (dark) и 16.6 (light); ink-dim/bg 7.35 и 5.70 — AA с запасом; accent/bg 4.43 и 4.89 — только крупный текст/иконки (как в ТЗ).
- Дым `vite preview` + браузер: обе темы и обе локали отдаются, light = rgb(248,244,238), переключение темы и маршруты на месте.

Частично:
- `--ink-faint` из ТЗ не проходил AA для мелкого текста (3.59 dark / 4.04 light при норме 4.5) — поднят минимальной дельтой: dark `#6e6862` → `#7f7972` (4.59:1), light `#8b7367` → `#846b5f` (4.51:1). На `--bg-2` остаётся 4.37/4.13 — чуть ниже 4.5, но faint-текст живёт на `--bg`; если в фазах 2–4 faint пойдёт на surface-плашки — поднять ещё раз.

Не сделано:
- Preload критичных woff2 в `index.html` — Vite хэширует ассеты бандла, а шрифты лежат в `public/` с постоянными путями; preload добавить тривиально, но гейт этого не требует. Если будет проседать LCP/CLS — добавить `<link rel="preload" href="/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" crossorigin>` (+ onest-cyrillic для RU).
- Пиксельный шрифт `--font-pixel` (§2.2) — к фазе 2 (бейджи), в мандат фазы 1 не входил.
- Побочная находка: в `ProjectPage` секция «следующий проект» была сиротой (её `data-reveal` не покрывался ни одним `useReveal`) — со старым механизмом это не проявлялось, с CSS-скрытием стала бы невидимой навсегда; закрыто вторым `useReveal` на секции.

Открытые вопросы к оркестратору: нет
