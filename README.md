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

Static build only. GitHub Pages via `gh-pages`.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run deploy
```

`npm run deploy` publishes `dist` to the `gh-pages` branch. Vite `base` is `/` because this is a user site (`coffee1337.github.io`).

## Structure

```text
src/
  components/   Header, Loader, NeuralOrb, Hero, About, Experience,
                Projects, Stack, Resume, Education, Contact, Footer
  content/      en.ts, ru.ts, projects.ts
  context/      theme, language, orb mode
  hooks/        reveal, magnetic, Lenis
  styles/       design tokens + global CSS
  three/        Neural Orb scene
public/
  brand/mark.svg
  favicon.svg, favicon-16.png, favicon-32.png, apple-touch-icon.png
  og.png
  projects/
    ai-python-mentor/      optional future media only — case studies use drawn visuals
    ngieu/
    transaction-monitor/
    neural-astar/
    knn/
```

## Themes and language

Dark and light tokens live in `src/styles/tokens.css`. The choice is stored in `localStorage` (`et-theme`, `et-lang`) and follows the system on the first visit.

## Project visuals

Case studies use drawn technical illustrations, not screenshots. The language lives in `src/components/Projects/ProjectVisual.tsx`.

## Author

Egor Trefilov — https://github.com/coffee1337
