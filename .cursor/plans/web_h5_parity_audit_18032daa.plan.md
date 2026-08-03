---
name: Web H5 Parity Audit
overview: Pad/PC `apps/web` 已与 `apps/h5` 在核心业务域（预订、订单、账户、出差、公告）实现约 95%+ 路由与行为对齐；剩余差异主要为平台策略性取舍、双方共同 stub 的能力，以及少量深链/入口/UI 抛光项。`.cursor/plans/web_h5_gap_roadmap` 文档状态落后于代码。
todos:
  - id: sync-roadmap-docs
    content: Update web_h5_gap_roadmap + bundle plan YAML todos to reflect completed implementation
    status: pending
  - id: parity-trips-redirect
    content: "Optional: add /trips → /orders?scope=pendingTravel redirect for legacy deep links"
    status: pending
  - id: parity-account-deletion-entry
    content: Implement account deletion entry on both H5 and Web AccountSecurityPage (route exists on both, entry row pending per account_deletion_feature plan)
    status: pending
  - id: commit-banner-fix
    content: Commit uncommitted WebBannerCarousel / useHomeBanners fixes if not yet committed
    status: pending
  - id: manual-pad-qa
    content: Run Pad/PC smoke checklist at 768px and 1440px against docs/需求实施/pad-pc mockups
    status: pending
  - id: optional-workbench
    content: "Optional P2: home 近期出行 workbench section (neither H5 nor Web ships it today)"
    status: pending
isProject: false
---

# Web vs H5 功能对齐审计

## 结论摘要

**当前状态：已基本 1:1 对齐（在 Pad/PC 产品范围内）。**

[`apps/web/src/app/routes.tsx`](apps/web/src/app/routes.tsx) 现已注册 **45+ 条**用户路由，覆盖 H5 全部核心业务流。旧版 [`web_h5_gap_roadmap_bfb8aee6.plan.md`](.cursor/plans/web_h5_gap_roadmap_bfb8aee6.plan.md) 中「Web 仅 10 条路由 / 预订全缺 / 我的占位」等描述**已过时**；三个 bundle 计划（[`web_booking_bundle`](.cursor/plans/web_booking_bundle.plan.md)、[`web_account_bundle`](.cursor/plans/web_account_bundle.plan.md)、[`web_travel_bundle`](.cursor/plans/web_travel_bundle.plan.md)）在代码层面已基本落地，仅 plan YAML 的 `pending` 状态未同步。

```mermaid
flowchart TB
  subgraph aligned [Aligned with H5]
    home[Home search banners notice business]
    book[Flight Train Hotel booking chains]
    orders[Orders list detail pay]
    account[Profile settings credentials bank cards]
    travel[Travel apply approval task open-url]
    content[Notice contact passenger]
  end
  subgraph intentional [Intentional differences]
    splash[Splash screen]
    mobileLogin[Mobile device login]
    narrowNav[No nav below 768px]
    car[Car product]
  end
  subgraph minor [Minor gaps]
    tripsAlias[/trips legacy redirect]
    acctDelEntry[Account deletion UI entry]
    resultUI[Result page UI polish]
    workbench[Recent trips workbench]
  end
  subgraph sharedStub [Shared stubs same as H5]
    inspur[Inspur repush]
    flightExchange[Flight exchange]
  end
```

---

## 路由级 1:1 对照

### 已对齐（行为等价）

