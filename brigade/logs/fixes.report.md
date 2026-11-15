# Отчёт: исправления и доводка портфолио

Репозиторий: `coffee1337.github.io`. Работа шла фазами мандата (1–11), коммиты — сразу в `main`.
Итог: **сделано** по всем фазам, кроме отзывов (данных нет — секция скрыта), LLM-ключа
(владелец подключает сам) и кросс-браузерной проверки на Windows/macOS (в этом окружении
доступен только Chromium/Linux).

## Коммиты

| sha | сообщение |
|---|---|
| `d982769` | `fix(infra): тема применяется синхронно, единый Lenis и блокировка скролла в модалках` |
| `f0a65f7` | `fix(hero,stack,scramble): переписаны облако эмбеддингов, 3D-клавиатура и расшифровка заголовков` |
| `e4ec873` | `fix(cases): шесть SVG-схем переделаны на реальную геометрию и данные` |
| `c5d4ccf` | `feat(assistant): локальный роутер, база знаний из контента и README, Worker на любом OpenAI-API` |
| `17cb86c` | `feat(brand,footer,loader): иконки, HTML-вотермарк, пиксельная чашка, новая айдентика и лоадер` |
| _(этот)_ | `chore: перф-проход, скриншоты, отчёт` |

## Фаза 1. Инфраструктура

- `SiteProvider`: `data-theme` ставится **синхронно** (в `commitTheme` до `setState`), затем
  `window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }))`. Первый кадр
  синхронизируется `useLayoutEffect`. Причина бага «анимации пропадают» (дочерний эффект читал
  CSS до эффекта провайдера) устранена.
- `src/lib/lenis.ts`: единственный инстанс, `getLenis()`, `useLenis()` (useSyncExternalStore).
- `useSmoothScroll`: регистрирует инстанс в модуле; если модалка уже открыта — сразу `stop()`.
- `src/hooks/useScrollLock.ts`: счётчик вложенных локов, `lenis.stop()`, `body { overflow:hidden }`
  с компенсацией скроллбара; при закрытии — `start()`.
- `data-lenis-prevent` + `overscroll-behavior: contain` на списке cmdk, ленте чата, мобильном меню.
- Базовый CSS Lenis (`html.lenis`, `.lenis-stopped`, `[data-lenis-prevent]`).
- `overflow-x: hidden` c `html`/`body` убран, оставлен один `overflow-x: clip` на `html`
  (не создаёт scroll-container, sticky и Lenis работают).
- Скроллбар: `scrollbar-width: thin` + `scrollbar-color` (Firefox) и `::-webkit-scrollbar*`
  (Chrome/Edge/Safari), ползунок `color-mix(--accent 55%, transparent)`, hover `--accent`,
  8px (6px внутри модалок), прозрачный трек, скругление.
- Удалён мёртвый код: `NeuralOrb`, `src/three/orb.ts`, `Splash`, `Capabilities`, `Experience`,
  `orbMode`/`assembleRef`. В `brigade/checks.d/03-hero.sh` путь проверки кнопки skip переведён
  с удалённого `Splash` на `Loader` (требование то же).

## Фаза 2. Hero: облако эмбеддингов

- `.hero-stage` (рамка/обрезка) удалён. Canvas живёт в `.hero-field`: справа, `width: min(64vw, 1000px)`,
  во всю высоту hero, уходит за правый край; края растворяются `mask-image` (эллипс), под текстом
  приглушено. На мобильных — мягкий фон сверху (`opacity .2`, высота 42%): текст читается.
- Камера подбирается по ограничивающей сфере облака и aspect; геометрия отцентрована в 0,
  вращение не выводит облако из кадра.
- Цвет: `THREE.Color.setStyle(..., SRGBColorSpace)` → линейное пространство, в шейдере
  премультиплицированная альфа `vec4(color * a, a)` + `#include <colorspace_fragment>`,
  `CustomBlending (ONE, ONE_MINUS_SRC_ALPHA)`. Проверено на тёмном и светлом фоне.
- Палитра под тему: dark — кремовые глифы + терракота/карамель; light — эспрессо-глифы,
  дальние точки ≥ 0.42 альфы, размер крупнее. Переход по `themechange` ~400 мс, без пересоздания.
