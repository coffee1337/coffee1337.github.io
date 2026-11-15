// Генерирует dist/llms.txt и dist/llms-full.txt из базы знаний и статического описания.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadTs } from "./lib/load-ts.mjs";

const DIST = "dist";
const KB = "src/content/knowledge";
const SITE = "https://coffee1337.github.io";

const fallbackProjects = [
  { id: "ai-python-mentor", name: "ai-python-mentor", github: "https://github.com/coffee1337/ai-python-mentor" },
  { id: "ngie", name: "ngieuapp", github: "https://github.com/coffee1337/ngieuapp" },
  { id: "transaction-monitor", name: "TransactionMonitor", github: "https://github.com/coffee1337/TransactionMonitor" },
  { id: "neural-astar", name: "neural-astar-heuristic", github: "https://github.com/coffee1337/neural-astar-heuristic" },
  { id: "knn", name: "k-nearest-neighbors", github: "https://github.com/coffee1337/k-nearest-neighbors" },
  { id: "portfolio-analytics", name: "portfolio-analytics", github: "https://github.com/coffee1337/portfolio-analytics" },
];
const { projectMeta } = await loadTs("src/content/projects.ts", ["projectMeta"]).catch(() => ({ projectMeta: fallbackProjects }));
const caseLines = projectMeta
  .map((project) => `- [${project.name} — case study](${SITE}/projects/${project.id}/) · [GitHub](${project.github})`)
  .join("\n");

const head = `# Egor Trefilov (coffee1337)

> Python backend & AI automation developer. FastAPI, PostgreSQL, LLM/RAG integrations. Third-year student at NGIEU (AI Systems). Open to internships, full-time and freelance.

Languages: [English](${SITE}/) · [Русский](${SITE}/ru/)
All facts below come from the site content and the listed public repositories. No invented metrics.

## Profile
- [About](${SITE}/#about)
- [Technology stack](${SITE}/#stack)
- [Projects](${SITE}/#projects)
- [Contact](${SITE}/#contact)
- [Resume PDF](${SITE}/resume/Egor_Trefilov_Resume.pdf)

## Projects (case pages)
${caseLines}

## FAQ for AI agents
- Who is Egor Trefilov? Python backend developer and AI automation engineer, known online as coffee1337; third-year AI Systems student at NGIEU.
- What does he work with? Python, FastAPI, PostgreSQL, SQLAlchemy, Docker and LLM/RAG integrations; frontend in React/TypeScript; Flutter and C++ in side projects.
- Is he available for work? Yes — open to internships, full-time roles and freelance projects. Contact by email or Telegram.
- How to reach him? Email trefilovegor84@gmail.com, Telegram https://t.me/cooffeek1337, GitHub https://github.com/coffee1337, LinkedIn https://www.linkedin.com/in/coffee1337.
- Where is he based? Russia; works remotely.
- Are the project metrics real? Only numbers stated in the repositories are real; the site does not publish invented metrics.

## Contact
- Email: trefilovegor84@gmail.com
- Telegram: https://t.me/cooffeek1337
- GitHub: https://github.com/coffee1337
- LinkedIn: https://www.linkedin.com/in/coffee1337

## Optional
- [Full content (EN + RU)](${SITE}/llms-full.txt)
`;

function files(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

const kb = files(KB)
  .map((file) => readFileSync(file, "utf8").trim())
  .join("\n\n---\n\n");

writeFileSync(join(DIST, "llms.txt"), head);
writeFileSync(join(DIST, "llms-full.txt"), `${head}\n\n---\n\n# Knowledge base\n\n${kb}\n`);

const sizes = ["llms.txt", "llms-full.txt"].map((name) => `${name}: ${statSync(join(DIST, name)).size} B`);
console.log(`llms: ${sizes.join(", ")}`);