| 域            | H5 路由                  | Web 路由             | 备注                                    |
| ------------- | ------------------------ | -------------------- | --------------------------------------- |
| 登录          | `/login/password`        | 同                   | 均无短信/设备登录页                     |
| 首页          | `/home`                  | `/`                  | 路径不同，功能等价                      |
| 订单 Tab      | `/home/orders`           | `/orders`            | Web 侧栏导航                            |
| 我的 Tab      | `/home/mine`             | `/mine`              | Web 为 Pad 网格布局                     |
| 机票预订      | `/flight/*`（7 条）      | 同                   | `pay` 重定向到 `/orders/flight/:id/pay` |
| 火车预订      | `/train/*`（4 条）       | 同                   | 双方均无 `result` 页                    |
| 酒店预订      | `/hotel/*`（10 条）      | 同                   |                                         |
| 订单详情/支付 | `/orders/{product}/:id`  | 同 + `/orders/*/pay` | Web 统一支付路由                        |
| 乘机人        | `/passenger/*`           | 同                   |                                         |
| 证件          | `/credentials`           | 同                   |                                         |
| 银行卡        | `/bank-cards/*`          | 同                   |                                         |
| 个人中心      | `/profile/center`        | 同                   |                                         |
| 设置          | `/settings/*`（7 页）    | 同                   |                                         |
| 公告/联系     | `/notice/*`, `/contact`  | 同                   |                                         |
| 出差          | `/travel/*`, `/open-url` | 同                   |                                         |
| 404           | —                        | `*` → `NotFoundPage` | Web 已补全                              |
| Legacy 深链   | `legacy-route-registry`  | 同（24 组别名）      | 路径映射已适配 Web（`/home`→`/`）       |

### 有差异但可接受

| 项         | H5                        | Web                                                                            | 建议                                  |
| ---------- | ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| 冷启动     | `/` Splash                | 直达 `/` 或登录                                                                | Pad/PC 不需要 Splash                  |
| 待出行深链 | `/trips` → `/home/orders` | 无 `/trips` 路由；legacy `tab-tmc-trip_ryx` 直达 `/orders?scope=pendingTravel` | 可选补 `/trips` redirect 以兼容旧链接 |
| 窄屏导航   | 底部 3 Tab                | 侧栏隐藏 + H5 提示条 [`WebShell`](apps/web/src/components/WebShell.tsx)        | 产品策略：窄屏引导用 H5               |
| 支付 URL   | `/flight/pay/:id` 等      | `/orders/*/pay`（booking pay 路由做 redirect）                                 | 已等价                                |

### 双方均未实现（非 Web 遗漏）

| 项                   | 说明                                                                            |
| -------------------- | ------------------------------------------------------------------------------- |
| 用车 (Car)           | 图标/类型存在，无搜索/预订/详情路由（H5 订单列表引用 `/orders/car/:id` 会 404） |
| 近期出行 / Workbench | H5 有 `HomeRecentTripPanel`（mock，未挂载）、`TravelExternalPage`（无路由）     |
| 重推浪潮             | 订单详情按钮双方均为 toast「即将上线」                                          |
| 机票改签             | 订单列表双方均为 stub（H5 文案更明确）                                          |

---

## 功能域细项核对

### 首页 — 对齐

- 因公/因私切换、三产品搜索、轮播图 + `coreJump`：已实现
- 公告条 → `/notice`：[`WebHomeNoticeStrip`](apps/web/src/components/home/WebHomeNoticeStrip.tsx) + API
- 因公业务入口（出差申请/我的申请/待我审批/已审任务）：[`WebBusinessPanel`](apps/web/src/components/home/WebBusinessPanel.tsx) 已 `navigate`
- 搜索提交 → `/flight|train|hotel/list`：已打通
- **近期出行区块**：双方均未上线（可选 P2）

### 预订（机票/火车/酒店）— 对齐

Bundle A 计划 todos 标记 `completed`，代码与 H5 hooks/lib 同源模式：

- 列表 / 筛选 / 政策 / 超时（机票）
- 舱位 / 车次 / 酒店详情·房型·图库
- 填写订单 / 乘机人 / 审批 / 保险（机票）/ 担保（酒店）
- 火车改签 `?exchange=1` 流程：[`train-exchange-session.ts`](apps/web/src/lib/train-exchange-session.ts)
- 结果页：路由存在，UI 为简化 Card（**视觉未完全对齐 H5**，功能可用）

### 订单 — 对齐

[`web_orders_migration`](.cursor/plans/web_orders_migration_377e4e0e.plan.md) 已完成：

- 渠道 × 产品 × 范围（全部/待出行）
- 列表内取消/退票/改签（火车）/支付
- 详情页出票/废除/退票/改签等与 H5 同逻辑
- 支付统一 [`WebOrderPayPage`](apps/web/src/pages/order/WebOrderPayPage.tsx)

### 账户（我的/设置/公告/银行卡）— 基本对齐

Bundle B 已落地：