- kNN: настоящий top-5 по евклидову расстоянию в 3D (без «зажима» 0.72–0.99), скор — `1/(1+d)`.
- Линии: `Line2/LineMaterial`, толщина 1.8px (glow 7px), квадратичная кривая, «прорисовка»
  `instanceCount` ~420 мс со stagger 70 мс, импульс карамелью, hold 2.5 с, fade 400 мс.
- Подписи — DOM-оверлей, позиция пересчитывается каждый кадр проекцией; скрываются за кадром,
  простейшее вертикальное разнесение. Подпись кластера — рядом с кластером (`dict.hero.cluster`).
- HUD: `dim=384 · n=<реальное число точек> · metric=euclidean · top_k=5`.
- Во время запроса вращение замедляется до 30%.
- Uтечек нет: dispose геометрий/материалов/текстур/лейблов, пауза по IntersectionObserver
  и `visibilitychange`, DPR ≤ 2, на мобильных 900 точек и без hover/drag.
- `HeroLogs`: `scrollHeight` читается только на resize, анимация паузится вне экрана и в скрытой
  вкладке.

## Фаза 3. Stack: 3D-клавиатура

- Клавиши берутся из `dict.stack.groups` (факты из контента, не из головы), на узких экранах
  ряды делятся пополам — клавиши крупнее.
- Подписи: полный текст, перенос на 2 строки, шрифт подгоняется по ширине; текстура рисуется
  после `document.fonts.ready`; наклейка — отдельная плоскость только на верхней грани.
- Цвета: dark — тёмно-коричневые колпачки/светлая подпись, light — светлые кремовые/коричневая
  подпись, подложка темнее; свет в light мягче. Перекраска по `themechange` без пересоздания.
- `getComputedStyle` только при создании/смене темы; покадрового парсинга `--accent-glow` нет.
- `color.lerp(accent2)` каждый кадр убран; вместо COFFEE-пасхалки — idle-волна по рядам после 6 с.
- Raycast только на `pointermove`/`pointerdown`; при промахе hover сбрасывается, курсор `pointer`.
- Клик: клавиша остаётся выделенной, панель «Где используется» (desktop — справа, mobile — под
  клавиатурой) со списком проектов и ссылками `/projects/:id/` (с `/ru`). Кнопка
  «Показать в проектах» применяет фильтр и только потом скроллит. Алиасы —
  `src/lib/tech.ts` (`LLM API↔LLM`, `.NET↔.NET 8`, `C++↔C++17`, …). Нет проектов — нейтральная строка.
- Фильтр `Projects` принимает любую технологию: временный чип с ×, сброс, авто-выбор видимого проекта.
- Frustum считается по проекции 8 углов доски — без обрезки до 360px.
- Доступность: визуально скрытый список кнопок синхронизирован с клавиатурой, aria-label/строки из i18n.

## Фаза 4. Схемы кейсов

- `transform-box: fill-box` + корректные `transform-origin` для клеток/столбиков/стрелки.
- `connect(a, b, sideA, sideB)` строит связи по границам узлов, со стрелками; база `--ink-faint` 45%,
  поверх — акцентный поток; пакеты идут по реальным путям (`animateMotion` + `mpath`).
- Факты сверены с README репозиториев: в mentor убраны Redis и прочее неподтверждённое
  (узлы Next.js → FastAPI → AI Gateway(+RAG) → LLM, PostgreSQL, workers, Telegram).
- KNN: победитель считается из данных (`winner: class b · 4/5`), метрика подписана `euclidean`.
- A*: путь считается настоящим A* по сетке при загрузке модуля, клетки раскрываются в порядке
  раскрытия, легенда совпадает с экраном, путь не проходит сквозь стены.
- Monitor: дуги low/medium/high на верхнем полукруге, стрелка вращается вокруг центра, строки
  втекают в rule engine по кривым.
- Analytics: столбики от своей базовой линии, мусор `opacity={flow ? 0 : 0}` убран, вместо SQLite
  в проде — PostgreSQL (по README), выдуманный «uptime 24/7» удалён.
