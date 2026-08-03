#!/usr/bin/env node
/**
 * Scan beeantmobile-main for req.Method / apiService.send() strings.
 * Usage: node packages/api/scripts/extract-methods.mjs [--source PATH] [--out PATH]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../..");

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const sourceRoot = arg(
  "--source",
  path.resolve(monorepoRoot, "../beeantmobile-main"),
);
const outJson = arg(
  "--out",
  path.resolve(monorepoRoot, "docs/api/METHODS.json"),
);
const outMethodsDir = arg(
  "--methods-dir",
  path.resolve(monorepoRoot, "packages/api/src/methods"),
);

const SCAN_DIRS = [
  "projects/core/src/services",
  "projects/ryx/src/app",
  "projects/jyx/src/app",
];

const PATTERNS = [
  /req\.Method\s*=\s*`([^`]+)`/g,
  /req\.Method\s*=\s*['"]([^'"]+)['"]/g,
  /req\.Method\s*=\s*`([^$`]*)\$\{/g,
  /\.send\s*\(\s*['"]([^'"]+)['"]/g,
  /\.send\s*\(\s*`([^`]+)`/g,
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

function parseMethod(method) {
  const dynamic = method.includes("${") || method.includes("${");
  const parts = method.split("-");
  if (parts.length < 3) {
    return { urlKey: method, controller: "", action: "", dynamic };
  }
  return {
    urlKey: parts[0],
    controller: parts[1],
    action: parts.slice(2).join("-"),
    dynamic,
  };
}

function domainFromUrlKey(urlKey) {
  if (urlKey.includes("Hotel")) return "hotel";
  if (urlKey.includes("Flight")) return "flight";
  if (urlKey.includes("Train")) return "train";
  if (urlKey.includes("Order")) return "order";
  if (urlKey.includes("Book")) return "book";
  if (urlKey.includes("Login") || urlKey.includes("Password")) return "auth";
  if (urlKey.includes("Member") || urlKey.includes("Account")) return "member";
  if (urlKey.includes("Hr") || urlKey.includes("Ronglv") || urlKey.includes("Jyx"))
    return "travel";
  if (urlKey.includes("Bpm") || urlKey.includes("Workflow")) return "bpm";
  if (urlKey.includes("Mms")) return "mms";
  if (urlKey.includes("Car")) return "car";
  if (urlKey.includes("Tourist")) return "tourist";
  if (urlKey.includes("Home") && urlKey.startsWith("TmcApi")) return "tmc";
  return "other";
}

function toConstName(method) {
  const { controller, action } = parseMethod(method);
  const raw = `${controller}_${action}`.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
  return raw || "UNKNOWN";
}

const map = new Map();

for (const rel of SCAN_DIRS) {
  const dir = path.join(sourceRoot, rel);
  for (const file of walk(dir)) {
    const content = fs.readFileSync(file, "utf8");
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        let method = m[1].trim();
        if (!method || method.length < 5) continue;
        const dynamic = method.includes("${");
        if (dynamic) method = method + "${...}";

        const relFile = path.relative(sourceRoot, file);
        const existing = map.get(method) ?? {
          method,
          ...parseMethod(method),
          sources: [],
          count: 0,
        };
        existing.count += 1;
        if (!existing.sources.includes(relFile)) existing.sources.push(relFile);
        map.set(method, existing);
      }
    }
  }
}

const methods = [...map.values()].sort((a, b) => a.method.localeCompare(b.method));
const summary = {
  generatedAt: new Date().toISOString(),
  sourceRoot,
  total: methods.length,
  byDomain: {},
  methods,
};

for (const m of methods) {
  const d = domainFromUrlKey(m.urlKey);
  summary.byDomain[d] = (summary.byDomain[d] ?? 0) + 1;
}

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));

// Generate METHODS.md
const mdLines = [
  "# API Methods (auto-generated)",
  "",
  `> Generated: ${summary.generatedAt}`,
  `> Total unique methods: **${summary.total}**`,
  "",
  "## By domain",
  "",
  ...Object.entries(summary.byDomain)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- **${k}**: ${v}`),
  "",
  "## Method list",
  "",
  "| Method | UrlKey | Controller | Action | Count |",
  "|--------|--------|------------|--------|-------|",
  ...methods.map(
    (m) =>
      `| \`${m.method}\` | ${m.urlKey} | ${m.controller} | ${m.action} | ${m.count} |`,
  ),
];
fs.writeFileSync(
  path.resolve(path.dirname(outJson), "METHODS.md"),
  mdLines.join("\n"),
);

// Generate TS constants by domain
fs.mkdirSync(outMethodsDir, { recursive: true });
const byDomain = {};
for (const m of methods) {
  if (m.dynamic) continue;
  const d = domainFromUrlKey(m.urlKey);
  if (!byDomain[d]) byDomain[d] = [];
  byDomain[d].push(m);
}

const indexExports = [];
for (const [domain, list] of Object.entries(byDomain).sort()) {
  const constName = domain.toUpperCase() + "_METHODS";
  const lines = [
    "// Auto-generated by extract-methods.mjs — do not edit manually",
    `export const ${constName} = {`,
  ];
  const used = new Set();
  for (const m of list) {
    let key = toConstName(m.method);
    if (used.has(key)) key = key + "_" + used.size;
    used.add(key);
    lines.push(`  ${key}: ${JSON.stringify(m.method)},`);
  }
  lines.push("} as const");
  lines.push("");
  lines.push(`export type ${domain.charAt(0).toUpperCase() + domain.slice(1)}Method =`);
  lines.push(`  (typeof ${constName})[keyof typeof ${constName}];`);
  lines.push("");

  const filePath = path.join(outMethodsDir, `${domain}.ts`);
  fs.writeFileSync(filePath, lines.join("\n"));
  indexExports.push(`export * from "./${domain}.js";`);
}

const FLOW_EXPORTS = [
  "auth-flow.js",
  "hotel-flow.js",
  "order-flow.js",
  "member-flow.js",
  "travel-flow.js",
];

fs.writeFileSync(
  path.join(outMethodsDir, "index.ts"),
  [
    "// Auto-generated barrel",
    ...indexExports,
    ...FLOW_EXPORTS.map((f) => `export * from "./${f.replace(".js", "")}.js";`),
    "",
  ].join("\n"),
);

console.log(`Extracted ${methods.length} methods → ${outJson}`);
console.log(`Generated ${Object.keys(byDomain).length} domain files in ${outMethodsDir}`);
