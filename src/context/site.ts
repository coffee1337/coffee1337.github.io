import { createContext, useContext } from "react";
import type { FullDictionary, Lang } from "../content";

export type Theme = "dark" | "light";

export type RouteKind = "home" | "project" | "catalog" | "notfound";

export interface RouteInfo {
  kind: RouteKind;
  projectId?: string;
}

export interface SiteContextValue {
  lang: Lang;
  switchLang: (to: Lang) => void;
  route: RouteInfo;
  /** "" for the english tree, "/ru" for the russian tree. */
  pathBase: string;
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
  dict: FullDictionary;
  reduced: boolean;
  lowPower: boolean;
  loaderDone: boolean;
  setLoaderDone: (v: boolean) => void;
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
