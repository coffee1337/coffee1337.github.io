// Общий загрузчик TS-контента для build-скриптов: esbuild собирает временный модуль,
// чтобы build-kb/fetch-readmes читали те же данные, что и сайт (без дублирования фактов).
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const bin = join(root, "node_modules", ".bin", process.platform === "win32" ? "esbuild.cmd" : "esbuild");
const cacheRoot = join(root, "node_modules", ".cache", "assistant-ts");

/**
 * @param {string} entry путь к TS-модулю относительно корня репозитория
 * @param {string[]} exports имена экспортов, которые нужно получить
 */
export async function loadTs(entry, exports) {
  const entryPath = join(root, entry);
  const dir = join(cacheRoot, `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  const wrapper = join(dir, "entry.ts");
  const spec = relative(dir, entryPath).split("\\").join("/");
  writeFileSync(wrapper, `export { ${exports.join(", ")} } from ${JSON.stringify(spec)};\n`, "utf8");
  const outfile = join(dir, "bundle.mjs");

  try {
    execFileSync(
      bin,
      [wrapper, "--bundle", "--format=esm", "--platform=node", "--log-level=error", `--outfile=${outfile}`],
      { cwd: root, stdio: ["ignore", "ignore", "pipe"] },
    );
    const mod = await import(pathToFileURL(outfile).href);
    const result = {};
    for (const name of exports) result[name] = mod[name];
    return result;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export { root };
