// Генерирует dist/llms.txt и dist/llms-full.txt из базы знаний и статического описания.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const KB = "src/content/knowledge";
const SITE = "https://coffee1337.github.io";

const head = `# Egor Trefilov (coffee1337)

> Python backend & AI automation developer. FastAPI, PostgreSQL, LLM/RAG integrations. Third-year student at NGIEU (AI Systems). Open to internships, full-time and freelance.

Note: all facts below come from the site content and the listed public repositories. No invented metrics.

## Profile
- [About](${SITE}/#about)
- [Technology stack](${SITE}/#stack)
- [Projects](${SITE}/#projects)
- [Reviews](${SITE}/#reviews)
- [Contact](${SITE}/#contact)
- [Resume PDF](${SITE}/resume/Egor_Trefilov_Resume.pdf)

## Projects
- [ai-python-mentor](https://github.com/coffee1337/ai-python-mentor): Next.js + FastAPI learning platform with AI Gateway, LLM, RAG on pgvector, Redis queue and a Telegram bot.
- [ngieuapp](https://github.com/coffee1337/ngieuapp): Flutter university app with offline SQLite cache, schedule and notifications.
- [TransactionMonitor](https://github.com/coffee1337/TransactionMonitor): C# / .NET 8 / WinUI 3 desktop app for transaction monitoring and risk.
- [neural-astar-heuristic](https://github.com/coffee1337/neural-astar-heuristic): learned value function guiding A* search.
- [k-nearest-neighbors](https://github.com/coffee1337/k-nearest-neighbors): k-NN from scratch in C++17 with visualisation.
- [portfolio-analytics](https://github.com/coffee1337/portfolio-analytics): first-party analytics collector (JS beacon → FastAPI → SQLAlchemy/SQLite).

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
