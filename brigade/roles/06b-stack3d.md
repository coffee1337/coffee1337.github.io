# Роль: ИЗОМЕТРИЧЕСКАЯ 3D-КЛАВИАТУРА (фаза 6, часть B)

Читай: `AGENTS.md` → `docs/PROMPT.md` §4.4, §2.4, §11 → `src/components/Stack/Stack.tsx`,
`src/components/Capabilities/Capabilities.tsx`, `src/content/*`, `src/three/*` (как сделан
embedding/орб — переиспользуй паттерн паузы, DPR, reduced-motion).

## Задачи

1. **Сцена** `src/components/Stack/StackKeyboard.tsx` + `src/three/keyboard.ts`:
   - ортографическая камера, изометрия, мягкие тени, `RoundedBoxGeometry` для колпачков;
   - колпачки — эспрессо/крем по теме, 6–8 акцентных терракотой и карамелью;
   - текст на колпачках — текстура, сгенерированная canvas'ом, моноширинный шрифт;
   - ряды: Backend (Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, Redis, Docker),
     AI/Data (LLM API, RAG, PyTorch, Pandas, pgvector, NumPy),
     Frontend/Mobile (TypeScript, React, Next.js, Flutter, Dart),
     Systems/Tools (C#, .NET, C++, Git, Linux).
2. **Взаимодействие**:
   - наведение — клавиша нажимается (пружинная анимация), tooltip
     `FastAPI · используется в: ai-python-mentor, portfolio-analytics` (данные — из `projects.ts`,
     не выдумывать);
   - клик — скролл к `#projects` и активация фильтра технологии (через контекст/кастомное событие,
     которое слушает `Explorer`);
   - лёгкий параллакс за курсором;
   - простой пользователь ничего не делает 6+ секунд → клавиши «печатают» `COFFEE`.
3. **Fallback** без WebGL и на мобильных: CSS-сетка «клавиш» с теми же цветами и нажатием по тапу,
   tooltip по фокусу. Определяй поддержку WebGL до создания контекста.
4. **4 карточки компетенций** под сценой: Backend Engineering / AI & Automation / Data & ML /
   Systems & Mobile, по 1–2 строки, тексты — из контента (добавь ключи в `en.ts`/`ru.ts` с
   сохранением паритета).
5. **Производительность**: ленивая загрузка сцены при приближении к секции (IntersectionObserver
   с rootMargin 400px), пауза вне экрана/в скрытой вкладке, DPR ≤ 2, максимум два WebGL-контекста
   на страницу. Проверь, что `npm run build` не тянет three в основной чанк.

## Приёмка

`./brigade/gate.sh` exit 0 при `PHASE=6`. Клавиатура работает мышью и тапом, tooltip не выходит
за экран, `COFFEE` печатается один раз за простой, память не течёт (сцена диспозится при уходе).

## Отчёт

`brigade/logs/06b-stack3d.report.md`.
