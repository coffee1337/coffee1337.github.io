import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type Lang } from "../content";
import { SiteContext, type RouteInfo, type Theme } from "./site";
import { trackEvent } from "../analytics";

const THEME_KEY = "et-theme";
const hasWindow = typeof window !== "undefined";

export const SECTION_ORDER = [
  "top",
  "about",
  "capabilities",
  "experience",
  "projects",
  "stack",
  "resume",
  "contact",
];

/** Событие для canvas/WebGL: палитра темы уже применена к `documentElement`. */
export const THEME_EVENT = "themechange";

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function initialTheme(): Theme {
  if (!hasWindow) return "dark";
  const stored = readStoredTheme();
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function SiteProvider({
  children,
  initialLang = "en",
  route = { kind: "home" },
}: {
  children: ReactNode;
  initialLang?: Lang;
  route?: RouteInfo;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [lang] = useState<Lang>(initialLang);
  const [reduced, setReduced] = useState(
    () => hasWindow && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [lowPower] = useState(() => {
    if (!hasWindow) return false;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency ?? 8;
    const narrow = window.matchMedia("(max-width: 760px)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    return Boolean(saveData) || (mem !== undefined && mem <= 4) || cores <= 4 || narrow;
  });
  // Project pages have no boot loader, so reveals and smooth scroll can start right away.
  const [loaderDone, setLoaderDone] = useState(route.kind !== "home");
  const [section, setSection] = useState("top");

  const pathBase = lang === "ru" ? "/ru" : "";

  /**
   * Тема применяется синхронно: `data-theme` пишется ДО setState, поэтому
   * canvas-компоненты в своём эффекте читают уже новые CSS-переменные.
   */
  const commitTheme = useCallback((next: Theme) => {
    if (!hasWindow) return;
    const root = document.documentElement;
    if (root.dataset.theme !== next) {
      root.dataset.theme = next;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* private mode */
      }
      window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: next } }));
    }
    setTheme(next);
  }, []);

  // Первый кадр: синхронизируем state с тем, что уже поставил inline-скрипт.
  useLayoutEffect(() => {
    commitTheme(theme);
  }, [commitTheme, theme]);

  /** Language lives in the URL ("/" vs "/ru/"), so switching is a navigation. */
  const switchLang = (to: Lang) => {
    if (!hasWindow || to === lang) return;
    const clean = window.location.pathname.replace(/index\.html$/, "").replace(/\/+$/, "");
    let target: string;
    if (to === "ru") {
      target = clean === "" ? "/ru/" : `/ru${clean}/`;
    } else {
      target = clean.replace(/^\/ru(?=\/|$)/, "") || "/";
    }
    if (target !== "/" && !target.endsWith("/")) target += "/";
    if (to !== lang) trackEvent("lang_switch", { to });
    window.location.assign(target);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    if (route.kind !== "home") return;
    const dict = dictionaries[lang];
    document.title = dict.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", dict.meta.description);
  }, [lang, route.kind]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      const root = document.documentElement;
      if (origin) {
        root.style.setProperty("--wipe-x", `${origin.x}px`);
        root.style.setProperty("--wipe-y", `${origin.y}px`);
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || typeof document.startViewTransition !== "function" || typeof document.body.animate !== "function") {
        commitTheme(next);
        return;
      }
      const wipe = document.createElement("div");
      wipe.className = "theme-wipe";
      wipe.style.background = next === "light" ? "#f8f4ee" : "#0c0a09";
      document.body.appendChild(wipe);
      wipe.animate(
        [
          { clipPath: `circle(0% at ${origin?.x ?? window.innerWidth * 0.9}px ${origin?.y ?? 40}px)` },
          { clipPath: `circle(150% at ${origin?.x ?? window.innerWidth * 0.9}px ${origin?.y ?? 40}px)` },
        ],
        { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
      );
      window.setTimeout(() => commitTheme(next), 180);
      window.setTimeout(() => wipe.remove(), 560);
    },
    [commitTheme, theme],
  );

  const value = useMemo(
    () => ({
      lang,
      switchLang,
      route,
      pathBase,
      theme,
      toggleTheme,
      dict: dictionaries[lang],
      reduced,
      lowPower,
      loaderDone,
      setLoaderDone,
      section,
      setSection,
      sectionIndex: Math.max(0, SECTION_ORDER.indexOf(section === "education" ? "resume" : section)),
    }),
    [lang, theme, toggleTheme, reduced, lowPower, loaderDone, section, route, pathBase],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
