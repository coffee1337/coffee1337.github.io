# AI-ассистент: Cloudflare Worker

Бесплатный тариф. Ключ LLM живёт только здесь, в браузер не попадает.
Сайт работает и без Worker: локальный режим на MiniSearch включён всегда.

## Что нужно от владельца (по шагам)

1. **Логин в Cloudflare**

   ```bash
   cd worker
   npm i -g wrangler          # если ещё нет
   wrangler login
   ```

2. **KV для rate limit** (необязательно, но рекомендуется)

   ```bash
   wrangler kv namespace create RATE_KV
   ```

   Команда печатает `id = "..."`. Раскомментируй блок `[[kv_namespaces]]` в `wrangler.toml`
   и вставь этот id. Без биндинга `RATE_KV` Worker работает, но не ограничивает запросы.

3. **Провайдер LLM.** Любой OpenAI-совместимый endpoint. Примеры значений для `wrangler.toml`
   (секция `[vars]`) или Dashboard → Worker → Settings → Variables:

   | Провайдер | `LLM_URL` | `LLM_MODEL` (пример) |
   | --- | --- | --- |
   | Google Gemini (OpenAI-endpoint) | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` | `gemini-2.5-flash` |
   | Groq | `https://api.groq.com/openai/v1/chat/completions` | `llama-3.3-70b-versatile` |
   | OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `<vendor>/<model>` из их каталога |
   | OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-4.1-mini` |

   Модели по умолчанию нет: если `LLM_MODEL` не задан, Worker отвечает `503 not_configured`,
   а клиент молча уходит в локальный режим. Так устаревшая модель не «зашивается» в код.

   ```bash
   # модель и URL — обычные переменные, не секреты
   wrangler secret put LLM_API_KEY     # ключ провайдера, в git не попадает
   ```

4. **Деплой**

   ```bash
   wrangler deploy
   ```

   Получишь URL вида `https://coffee1337-chat.<account>.workers.dev`.

5. **Подключить сайт.** В GitHub: Settings → Secrets and variables → Actions → **Variables** →
   New repository variable:

   ```
   VITE_CHAT_API_URL = https://coffee1337-chat.<account>.workers.dev
   ```

   `deploy.yml` передаёт её в `npm run build` как `VITE_CHAT_API_URL`. Локально можно положить
   в `.env.local` (файл в `.gitignore`).

6. **Проверка**

   ```bash
   curl -i -X POST https://coffee1337-chat.<account>.workers.dev \
     -H 'content-type: application/json' \
     -H 'origin: http://localhost:5173' \
     -d '{"question":"What is your stack?","lang":"en","chunks":[]}'
   ```

   Ожидаемо: `200` и поток `text/event-stream` с `data: {"choices":[{"delta":{"content":"..."}}]}`.

## Переменные

| Переменная | Обязательна | Смысл |
| --- | --- | --- |
| `LLM_URL` | да | полный URL `…/chat/completions` OpenAI-совместимого API |
| `LLM_MODEL` | да | имя модели у провайдера; без него `503 not_configured` |
| `LLM_API_KEY` | да (secret) | ключ провайдера, только через `wrangler secret put` |
| `LLM_MAX_TOKENS` | нет | лимит ответа, по умолчанию `400` |
| `ALLOWED_ORIGINS` | нет | CORS-список через запятую, по умолчанию прод + `http://localhost:5173` |
| `RATE_LIMIT` | нет | запросов в час на IP, по умолчанию `20` |

`RATE_KV` — биндинг KV namespace, без него лимитер выключен. Ключи в репозиторий не коммитим.

## Контракт

`POST /` принимает:

```json
{
  "question": "Какие проекты на FastAPI?",
  "lang": "ru",
  "history": [{ "role": "user", "content": "…" }, { "role": "assistant", "content": "…" }]
}
```

* `lang` — `ru` или `en`; ответ обязан быть на этом языке.
* `history` — последние 6 реплик (клиент обрезает сам).
* `chunks` из запроса **не используются**: Worker сам забирает `https://coffee1337.github.io/kb-index.json`
  (переопределяется переменной `SITE_URL`), кэширует его на edge и выбирает top-8 чанков по вопросу
  плюс профильный чанк. Так воркер нельзя превратить в открытый LLM-прокси с произвольным контекстом.

Ответ — SSE-поток, совместимый с OpenAI `chat.completion.chunk`. Ошибки:
`400 bad_json | empty_question`, `403 forbidden_origin`, `405 method_not_allowed`,
`429 rate_limited`, `502 upstream_error | upstream_unreachable | empty_answer`,
`503 not_configured | kb_unavailable`. Клиент на любую из них молча откатывается в локальный режим,
поэтому сайт не ломается без Worker.

Системный промпт: о Егоре в третьем лице, только по контексту, короткий small talk,
вежливый отказ на офтоп, защита от инъекций (контекст — данные, а не инструкции),
ссылки только из разрешённого списка (разделы сайта, страницы проектов, GitHub, Telegram,
email, резюме).

## Контактная форма → Telegram

`POST /contact` принимает заявку с сайта и пересылает её владельцу в Telegram Bot API.
Включается только при заданных секретах; без них отвечает `503 not_configured` и форма
продолжает работать через `mailto:`.

```bash
wrangler secret put TG_BOT_TOKEN   # токен бота от @BotFather
wrangler secret put TG_CHAT_ID     # числовой chat id владельца
```

Тело запроса: `{ "name", "email", "topic": "hire|project|other", "message", "company" }`.
`company` — honeypot: если заполнено, Worker отвечает `200 { ok: true }` и ничего не отправляет.
Лимиты: 5 заявок в час на IP (`CONTACT_RATE_LIMIT`), длина имени 2–80, сообщения 10–4000,
строгая проверка `Origin` по `ALLOWED_ORIGINS`. Ответы: `200 ok`, `400 invalid_fields`,
`403 forbidden_origin`, `429 rate_limited`, `502 telegram_failed|telegram_unreachable`,
`503 not_configured`.

Подключение на сайте: GitHub → Settings → Variables → `VITE_CONTACT_ENDPOINT` =
`https://<worker>.workers.dev/contact` (или `VITE_CONTACT_PROVIDER` для явного выбора).
Приоритет: `VITE_WEB3FORMS_KEY` → `VITE_CONTACT_ENDPOINT` → `mailto:`.

## Health-check

`GET /health` → `{ "ok": true, "service": "coffee1337-chat" }`, без секретов и без CORS-ограничений
для мониторинга.

## Если провайдер не поддерживает stream

Worker проверяет `content-type` ответа: если это не `text/event-stream`, он сам оборачивает
обычный JSON-ответ в один SSE-кадр и закрывает поток `data: [DONE]`. Клиенту всё равно,
какой режим вернул провайдер.
