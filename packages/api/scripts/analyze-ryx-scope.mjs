#!/usr/bin/env node
/**
 * Analyze how many Methods ryx actually references vs migration scope.
 * Usage: node packages/api/scripts/analyze-ryx-scope.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../..");
const beeantRoot = path.resolve(monorepoRoot, "../beeantmobile-main");
const methodsJson = JSON.parse(
  fs.readFileSync(path.join(monorepoRoot, "docs/api/METHODS.json"), "utf8"),
);

const methods = methodsJson.methods;

function hasRyx(sources) {
  return sources?.some((s) => s.includes("/ryx/"));
}
function hasJyx(sources) {
  return sources?.some((s) => s.includes("/jyx/"));
}
function hasCore(sources) {
  return sources?.some((s) => s.includes("/core/"));
}

const ryxReferenced = methods.filter((m) => hasRyx(m.sources));
const ryxOnlySources = methods.filter((m) => hasRyx(m.sources) && !hasJyx(m.sources));
const sharedRyxJyx = methods.filter((m) => hasRyx(m.sources) && hasJyx(m.sources));

// ryx app-only static scan (same as diff-jyx-methods)
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
  const map = new Map();
  const dir = path.join(beeantRoot, relDir);
  for (const file of walk(dir)) {
    const rel = file.replace(beeantRoot + path.sep, "").replace(/\\/g, "/");
    const content = fs.readFileSync(file, "utf8");
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(content)) !== null) {
        const method = m[1].trim();
        if (method.length >= 5 && !method.includes("${")) {
          if (!map.has(method)) map.set(method, []);
          map.get(method).push(rel);
        }
      }
    }
  }
  return map;
}

const ryxScan = extractFromTree("projects/ryx/src/app");

// Classify ryx scan by module folder (first path segment under app/)
function moduleOf(sourcePath) {
  const m = sourcePath.match(/projects\/ryx\/src\/app\/([^/]+)/);
  return m ? m[1] : "other";
}

const byModule = new Map();
for (const [method, files] of ryxScan) {
  for (const f of files) {
    const mod = moduleOf(f);
    if (!byModule.has(mod)) byModule.set(mod, new Set());
    byModule.get(mod).add(method);
  }
}

const moduleStats = [...byModule.entries()]
  .map(([mod, set]) => ({ mod, count: set.size }))
  .sort((a, b) => b.count - a.count);

// UrlKey breakdown for ryx-referenced from METHODS.json
const byUrlKey = new Map();
for (const m of ryxReferenced) {
  const k = m.urlKey || "unknown";
  byUrlKey.set(k, (byUrlKey.get(k) || 0) + 1);
}

// "Core TMC" subset: hotel, book, order, flight, train, tmc home - exclude mms, crm, tourist
const TMC_URL_KEYS = new Set([
  "TmcApiHotelUrl",
  "TmcApiBookUrl",
  "TmcApiOrderUrl",
  "TmcApiFlightUrl",
  "TmcApiTrainUrl",
  "TmcApiHomeUrl",
  "TmcApiCarUrl",
  "TmcApiInternationalFlightUrl",
  "TmcApiInternationalHotelUrl",
]);
const AUTH_URL_KEYS = new Set([
  "ApiLoginUrl",
  "ApiHomeUrl",
  "ApiMemberUrl",
  "ApiAccountUrl",
  "ApiPasswordUrl",
]);
const OUT_OF_MAINLINE = /^(CrmApiUrl|MmsApi|TmcTourist|BpmApi|WorkflowApi)/;

const ryxScanMethods = [...ryxScan.keys()];
const ryxScanOutOfMainline = ryxScanMethods.filter((method) => {
  const row = methods.find((m) => m.method === method);
  return row && OUT_OF_MAINLINE.test(row.urlKey || "");
});
const ryxScanCore = ryxScanMethods.filter((method) => {
  const row = methods.find((m) => m.method === method);
  return row && !OUT_OF_MAINLINE.test(row.urlKey || "");
});

// TMC 主 Tab 相关 urlKey（酒店/机票/火车/订单/预订/首页）
const CORE_TMC_URL = /^(TmcApi(Hotel|Book|Order|Flight|Train|Home|Car|International)|Api(Login|Home|Member)Url|HrApiUrl|FeatureRonglvUrl)/;
const ryxScanCoreTmc = ryxScanMethods.filter((method) => {
  const row = methods.find((m) => m.method === method);
  return row && CORE_TMC_URL.test(row.urlKey || "");
});

const ryxMainline = ryxReferenced.filter(
  (m) =>
    TMC_URL_KEYS.has(m.urlKey) ||
    AUTH_URL_KEYS.has(m.urlKey) ||
    m.urlKey === "HrApiUrl" ||
    m.urlKey === "FeatureRonglvUrl",
);
const ryxOutOfMainline = ryxReferenced.filter((m) =>
  OUT_OF_MAINLINE.test(m.urlKey || ""),
);

// count distribution for ryx-referenced
const countBuckets = { "1": 0, "2-5": 0, "6+": 0 };
for (const m of ryxReferenced) {
  const c = m.count || 1;
  if (c === 1) countBuckets["1"]++;
  else if (c <= 5) countBuckets["2-5"]++;
  else countBuckets["6+"]++;
}

// Methods in ryx scan but NOT in METHODS.json (missed by extract)
const inJson = new Set(methods.map((m) => m.method));
const missedByExtract = [...ryxScan.keys()].filter((k) => !inJson.has(k));

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    methodsJsonTotal: methods.length,
    ryxReferencedInJson: ryxReferenced.length,
    ryxOnlyInJson: ryxOnlySources.length,
    sharedRyxJyxInJson: sharedRyxJyx.length,
    /** ryx/src/app 静态扫描去重 — 上界，含 CRM/MMS/BPM/游客态等 */
    ryxAppStaticScan: ryxScan.size,
    /** 354 中按 urlKey 排除 CRM/MMS/BPM/Tourist */
    ryxScanExcludingOutOfMainline: ryxScanCore.length,
    ryxScanOutOfMainlineOnly: ryxScanOutOfMainline.length,
    /** 酒店/机票/火车/订单/登录/会员/出差 等主 Tab 相关 */
    ryxScanCoreTmcTabs: ryxScanCoreTmc.length,
    ryxMainlineEstimate: ryxMainline.length,
    ryxOutOfMainlineEstimate: ryxOutOfMainline.length,
    missedByExtractCount: missedByExtract.length,
  },
  countBuckets,
  moduleStats,
  urlKeyTop: [...byUrlKey.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([urlKey, count]) => ({ urlKey, count })),
  outOfMainlineUrlKeys: [...new Set(ryxOutOfMainline.map((m) => m.urlKey))].sort(),
  missedByExtract: missedByExtract.slice(0, 20),
  migrationGuidance: {
    inventory364: "core+ryx+jyx 全库登记 — 仅 dictionary，非迁移目标",
    ryxStatic354: "ryx/src/app 文本扫描上界 — 整库拷贝自 jyx 共用代码，大量非 /rl/ 主线",
    outOfMainline144: "CRM(18)+MMS(33)+BPM/Workflow(38)+Tourist(55) — 建议 Out of Scope",
    realisticReplaceRl: "ryxScanCoreTmcTabs ≈ 主 Tab TMC+登录会员出差 — 实际迁移预算",
    alreadyWrapped: 25,
  },
};

