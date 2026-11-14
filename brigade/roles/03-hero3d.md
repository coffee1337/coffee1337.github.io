# Роль: СПЛЭШ, HERO, 3D-ОБЛАКО, ЛОГИ (фаза 3)

Читай: `AGENTS.md` → `docs/PROMPT.md` §3.4, §4.1, §2.4, §11, §8 → `src/components/Loader/Loader.tsx`,
`src/components/Hero/Hero.tsx`, `src/components/NeuralOrb/NeuralOrb.tsx`, `src/three/orb.ts`,
`src/App.tsx`, `src/context/SiteProvider.tsx`, `src/content/{en,ru}.ts`.

Фазы 1–2 закрыты: есть палитра, шрифты, `ScrambleHeading`, шапка, тосты, футер, Cmd+K.
Ты делаешь фазу 3. Секции §01–§06 и чат не трогай.

## Задачи

1. **Сплэш «загрузка модели» (§3.4)** — заменить `Loader.tsx`, старый глобус/orb не возвращать.
   3 сценария в 3000ms на canvas: сборка ASCII-схемы сети из хаоса → импульсы forward pass и
   прогресс `▓░` → стриминг токенов имени с `p=0.97` → разлёт узлов в облако hero и растворение.
   - Полная версия — при первом визите за сессию (`sessionStorage`), повторно ~700ms или без.
   - Пропуск: клик, любая клавиша, `skip ↵` в углу.
   - Контент страницы уже в HTML под оверлеем; оверлей монтируется только на клиенте, без JS его нет.
   - `prefers-reduced-motion` → статичный кадр 600ms, без анимации текста и импульсов.
   - Учитывай `reduced` из `useSite()`; не ломай `loaderDone` (на нём висит reveal).
2. **Embedding Space (§4.1.6)** — `src/components/Hero/EmbeddingSpace.tsx` + `src/three/embedding.ts`.
   - `THREE.Points` 1500–2500 точек (мобильные 600–900), 5–6 кластеров (`backend`, `llm`, `rag`,
     `ml`, `mobile`, `data`).
   - Глифы вместо круглых точек: атлас символов `0 1 · + * ▪ :` + изредка короткие токены
     (`fastapi`, `rag`, `attention`, `vector`, `torch`, `sql`), генерируется на canvas; яркость
     и размер зависят от z (шейдер, `ShaderMaterial`).
   - Автоповорот, drag с инерцией, курсор `grab`/`grabbing`; при наведении на кластер — подпись
     `cluster: rag · n=412`.
   - Каждые ~4s «запрос»: терракотовая точка с подписью `query: "<текст>"`, линии к top-5
     соседям, карамельная подсветка, метки сходства `0.91`, `0.88`, через 1.5s гаснет.
   - HUD в углу: `dim=384 · n=2048 · metric=cosine · top_k=5`.
   - Цвета — из CSS-переменных (`getComputedStyle`), реакция на смену темы.
   - Ленивый `import()` после сплэша, пауза вне экрана и в скрытой вкладке, DPR ≤ 2,
     fallback без WebGL — статичная картинка облака (SVG) в `public/`.
3. **Фоновые логи (§4.1.7)** — `src/content/logs.ts` (40–60 правдоподобных строк из ТЗ,
   перемешаны, зациклены без шва) + слой за hero: моно 12–13px, opacity 0.12 (dark) / 0.10 (light),
   медленный скролл вверх, маска-градиент, `aria-hidden`, `prefers-reduced-motion` → без анимации.
   Никаких утверждений о реальных метриках: это декорация.
4. **Hero (§4.1).** Переписать `Hero.tsx`:
   - строка статуса (`● ЕГОР ТРЕФИЛОВ · PYTHON BACKEND & AI · 3 КУРС НГИЭУ · MSK HH:MM:SS · ОТКРЫТ К НАЙМУ
     И ФРИЛАНСУ`), зелёная пульсирующая точка, живые часы, в пререндере `--:--:--`;
   - заголовок `БЭКЕНД, КОТОРЫЙ ДУМАЕТ.` / `BACKENDS THAT THINK.` через `ScrambleHeading`,
     градиентная заливка, **одна** каретка `data-caret` терракотового цвета, мигает 3 раза и замирает;
   - подзаголовок из ТЗ, кнопки `Смотреть проекты` / `Связаться ↗`, строка моно-ссылок
     `EMAIL · TELEGRAM · GITHUB · LINKEDIN · РЕЗЮМЕ`;
   - 4 карточки-метрик с count-up: `{commitsLastYear}`, `{publicRepos}`, `3`, `6`; каждая — ссылка;
     значения из `src/generated/github.json` с fallback на закоммиченный кэш.
5. **`scripts/fetch-github.mjs` (§8).** GraphQL `contributionsCollection.contributionCalendar.totalContributions`
   + REST `public_repos`; токен `GH_STATS_TOKEN` из env; результат → `src/generated/github.json`.
   Без токена или при ошибке — молча использовать существующий кэш, сборка не падает.
   Добавь шаг в `build` перед `vite build`.
6. **Производительность (§11).** Начальный JS не растёт: Three и сцены — только в ленивых чанках.
   LCP — текст hero из пререндера, не canvas. Проверь `vite build` вывод по размеру чанков.

## Приёмка

`./brigade/gate.sh` exit 0 при `PHASE=3`. Проверь в браузере: сплэш проходится кликом, canvas
крутится и тормозит вне экрана, тема переключается и облако меняет цвет, без WebGL — картинка.

## Отчёт

`brigade/logs/03-hero3d.report.md` по шаблону `AGENTS.md`. В отчёте — размеры чанков из `vite build`.
