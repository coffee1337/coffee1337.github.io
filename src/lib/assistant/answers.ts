import { dictionaries, links, resumePdfFor } from "../../content/index";
import { assistantUi, type AnswerIntent } from "../../content/assistant-ui";
import type { Lang } from "../../content/types";
import { detectIntent, TECHS } from "./intent";
import { detectLang } from "./lang";
import type { Answer, LocalAnswerOptions, SearchHit } from "./types";

const mdLink = (label: string, href: string): string => `[${label}](${href})`;

/** Résumé link in the language of the conversation. */
const resumeHref = (lang: Lang): string => resumePdfFor(lang);

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 0 ? space : max).trimEnd()}…`;
}

/** Канонизация стековой строки: «C++17» → «c++», «.NET 8» → «.net». */
function canonStack(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .trim()
    .replace(/\s*v?\d+(?:\.\d+)*$/, "")
    .trim();
}

/** Первые два предложения чанка — чтобы поиск давал короткий ответ, а не простыню. */
function leadSentences(text: string, limit: number): string {
  const clean = text
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/[`*_>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const sentences = clean.split(/(?<=[.!?])\s+/).slice(0, limit);
  return sentences.join(" ").trim();
}

export function answerLocal(question: string, options: LocalAnswerOptions = {}): Answer {
  const lang: Lang = detectLang(question);
  const ui = assistantUi[lang];
  const dict = dictionaries[lang];
  const copy = ui.answers;
  const labels = copy.labels;
  const detected = detectIntent(question);
  const base = lang === "ru" ? "/ru" : "";
  const section = (id: string): string => `${base}/#${id}`;
  const projectPage = (id: string): string => `${base}/projects/${id}/`;
  const chips = (intent: AnswerIntent): string[] => [...copy.followUps[intent]];

  const done = (intent: AnswerIntent, text: string, sources: string[], hrefs: string[] = []): Answer => ({
    intent,
    lang,
    text: text.trim(),
    chips: chips(intent),
    sources: Array.from(new Set(sources.filter(Boolean))),
    hrefs: Array.from(new Set(hrefs.filter(Boolean))),
  });

  const project = detected.projectId ? dict.projects.items.find((item) => item.id === detected.projectId) : undefined;

  switch (detected.intent) {
    case "greeting":
      return done("greeting", copy.greeting, []);

    case "thanks":
      return done("thanks", copy.thanks[0] ?? copy.thanks[copy.thanks.length - 1], []);

    case "stack": {
      const groups = dict.stack.groups.map((group) => `- **${group.name}** — ${group.items.join(", ")}`);
      return done(
        "stack",
        [`**${dict.stack.title}**`, "", copy.stackIntro, "", ...groups, "", mdLink(dict.nav.stack, section("stack"))].join("\n"),
        [dict.nav.stack],
        [section("stack")],
      );
    }

    case "projects": {
      const items = dict.projects.items.map((item) => {
        const refs = [mdLink(labels.caseStudy, projectPage(item.id))];
        if (item.github) refs.push(mdLink(labels.github, item.github));
        if (item.patent) refs.push(mdLink(item.patent.number, item.patent.registryUrl));
        return `- **${item.name}** — ${item.statement} (${refs.join(", ")})`;
      });
      const hrefs = dict.projects.items.map((item) => projectPage(item.id));
      for (const item of dict.projects.items) if (item.patent) hrefs.push(item.patent.registryUrl);
      return done("projects", [copy.projectsIntro, "", ...items].join("\n"), [dict.nav.projects], hrefs);
    }

    case "project": {
      if (!project) {
        return done("project", copy.projectMissing, []);
      }
      const lines = [
        `**${project.name}** — ${project.statement}`,
        "",
        `- **${labels.purpose}:** ${project.purpose}`,
        `- **${labels.built}:** ${project.built}`,
        `- **${labels.highlights}:** ${project.highlights.join(" · ")}`,
        `- **${labels.stack}:** ${project.stack.join(", ")}`,
      ];
      if (project.status) lines.push(`- **${labels.status}:** ${project.status}`);
      const refs = [mdLink(labels.caseStudy, projectPage(project.id))];
      if (project.github) refs.push(mdLink(labels.github, project.github));
      if (project.patent) refs.push(mdLink(project.patent.number, project.patent.registryUrl));
      lines.push("", refs.join(" · "));
      const hrefs = [projectPage(project.id)];
      if (project.github) hrefs.push(project.github);
      if (project.patent) hrefs.push(project.patent.registryUrl);
      return done("project", lines.join("\n"), [project.name], hrefs);
    }

    case "certificates": {
      const certificates = dict.sections.certificates;
      const items = certificates.items.map((item) => {
        const refs: string[] = [];
        const target = item.links.find((link) => link.kind === "registry" || link.kind === "verify");
        if (target) refs.push(mdLink(target.label, target.href));
        const caseStudy = item.links.find((link) => link.kind === "case");
        if (caseStudy) refs.push(mdLink(caseStudy.label, `${base}${caseStudy.href}`));
        const suffix = refs.length ? ` (${refs.join(", ")})` : "";
        return `- **${item.title}** — ${item.issuer}, ${item.date}${suffix}`;
      });
      const lines = [
        `**${certificates.title}**`,
        "",
        copy.certificatesIntro,
        "",
        ...items,
        "",
        mdLink(dict.nav.certificates, section("certificates")),
      ];
      const hrefs = [section("certificates")];
      for (const item of certificates.items) {
        for (const link of item.links) {
          if (link.kind === "case") hrefs.push(`${base}${link.href}`);
          else if (link.kind !== "pdf") hrefs.push(link.href);
        }
      }
      return done("certificates", lines.join("\n"), [dict.nav.certificates], hrefs);
    }

    case "tech": {
      const techId = detected.tech ?? "";
      const tech = TECHS.find((item) => item.id === techId);
      const label = tech?.label ?? techId;
      const using = dict.projects.items.filter((item) => item.stack.some((entry) => canonStack(entry) === techId));
      if (!using.length) {
        return done("tech", copy.noTechProjects.replace("{tech}", label), [dict.nav.stack], [section("stack")]);
      }
      const intro = copy.techIntro.replace("{tech}", label);
      const items = using.map(
        (item) => `- **${item.name}** — ${item.statement} (${mdLink(labels.caseStudy, projectPage(item.id))})`,
      );
      return done(
        "tech",
        [intro, "", ...items].join("\n"),
        [dict.nav.projects],
        using.map((item) => projectPage(item.id)),
      );
    }

    case "education": {
      const card = dict.sections.educationCard;
      const lines = [
        copy.educationIntro,
        card.school,
        `${card.program} · ${card.profile} · ${card.period}`,
        "",
        `- **${labels.coursework}:** ${card.chips.join(", ")}`,
        "",
        card.note,
        "",
        mdLink(dict.education.label, section("education")),
      ];
      return done("education", lines.join("\n"), [dict.education.label], [section("education")]);
    }

    case "hiring": {
      const card = dict.sections.entry.cards[0];
      const lines = [
        `${copy.hiringIntro} ${dict.contact.status}`,
        "",
        card.body,
        "",
        `- ${mdLink(labels.resumePdf, resumeHref(lang))} · ${mdLink(labels.resumeRepo, links.resumeRepo)}`,
        `- ${mdLink(labels.email, links.mailto)} · ${mdLink(labels.telegram, links.telegram)}`,
        `- ${dict.footer.location}`,
      ];
      return done("hiring", lines.join("\n"), [dict.sections.entry.cards[0].title], [resumeHref(lang), links.resumeRepo, links.telegram]);
    }

    case "freelance": {
      const card = dict.sections.entry.cards[1];
      const lines = [
        `${copy.freelanceIntro} ${card.body}`,
        "",
        `- ${labels.pricing}`,
        `- ${mdLink(labels.telegram, links.telegram)} · ${mdLink(labels.email, links.mailto)}`,
      ];
      return done("freelance", lines.join("\n"), [dict.sections.entry.cards[1].title], [links.telegram]);
    }

    case "contacts": {
      const lines = [
        copy.contactsIntro,
        "",
        `- **${labels.email}:** ${mdLink(links.email, links.mailto)} — ${labels.reliable}.`,
        `- **${labels.telegram}:** ${mdLink(links.telegramHandle, links.telegram)}`,
        `- **${labels.github}:** ${mdLink("github.com/coffee1337", links.github)} · **${labels.linkedin}:** ${mdLink("linkedin.com/in/coffee1337", links.linkedin)}`,
        `- ${mdLink(labels.resumePdf, resumeHref(lang))}`,
      ];
      return done("contacts", lines.join("\n"), [dict.nav.contact], [links.telegram, links.github, links.linkedin, resumeHref(lang)]);
    }

    case "location": {
      const lines = [copy.locationIntro, dict.footer.location, "", `- ${labels.remote}`];
      return done("location", lines.join("\n"), [dict.nav.contact], []);
    }

    case "resume": {
      const resume = dict.resume;
      const lines = [
        `${copy.resumeIntro} ${resume.role}. ${resume.profile}`,
        "",
        `- **${resume.skillsTitle}:** ${resume.skills.join(", ")}`,
        `- ${mdLink(labels.resumePdf, resumeHref(lang))}`,
        `- ${mdLink(labels.resumeRepo, links.resumeRepo)}`,
      ];
      return done("resume", lines.join("\n"), [resume.title], [resumeHref(lang), links.resumeRepo]);
    }

    case "search": {
      const hits: SearchHit[] = options.search ? options.search(question, lang) : [];
      const usable = hits.filter((hit) => leadSentences(hit.text, 1).length >= 40);
      if (!usable.length) break;

      const parts: string[] = [];
      for (const hit of usable.slice(0, 2)) {
        const lead = leadSentences(hit.text, 2);
        if (lead && !parts.some((part) => part.includes(lead.slice(0, 40)))) parts.push(lead);
      }
      if (!parts.length) break;

      const text = truncate(parts.join(" "), 560);
      if (text.length < 40) break;
      return {
        intent: "search",
        lang,
        text,
        chips: chips("search"),
        sources: Array.from(new Set(usable.slice(0, 2).map((hit) => hit.title).filter(Boolean))),
        hrefs: Array.from(new Set(usable.map((hit) => hit.href ?? "").filter(Boolean))).slice(0, 3),
      };
    }

    default:
      break;
  }

  const fallback = [ui.fallback, "", copy.unknownHint, "", ...copy.suggestions.map((item) => `- ${item}`)].join("\n");
  return {
    intent: "fallback",
    lang,
    text: fallback,
    chips: copy.suggestions.slice(0, 3),
    sources: [],
    hrefs: [],
  };
}

/** Follow-up подсказки: сначала по намерению, потом общие chips, без повторов заданных. */
export function followUpChips(answer: Answer, asked: string[], limit = 3): string[] {
  const seen = new Set(asked.map((item) => item.trim().toLowerCase()));
  const ui = assistantUi[answer.lang];
  const pool = [...answer.chips, ...ui.chips, ...ui.answers.suggestions];
  const picked: string[] = [];
  for (const chip of pool) {
    const key = chip.trim().toLowerCase();
    if (!chip.trim() || seen.has(key) || picked.some((item) => item.toLowerCase() === key)) continue;
    picked.push(chip);
    if (picked.length >= limit) break;
  }
  return picked;
}
