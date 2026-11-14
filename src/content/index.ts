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
  resumePdf: "/resume/Egor_Trefilov_Resume.pdf",
  site: "https://coffee1337.github.io",
};

export type { Dictionary, FullDictionary, Lang, ProjectContent } from "./types";
