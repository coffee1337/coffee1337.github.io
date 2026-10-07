import type { Dictionary, Lang } from "./types";
import en from "./en";
import ru from "./ru";

export const dictionaries: Record<Lang, Dictionary> = { en, ru };

export const links = {
  email: "trefilovegor84@gmail.com",
  mailto: "mailto:trefilovegor84@gmail.com",
  github: "https://github.com/coffee1337",
  linkedin: "https://www.linkedin.com/in/coffee1337",
  telegram: "https://t.me/cooffeek1337",
  telegramHandle: "@cooffeek1337",
  resumeRepo: "https://github.com/coffee1337/resume",
  resumePdf: "https://raw.githubusercontent.com/coffee1337/resume/main/Egor_Trefilov_Resume.pdf",
  site: "https://coffee1337.github.io",
};

export type { Dictionary, Lang, ProjectContent } from "./types";
