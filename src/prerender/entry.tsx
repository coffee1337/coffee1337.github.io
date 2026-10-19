// Build-time SSR entry: rendered to HTML by `vite build --ssr`, driven by scripts/prerender.mjs.
// It renders the same components as the client, so prerendered pages can never drift from the app.
import { renderToString } from "react-dom/server";
import { App } from "../App";
import { NotFound } from "../components/NotFound";
import { ProjectPage } from "../components/Projects/ProjectPage";
import { SiteProvider } from "../context/SiteProvider";
import { dictionaries, type Lang } from "../content";
import { projectMeta } from "../content/projects";

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
  return { title: dict.meta.title, description: dict.meta.description };
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
      {inner}
    </SiteProvider>,
  );
}
