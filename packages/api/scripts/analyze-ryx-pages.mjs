#!/usr/bin/env node
/**
 * Build page → API matrix for ryx H5 migration (mainline /rl/ only).
 * Usage: node packages/api/scripts/analyze-ryx-pages.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../..");
const beeantRoot = path.resolve(monorepoRoot, "../beeantmobile-main");
const ryxApp = path.join(beeantRoot, "projects/ryx/src/app");

const METHOD_PATTERNS = [
  /req\.Method\s*=\s*`([^`$]+)`/g,
  /req\.Method\s*=\s*['"]([^'"]+)['"]/g,
  /\.send\s*\(\s*['"]([^'"]+)['"]/g,
];

/** Curated mainline pages — migration order (wave). Methods auto-scanned from sourceDirs. */
const MIGRATION_PAGES = [
  {
    wave: 1,
    id: "login-phone",
    name: "手机登录",
    oldRoute: "login",
    newRoute: "/login",
    entry: "未登录入口",
    sourceDirs: ["login"],
    h5: "partial",
    h5Note: "PhoneLoginPage",
  },
  {
    wave: 1,
    id: "login-password",
    name: "密码登录",
    oldRoute: "login/password",
    newRoute: "/login/password",
    entry: "登录页切换",
    sourceDirs: ["login", "password"],
    h5: "partial",
    h5Note: "PasswordLoginPage；缺 identity 续票",
  },
  {
    wave: 2,
    id: "tab-shell",
    name: "底部 Tab 壳",
    oldRoute: "tabs (isTmcHome)",
    newRoute: "/home",
    entry: "登录后",
    sourceDirs: ["tabs"],
    h5: "none",
    h5Note: "无 TabLayout",
  },
  {
    wave: 2,
    id: "home",
    name: "首页工作台",
    oldRoute: "tab-tmc-home_ryx",
    newRoute: "/home",
    entry: "Tab 首页",
    sourceDirs: ["tabs/tab-tmc-home_ryx", "tmc/tmc-home"],
    h5: "none",
    h5Note: "HomePage 占位，无工作台 API",
  },
  {
    wave: 2,
    id: "trip-tab",
    name: "待出行 Tab",
    oldRoute: "tab-tmc-trip_ryx",
    newRoute: "/trips",
    entry: "Tab 待出行",
    sourceDirs: ["tabs/tab-tmc-trip_ryx", "tmc/tmc-order"],
    h5: "none",
  },
  {
    wave: 2,
    id: "my-tab",
    name: "我的 Tab",
    oldRoute: "tab-tmc-my_ryx",
    newRoute: "/me",
    entry: "Tab 我的",
    sourceDirs: ["tabs/tab-tmc-my_ryx", "member"],
    h5: "none",
  },
  {
    wave: 3,
    id: "hotel-search",
    name: "酒店搜索",
    oldRoute: "tmc-hotel-search_ryx",
    newRoute: "/hotel",
    entry: "首页 → 酒店",
    sourceDirs: [
      "tmc/tmc-hotel/tmc-hotel-search_ryx",
      "tmc/tmc-hotel/tmc-hotel-searchtext_ryx",
    ],
    h5: "partial",
    h5Note: "缺城市/日期搜索 UI",
  },
  {
    wave: 3,
    id: "hotel-list",
    name: "酒店列表",
    oldRoute: "tmc-hotel-list_ryx",
    newRoute: "/hotel",
    entry: "搜索 → 列表",
    sourceDirs: ["tmc/tmc-hotel/tmc-hotel-list_ryx", "tmc/tmc-hotel/tmc-hotel-list"],
    h5: "done",
    h5Note: "HotelListPage",
  },
  {
    wave: 3,
    id: "hotel-detail",
    name: "酒店详情",
    oldRoute: "tmc-hotel-detail_ryx",
    newRoute: "/hotel/:hotelId",
    entry: "列表 → 详情",
    sourceDirs: ["tmc/tmc-hotel/tmc-hotel-detail_ryx"],
    h5: "done",
    h5Note: "HotelDetailPage",
  },
  {
    wave: 3,
    id: "hotel-book",
    name: "酒店填单",
    oldRoute: "tmc-hotel-book_ryx",
    newRoute: "/hotel/:hotelId/book",
    entry: "详情 → 预订",
    sourceDirs: ["tmc/tmc-hotel/tmc-hotel-book_ryx", "tmc/tmc-select-passenger_ryx"],
    h5: "done",
    h5Note: "HotelBookPage + 选出差单",
  },
  {
    wave: 3,
    id: "hotel-result",
    name: "酒店下单结果",
    oldRoute: "tmc-checkout-success",
    newRoute: "/hotel/result/:orderId",
    entry: "填单提交后",
    sourceDirs: ["tmc/tmc-checkout-success", "tmc/tmc-order"],
    h5: "done",
    h5Note: "HotelResultPage 轮询 order.getDetail",
  },
  {
    wave: 3,
    id: "hotel-pay",
    name: "酒店支付",
    oldRoute: "（订单支付子页）",
    newRoute: "/hotel/pay/:orderId",
    entry: "结果页 → 支付",
    sourceDirs: ["tmc/tmc-order"],
    h5: "done",
    h5Note: "HotelPayPage",
  },
  {
    wave: 4,
    id: "order-list",
    name: "订单列表",
    oldRoute: "tmc-order-list_ryx",
    newRoute: "/orders",
    entry: "我的 → 我的订单",
    sourceDirs: ["tmc/tmc-order/tmc-order-list_ryx", "tmc/tmc-order/tmc-product-list"],
    h5: "none",
    h5Note: "API/Mock 已有，无页面",
  },
  {
    wave: 4,
    id: "order-hotel-detail",
    name: "酒店订单详情",
    oldRoute: "tmc-order-hotel-detail_ryx",
    newRoute: "/orders/hotel/:orderId",
    entry: "订单列表 → 酒店单",
    sourceDirs: ["tmc/tmc-order/tmc-order-hotel-detail"],
    h5: "none",
  },
  {
    wave: 4,
    id: "order-flight-detail",
    name: "机票订单详情",
    oldRoute: "tmc-order-flight-detail_ryx",
    newRoute: "/orders/flight/:orderId",
    entry: "订单列表 → 机票单",
    sourceDirs: ["tmc/tmc-order/tmc-order-flight-detail"],
    h5: "none",
  },
  {
    wave: 4,
    id: "order-train-detail",
    name: "火车订单详情",
    oldRoute: "tmc-order-train-detail_ryx",
    newRoute: "/orders/train/:orderId",
    entry: "订单列表 → 火车单",
    sourceDirs: ["tmc/tmc-order/tmc-order-train-detail"],
    h5: "none",
  },
  {
    wave: 5,
    id: "flight-search",
    name: "机票搜索",
    oldRoute: "tmc-flight-search_ryx",
    newRoute: "/flight",
    entry: "首页 → 机票",
    sourceDirs: ["tmc/tmc-flight"],
    h5: "none",
  },
  {
    wave: 5,
    id: "flight-list",
    name: "机票列表",
    oldRoute: "tmc-flight-list_ryx",
    newRoute: "/flight/list",
    entry: "搜索 → 列表",
    sourceDirs: ["tmc/tmc-flight"],
    h5: "none",
  },
  {
    wave: 5,
    id: "flight-book",
    name: "机票填单",
    oldRoute: "tmc-flight-book_ryx",
    newRoute: "/flight/book",
    entry: "列表 → 预订",
    sourceDirs: ["tmc/tmc-flight"],
    h5: "none",
  },
  {
    wave: 6,
    id: "train-search",
    name: "火车搜索",
    oldRoute: "tmc-train-search_ryx",
    newRoute: "/train",
    entry: "首页 → 火车",
    sourceDirs: ["tmc/tmc-train"],
    h5: "none",
  },
  {
    wave: 6,
    id: "train-list",
    name: "火车车次",
    oldRoute: "tmc-train-list_ryx",
    newRoute: "/train/list",
    entry: "搜索 → 车次",
    sourceDirs: ["tmc/tmc-train"],
    h5: "none",
  },
  {
    wave: 6,
    id: "train-book",
    name: "火车填单",
    oldRoute: "tmc-train-book_ryx",
    newRoute: "/train/book",
    entry: "车次 → 预订",
    sourceDirs: ["tmc/tmc-train"],
    h5: "none",
  },
  {
    wave: 7,
    id: "travel-apply",
    name: "出差申请",
    oldRoute: "goBusiness / business-list",
    newRoute: "/travel/apply",
    entry: "首页工作台（源码入口隐藏）",
    sourceDirs: ["bpm", "workflow", "hr"],
    h5: "none",
    h5Note: "提交 API 待抓包",
    captureRequired: true,
  },
  {
    wave: 7,
    id: "travel-select",
    name: "选择出差单",
    oldRoute: "GetTravelUrl",
    newRoute: "预订页内嵌",
    entry: "机/酒/火填单",
    sourceDirs: ["tmc/tmc-hotel/tmc-hotel-book_ryx"],
    h5: "done",
    h5Note: "HotelBookPage 已接",
  },
  {
    wave: 7,
    id: "select-passenger",
    name: "选择常旅客",
    oldRoute: "tmc-select-passenger_ryx",
    newRoute: "预订子流程",
    entry: "填单页",
    sourceDirs: ["tmc/tmc-select-passenger_ryx", "member/member-passenger"],
    h5: "partial",
    h5Note: "酒店填单内嵌列表，无独立页",
  },
  {
    wave: 8,
    id: "account-setting",
    name: "账户设置",
    oldRoute: "account-setting_ryx",
    newRoute: "/me/settings",
    entry: "我的 → 设置",
    sourceDirs: ["account/account-setting_ryx"],
    h5: "none",
  },
  {
    wave: 8,
    id: "account-security",
    name: "账户安全",
    oldRoute: "account-security_ryx",
    newRoute: "/me/security",
    entry: "设置 → 安全",
    sourceDirs: ["account/account-security_ryx", "password"],
    h5: "none",
  },
  {
    wave: 8,
    id: "member-credential",
    name: "证件管理",
    oldRoute: "member-credential-list",
    newRoute: "/me/credentials",
    entry: "我的 → 证件",
    sourceDirs: ["member/member-credential-list", "member/member-credential-management"],
    h5: "none",
  },
  {
    wave: 8,
    id: "approval-task",
    name: "我的审批",
    oldRoute: "tmc-approval-task",
    newRoute: "/me/approvals",
    entry: "首页工作台",
    sourceDirs: ["tmc/tmc-approval-task"],
    h5: "none",
    optional: true,
  },
];

