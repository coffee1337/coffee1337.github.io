# AI-ассистент: Cloudflare Worker

Бесплатный тариф. Ключ LLM живёт только здесь, в браузер не попадает.

## Деплой

```bash
cd worker
npm i -g wrangler          # если ещё нет
wrangler login
wrangler kv namespace create RATE_KV      # вставить id в wrangler.toml
wrangler secret put LLM_API_KEY           # ключ Gemini/Groq (бесплатный тариф)
wrangler deploy
```

После деплоя получить URL вида `https://coffee1337-chat.<account>.workers.dev`
и прописать в репозитории сайта:

```bash
# .env.local или секреты GitHub Actions
VITE_CHAT_API_URL=https://coffee1337-chat.<account>.workers.dev
```

Сайт работает без этого URL: локальный режим на MiniSearch включён всегда.

## Контракт

`POST /` → `{ question: string, chunks: [{ title, text }] }`, ответ — SSE-поток, совместимый с
OpenAI `chat.completion.chunk`. Ошибки: `429 rate_limited`, `502 upstream_error`,
`503 not_configured` — клиент на любой из них молча откатывается в локальный режим.

Лимит: 20 запросов на IP в час (KV). CORS только на `ALLOWED_ORIGIN`.
