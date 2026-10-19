import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { dictionaries, type Lang } from "../content";
import { SiteContext, type OrbMode, type RouteInfo, type Theme } from "./site";

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

function initialTheme(): Theme {
  if (!hasWindow) return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
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
  const [orbMode, setOrbMode] = useState<OrbMode>("assemble");
  // Project pages have no boot loader, so reveals and smooth scroll can start right away.
  const [loaderDone, setLoaderDone] = useState(route.kind !== "home");
  const assembleRef = useRef(0.05);
  const [section, setSection] = useState("top");

  const pathBase = lang === "ru" ? "/ru" : "";

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
    window.location.assign(target);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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

  const value = useMemo(
    () => ({
      lang,
      switchLang,
      route,
      pathBase,
      theme,
      toggleTheme: (origin?: { x: number; y: number }) => {
        const root = document.documentElement;
        if (origin) {
          root.style.setProperty("--wipe-x", `${origin.x}px`);
          root.style.setProperty("--wipe-y", `${origin.y}px`);
        }
        const next: Theme = theme === "dark" ? "light" : "dark";
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce || typeof document.startViewTransition !== "function") {
          setTheme(next);
          return;
        }
        const wipe = document.createElement("div");
        wipe.className = "theme-wipe";
        wipe.style.background = next === "light" ? "#f4f0e8" : "#0b0b0c";
        document.body.appendChild(wipe);
        wipe.animate(
          [
            { clipPath: `circle(0% at ${origin?.x ?? window.innerWidth * 0.9}px ${origin?.y ?? 40}px)` },
            { clipPath: `circle(150% at ${origin?.x ?? window.innerWidth * 0.9}px ${origin?.y ?? 40}px)` },
          ],
          { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
        );
        window.setTimeout(() => setTheme(next), 180);
        window.setTimeout(() => wipe.remove(), 560);
      },
      dict: dictionaries[lang],
      reduced,
      lowPower,
      orbMode,
      setOrbMode,
      loaderDone,
      setLoaderDone,
      assembleRef,
      section,
      setSection,
      sectionIndex: Math.max(0, SECTION_ORDER.indexOf(section === "education" ? "resume" : section)),
    }),
    [lang, theme, reduced, lowPower, orbMode, loaderDone, section, route, pathBase],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
