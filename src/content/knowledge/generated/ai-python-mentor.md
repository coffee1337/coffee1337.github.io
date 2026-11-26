<!-- lang: en -->
# AI Python Mentor — README

Source: https://github.com/coffee1337/ai-python-mentor

**English** · Русский · Case Study

🧠 AI Python Mentor

### AI-powered platform for learning Python and backend development

**FastAPI · Next.js · PostgreSQL · RAG · Docker**

📸 Screenshots

Real captures from a browser run (`npx playwright test`, Chromium 153, 1440×900) — not mockups.

✨ Overview

AI Python Mentor is a full-stack application for learning Python from scratch up to backend development.

The platform combines:

- a structured curriculum;
- hands-on Python exercises;
- an AI mentor;
- a personalised roadmap;
- a progress and spaced-repetition system;
- job-posting analysis and skill gaps;
- project practice;
- email and Telegram notifications (adapters and queue are ready; enabled by a provider,
  see `docs/decisions.md`).

The project is built as a production-oriented system with separate backend and frontend layers, PostgreSQL, migrations, background processing, CI and an isolated execution architecture for user Python code.

🚧 Project Status

**A working product; release v1.0.0 is in preparation.**

What has been verified by commands rather than claimed:

Limitations that cannot be avoided on the build machine: there is no Docker and no root here, so
`compose.prod.yml` is verified structurally, and the containerised runner backend (runsc + cgroups v2)
is covered by unit tests only. The live run happens on the target host per `docs/RUNBOOK.md`.
Spec traceability matrix: `docs/SPEC-MATRIX.md`, defect audit: `docs/AUDIT.md`,
status: `docs/STATUS.md`, security: `docs/SECURITY-ASVS.md`.

🚀 Key Features

### 🎓 Learning Platform

- 90 learning skills and lessons;
- a path from Python basics to backend;
- knowledge checks and quizzes;
- hands-on assignments;
- a hint system;
- spaced repetition;
- a personalised learning roadmap;
- progress and mastery tracking.

### 🤖 AI Tutor

- an AI chat with learning context;
- local RAG over the current version of a lesson;
- error and user-code analysis;
- AI feedback for written assignments;
- AI usage limits;
- tracking of AI call usage and cost.

### 💻 Python Practice

Every exercise follows the contract:

The system supports:

- public examples;
- hidden tests;
- solution persistence;
- attempt history;
- asynchronous enqueueing of executions.

Execution of user code is moved outside the main API and is designed as a separate hardened Runner.

🏗 Architecture

The main application is organised as a modular monolith.

These can run as separate processes:

- notification dispatcher;
- execution dispatcher;
- Python Runner;
- email / Telegram / billing handlers (a provider is wired through environment variables;
  without a provider no email is sent, the payment button stays hidden, and Telegram is not linked).

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

The application implements:

- cookie-based sessions;
- Argon2 password hashing;
- CSRF protection;
- email confirmation;
- password reset;
- session revocation;
- account export;
- account deletion;
- audit logging for administrative operations.

The production configuration requires HTTPS and secure cookies.

Secrets must never be stored in the Git repository.

🧠 RAG

The AI tutor uses Retrieval-Augmented Generation to pull context from the learning materials.

The knowledge base is built from immutable snapshots of published lessons.

This lets the AI work against the exact version of the material the user is studying.

📊 Learning Model

The platform separates several progress signals:

Learning outcomes are not defined by the number of correct answers alone.

The system accounts for:

- knowledge;
- practical application;
- independence;
- retention over time.

💼 Career Features

The platform can analyse a job posting and extract:

- requirements;
- required technologies;
- supporting excerpts from the posting;
- the user's skill gaps.

Based on the selected posting, the learning roadmap can be rebuilt around a specific career goal.

📦 Project Practice

The platform includes portfolio project templates.

Each project supports:

- milestones;
- artifact history;
- completeness checks;
- publishing the project to the portfolio.

⚡ Quick Start

### Requirements

For local development:

PostgreSQL is recommended, but SQLite can be used for a local run.

🪟 Windows

### Backend

Backend:

Swagger:

Health check:

### Frontend

In a new terminal:

Open:

🐧 Linux / macOS

### Backend

### Frontend

🐳 Docker (development)

The Runner and background handlers are enabled by profiles: `--profile execution` (code execution)
and `--profile notifications` (email and Telegram).

🚢 Production: one command

What happens: `db` → `migrate` (alembic upgrade head) → `seed-check` (90 skills and 90 exercises,
otherwise the deploy fails) → `api` → `execution-worker`, `notification-worker`, `runner`,
`runner-reaper`, `web`, `caddy` with automatic TLS. Only ports 80/443 are exposed;
`/metrics` and `/internal/*` return 404 from the outside.

Verification and next steps: `curl -fsS https://$DOMAIN/ready`; the full runbook is
`docs/RUNBOOK.md` (deploy, upgrade, rollback, backup, restore drill, alert response).

⚙️ Configuration

An example configuration lives in:

Main groups of settings:

Example AI configuration:

Without an AI Gateway the core learning system keeps working, and AI features become unavailable.

🧪 Testing

Backend:

PostgreSQL-specific tests:

Migration check:

Frontend:
