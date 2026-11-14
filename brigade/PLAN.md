# Бригада: роли, модели, порядок

Оркестратор — сессия VANTA (эта). Фазы идут последовательно; внутри фазы допускается
параллель только по непересекающимся файлам. Один процесс = одна модель, запуск через
`brigade/run.sh <мандат> <model-id>` (`hermes chat --query-file`).

| # | Роль | Модель в таблице | Фактический id | Статус |
|---|------|------------------|----------------|--------|
| 0 | Оркестратор | GPT 6.1 Sol | `gpt-6.1-sol` (доступна) | арбитр фаз, аудит, мандаты |
| 1 | Фундамент | Kimi K3.1 Pro | `kimi-k3` | фаза 1 |
| 2 | UI-компоненты | GPT 6.1 Terra | `gpt-5.6-terra` | фаза 2 |
| 3 | 3D / canvas | Grok 4.6 | `grok-4.6` | фаза 3 |
| 4 | Секции | GPT 6.1 Terra | `gpt-5.6-terra` | фаза 4a |
| 5 | SVG-схемы | deepseek-v4.1-flash | `deepseek-v4.1-flash` | фаза 4b (6 компонентов параллельно) |
| 6 | Отзывы + форма | GPT 6.1 Terra | `gpt-5.6-terra` | фаза 4c |
| 7 | Тексты | MiMo V2.6 Pro | `glm-5.3-flash` | фаза 4d (mimo-v2.5 → 503) |
| 8 | AI-чат + Worker | GLM 5.3 | `glm-5.3` | фаза 5 |
| 9 | llms.txt + деплой | GLM 5.3 | `glm-5.3` | фаза 6 |
| 10 | QA | MiniMax M3.1 Flash | `gpt-6-luna` | фаза 7 (minimax-m3 → 503) |

Проверено `curl` по `https://ru.cheapvibecode.ru/v1/chat/completions` 2026-11-14: живые —
`gpt-6.1-sol`, `grok-4.6`, `kimi-k3`, `gpt-5.6-terra`, `glm-5.3`, `glm-5.3-flash`,
`deepseek-v4.1-flash`, `gpt-6-luna`, `claude-sonnet-5`. Лежат (503): `mimo-v2.5`, `minimax-m3`,
`qwen3.8-flash`, `gemini-3.1-pro`.

Расхождение имён: `gpt-6.1-terra`, `kimi-k3.1-pro`, `mimo-v2.6-pro`, `minimax-m3.1-flash` в
агрегаторе отсутствуют — взяты ближайшие живые. Переиграть, когда появятся.

## Правило приёмки

Фаза закрыта только когда `./brigade/PHASE` указывает на неё, `./brigade/gate.sh` даёт exit 0,
и оркестратор прочитал diff. Отчёт роли — самодоклад, не доказательство: гейт и `git diff`
важнее.
