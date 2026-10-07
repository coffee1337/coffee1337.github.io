import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { dictionaries, type Lang } from "../content";
import { SiteContext, type OrbMode, type Theme } from "./site";

const THEME_KEY = "et-theme";
const LANG_KEY = "et-lang";

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
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function initialLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === "ru" || stored === "en") return stored;
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [lowPower] = useState(() => {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency ?? 8;
    const narrow = window.matchMedia("(max-width: 760px)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    return Boolean(saveData) || (mem !== undefined && mem <= 4) || cores <= 4 || narrow;
  });
  const [orbMode, setOrbMode] = useState<OrbMode>("assemble");
  const [loaderDone, setLoaderDone] = useState(false);
  const assembleRef = useRef(0.05);
  const [section, setSection] = useState("top");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    const dict = dictionaries[lang];
    document.title = dict.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", dict.meta.description);
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang: (next: Lang) => setLangState(next),
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
    [lang, theme, reduced, lowPower, orbMode, loaderDone, section],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