/** @ryx/api wrapped Methods (from *-flow.ts) */
const WRAPPED_METHODS = new Set([
  "ApiLoginUrl-Home-Login",
  "ApiLoginUrl-Home-MobileLogin",
  "ApiLoginUrl-Home-DeviceLogin",
  "ApiLoginUrl-Home-Logout",
  "ApiHomeUrl-Identity-Get",
  "ApiHomeUrl-Identity-Check",
  "ApiHomeUrl-Identity-GetWebSocketUrl",
  "TmcApiHotelUrl-Home-List",
  "TmcApiHotelUrl-Home-Detail",
  "TmcApiHotelUrl-Home-Policy",
  "TmcApiBookUrl-Hotel-Initialize",
  "TmcApiBookUrl-Hotel-Book",
  "TmcApiBookUrl-Home-GetTravelUrl",
  "TmcApiOrderUrl-Order-List",
  "TmcApiOrderUrl-Order-Detail",
  "TmcApiOrderUrl-Order-CancelOrderHotel",
  "TmcApiOrderUrl-Order-GetOrderPays",
  "TmcApiOrderUrl-Pay-Create",
  "TmcApiOrderUrl-Pay-Process",
  "ApiMemberUrl-Member-Get",
  "ApiMemberUrl-Passenger-List",
  "ApiMemberUrl-Passenger-Add",
  "HrApiUrl-Staff-Get",
  "FeatureRonglvUrl-jyx-GetTravelForms",
]);

