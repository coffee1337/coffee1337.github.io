import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { NotFound } from "./components/NotFound";
import { ProjectPage } from "./components/Projects/ProjectPage";
import { SiteProvider } from "./context/SiteProvider";
import type { Lang } from "./content";
import "./styles/global.css";

interface ClientRoute {
  kind: "home" | "project" | "notfound";
  lang: Lang;
  projectId?: string;
}

function parseRoute(): ClientRoute {
  const path = window.location.pathname.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
  const ru = path === "/ru" || path.startsWith("/ru/");
  const lang: Lang = ru ? "ru" : "en";
  const rest = ru ? path.slice(3) || "/" : path;
  if (rest === "/" || rest === "/projects") return { kind: "home", lang };
  const match = rest.match(/^\/projects\/([a-z0-9-]+)$/i);
  if (match) return { kind: "project", lang, projectId: match[1] };
  return { kind: "notfound", lang };
}

const route = parseRoute();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteProvider initialLang={route.lang} route={route}>
      {route.kind === "home" ? (
        <App />
      ) : route.kind === "project" ? (
        <ProjectPage id={route.projectId} />
      ) : (
        <NotFound />
      )}
    </SiteProvider>
  </StrictMode>,
);