- Ngieu: одна композиция (телефон → кэш → расписание → уведомления → виджет), без дублей.
- Все подписи — `dict.visuals.*` (RU/EN паритет), бейдж `active` — `dict.sections.projectsUi.active`.
- Анимация паузится вне экрана (data-flow в обе стороны), reduced motion — статичный финальный кадр.
- Двойная рамка на странице кейса убрана (внешний `.case-visual` снят), у визуала фиксированный
  `aspect-[480/300]` — crossfade без скачка высоты.

## Фаза 5. Scramble заголовков

- В разметке/пререндере — обычный текст; на старте текст нарезается в DOM на слова/символы.
- Пробелы не скрамбливаются, слова — `inline-block/nowrap`, переносы совпадают с финальными.
- Ширина каждой ячейки фиксируется по финальному глифу после `document.fonts.ready`
  (одна пачка чтений, потом пачка записей) — **CLS 0**: замер высоты h1 во время анимации
  даёт 349.9px на всех кадрах.
- rAF + `textContent`, без `setState` на тиках; unresolved-символы — `--ink-dim`; ~820 мс.
- Hero: старт строго после `loaderDone`; секции — один раз при 40% видимости; reduced motion — без эффекта.
- Градиент hero остался непрерывным (background-clip на блоке, не на буквах).
- Каретка — inline сразу после последнего символа (замер: 449.3px при правом крае h1 712.3px),
  3 мигания после анимации.
- a11y: `aria-label` с полным текстом, визуальный слой `aria-hidden`.

## Фаза 6. Подвал и иконки

- `src/components/Icons/`: GitHub, LinkedIn, Telegram, Mail, Resume, Llms, Copy, ArrowUpRight,
  PixelCup (inline SVG, `currentColor`, 16–18px, aria-hidden, hover → `--accent`).
- Ватермарк `COFFEE1337` — HTML-текст шрифтом `--font-display`, fit-text по ширине контейнера,
  заливка `linear-gradient(180deg, --ink → transparent)` через `background-clip: text`,
  без SVG-обводки и без искажения `spacingAndGlyphs`.
- Маскот: пиксельная сетка, непересекающиеся rect, `shape-rendering: crispEdges`, пар из 3
  столбиков, статично при reduced motion.
- Ссылки подвала: иконка + текст, Email с копированием и тостом, Resume PDF, llms.txt.
- `KbdShortcut`: ⌘K на Apple, Ctrl K иначе, нейтральный вариант в пререндере; используется в
  Header, Footer.
- `© {год}` — динамический; строки подвала/aria — в i18n (`dict.footer.resume`, `linksAria`).

## Фаза 7. Command Palette

- Хоткей: `(e.metaKey || e.ctrlKey) && (e.code === "KeyK" || e.key.toLowerCase() === "k")` +
  `preventDefault()`. Проверено синтетическим событием с `key: "л", code: "KeyK"` — палитра открывается.
- Колесо внутри списка скроллит список (`scrollTop 396`), страница остаётся на `scrollY 0`.
- Стрелки прокручивают выбранный пункт в зону видимости (`ArrowDown ×12` → пункт виден).
- Один обработчик `Escape` (в Header), палитра его не дублирует; при закрытии фокус возвращается
  на триггер (`paletteButton`).
- Мобильная кнопка меню без `⌘`.

## Фаза 8. AI-ассистент

- Клиент: индекс в promise-кэше + `await` в `ask()` (stale closure устранён), SSE-парсер без
  дублей (буфер хранит только неполную последнюю строку), `AbortController` на 15 с, откат в
  локальный режим без дублей сообщений.
- База знаний: `build-kb.mjs` разносит `## RU`/`## EN` в отдельные чанки (`lang: ru|en`),
  заголовки нормальные; часть базы генерится из `src/content/*` (проекты/стек/образование/контакты).
- `scripts/fetch-readmes.mjs` тянет README проектов, чистит бейджи/HTML, пишет
  `src/content/knowledge/generated/<repo>.md`; при ошибке сети использует снапшот и не падает.
  Подключён в `npm run build` перед `build-kb`.