const MOCK_METHODS = new Set([
  ...WRAPPED_METHODS,
  "TmcApiHomeUrl-Resource-DomesticHotelCity",
]);

const OUT_OF_MAINLINE_URL = /^(CrmApiUrl|MmsApi|TmcTourist|BpmApiSales)/;

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

function extractMethodsFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const found = new Set();
  for (const re of METHOD_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const method = m[1].trim();
      if (method.length >= 5 && !method.includes("${")) found.add(method);
    }
  }
  return found;
}

function scanDirs(relDirs) {
  const methods = new Set();
  const files = [];
  for (const rel of relDirs) {
    const dir = path.join(ryxApp, rel);
    if (!fs.existsSync(dir)) continue;
    for (const f of walk(dir)) {
      files.push(f.replace(beeantRoot + path.sep, "").replace(/\\/g, "/"));
      for (const m of extractMethodsFromFile(f)) methods.add(m);
    }
  }
  // Also scan module-level services for tmc paths
  for (const rel of relDirs) {
    if (!rel.startsWith("tmc/")) continue;
    const mod = rel.split("/")[1];
    const svcDir = path.join(ryxApp, "tmc", mod);
    if (fs.existsSync(svcDir)) {
      for (const f of walk(svcDir)) {
        if (!f.endsWith(".service.ts")) continue;
        files.push(f.replace(beeantRoot + path.sep, "").replace(/\\/g, "/"));
        for (const m of extractMethodsFromFile(f)) methods.add(m);
      }
    }
  }
  return { methods: [...methods].sort(), files: [...new Set(files)].sort() };
}

