export type Lang = "en" | "ru";

export type FullDictionary = Dictionary & { sections: Sections };

export interface ProjectContent {
  id: string;
  name: string;
  status?: string;
  statement: string;
  purpose: string;
  built: string;
  highlights: string[];
  stack: string[];
  github: string;
  visual: "mentor" | "campus" | "ledger" | "search" | "neighbors" | "analytics";
  image?: string;
}

export interface Sections {
  entry: {
    index: string;
    label: string;
    title: string;
    cards: { id: "hire" | "freelance" | "code"; title: string; body: string; action: string }[];
  };
  educationCard: {
    labels: { code: string; profile: string; term: string };
    badge: string;
    school: string;
    program: string;
    profile: string;
    period: string;
    chipsTitle: string;
    chips: string[];
    note: string;
  };
  reviews: { index: string; label: string; title: string; prev: string; next: string; empty: string };
  contactForm: {
    title: string;
    name: string;
    email: string;
    topic: string;
    topics: { hire: string; project: string; other: string };
    message: string;
    send: string;
    sending: string;
    success: string;
    error: string;
    privacy: string;
    unavailable: string;
    mailtoCta: string;
  };
  assistant: {
    title: string;
    online: string;
    note: string;
    placeholder: string;
    send: string;
    sources: string;
    fallback: string;
    open: string;
    close: string;
    chips: string[];
  };
  projectsUi: {
    explorer: string;
    filterAll: string;
    details: string;
    problem: string;
    solution: string;
    result: string;
    clone: string;
    caseStudy: string;
    repo: string;
    copy: string;
    copied: string;
    empty: string;
    tabs: string;
  };
}

export interface Dictionary {
  meta: { title: string; description: string };
  palette: {
    search: string;
    empty: string;
    nav: string;
    projects: string;
    actions: string;
    settings: string;
    copyEmail: string;
    downloadResume: string;
    askAi: string;
    writeMe: string;
    toggleTheme: string;
    switchLang: string;
    hints: string;
  };
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
  loader: { forming: string; skip: string; lines: string[]; tokens: string[] };
  hero: {
    label: string;
    first: string;
    last: string;
    role: string;
    headline: string;
    summary: string;
    explore: string;
    contact: string;
    available: string;
    locationNote: string;
    status: string;
    metricCommits: string;
    metricRepos: string;
    metricYear: string;
    metricLangs: string;
    linkEmail: string;
    linkTelegram: string;
    linkGithub: string;
    linkLinkedin: string;
    linkResume: string;
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
  projectPage: {
    open: string;
    back: string;
    next: string;
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
    status: string;
    location: string;
    sayHello: string;
    builtWith: string;
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
