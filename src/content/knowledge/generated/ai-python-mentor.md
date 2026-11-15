<!-- lang: ru -->
# AI Python Mentor — README

Source: https://github.com/coffee1337/ai-python-mentor

🧠 AI Python Mentor

### AI-powered platform for learning Python and backend development

**FastAPI · Next.js · PostgreSQL · RAG · Docker**

📸 Screenshots

Реальные снимки из браузерного прогона (`npx playwright test`, Chromium 153, 1440×900),
не макеты.

✨ Overview

AI Python Mentor — full-stack приложение для изучения Python с нуля до backend-разработки.

Платформа объединяет:

- структурированную программу обучения;
- практические Python-задания;
- AI-наставника;
- персональный roadmap;
- систему прогресса и повторений;
- анализ вакансий и skill gaps;
- проектную практику;
- уведомления в email и Telegram (адаптеры и очередь готовы; включаются провайдером,
  см. `docs/decisions.md`).

Проект построен как production-oriented система с отдельными backend/frontend слоями, PostgreSQL, миграциями, фоновой обработкой задач, CI и изолированной архитектурой исполнения пользовательского Python-кода.

🚧 Project Status

**Работающий продукт, идёт подготовка релиза v1.0.0.**

Что проверено командами, а не заявлено:

Ограничения, которые нельзя обойти на сборочной машине: здесь нет Docker и root, поэтому
`compose.prod.yml` проверен структурно, а контейнерный бэкенд runner (runsc + cgroups v2) —
только unit-тестами. Живой прогон — на целевом хосте по `docs/RUNBOOK.md`.
Матрица трассировки спеки: `docs/SPEC-MATRIX.md`, аудит дефектов: `docs/AUDIT.md`,
статус: `docs/STATUS.md`, безопасность: `docs/SECURITY-ASVS.md`.

🚀 Key Features

### 🎓 Learning Platform

- 90 учебных навыков и уроков;
- обучение от Python basics до backend;
- knowledge checks и quiz;
- практические задания;
- система подсказок;
- spaced repetition;
- персонализированный learning roadmap;
- отслеживание прогресса и mastery.

### 🤖 AI Tutor

- AI-чат с учебным контекстом;
- локальный RAG по актуальной версии урока;
- разбор ошибок и пользовательского кода;
- AI-feedback для письменных заданий;
- ограничение AI usage;
- учёт использования и стоимости AI-вызовов.

### 💻 Python Practice

Каждое практическое задание использует контракт:

Система поддерживает:

- публичные примеры;
- скрытые тесты;
- сохранение решений;
- историю попыток;
- асинхронную постановку выполнения в очередь.

Исполнение пользовательского кода вынесено за пределы основного API и проектируется как отдельный защищённый Runner.

🏗 Architecture

Основное приложение организовано как модульный монолит.

Отдельными процессами могут работать:

- notification dispatcher;
- execution dispatcher;
- Python Runner;
- обработчики email / Telegram / billing (провайдер подключается переменными окружения;
  без провайдера письма не уходят, кнопка оплаты скрыта, Telegram не привязан).

🛠 Tech Stack

### Backend

- Python 3.12
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic
- Argon2
- AsyncIO

### Frontend

- Next.js 15
- React 19
- TypeScript

### AI

- LLM Gateway
- Retrieval-Augmented Generation
- local knowledge index
- usage quotas
- token / cost accounting

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- background workers
- PostgreSQL migrations

### Integrations

- Telegram Bot API
- Email delivery adapter
- Billing adapter
- AI providers

🔐 Authentication & Security

В приложении реализованы:

- cookie-based sessions;
- Argon2 password hashing;
- CSRF protection;
- email confirmation;
- password reset;
- session revocation;
- account export;
- account deletion;
- audit logging для административных операций.

Production-конфигурация требует HTTPS и secure cookies.

Секреты не должны храниться в Git-репозитории.

🧠 RAG

AI-наставник использует Retrieval-Augmented Generation для получения контекста из учебных материалов.

Knowledge base строится на основе immutable snapshots опубликованных уроков.

Это позволяет AI работать с конкретной версией учебного материала, которую изучает пользователь.

📊 Learning Model

Платформа разделяет несколько показателей прогресса:

Результат обучения не определяется только количеством правильных ответов.

Система учитывает:

- знания;
- практическое применение;
- самостоятельность;
- сохранение знаний со временем.

💼 Career Features

Платформа может анализировать текст вакансии и выделять:

- требования;
- необходимые технологии;
- подтверждающие фрагменты вакансии;
- skill gaps пользователя.

На основе выбранной вакансии learning roadmap может перестраиваться под конкретную карьерную цель.

📦 Project Practice

В платформу входят шаблоны проектов для портфолио.

Для каждого проекта поддерживаются:

- milestones;
- история артефактов;
- проверка комплектности;
- публикация проекта в портфолио.

⚡ Quick Start

### Requirements

Для локальной разработки:

PostgreSQL рекомендуется, но для локального запуска можно использовать SQLite.

🪟 Windows

### Backend

Backend:

Swagger:

Health check:

### Frontend

В новом терминале:

Откройте:

🐧 Linux / macOS

### Backend

### Frontend

🐳 Docker (разработка)

Runner и фоновые обработчики включаются профилями: `--profile execution` (исполнение кода)
и `--profile notifications` (письма и Telegram).

🚢 Production: одна команда

Что произойдёт: `db` → `migrate` (alembic upgrade head) → `seed-check` (90 навыков и 90 заданий,
иначе деплой падает) → `api` → `execution-worker`, `notification-worker`, `runner`,
`runner-reaper`, `web`, `caddy` с автоматическим TLS. Наружу открыты только 80/443;
`/metrics` и `/internal/*` снаружи отдают 404.

Проверка и дальнейшие шаги: `curl -fsS https://$DOMAIN/ready`, полный runbook —
`docs/RUNBOOK.md` (деплой, обновление, откат, бэкап, restore drill, реакция на алерты).

⚙️ Configuration

Пример конфигурации находится в:

Основные группы настроек:

Пример AI-конфигурации:

При отсутствии AI Gateway основная учебная система продолжает работать, а AI-функции становятся недоступными.

🧪 Testing

Backend:

PostgreSQL-specific tests:

Проверка миграций:

Frontend:
