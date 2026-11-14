## Итог: сделано
Коммиты: 1dcfc78 phase 3: сплэш загрузки модели, Embedding Space, фоновые логи, hero с метриками и fetch-github
Зелено: `./brigade/gate.sh` → GATE GREEN (phase 3). `npm run build` включает fetch-github + tsc + vite + ssr + prerender. Пререндер EN/RU содержит hero (`BACKENDS THAT THINK.` / `БЭКЕНД, КОТОРЫЙ ДУМАЕТ.`), sitemap 12 urls, 404, нет inline opacity:0.

Размеры чанков (`vite build`):
- `index-CRA3ePoQ.js` 503.64 kB (gzip 163.07 kB) — основной бандл (React/контент)
- `embedding-CLfDlZQI.js` 479.05 kB (gzip 120.84 kB) — Three + Embedding Space, ленивый чанк
- `EmbeddingCanvas-wdfMDa5r.js` 2.21 kB (gzip 1.02 kB)
- `index-D4-8ALNT.js` 70.43 kB (gzip 27.68 kB)
- `ScrollTrigger-BrDuEirF.js` 43.55 kB (gzip 18.11 kB)
- `lenis-BBml_0t9.js` 18.71 kB (gzip 5.45 kB)
- CSS `index-DWM3L5OM.css` 33.17 kB (gzip 8.09 kB)

Three не в начальном графе: `import()` после `loaderDone`. LCP — текст hero в пререндере, canvas не в HTML без JS.

Частично: живой прогон в браузере (клик по сплэшу, drag облака, смена темы, отключение WebGL) в этой CLI-сессии не делался.
Не сделано: удаление `NeuralOrb`/`src/three/orb.ts` — не в мандате, Hero больше их не импортирует.
Открытые вопросы к оркестратору: нет. `GH_STATS_TOKEN` в секретах репо ещё нужен для живых коммитов; кэш `src/generated/github.json` — 307 / 10.
