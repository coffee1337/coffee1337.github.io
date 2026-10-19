// Prerenders the built SPA into static HTML files for every route, then emits
// sitemap.xml and 404.html. Runs after `vite build` and `vite build --ssr`.
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRoutes, renderRoute, routeMeta } from "../dist-ssr/entry.js";

const SITE = "https://coffee1337.github.io";
const root = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(root, "dist");

const raw = await readFile(join(distDir, "index.html"), "utf8");
// Re-runs operate on an already-prerendered file — strip the previous content first.
const template = raw.includes('<div id="root"></div>')
  ? raw
  : raw.replace(/<div id="root">[\s\S]*?(?=<script type="module")/, '<div id="root"></div>\n  ');

const esc = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Fails the build if "/>" leaked into the document as text (outside of any tag). */
function assertNoStrayText(html, label) {
  let inTag = false;
  for (let i = 0; i < html.length; i++) {
    const ch = html[i];
    if (ch === "<" && !inTag) inTag = true;
    else if (ch === ">" && inTag) inTag = false;
    else if (!inTag && html.startsWith("/>", i)) {
      throw new Error(`prerender: stray "/>" text in ${label} at byte ${i}`);
    }
  }
}

function patchOnce(html, regex, replacement, label) {
  if (!regex.test(html)) throw new Error(`prerender: template is missing ${label}`);
  return html.replace(regex, replacement);
}

/** Language mirror of a route path: "/" <-> "/ru/", "/projects/x/" <-> "/ru/projects/x/". */
function mirror(path, toLang) {
  const base = path.replace(/^\/ru(?=\/|$)/, "") || "/";
  if (toLang === "ru") return base === "/" ? "/ru/" : `/ru${base}`;
  return base;
}

function renderPage(route) {
  const { title, description } = routeMeta(route);
  const url = SITE + route.path;
  const locale = route.lang === "ru" ? "ru_RU" : "en_US";
  const enPath = mirror(route.path, "en");
  const ruPath = mirror(route.path, "ru");

  let html = template;
  html = patchOnce(html, /<html lang="en">/, `<html lang="${route.lang}">`, "html lang");
  html = patchOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, "title");
  html = patchOnce(html, /(name="description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`, "meta description");
  html = patchOnce(
    html,
    /<link rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${url}" />\n    <link rel="alternate" hreflang="en" href="${SITE}${enPath}" />\n    <link rel="alternate" hreflang="ru" href="${SITE}${ruPath}" />\n    <link rel="alternate" hreflang="x-default" href="${SITE}${enPath}" />`,
    "canonical",
  );
  html = patchOnce(html, /(<meta[^>]*property="og:locale"[^>]*content=")[^"]*(")/, `$1${locale}$2`, "og:locale");
  html = patchOnce(html, /(<meta[^>]*property="og:title"[^>]*content=")[^"]*(")/, `$1${esc(title)}$2`, "og:title");
  html = patchOnce(html, /(<meta[^>]*property="og:description"[^>]*content=")[^"]*(")/, `$1${esc(description)}$2`, "og:description");
  html = patchOnce(html, /(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")/, `$1${url}$2`, "og:url");
  html = patchOnce(html, /(<meta[^>]*name="twitter:title"[^>]*content=")[^"]*(")/, `$1${esc(title)}$2`, "twitter:title");
  html = patchOnce(html, /(<meta[^>]*name="twitter:description"[^>]*content=")[^"]*(")/, `$1${esc(description)}$2`, "twitter:description");

  // Without JS the boot loader would cover the content forever — hide it.
  if (route.kind === "home") {
    html = patchOnce(
      html,
      /<\/head>/,
      "<noscript><style>.loader-screen{display:none!important}</style></noscript>\n  </head>",
      "</head>",
    );
  }

  const content = renderRoute(route);
  const patched = patchOnce(html, /<div id="root"><\/div>/, `<div id="root">${content}</div>`, "#root");
  assertNoStrayText(patched, route.path);
  return patched;
}

const routes = buildRoutes();
for (const route of routes) {
  const html = renderPage(route);
  const file = route.path === "/" ? join(distDir, "index.html") : join(distDir, route.path, "index.html");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  console.log(`prerender: ${route.path}`);
}

// GitHub Pages serves 404.html for unknown paths; the client router shows NotFound on top of it.
await copyFile(join(distDir, "index.html"), join(distDir, "404.html"));
console.log("prerender: /404.html");

const lastmod = new Date().toISOString().slice(0, 10);
const urls = routes
  .map((route) => {
    const en = mirror(route.path, "en");
    const ru = mirror(route.path, "ru");
    return `  <url>
    <loc>${SITE}${route.path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${en}"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${SITE}${ru}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${en}"/>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
await writeFile(join(distDir, "sitemap.xml"), sitemap);
console.log(`prerender: sitemap.xml (${routes.length} urls)`);
