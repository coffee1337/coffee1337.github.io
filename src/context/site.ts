import { createContext, useContext, type MutableRefObject } from "react";
import type { Dictionary, Lang } from "../content";

export type Theme = "dark" | "light";
export type OrbMode = "assemble" | "hero" | "exit";

export interface SiteContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  dict: Dictionary;
  reduced: boolean;
  lowPower: boolean;
  orbMode: OrbMode;
  setOrbMode: (mode: OrbMode) => void;
  loaderDone: boolean;
  setLoaderDone: (v: boolean) => void;
  assembleRef: MutableRefObject<number>;
  section: string;
  setSection: (id: string) => void;
  sectionIndex: number;
}

export const SiteContext = createContext<SiteContextValue | null>(null);

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite outside provider");
  return ctx;
}
