// Build-time SSR entry: rendered to HTML by `vite build --ssr`, driven by scripts/prerender.mjs.
// It renders the same components as the client, so prerendered pages can never drift from the app.
import { renderToString } from "react-dom/server";
import { App } from "../App";
import { NotFound } from "../components/NotFound";
import { ProjectPage } from "../components/Projects/ProjectPage";
import { SiteProvider } from "../context/SiteProvider";
import { dictionaries, type Lang } from "../content";
import { projectMeta } from "../content/projects";
import { ToastProvider } from "../components/Toast/ToastProvider";

export interface PrerenderRoute {
  /** URL path with trailing slash, e.g. "/", "/ru/", "/projects/ai-python-mentor/". */
  path: string;
  lang: Lang;
  kind: "home" | "project" | "notfound";
  projectId?: string;
}

export function buildRoutes(): PrerenderRoute[] {
  const routes: PrerenderRoute[] = [
    { path: "/", lang: "en", kind: "home" },
    { path: "/ru/", lang: "ru", kind: "home" },
  ];
  routes.push({ path: "/404.html", lang: "en", kind: "notfound" });
  for (const meta of projectMeta) {
    routes.push({ path: `/projects/${meta.id}/`, lang: "en", kind: "project", projectId: meta.id });
    routes.push({ path: `/ru/projects/${meta.id}/`, lang: "ru", kind: "project", projectId: meta.id });
  }
  return routes;
}

export function routeMeta(route: PrerenderRoute): { title: string; description: string } {
  const dict = dictionaries[route.lang];
  if (route.kind === "project") {
    const project = dict.projects.items.find((p) => p.id === route.projectId);
    if (project) {
      return { title: `${project.name} — ${dict.resume.name}`, description: project.statement };
    }
  }
  if (route.kind === "notfound") {
    return { title: dict.a11y.notFound.title, description: dict.a11y.notFound.body };
  }
  return { title: dict.meta.title, description: dict.meta.description };
}

const SITE = "https://coffee1337.github.io";
const LANGUAGES = ["Python", "TypeScript", "JavaScript", "Dart", "C#", "C++", "SQL"];

/**
 * JSON-LD для страницы: главные — WebSite + ProfilePage → Person (локализовано),
 * кейсы — SoftwareSourceCode + BreadcrumbList. Пустая строка = без разметки.
 */
export function routeJsonLd(route: PrerenderRoute): string {
  const dict = dictionaries[route.lang];
  const isRu = route.lang === "ru";
  const home = `${SITE}${isRu ? "/ru/" : "/"}`;

  if (route.kind === "project") {
    const project = dict.projects.items.find((p) => p.id === route.projectId);
    if (!project) return "";
    const url = `${SITE}${isRu ? "/ru" : ""}/projects/${project.id}/`;
    const langs = project.stack.filter((item) => LANGUAGES.includes(item));
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareSourceCode",
          "@id": `${url}#source`,
          name: project.name,
          description: project.statement,
          ...(langs.length ? { programmingLanguage: langs } : {}),
          codeRepository: project.github,
          url,
          inLanguage: isRu ? "ru" : "en",
          author: {
            "@type": "Person",
            name: isRu ? "Егор Трефилов" : "Egor Trefilov",
            alternateName: "coffee1337",
            url: home,
          },
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${url}#breadcrumbs`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: isRu ? "Главная" : "Home", item: home },
            {
              "@type": "ListItem",
              position: 2,
              name: isRu ? "Проекты" : "Projects",
              item: `${home}#projects`,
            },
            { "@type": "ListItem", position: 3, name: project.name, item: url },
          ],
        },
      ],
    });
  }

  if (route.kind === "notfound") return "";

  const person = {
    "@type": "Person",
    "@id": `${home}#person`,
    name: isRu ? "Егор Трефилов" : "Egor Trefilov",
    alternateName: [isRu ? "Егор Трефилов" : "Egor Trefilov", "coffee1337"],
    jobTitle: isRu ? "Python Backend и AI/LLM разработчик" : "Python Backend & AI Automation Developer",
    url: home,
    email: "trefilovegor84@gmail.com",
    image: `${SITE}/og.png`,
    sameAs: [
      "https://github.com/coffee1337",
      "https://www.linkedin.com/in/coffee1337",
      "https://t.me/cooffeek1337",
    ],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: isRu
        ? "НГИЭУ — Нижегородский государственный инженерно-экономический университет"
        : "Nizhny Novgorod State Engineering and Economic University (NGIEU)",
    },
    knowsAbout: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "SQLAlchemy",
      "Docker",
      "LLM integration",
      "RAG",
      "PyTorch",
      "React",
      "TypeScript",
      "Flutter",
      "C++",
    ],
    knowsLanguage: isRu ? ["ru", "en"] : ["en", "ru"],
  };

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: home,
        name: isRu ? "Егор Трефилов — портфолио" : "Egor Trefilov — portfolio",
        inLanguage: isRu ? "ru" : "en",
        publisher: { "@id": `${home}#person` },
      },
      {
        "@type": "ProfilePage",
        "@id": `${home}#profile`,
        url: home,
        name: isRu ? "Егор Трефилов (coffee1337)" : "Egor Trefilov (coffee1337)",
        inLanguage: isRu ? "ru" : "en",
        isPartOf: { "@id": `${SITE}/#website` },
        mainEntity: { "@id": `${home}#person` },
      },
      person,
    ],
  });
}

export function renderRoute(route: PrerenderRoute): string {
  const inner =
    route.kind === "project" ? (
      <ProjectPage id={route.projectId} />
    ) : route.kind === "home" ? (
      <App />
    ) : (
      <NotFound />
    );
  return renderToString(
    <SiteProvider initialLang={route.lang} route={route}>
      <ToastProvider>{inner}</ToastProvider>
    </SiteProvider>,
  );
}
