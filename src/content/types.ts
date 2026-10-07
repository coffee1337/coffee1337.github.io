export type Lang = "en" | "ru";

export interface ProjectContent {
  id: string;
  index: string;
  name: string;
  status?: string;
  statement: string;
  purpose: string;
  built: string;
  highlights: string[];
  stack: string[];
  github: string;
  visual: "mentor" | "campus" | "ledger" | "search" | "neighbors";
  image?: string;
}

export interface Dictionary {
  meta: { title: string; description: string };
  nav: {
    about: string;
    capabilities: string;
    projects: string;
    experience: string;
    stack: string;
    resume: string;
    contact: string;
    menu: string;
    close: string;
  };
  loader: { forming: string };
  hero: {
    label: string;
    first: string;
    last: string;
    role: string;
    summary: string;
    explore: string;
    contact: string;
    available: string;
    locationNote: string;
  };
  about: {
    index: string;
    label: string;
    statement: string;
    paragraphs: string[];
  };
  experience: {
    index: string;
    label: string;
    title: string;
    role: string;
    employment: string;
    period: string;
    intro: string;
    tracksTitle: string;
    tracks: { period: string; title: string; body: string }[];
    builtTitle: string;
    built: string[];
    practiceTitle: string;
    practice: string[];
  };
  capabilities: {
    index: string;
    label: string;
    title: string;
    items: { index: string; title: string; tags: string; body: string }[];
  };
  projects: {
    index: string;
    label: string;
    title: string;
    purpose: string;
    built: string;
    highlights: string;
    technology: string;
    github: string;
    active: string;
    items: ProjectContent[];
  };
  stack: {
    index: string;
    label: string;
    title: string;
    groups: { name: string; items: string[] }[];
  };
  resume: {
    index: string;
    label: string;
    title: string;
    name: string;
    role: string;
    profileTitle: string;
    profile: string;
    experienceTitle: string;
    educationTitle: string;
    skillsTitle: string;
    skills: string[];
    workTitle: string;
    download: string;
    view: string;
  };
  education: {
    index: string;
    label: string;
    school: string;
    program: string;
    period: string;
  };
  contact: {
    index: string;
    label: string;
    title: string;
    status: string;
    cta: string;
    github: string;
    copyEmail: string;
    copyTelegram: string;
    copied: string;
    email: string;
    telegram: string;
    linkedin: string;
    resume: string;
  };
  footer: {
    role: string;
    rights: string;
  };
  a11y: {
    themeToLight: string;
    themeToDark: string;
    themeLight: string;
    themeDark: string;
    lang: string;
    skip: string;
    orb: string;
    notFound: { title: string; body: string; back: string };
  };
}
