import type { FullDictionary, Lang } from "./types";
import en from "./en";
import ru from "./ru";
import { sections } from "./sections";

export const dictionaries: Record<Lang, FullDictionary> = {
  en: { ...en, sections: sections.en },
  ru: { ...ru, sections: sections.ru },
};

export const links = {
  email: "trefilovegor84@gmail.com",
  mailto: "mailto:trefilovegor84@gmail.com",
  github: "https://github.com/coffee1337",
  linkedin: "https://www.linkedin.com/in/coffee1337",
  telegram: "https://t.me/cooffeek1337",
  telegramHandle: "@cooffeek1337",
  resumeRepo: "https://github.com/coffee1337/resume",
  /** Legacy default (Russian edition) — kept for callers that have no language context. */
  resumePdf: "/resume/Egor_Trefilov_Resume.pdf",
  resumePdfEn: "/resume/Egor_Trefilov_Resume_EN.pdf",
  resumePdfRu: "/resume/Egor_Trefilov_Resume.pdf",
  site: "https://coffee1337.github.io",
};

/** Language-matched résumé PDF: EN tree gets the English edition, RU tree the Russian one. */
export function resumePdfFor(lang: Lang): string {
  return lang === "en" ? links.resumePdfEn : links.resumePdfRu;
}

export type { Dictionary, FullDictionary, Lang, ProjectContent } from "./types";