const md = [
  "# ryx Method 迁移范围分析",
  "",
  `> Generated: ${report.generatedAt}`,
  "",
  "## 结论（354 不等于要迁 354）",
  "",
  "| 层级 | 数量 | 含义 |",
  "|------|------|------|",
  `| 全库 inventory | 364 | core+ryx+jyx 登记 |`,
  `| ryx 静态扫描上界 | ${report.summary.ryxAppStaticScan} | ryx/src/app 出现过的 Method 字符串 |`,
  `| 非主线（CRM/MMS/BPM/游客） | ${report.summary.ryxScanOutOfMainlineOnly} | 建议不纳入 /rl/ 替换 |`,
  `| 去掉非主线后 | ${report.summary.ryxScanExcludingOutOfMainline} | 仍含改密/账户等 |`,
  `| **/rl/ 主 Tab 合理预算** | **${report.summary.ryxScanCoreTmcTabs}** | TMC+登录+会员+出差 |`,
  `| 已封装 | ${report.migrationGuidance.alreadyWrapped} | @ryx/api 当前进度 |`,
  "",
  "重新生成：`pnpm analyze-ryx-scope`",
  "",
  "**逐页迁移**：[PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md) · `pnpm analyze-ryx-pages`",
  "",
  "详见 [task-list.md](./task-list.md)",
].join("\n");

const outDir = path.join(monorepoRoot, "docs/api");
const outPath = path.join(outDir, "METHODS-RYX-SCOPE.json");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(outDir, "METHODS-RYX-SCOPE.md"), md);

console.log(JSON.stringify(report.summary, null, 2));
console.log("\nTop ryx modules by unique Method:");
for (const { mod, count } of moduleStats.slice(0, 12)) {
  console.log(`  ${mod.padEnd(28)} ${count}`);
}
console.log("\nCount buckets (ryx-referenced in METHODS.json):", countBuckets);
console.log(`\nWrote ${outPath}`);
