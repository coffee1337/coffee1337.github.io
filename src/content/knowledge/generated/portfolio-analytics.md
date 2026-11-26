<!-- lang: en -->
# portfolio-analytics — README

Source: https://github.com/coffee1337/portfolio-analytics

**English** · Русский · Case Study

portfolio-analytics

Self-hosted analytics for the portfolio site coffee1337.github.io:
events arrive from a beacon, aggregation runs on the server, and the SPA dashboard matches the
look of the site itself.

Stack: **FastAPI + SQLAlchemy 2.0 + PostgreSQL (Neon) / SQLite** and **React 19 + TypeScript +
Vite + Tailwind** in `web/` (built into `app/static` and served by the same service).
Deployment is a single process: Render (free tier) or Docker.

Privacy

- The raw IP **is never written to the database**. Only `ip_masked` (`95.161.224.xxx`) and
  `ip_hash` = `HMAC-SHA256(salt, ip)[:24]` are stored — stable and irreversible.
- No cookies: a visitor is an anonymous ID kept in `localStorage` (`et-vid`).
- `Do Not Track` is honoured client-side: the beacon is not initialised.
- The owner can mark their own visits as `is_me` in one click and hide them from every KPI.

IP, geo and ISP detection (`app/geo.py`)

1. `extract_client_ip()`: `cf-connecting-ip` → `true-client-ip` → `x-real-ip` →
   `fastly-client-ip` → `x-forwarded-for` **left to right** (first public address) →
   `request.client.host`. Every candidate is stripped of port/brackets/zone and validated with
   `ipaddress`: only `is_global and not private/loopback/link-local/multicast/reserved` pass.
2. Country/city/region come first from CDN headers (`cf-ipcountry`, `cf-ipcity`,
   `x-vercel-ip-*`), then from the asynchronous lookup.
3. `enrich_geo_async()`: an LRU+TTL cache for 24 h (5 000 IPs), `httpx.AsyncClient(timeout=2.5)`,
   primary source `ip-api.com`, fallback `ipwho.is`. It is called **only** from `BackgroundTasks` —
   `/collect` never waits on the network.
4. After the response, a background task writes `country/region/city/asn/isp/is_datacenter`
   into the records for that IP hash (empty fields only — country and city always come from one source).
5. `is_datacenter` = `hosting`/`proxy` on the provider or cloud/VPN markers in `isp`/`org`.

Metrics

- **Active time**: the client sends a cumulative `props.active_sec` (it only ticks while
  `visibilityState === "visible"`); the server sums the maximums per page of a session. For older
  events there is a fallback — "sum of intervals, each capped at 60 s" — so a forgotten tab never adds hours.
- **Engaged visit** (not a bounce) if at least one holds: `active_sec >= 15`,
  `scroll >= 50%`, `>= 3` sections, `>= 2` pages, any interaction or conversion.
- **Conversions**: résumé, contact form, email/Telegram copy, social links, the
  "What brought you here" cards, project actions (GitHub / Demo / `git clone`).
- **Bots** are detected by an extended marker list (`app/ua.py`) and excluded from every KPI and
  chart by default; there is a toggle in the dashboard header.
- Render cold start: the client sends `client_ts`; the server accepts it only inside the
  −15 min … +2 min window around `utcnow()`, otherwise it records the server time.

API

Filters for `overview` and the exports: `range=today|yesterday|7d|30d|90d|all|custom` (or `from`/`to`),
`me`, `bots`, `source`, `utm`, `country`, `city`, `isp`, `device`, `os`, `browser`,
`path` (any page of the visit), `entry` (entry point only), `screen`, `lang`,
`project`, `goal`, `engaged`, `hide_dc` (no data centres/VPN), `dow` (0–6) and `hour` (0–23)
in MSK (clicking a cell of the 24×7 matrix), `q` (search by city, ISP, IP, page, sid…),
`tab=all|engaged|goals|live|bounce`, `page`, `per_page`.

`overview` additionally returns `prev_timeseries` (dashed previous period),
`heatmap` (7×24 visits by weekday and MSK hour), `insights` (top project,
main source, scroll depth to contacts, activity peak), `clicks` (top external links
and buttons), `preferences` (browser language, site version, theme by session) and
`sessions.counts` (journal tab counters for the whole period, not just the page) plus
`vitals` (p50/p75 for LCP, INP, CLS, FCP, TTFB with good/warn/poor grades and a desktop/mobile breakdown).

CI

`.github/workflows/ci.yml` runs on every push/PR to `main`: it checks that the committed `app/static`
is consistent (every `/assets/*` referenced by `index.html` exists, exactly one `index-*.js` and one
`index-*.css`), runs `pytest -q` on Python 3.12 and builds the SPA on Node 22.

Dashboard

- 6 clickable KPIs: a card switches the metric of the main chart, with a sparkline
  from `timeseries` inside; the "Headline for the period" strip filters by project and source in one click.
- `§02`: area / bars / **24×7 matrix**, a Y axis with integer ticks (the scale never lies),
  a dashed previous period, and a hover tooltip with the exact value.
- `§03`: section funnel (the splash as a separate two-colour widget, never duplicated in the steps),
  project cards with human-readable names and 5 metrics, conversions with icons.
- `§04`: sources, countries/cities/providers, OS/browsers/screens (click = filter),
  entry and all pages kept apart, language is a filter too.
- `§05`: tabs "all / engaged / converted / online / bounces", instant search, and a sliding
  visit drawer (`Esc` closes it) with the passport and the route.
- `RU | EN`, Espresso / Parchment themes with a circular View Transition, auto-refresh without
  reloading the page and without losing the scroll position.

Local run

Tests:

SQLite (`analytics.db`) and auth are off by default. Checking event intake:

An event without a `session` is not lost: the server creates `anon--`.

Demo data for a local dashboard (60 sessions over two weeks + bots):

Deploy (Render + Neon)