- [`WebProfilePage`](apps/web/src/pages/profile/WebProfilePage.tsx) — Pad 设计稿布局（非 H5 菜单列表，**入口等价**）
- 设置 7 页、证件、银行卡、联系、公告：路由齐全

**双方均未实现（非 Web 遗漏）：**

- 「注销账号」入口：[`AccountSecurityPage`](apps/h5/src/pages/settings/AccountSecurityPage.tsx) 与 Web 版本代码完全相同，**双方均无**该入口行
- 路由 `/settings/account-deletion` 双方均已注册；[`account_deletion_feature`](.cursor/plans/account_deletion_feature_00b59b9a.plan.md) 仍为 pending
- 待该计划实施时，双方 AccountSecurityPage 应同步添加入口

### 出差审批 — 对齐

Bundle C 已落地：

- `/travel/apply`, `/travel/approval`, `/travel/task`, `/open-url`
- 首页业务面板已串联

### 认证 — 部分对齐（双方相同）

- 密码登录：双方均有
- 短信登录 / 设备登录：H5 有 hooks（[`useAuth.ts`](apps/h5/src/hooks/useAuth.ts)），**无独立页面**；Web 未复制 hooks
- Pad/PC 通常不需要，可保持现状

---

## 与 H5 不对齐的 Web 独有项（非遗漏）

- [`RequireAuth`](apps/web/src/app/layouts/RequireAuth.tsx) 路由级鉴权
- 侧栏导航（Pad 88px / PC 224px）
- 轮播图 loop 修复（本会话已改，可能未提交）：[`WebBannerCarousel.tsx`](apps/web/src/components/home/WebBannerCarousel.tsx)

---

## 建议后续行动（按优先级）

### P0 — 文档与状态同步（无功能开发）

1. 更新 [`web_h5_gap_roadmap_bfb8aee6.plan.md`](.cursor/plans/web_h5_gap_roadmap_bfb8aee6.plan.md) 顶部状态表与 todos（booking/account/travel → completed）
2. 同步三个 bundle plan 的 YAML todo 状态

### P1 — 小缺口（若要求严格 1:1）

1. **注销账号入口**：双方 `AccountSecurityPage` 均缺入口（路由已注册）；实施 `account_deletion_feature` 时双方同步加入
2. **Legacy `/trips` redirect**：在 [`routes.tsx`](apps/web/src/app/routes.tsx) 增加 `{ path: "trips", element: <Navigate to="/orders?scope=pendingTravel" /> }`
3. **提交轮播图修复**（若尚未 commit）

### P2 — 可选增强（H5 也未完成）

1. 首页「近期出行」workbench 区块（[`web_travel_bundle`](.cursor/plans/web_travel_bundle.plan.md) `home-workbench-optional`）
2. 重推浪潮、机票改签（需 API/产品确认，双方同为 stub）
3. 用车产品线（双方均 out of scope）

### P3 — 质量验收（推荐手工清单）

在 **768px / 1440px** 对照 `docs/需求实施/pad-pc/` mockups 走通：

- 首页搜索 → 三产品列表 → 预订 → 支付 → 订单详情
- 订单列表：取消/退票/火车改签
- 我的 → 证件/银行卡/设置/注销流程
- 因公：业务面板 → 出差申请/审批 → iframe 任务
- 公告条 → 公告列表/详情
- Banner `coreJump` 深链抽样

---

## 最终判定

| 维度         | 对齐度   | 说明                                               |
| ------------ | -------- | -------------------------------------------------- |
| 路由覆盖     | **~98%** | 缺 Splash、`/trips` 别名；路径命名 `/home` vs `/`  |
| 核心业务行为 | **~95%** | 预订/订单/账户/出差/公告与 H5 同源逻辑             |
| UI 1:1       | **~85%** | Pad mockup 驱动，非 H5 像素复刻；结果页/设置页较简 |
| 平台特性     | **N/A**  | 侧栏、窄屏 H5 引导为 Web 设计，不算遗漏            |

**没有大块 H5 功能尚未迁移到 Web。** 剩余工作主要是：文档同步、1–2 个小入口/深链、可选 workbench、以及 Pad mockup 视觉验收——而非新一轮大规模迁移。
