import type { Lang } from "./types";

/** Намерения локального роутера. Один и тот же набор ключей — в en и ru. */
export type AnswerIntent =
  | "greeting"
  | "thanks"
  | "stack"
  | "projects"
  | "project"
  | "certificates"
  | "tech"
  | "education"
  | "hiring"
  | "freelance"
  | "contacts"
  | "location"
  | "resume"
  | "search"
  | "fallback";

export interface AssistantAnswerLabels {
  purpose: string;
  built: string;
  highlights: string;
  stack: string;
  caseStudy: string;
  github: string;
  email: string;
  telegram: string;
  linkedin: string;
  resumePdf: string;
  resumeRepo: string;
  status: string;
  coursework: string;
  reliable: string;
  remote: string;
  pricing: string;
}

export interface AssistantAnswers {
  greeting: string;
  thanks: string[];
  stackIntro: string;
  projectsIntro: string;
  certificatesIntro: string;
  techIntro: string;
  noTechProjects: string;
  projectMissing: string;
  educationIntro: string;
  hiringIntro: string;
  freelanceIntro: string;
  contactsIntro: string;
  locationIntro: string;
  resumeIntro: string;
  unknownHint: string;
  suggestions: string[];
  labels: AssistantAnswerLabels;
  followUps: Record<AnswerIntent, string[]>;
}

export interface AssistantUi {
  title: string;
  online: string;
  note: string;
  placeholder: string;
  send: string;
  stop: string;
  sources: string;
  fallback: string;
  open: string;
  close: string;
  copy: string;
  copied: string;
  clear: string;
  thinking: string;
  chips: string[];
  projectQuestions: { built: string; problem: string; stack: string };
  tryAsking: string;
  dialogLabel: string;
  feedLabel: string;
  you: string;
  assistant: string;
  answers: AssistantAnswers;
}

const en: AssistantUi = {
  title: "Egor's AI assistant",
  online: "online",
  note: "runs on caffeine, may be wrong",
  placeholder: "Ask about stack, projects, hiring…",
  send: "Send",
  stop: "Stop",
  sources: "sources",
  fallback: "I don't have that in the knowledge base. Email Egor directly: trefilovegor84@gmail.com",
  open: "Ask the AI assistant",
  close: "Close",
  copy: "Copy answer",
  copied: "Copied",
  clear: "Clear chat",
  thinking: "typing",
  chips: [
    "What is your stack?",
    "Tell me about AI Python Mentor",
    "Are you open to an internship?",
    "How do I contact you?",
  ],
  projectQuestions: {
    built: "How is {name} built?",
    problem: "What problem does {name} solve?",
    stack: "What stack does {name} use?",
  },
  tryAsking: "Try asking",
  dialogLabel: "AI assistant chat",
  feedLabel: "Conversation",
  you: "you",
  assistant: "assistant",
  answers: {
    greeting:
      "**Hey — I'm Egor's assistant.** I know his stack, the seven projects, certifications, the Rospatent-registered database, education, hiring terms and contacts. Everything I say comes from this site, its knowledge base and his public repositories.",
    thanks: [
      "Anytime. Ask if you want the details on a project or the stack.",
      "You're welcome — happy to help.",
    ],
    stackIntro: "Four layers Egor actually ships with:",
    projectsIntro: "Seven projects — six open repositories plus a Rospatent-registered R&D system — each with a case study:",
    certificatesIntro: "Certifications and registered intellectual property:",
    techIntro: "Projects with **{tech}**:",
    noTechProjects: "No public project on the site uses **{tech}** yet. Ask about the stack to see what he does use.",
    projectMissing: "There is no project with that name on the site.",
    educationIntro: "**Education.**",
    hiringIntro: "**Hiring.**",
    freelanceIntro: "**Freelance.**",
    contactsIntro: "**Contacts.**",
    locationIntro: "**Location.**",
    resumeIntro: "**Resume.**",
    unknownHint: "I can talk about the stack, a specific project, education, hiring or contacts:",
    suggestions: ["What is your stack?", "Show me the projects", "How do I contact you?"],
    labels: {
      purpose: "Purpose",
      built: "What he built",
      highlights: "Engineering",
      stack: "Stack",
      caseStudy: "Case study",
      github: "GitHub",
      email: "Email",
      telegram: "Telegram",
      linkedin: "LinkedIn",
      resumePdf: "Resume PDF",
      resumeRepo: "Resume on GitHub",
      status: "Status",
      coursework: "Coursework",
      reliable: "most reliable channel",
      remote: "remote-friendly",
      pricing: "Price depends on scope — agreed after the brief.",
    },
    followUps: {
      greeting: ["What is your stack?", "Show me the projects", "Can I hire you?"],
      thanks: ["Show me the projects", "How do I contact you?", "What is your stack?"],
      stack: ["Which projects use FastAPI?", "Tell me about AI Python Mentor", "What is your education?"],
      projects: ["Tell me about AI Python Mentor", "Which projects use Python?", "How do I contact you?"],
      project: ["What is your stack?", "Show me the other projects", "Can I hire you?"],
      certificates: ["Show me your certifications", "What is the Rospatent database?", "Tell me about RadarPPI-MTD"],
      tech: ["Show me all projects", "Tell me about AI Python Mentor", "What is your stack?"],
      education: ["Can I hire you?", "What is your stack?", "Show me the projects"],
      hiring: ["How do I contact you?", "What is your stack?", "Do you freelance?"],
      freelance: ["How do I contact you?", "What is your stack?", "Show me the projects"],
      contacts: ["Can I hire you?", "Show me the projects", "Where are you based?"],
      location: ["Can I hire you?", "How do I contact you?", "What is your stack?"],
      resume: ["Can I hire you?", "How do I contact you?", "Show me the projects"],
      search: ["What is your stack?", "Show me the projects", "How do I contact you?"],
      fallback: ["What is your stack?", "Show me the projects", "How do I contact you?"],
    },
  },
};