function loadMethodsJson() {
  const p = path.join(monorepoRoot, "docs/api/METHODS.json");
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  const map = new Map(data.methods.map((m) => [m.method, m]));
  return map;
}

function methodStatus(method, methodsMap) {
  const row = methodsMap.get(method);
  const urlKey = row?.urlKey ?? "unknown";
  const scope =
    OUT_OF_MAINLINE_URL.test(urlKey) || /TmcTourist/.test(method)
      ? "out"
      : "mainline";
  return {
    method,
    urlKey,
    scope,
    api: WRAPPED_METHODS.has(method) ? "yes" : "no",
    mock: MOCK_METHODS.has(method) ? "yes" : "no",
  };
}

function h5Icon(status) {
  if (status === "done") return "[x]";
  if (status === "partial") return "[~]";
  if (status === "none") return "[ ]";
  if (status === "skip") return "[-]";
  return "[ ]";
}

function summarizePage(page, methodsMap) {
  const { methods } = scanDirs(page.sourceDirs);
  const methodRows = methods.map((m) => methodStatus(m, methodsMap));
  const mainline = methodRows.filter((r) => r.scope === "mainline");
  const apiDone = mainline.filter((r) => r.api === "yes").length;
  const mockDone = mainline.filter((r) => r.mock === "yes").length;
  return {
    ...page,
    methods: methodRows,
    methodCount: methods.length,
    mainlineMethodCount: mainline.length,
    apiProgress: mainline.length
      ? `${apiDone}/${mainline.length}`
      : "0/0",
    mockProgress: mainline.length
      ? `${mockDone}/${mainline.length}`
      : "0/0",
  };
}

const methodsMap = loadMethodsJson();
const pages = MIGRATION_PAGES.map((p) => summarizePage(p, methodsMap));

const stats = {
  totalPages: pages.length,
  h5Done: pages.filter((p) => p.h5 === "done").length,
  h5Partial: pages.filter((p) => p.h5 === "partial").length,
  h5None: pages.filter((p) => p.h5 === "none").length,
  captureRequired: pages.filter((p) => p.captureRequired).length,
  uniqueMethods: new Set(pages.flatMap((p) => p.methods.map((m) => m.method)))
    .size,
  uniqueMainlineMethods: new Set(
    pages.flatMap((p) =>
      p.methods.filter((m) => m.scope === "mainline").map((m) => m.method),
    ),
  ).size,
};

const waves = [...new Set(pages.map((p) => p.wave))].sort((a, b) => a - b);

function pageRow(p) {
  const pri = p.wave <= 3 ? "P0" : p.wave <= 6 ? "P1" : "P2";
  return `| ${p.wave} | ${p.name} | \`${p.oldRoute}\` | \`${p.newRoute}\` | ${p.mainlineMethodCount} | ${p.apiProgress} | ${p.mockProgress} | ${h5Icon(p.h5)} | ${p.h5Note ?? ""} |`;
}

