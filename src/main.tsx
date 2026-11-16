import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { NotFound } from "./components/NotFound";
import { ProjectPage } from "./components/Projects/ProjectPage";
import { ProjectsCatalog } from "./components/Projects/ProjectsCatalog";
import { SiteProvider } from "./context/SiteProvider";
import type { Lang } from "./content";
import { initAnalytics } from "./analytics";
import { installScrollTriggerRefresh } from "./lib/scrollRefresh";
import { ToastProvider } from "./components/Toast/ToastProvider";
import "./styles/global.css";

// §10.1: CSS скрывает [data-reveal] только под html.js — без JS и в пререндере всё видно.
document.documentElement.classList.add("js");
installScrollTriggerRefresh();

interface ClientRoute {
  kind: "home" | "project" | "catalog" | "notfound";
  lang: Lang;
  projectId?: string;
}

function parseRoute(): ClientRoute {
  const path = window.location.pathname.replace(/index\.html$/, "").replace(/\/+$/, "") || "/";
  const ru = path === "/ru" || path.startsWith("/ru/");
  const lang: Lang = ru ? "ru" : "en";
  const rest = ru ? path.slice(3) || "/" : path;
  if (rest === "/") return { kind: "home", lang };
  if (rest === "/projects") return { kind: "catalog", lang };
  const match = rest.match(/^\/projects\/([a-z0-9-]+)$/i);
  if (match) return { kind: "project", lang, projectId: match[1] };
  return { kind: "notfound", lang };
}

const route = parseRoute();

/** Аналитика инициализируется после монтирования: IntersectionObserver должен видеть живые [data-section]. */
function Root() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <StrictMode>
      <SiteProvider initialLang={route.lang} route={route}>
        <ToastProvider>
          {route.kind === "home" ? (
            <App />
          ) : route.kind === "project" ? (
            <ProjectPage id={route.projectId} />
          ) : route.kind === "catalog" ? (
            <ProjectsCatalog />
          ) : (
            <NotFound />
          )}
        </ToastProvider>
      </SiteProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
