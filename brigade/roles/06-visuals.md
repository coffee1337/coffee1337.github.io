# Роль: ШЕСТЬ SVG-СХЕМ ПРОЕКТОВ (фаза 6, часть A)

Читай: `AGENTS.md` → `docs/PROMPT.md` §4.5 (пункт про SVG-схемы), §2.3, §2.4 → текущий
`src/components/Projects/ProjectVisual.tsx`, `src/content/projects.ts`.

Ты делаешь только шесть компонентов-схем. `Explorer.tsx`, карточку и аккордеон не трогай —
их сделала фаза 5, ты подключаешься в `ProjectVisual.tsx` как в диспетчер.

## Общий стиль (все шесть)

- Инлайн SVG, viewBox фиксированный, `preserveAspectRatio="xMidYMid meet"`, ширина 100%.
- Узлы — острые прямоугольники (rx ≤ 2) с моно-подписями 11–13px, обводка `var(--line)`,
  заливка `var(--bg-2)`; акцент — `var(--accent)`, второй — `var(--accent-2)`.
- Связи — пунктир `stroke-dasharray`, по ним бегут пакеты данных (`stroke-dashoffset` или
  `offset-path` + `animateMotion`).
- Наведение на узел подсвечивает его связи и показывает tooltip (HTML-оверлей, не `<title>`).
- Анимация стартует только в зоне видимости (IntersectionObserver) и уважает
  `prefers-reduced-motion` (статичный кадр с подписями).
- Никаких выдуманных метрик в подписях: только имена компонентов и технологий из README.

## Шесть схем

1. `ai-python-mentor` — `Next.js → FastAPI → AI Gateway → LLM`; ветки `RAG (pgvector) → PostgreSQL`,
   `Redis queue → worker`, `Telegram bot`; сценарий «вопрос → retrieval → стримится ответ».
2. `neural-astar-heuristic` — сетка-лабиринт, A* раскрывает клетки, тепловая карта нейро-эвристики,
   путь прорисовывается терракотой.
3. `ngieuapp` — силуэт телефона, `Flutter UI → SQLite offline cache → schedule → notifications`,
   мини-виджет на «экране блокировки».
4. `transaction-monitor` — поток строк-транзакций → rule engine → шкала risk score со стрелкой,
   `SQL Server`.
5. `knn-classifier` — 2D scatter с классами, query-точка, линии к k=5 соседям, точка
   перекрашивается в класс-победитель.
6. `portfolio-analytics` — `browser beacon → FastAPI collector → SQLAlchemy → dashboard`,
   мигающие события.

## Файлы

`src/components/Projects/visuals/MentorVisual.tsx`, `AstarVisual.tsx`, `NgieuVisual.tsx`,
`MonitorVisual.tsx`, `KnnVisual.tsx`, `AnalyticsVisual.tsx` + `index.ts`.
`ProjectVisual.tsx` переписать в диспетчер: `switch (id)` → компонент, fallback — простой плейсхолдер.

## Приёмка

`./brigade/gate.sh` exit 0 при `PHASE=6`. Каждая схема: `<svg>` без внешних зависимостей,
`aria-label` по проекту, вес одного чанка < 20 KB, при `prefers-reduced-motion` не двигается.

## Отчёт

`brigade/logs/06-visuals.report.md`.