const md = [
  "# ryx H5 页面 → 接口矩阵",
  "",
  `> Generated: ${new Date().toISOString()}`,
  "> **用法**：逐页迁移时只处理本页 `methods`；全库 [METHODS.json](./METHODS.json) 仅备查。",
  "> **重新生成**：`pnpm analyze-ryx-pages`",
  "",
  "## 1. 工作方式",
  "",
  "```",
  "冻结 /rl/ 主线 → 按 Wave 选页 → 静态扫描 + 必要时抓包 → 封装 API/Mock → 迁 H5",
  "```",
  "",
  "| 文档 | 角色 |",
  "|------|------|",
  "| **本文** | 页面 → Method 操作手册（迁移顺序） |",
  "| [task-list.md](./task-list.md) | 总看板：阶段 + 域级 Method 状态 |",
  "| [METHODS.json](./METHODS.json) | 364 条字典 |",
  "| [METHODS-RYX-SCOPE.md](./METHODS-RYX-SCOPE.md) | 354 扫描 vs 非主线范围 |",
  "",
  "## 2. 进度快照",
  "",
  "| 指标 | 值 |",
  "|------|-----|",
  `| 主线页面（矩阵内） | ${stats.totalPages} |`,
  `| H5 已完成 | ${stats.h5Done} |`,
  `| H5 部分 | ${stats.h5Partial} |`,
  `| H5 未开始 | ${stats.h5None} |`,
  `| 需抓包页面 | ${stats.captureRequired} |`,
  `| 矩阵内去重 Method | ${stats.uniqueMethods}（主线 ${stats.uniqueMainlineMethods}） |`,
  "",
  "**页面迁移进度**（按 H5 列）：",
  "",
  `\`${stats.h5Done} done + ${stats.h5Partial} partial\` / ${stats.totalPages} ≈ **${Math.round(((stats.h5Done + stats.h5Partial * 0.5) / stats.totalPages) * 100)}%**`,
  "",
  "## 3. 迁移顺序（Wave）",
  "",
  "| Wave | 主题 | 页面数 |",
  "|------|------|--------|",
  ...waves.map((w) => {
    const group = pages.filter((p) => p.wave === w);
    const theme =
      {
        1: "登录与会话",
        2: "Tab 壳 + 首页/待出行/我的",
        3: "酒店预订链",
        4: "订单列表 + 详情",
        5: "机票链",
        6: "火车链",
        7: "出差 + 常旅客",
        8: "账户/审批 P2",
      }[w] ?? "";
    return `| ${w} | ${theme} | ${group.length} |`;
  }),
  "",
  "## 4. 页面总表",
  "",
  "| Wave | 页面 | 旧路由 | 新路由 | 主线 Method | API | Mock | H5 | 备注 |",
  "|------|------|--------|--------|-------------|-----|------|----|------|",
  ...pages.map(pageRow),
  "",
  "## 5. 各页 Method 明细",
  "",
  ...pages.flatMap((p) => [
    `### Wave ${p.wave} · ${p.name}`,
    "",
    `- **旧路由**：\`${p.oldRoute}\` → **新路由**：\`${p.newRoute}\``,
    `- **入口**：${p.entry}`,
    `- **扫描目录**：${p.sourceDirs.map((d) => `\`${d}\``).join(", ")}`,
    p.captureRequired ? "- ⚠️ **需 `/rl/` 抓包补全提交 API**" : "",
    "",
    "| Method | urlKey | API | Mock | 范围 |",
    "|--------|--------|-----|------|------|",
    ...(p.methods.length
      ? p.methods.map(
          (m) =>
            `| \`${m.method}\` | ${m.urlKey} | ${m.api} | ${m.mock} | ${m.scope} |`,
        )
      : ["| （静态扫描未命中，需抓包或联调） | | | | |"]),
    "",
  ]),
  "",
  "## 6. Out of Scope（矩阵外）",
  "",
  "以下在 ryx 源码中存在，**默认不纳入** `/rl/` 企业主线，除非实测有入口：",
  "",
  "- `public/*` 游客/会展 · `mms/*` 商城 · `crm/*`",
  "- `tmc-international-*` 国际机酒 · `tmc-car` / 租车",
  "- BPM 销售/日记/报价全套",
  "",
].join("\n");

const outDir = path.join(monorepoRoot, "docs/api");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "PAGE-API-MATRIX.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), stats, pages }, null, 2),
);
fs.writeFileSync(path.join(outDir, "PAGE-API-MATRIX.md"), md);

console.log("Page matrix stats:", stats);
console.log(`Wrote docs/api/PAGE-API-MATRIX.md (${pages.length} pages)`);
