# Роль: МАШИНОЧИТАЕМОСТЬ И ДЕПЛОЙ (фаза 8)

Читай: `AGENTS.md` → `docs/PROMPT.md` §7, §8, §12 (пункты 6) → `scripts/prerender.mjs`,
`scripts/fetch-github.mjs`, `src/content/*`, `.github/` (если есть).

## Задачи

1. **`/llms.txt` и `/llms-full.txt`** — генерировать на сборке из `src/content/llms.md` и
   knowledge-базы: описание, позиционирование, секции, проекты со ссылками, резюме, контакты.
   Формат по спецификации llms.txt (H1, blockquote-описание, H2-секции со ссылками в списках).
   `llms-full.txt` — полный текст EN+RU.
2. **JSON-LD `Person`** в `<head>` главной: имя, jobTitle, alumniOf (НГИЭУ), sameAs (GitHub,
   LinkedIn, Telegram), knowsAbout (стек). Валидировать через `node -e` парсинг JSON-LD из
   `dist/index.html`.
3. **OG-изображения** на сборке: главная + каждый проект (дарк-фон, имя проекта Bricolage,
   терракотовая плашка). Генерация скриптом `scripts/og.mjs` на `sharp` **нельзя** — зависимость
   не разрешена; используй `@resvg/resvg-js`? Тоже нельзя. Разрешённый путь: SVG → PNG через
   `canvas`? Нет. Поэтому: генерируй SVG-исходники и подключай их как `og:image` (SVG принимается
   не всеми скраперами) **или** оставь текущий `public/og.png` и добавь по одному SVG на проект
   с TODO. Выбери вариант, опиши в отчёте, не тяни тяжёлых зависимостей.
4. **GitHub Actions** `.github/workflows/deploy.yml`: `build` (npm ci → build) → `deploy-pages`,
   `permissions: pages: write, id-token: write`, `schedule: cron "0 3 * * *"` для ежедневной
   пересборки счётчика коммитов, `GH_STATS_TOKEN` из секретов. Проверить, что `dist/404.html` и
   `dist/sitemap.xml` уезжают в артефакт.
5. **`public/robots.txt`** — добавить `Sitemap:` и разрешить `llms.txt`.
6. **Битые ссылки**: скрипт `scripts/check-links.mjs` по `dist/**/*.html` — внутренние `href`
   и `src` существуют на диске, внешние не проверяются (офлайн). Выход ненулевой при находке.

## Приёмка

`./brigade/gate.sh` exit 0 при `PHASE=8`: в `dist/` есть `llms.txt`, `llms-full.txt`, JSON-LD
парсится, `check-links` зелёный, workflow валиден YAML.

## Отчёт

`brigade/logs/08-machine.report.md` + что осталось от владельца (`GH_STATS_TOKEN`, ключи).
