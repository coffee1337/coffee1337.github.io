<!-- lang: ru -->
# portfolio-analytics — README

Source: https://github.com/coffee1337/portfolio-analytics

portfolio-analytics

Собственная аналитика для портфолио coffee1337.github.io:
приём событий маяком, агрегация на сервере и SPA-дашборд в эстетике самого сайта.

Стек: **FastAPI + SQLAlchemy 2.0 + PostgreSQL (Neon) / SQLite** и **React 19 + TypeScript +
Vite + Tailwind** в `web/` (собирается в `app/static`, раздаётся тем же сервисом).
Деплой — один процесс: Render (free) или Docker.

Приватность

- Сырой IP **никогда не пишется в БД**. Хранятся только `ip_masked` (`95.161.224.xxx`) и
  `ip_hash` = `HMAC-SHA256(salt, ip)[:24]` — стабильный, необратимый.
- Cookies не используются: посетитель — анонимный ID из `localStorage` (`et-vid`).
- `Do Not Track` уважается на клиенте: маяк не инициализируется.
- Владелец может в один клик пометить свои визиты (`is_me`) и скрыть их из всех KPI.

Определение IP, гео и провайдера (`app/geo.py`)

1. `extract_client_ip()`: `cf-connecting-ip` → `true-client-ip` → `x-real-ip` →
   `fastly-client-ip` → `x-forwarded-for` **слева направо** (первый публичный адрес) →
   `request.client.host`. Каждый кандидат чистится от порта/скобок/зоны и проверяется через
   `ipaddress`: только `is_global and not private/loopback/link-local/multicast/reserved`.
2. Страна/город/регион сначала берутся из заголовков CDN (`cf-ipcountry`, `cf-ipcity`,
   `x-vercel-ip-*`), затем из асинхронного лукапа.
3. `enrich_geo_async()`: LRU+TTL кэш на 24 ч (5 000 IP), `httpx.AsyncClient(timeout=2.5)`,
   основной источник `ip-api.com`, резервный `ipwho.is`. Вызывается **только** из
   `BackgroundTasks` — `/collect` никогда не ждёт сеть.
4. После ответа фоновая задача дописывает `country/region/city/asn/isp/is_datacenter`
   в записи этого IP-хэша (только в пустые поля — страна и город всегда из одного источника).
5. `is_datacenter` = `hosting`/`proxy` у провайдера или маркеры облаков/VPN в `isp`/`org`.

Метрики

- **Активное время**: клиент шлёт кумулятивный `props.active_sec` (тикает только при
  `visibilityState === "visible"`); сервер суммирует максимумы по страницам сессии. Для старых
  событий — фолбэк «сумма интервалов, каждый не больше 60 с», так что забытая вкладка не
  добавляет часы.
- **Вовлечённый визит** (не отказ), если выполнено хотя бы одно: `active_sec >= 15`,
  `scroll >= 50%`, `>= 3` секции, `>= 2` страницы, любая интеракция или конверсия.
- **Конверсии**: резюме, контактная форма, копирование email/telegram, соцсети, карточки
  «С чем вы пришли», действия с проектом (GitHub / Demo / `git clone`).
- **Боты** определяются по расширенному списку маркеров (`app/ua.py`) и по умолчанию
  исключены из всех KPI и графиков; переключатель в шапке дашборда.
- Холодный старт Render: клиент присылает `client_ts`; сервер принимает его, если он в окне
  −15 мин … +2 мин от `utcnow()`, иначе пишет серверное время.

API

Фильтры `overview` и экспорта: `range=today|yesterday|7d|30d|90d|all` (или `from`/`to`),
`me`, `bots`, `source`, `utm`, `country`, `city`, `isp`, `device`, `os`, `browser`, `path`,
`project`, `goal`, `engaged`, `page`, `per_page`.

Локальный запуск

Тесты:

По умолчанию SQLite (`analytics.db`) и авторизация выключены. Проверка приёма события:

Событие без `session` не теряется: сервер создаёт `anon--`.

Демо-данные для локального дашборда (60 сессий за две недели + боты):

Деплой (Render + Neon)

1. Neon → Create project → скопировать connection string.
2. Render → New → Blueprint → этот репозиторий. `render.yaml` создаёт сервис с
   `healthCheckPath: /health`. Задать `DATABASE_URL` и `SITE_KEY`; `ADMIN_TOKEN` и
   `VISITOR_SALT` Render сгенерирует сам.
3. В репозитории сайта: `VITE_ANALYTICS_URL=https://.onrender.com`,
   `VITE_ANALYTICS_KEY=` (в GitHub → Settings → Variables или Secrets: workflow
   читает и `vars`, и `secrets`).
4. Открыть `https://.onrender.com/` — экран входа по `ADMIN_TOKEN`.

Собранная SPA закоммичена в `app/static`, поэтому Python-сервис поднимается без Node.
Если в окружении сборки есть npm, `buildCommand` пересоберёт фронтенд из `web/`.

Docker

Multi-stage: `node:22-alpine` собирает `web/` в `app/static`, затем `python:3.12-slim`
ставит зависимости и копирует приложение.

Переменные окружения