const ru: AssistantUi = {
  title: "AI-ассистент Егора",
  online: "online",
  note: "работает на кофеине, может ошибаться",
  placeholder: "Спросите про стек, проекты, найм…",
  send: "Отправить",
  stop: "Стоп",
  sources: "источники",
  fallback: "В базе знаний этого нет. Напишите Егору напрямую: trefilovegor84@gmail.com",
  open: "Спросить AI-ассистента",
  close: "Закрыть",
  copy: "Копировать ответ",
  copied: "Скопировано",
  clear: "Очистить чат",
  thinking: "печатает",
  chips: [
    "Какой у тебя стек?",
    "Расскажи про AI Python Mentor",
    "Ты открыт к стажировке?",
    "Как с тобой связаться?",
  ],
  projectQuestions: {
    built: "Как устроен {name}?",
    problem: "Какую задачу решает {name}?",
    stack: "Какой стек у {name}?",
  },
  tryAsking: "Попробуйте спросить",
  dialogLabel: "Чат с AI-ассистентом",
  feedLabel: "Диалог",
  you: "вы",
  assistant: "ассистент",
  answers: {
    greeting:
      "**Привет — я ассистент Егора.** Знаю его стек, семь проектов, сертификаты, регистрацию базы данных в Роспатенте, образование, условия найма и контакты. Всё, что я говорю, взято с этого сайта, его базы знаний и публичных репозиториев.",
    thanks: [
      "Пожалуйста. Спросите, если нужно глубже по проекту или стеку.",
      "Не за что — обращайтесь.",
    ],
    stackIntro: "Четыре слоя, с которыми Егор реально работает:",
    projectsIntro: "Семь проектов: шесть открытых репозиториев и R&D-система с государственной регистрацией базы данных в Роспатенте — у каждого есть кейс:",
    certificatesIntro: "Сертификаты и зарегистрированная интеллектуальная собственность:",
    techIntro: "Проекты с **{tech}**:",
    noTechProjects: "Публичных проектов с **{tech}** на сайте пока нет. Спросите про стек — расскажу, что он использует.",
    projectMissing: "Проекта с таким названием на сайте нет.",
    educationIntro: "**Образование.**",
    hiringIntro: "**Найм.**",
    freelanceIntro: "**Фриланс.**",
    contactsIntro: "**Контакты.**",
    locationIntro: "**Локация.**",
    resumeIntro: "**Резюме.**",
    unknownHint: "Могу рассказать про стек, конкретный проект, образование, найм или контакты:",
    suggestions: ["Какой у тебя стек?", "Покажи проекты", "Как с тобой связаться?"],
    labels: {
      purpose: "Задача",
      built: "Что сделано",
      highlights: "Инженерия",
      stack: "Стек",
      caseStudy: "Кейс",
      github: "GitHub",
      email: "Email",
      telegram: "Telegram",
      linkedin: "LinkedIn",
      resumePdf: "Резюме PDF",
      resumeRepo: "Резюме на GitHub",
      status: "Статус",
      coursework: "Дисциплины",
      reliable: "самый надёжный канал",
      remote: "удалённо, MSK (UTC+3)",
      pricing: "Стоимость зависит от объёма — обсуждается после описания задачи.",
    },
    followUps: {
      greeting: ["Какой у тебя стек?", "Покажи проекты", "Можно тебя нанять?"],
      thanks: ["Покажи проекты", "Как с тобой связаться?", "Какой у тебя стек?"],
      stack: ["Какие проекты на FastAPI?", "Расскажи про AI Python Mentor", "Где учишься?"],
      projects: ["Расскажи про AI Python Mentor", "Какие проекты на Python?", "Как с тобой связаться?"],
      project: ["Какой у тебя стек?", "Покажи остальные проекты", "Можно тебя нанять?"],
      certificates: ["Покажи сертификаты", "Что за база данных в Роспатенте?", "Расскажи про RadarPPI-MTD"],
      tech: ["Покажи все проекты", "Расскажи про AI Python Mentor", "Какой у тебя стек?"],
      education: ["Можно тебя нанять?", "Какой у тебя стек?", "Покажи проекты"],
      hiring: ["Как с тобой связаться?", "Какой у тебя стек?", "Ты фрилансишь?"],
      freelance: ["Как с тобой связаться?", "Какой у тебя стек?", "Покажи проекты"],
      contacts: ["Можно тебя нанять?", "Покажи проекты", "Где ты находишься?"],
      location: ["Можно тебя нанять?", "Как с тобой связаться?", "Какой у тебя стек?"],
      resume: ["Можно тебя нанять?", "Как с тобой связаться?", "Покажи проекты"],
      search: ["Какой у тебя стек?", "Покажи проекты", "Как с тобой связаться?"],
      fallback: ["Какой у тебя стек?", "Покажи проекты", "Как с тобой связаться?"],
    },
  },
};

/** Все строки ассистента. Паритет ключей ru/en держится типом AssistantUi. */
export const assistantUi: Record<Lang, AssistantUi> = { en, ru };

export type { Lang };
