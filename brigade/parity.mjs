// brigade/parity.mjs — сравнение набора ключей RU/EN контента.
// Приблизительно, но ловит 95% расхождений: ключи вида `name:` на любом уровне вложенности.
import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
const keysOf = (p) => {
  const src = readFileSync(p, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const set = new Set();
  for (const m of src.matchAll(/^\s{2,}(["']?)([A-Za-z_$][\w$-]*)\1\s*:/gm)) set.add(m[2]);
  return set;
};

const [a, b] = files;
const A = keysOf(a), B = keysOf(b);
const onlyA = [...A].filter((k) => !B.has(k));
const onlyB = [...B].filter((k) => !A.has(k));
console.log(`${a}: ${A.size} ключей`);
console.log(`${b}: ${B.size} ключей`);
if (onlyA.length) console.log(`только в A (${onlyA.length}): ${onlyA.slice(0, 40).join(", ")}`);
if (onlyB.length) console.log(`только в B (${onlyB.length}): ${onlyB.slice(0, 40).join(", ")}`);
process.exit(onlyA.length + onlyB.length === 0 ? 0 : 1);
