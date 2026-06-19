#!/usr/bin/env node
/**
 * Diff Method strings between ryx and jyx app trees.
 * Usage: node packages/api/scripts/diff-jyx-methods.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../..");
const beeantRoot = path.resolve(monorepoRoot, "../beeantmobile-main");

const SCAN_DIRS = ["projects/ryx/src/app", "projects/jyx/src/app"];
const PATTERNS = [
  /req\.Method\s*=\s*`([^`$]+)`/g,
  /req\.Method\s*=\s*['"]([^'"]+)['"]/g,
  /\.send\s*\(\s*['"]([^'"]+)['"]/g,
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(full, files);
    } else if (name.endsWith(".ts") && !name.endsWith(".spec.ts")) {
      files.push(full);
    }
  }
  return files;
}

function extractFromTree(relDir) {
  const set = new Set();
  const dir = path.join(beeantRoot, relDir);
  for (const file of walk(dir)) {
    const content = fs.readFileSync(file, "utf8");
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        const method = m[1].trim();
        if (method.length >= 5 && !method.includes("${")) {
          set.add(method);
        }
      }
    }
  }
  return set;
}

const ryx = extractFromTree("projects/ryx/src/app");
const jyx = extractFromTree("projects/jyx/src/app");

const ryxOnly = [...ryx].filter((m) => !jyx.has(m)).sort();
const jyxOnly = [...jyx].filter((m) => !ryx.has(m)).sort();
const shared = [...ryx].filter((m) => jyx.has(m)).sort();

const report = {
  generatedAt: new Date().toISOString(),
  ryxTotal: ryx.size,
  jyxTotal: jyx.size,
  sharedCount: shared.length,
  ryxOnlyCount: ryxOnly.length,
  jyxOnlyCount: jyxOnly.length,
  ryxOnly,
  jyxOnly,
  shared,
};

const outDir = path.resolve(monorepoRoot, "docs/api");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "METHODS-JYX-DIFF.json"), JSON.stringify(report, null, 2));

const md = [
  "# ryx vs jyx Method Diff",
  "",
  `> Generated: ${report.generatedAt}`,
  "",
  `| Set | Count |`,
  `|-----|-------|`,
  `| ryx unique | ${report.ryxTotal} |`,
  `| jyx unique | ${report.jyxTotal} |`,
  `| shared | ${report.sharedCount} |`,
  `| ryx only | ${report.ryxOnlyCount} |`,
  `| jyx only | ${report.jyxOnlyCount} |`,
  "",
  "## ryx only (sample)",
  "",
  ...ryxOnly.slice(0, 20).map((m) => `- \`${m}\``),
  ryxOnly.length > 20 ? `\n… and ${ryxOnly.length - 20} more` : "",
  "",
  "## jyx only (sample)",
  "",
  ...jyxOnly.slice(0, 20).map((m) => `- \`${m}\``),
  jyxOnly.length > 20 ? `\n… and ${jyxOnly.length - 20} more` : "",
].join("\n");

fs.writeFileSync(path.join(outDir, "METHODS-JYX-DIFF.md"), md);
console.log(`ryx=${ryx.size} jyx=${jyx.size} shared=${shared.length} ryxOnly=${ryxOnly.length} jyxOnly=${jyxOnly.length}`);