- Локальный режим: язык по кириллице, роутер намерений ДО поиска (приветствие/благодарность/стек/
  проекты/проект/технология/образование/найм/фриланс/контакты/локация/резюме), ответы из
  структурированного контента со ссылками; MiniSearch со стоп-словами и prefix/fuzzy по длине;
  «ку» не находит «курс»; fallback + подсказки.
- Worker: любой OpenAI-compatible API (`LLM_URL`, `LLM_MODEL`, `LLM_API_KEY`), модель только из env,
  иначе `503 not_configured`; системный промпт (третье лицо, только контекст, отказ на офтоп,
  ссылки из белого списка), история 6 реплик, top 6–8 чанков, rate limit KV, CORS по списку origin
  (прод + `http://localhost:5173`), SSE.
- `deploy.yml`: `VITE_CHAT_API_URL: ${{ vars.VITE_CHAT_API_URL }}` в шаг сборки; без переменной —
  локальный режим.
- UI: подсказки в начале и follow-up после ответа, копирование ответа, безопасный мини-markdown
  ссылки/жирный/списки с экранированием, «печатает», очистка чата, история в sessionStorage,
  focus trap/Esc/aria, источники — человекочитаемые заголовки чанков.
- `npm run test:assistant`: **53/53** проверок (30+ вопросов RU/EN, обязательные кейсы, anti-«курс»,
  SSE, markdown, паритет 64 ключей assistant-ui).

## Фаза 9. Favicon и бренд-ассеты

- Новая монограмма: эспрессо-плашка, терракотовая «c»-чашка, карамельный пар, кремовая точка.
- `favicon.svg`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png` (180), `icon-192.png`,
  `icon-512.png`, `site.webmanifest`, обновлённый `brand/mark.svg`, `og.png` 1200×630.
- В `index.html` прописаны иконки, манифест и `theme-color` для обеих схем. Старые
  `#8B6CFF`/`#D6F25C` не встречаются.

## Фаза 10. Лоадер

- Критический оверлей `#boot` в `index.html` (цвет темы, виден с первого кадра), снимается после
  первого кадра React-лоадера + `html.boot-done`; `noscript` убирает его без JS — пререндер не мелькает.
- Сюжет ~4 с: шум → схождение в `coffee1337` (цели — сэмплы пикселей текста с offscreen-canvas) →
  световой импульс → разлёт/шторка и `onDone()` (hero-scramble и счётчики стартуют от `loaderDone`).
- Параллельно печатаются `dict.loader.lines`, прогресс синхронизирован с фазами.
- Повторный визит в сессии — ~1 с; пропуск: кнопка + Esc/Enter/клик (не «любая клавиша»);
  reduced motion — статичный ник 400 мс и fade.
- Палитра читается один раз на тему и плавно перекрашивается по `themechange`; `getComputedStyle`
  не в кадре; DPR ≤ 2; пауза в скрытой вкладке.

## Фаза 11. Чистка и мелочи

- Отзывы: блок данных от владельца пуст → `testimonials = []`, секция `Reviews` не рендерится
  (заглушки на проде нет).
- Старые алиасы токенов (`--lime`, `--text`, `--muted`, `--faint`, `--surface*`, `--focus`)
  заменены на основные переменные без визуальных изменений; блок алиасов удалён из `tokens.css`,
  `--line-strong`, `--header`, `--accent-ink` стали полноценными токенами темы.
- `HeroLogs` больше не читает `scrollHeight` в кадре.
- Метрики hero (`3`, `6`) перенесены в контент (`metricYearValue`, `metricLangsValue`).
- Новые UI-строки — только на обоих языках (паритет проверен гейтом).
- `createRoot` → `hydrateRoot` **не** переключал: пререндер содержит клиентские плейсхолдеры
  (часы, canvas, интерактивные списки), и смена точки входа даёт риск hydration-варнингов без
  выигрыша. Оставлено `createRoot` осознанно.

## Проверка

```
npm run build        → exit 0 (tsc + vite + ssr + prerender + llms + check-links)
bash brigade/gate.sh → GATE GREEN (phase 9), 97 проверок ok
npm run test:assistant → 53/53
```

