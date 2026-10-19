# Egor Trefilov — Portfolio

Personal site of **Egor Trefilov / Coffee1337**, Python Backend & AI Automation Developer.

Live: https://coffee1337.github.io

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- GSAP (scroll reveals)
- Lenis (smooth scroll, disabled for reduced motion)
- Three.js (Neural Orb, dynamically imported)

Static build + build-time prerendering. GitHub Pages via `gh-pages`.

## Scripts

```bash
npm install
npm run dev          # dev server with SPA fallback — /ru/ and /projects/* work
npm run build        # typecheck + client build + SSR build + prerender + sitemap
npm run preview      # serve dist/ locally
npm run deploy       # publish dist to the gh-pages branch
npm run sync:resume  # re-download the resume PDF from coffee1337/resume into public/
```

`npm run deploy` publishes `dist` to the `gh-pages` branch. Vite `base` is `/` because this is a user site (`coffee1337.github.io`).

## Routing

Language lives in the URL, not in localStorage:

| Route | Page |
| --- | --- |
| `/` | landing (EN) |
| `/ru/` | landing (RU) |
| `/projects/<id>/` | project case page (EN) |
| `/ru/projects/<id>/` | project case page (RU) |
| anything else | 404 (client-side `NotFound` via `404.html`) |

The client router is `src/main.tsx`; language switching (`Header → switchLang`) is a navigation to the mirrored URL.

## Prerendering and SEO

`npm run build` renders every route to static HTML with React `renderToString`
(`src/prerender/entry.tsx` → `dist-ssr/`, driven by `scripts/prerender.mjs`), so
crawlers and social previews see full content. The script also patches per-route
`<title>`, meta description, canonical, `og:*`, `hreflang` (en/ru/x-default),
writes `sitemap.xml`, and copies the patched landing page to `404.html`.
`robots.txt` points to the sitemap.

The resume PDF is served from `/resume/Egor_Trefilov_Resume.pdf` (same-origin, so
the `download` attribute works). After updating the source repo, run
`npm run sync:resume` before building.

## Structure

```text
src/
  components/   Header, Loader, NeuralOrb, Hero, About, Experience,
                Projects (+ ProjectPage, ProjectVisual), Stack, Resume,
                Education, Contact, Footer
  content/      en.ts, ru.ts, projects.ts (project meta + GitHub links)
  context/      theme, language, route info, orb mode
  hooks/        reveal, magnetic, scroll spy, Lenis
  prerender/    SSR entry used by scripts/prerender.mjs
  styles/       design tokens + global CSS
  three/        Neural Orb scene
scripts/
  prerender.mjs route prerender, sitemap.xml, 404.html
public/
  robots.txt
  resume/Egor_Trefilov_Resume.pdf
  brand/mark.svg
  favicon.svg, favicon-16.png, favicon-32.png, apple-touch-icon.png
  og.png
```

## Themes and language

Dark and light tokens live in `src/styles/tokens.css`. The theme choice is
stored in `localStorage` (`et-theme`) and follows the system on the first visit.
The language follows the URL (`/` vs `/ru/`).

## Project visuals

Case studies use drawn technical illustrations, not screenshots. The language lives in `src/components/Projects/ProjectVisual.tsx`.

## Author

Egor Trefilov — https://github.com/coffee1337
