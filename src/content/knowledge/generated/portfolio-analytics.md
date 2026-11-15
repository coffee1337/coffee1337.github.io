<!-- lang: ru -->
# portfolio-analytics — README

Source: https://github.com/coffee1337/portfolio-analytics

portfolio-analytics

Мини-аналитика для персонального сайта (coffee1337.github.io): просмотры страниц,
клики по внешним ссылкам, доскроллы до секций, переключение языка. Без cookies,
без сторонних трекеров, сырые IP не хранятся (только суточный солёный хэш).

Стек: FastAPI + SQLAlchemy + PostgreSQL (Neon). Деплой: Render (free tier).

Как это работает

Сборка сайта подставляет `VITE_ANALYTICS_URL` и `VITE_ANALYTICS_KEY` — без них
beacon отключён и ничего не отправляет.

Локальный запуск

По умолчанию используется SQLite (`analytics.db`) и auth выключен.
Сгенерировать события для теста:

Деплой (Render + Neon, всё бесплатно)

1. **Neon** (https://neon.tech): Create project → скопируй `Connection string`
   (вид `postgresql://user:pass@host/db?sslmode=require`).
2. Залей этот репозиторий на GitHub (`portfolio-analytics`).
3. **Render** (https://render.com): New → **Blueprint** → выбери репозиторий —
   `render.yaml` создаст сервис. В переменных укажи:
   - `DATABASE_URL` — строка из Neon;
   - `SITE_KEY` — придумай публичный ключ (его же подставишь в сборку сайта);
   - `ADMIN_TOKEN` и `VISITOR_SALT` — Render сгенерирует сам.
4. Открой `https://.onrender.com/` — вход по `ADMIN_TOKEN`.
5. В репозитории сайта создай `.env` (в `.gitignore` он уже исключён):

   и собери/задеплой сайт как обычно (`npm run build && npm run deploy`).

API

Docker (опционально, для VPS/локального прогона)

Что собирается

- событие: тип, путь, referrer, страна (по заголовку CDN), устройство (по UA);
- посетитель: `sha256(ip + ua + дата + соль)` — обрезан, ротируется раз в сутки,
  IP в чистом виде не сохраняется;
- `Do Not Track` уважается: beacon отключается при `navigator.doNotTrack == "1"`.