Визуальные проверки (Chromium/Linux, `npm run preview`, скриншоты в `brigade/screens/`):
hero 1440/390 × light/dark × после переключения темы туда-обратно, stack (light/dark/панель/360px),
все 6 схем кейсов, footer (light/dark), палитра, чат, лоадер (~1.6 с).

Консоль: ошибок и предупреждений нет (кроме `GL Driver Message` программного рендера в headless-VM).

Скролл и хоткей:
- колесо в палитре: список `scrollTop 396`, страница `scrollY 0`;
- колесо в чате: лента скроллится, страница `scrollY 0`, `body.overflow: hidden` пока чат открыт;
- `Ctrl+K` при эмуляции RU-раскладки (`key: "л"`, `code: "KeyK"`) открывает палитру;
- стрелки прокручивают выбранный пункт в видимую зону; `Escape` закрывает и возвращает фокус.

Адаптив: горизонтального скролла нет на 360/390/768/1024/1440/1920
(`scrollWidth ≤ clientWidth`, разница −10px — резерв под скроллбар).

Производительность (CDP, CPU throttle 4×, 390×844, медиана 3 прогонов, новый билд против
`e2f606d`):

| метрика | до | после |
|---|---|---|
| FCP | 236 ms | **216 ms** |
| LCP | 1688 ms | **464 ms** |
| TBT | 2304 ms | **2173 ms** |
| JS transfer | 344 KB | **245 KB** |
| DOM nodes | 547 | 716 |

Lighthouse напрямую в этом окружении не запускался (нет совместимого Chrome для headless-запуска);
вместо него те же метрики Core Web Vitals сняты через PerformanceObserver + CDP-троттлинг.
Все ключевые метрики не хуже базовых — требование «Performance не ниже» выполнено с запасом по LCP.

## Что осталось / ограничения

1. **Отзывы.** Нужны реальные тексты (RU/EN, автор, роль, ссылка). Добавить в
   `src/content/testimonials.ts` по формату из комментария — секция появится сама.
2. **LLM.** Провайдер и ключ задаёт владелец. Пока `VITE_CHAT_API_URL` не задан — работает
   локальный режим (полностью функциональный).
3. **Кросс-браузер.** Проверено в Chromium/Linux (обе темы, RU/EN, 360–1920px). Windows Chrome/Edge
   и macOS Safari в этом окружении недоступны: стили скроллбара написаны и для `-webkit-`, и для
   Firefox, но живой прогон на Windows/macOS нужно сделать владельцу.
4. **`brigade/checks.d/03-hero.sh`** — путь проверки кнопки skip переведён с удалённого `Splash`
   на `Loader` (сама проверка не ослаблена).
5. **`createRoot`** оставлен — причина в разделе фазы 11.

## Как подключить LLM (для владельца)

1. `cd worker && wrangler login`.
2. `wrangler kv namespace create RATE_KV` → вставить `id` в `worker/wrangler.toml`
   (блок `[[kv_namespaces]]`).
3. Выбрать любого OpenAI-совместимого провайдера и задать переменные:
   ```bash
   wrangler secret put LLM_API_KEY
   ```
   В `wrangler.toml` (`[vars]`):
   - Gemini OpenAI-endpoint: `LLM_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"`,
     `LLM_MODEL = "gemini-2.0-flash"`;
   - Groq: `LLM_URL = "https://api.groq.com/openai/v1/chat/completions"`, `LLM_MODEL = "llama-3.3-70b-versatile"`;
   - OpenRouter: `LLM_URL = "https://openrouter.ai/api/v1/chat/completions"`, `LLM_MODEL = "<любая модель>"`;
   - OpenAI: `LLM_URL = "https://api.openai.com/v1/chat/completions"`, `LLM_MODEL = "<модель>"`.
   `ALLOWED_ORIGINS` — список origin через запятую (прод + `http://localhost:5173`).
4. `wrangler deploy` → получить URL `https://coffee1337-chat.<account>.workers.dev`.
5. В GitHub: Settings → Secrets and variables → Actions → **Variables** → добавить
   `VITE_CHAT_API_URL` = этот URL. Следующий деплой подхватит его; без переменной сайт
   остаётся в локальном режиме.

Ключи в репозиторий не коммитить: они живут только в секретах Worker.
