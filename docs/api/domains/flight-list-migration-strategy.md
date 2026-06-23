# 机票列表页迁移策略（`tmc-flight-list_ryx` → `/flight/list`）

> **Legacy 路由**：`http://app.rtesp.com/rl/#/tmc-flight-list_ryx`  
> **新 H5 路由**：`/flight/list?date&fromCode&toCode&fromAsAirport&toAsAirport&...`  
> **业务域总览**：[机票模块.md](../../ryx/机票模块.md)  
> **页面矩阵**：[PAGE-API-MATRIX.md](../PAGE-API-MATRIX.md) Wave 5  
> **Legacy 原则**：仅对照行为与 API，不照搬 Angular/Ionic 实现（见 `.cursor/rules/legacy-ryx-reference.mdc`）

---

## 1. 目标

在 H5 中交付与 Legacy `tmc-flight-list_ryx` **业务行为对齐**的航班列表页，并打通选航班 → 舱位页入口。

**不是从零开始**：`FlightListPage`、`searchFlights(Home-Index)`、客户端筛选/排序工具已存在；本策略聚焦 **Gap 补齐 + Proxy 真 API 优先 + Mock 最后对齐**。

---

## 2. 现状对照

| 维度 | Legacy | 新 H5 现状 |
|------|--------|------------|
| 路由 | `#/tmc-flight-list_ryx` | `/flight/list` |
| 列表 API | `TmcApiFlightUrl-Home-Index` v2.0，Timeout 60s | ✅ `packages/api` `searchFlights()` |
| 页面逻辑 | `tmc-flight-list_ryx.base.page.ts` | ✅ `FlightListPage.tsx`（部分） |
| 客户端筛选/排序 | `FilterConditionModel` + `fly-filter` | ✅ `utils/flight-list.ts` |
| 出行人 | `bookInfos` + 选乘客弹层 | ⚠️ `/passenger/select` 链接，未联动 refetch |
| 选航班 → 舱位 | → `tmc-flight-item-cabins_ryx` | ⚠️ `FlightCabinsPage` 占位 |
| 改签 | `isExchange` + `Home-Exchange` | ❌ |
| 往返 | 去程/回程 + `FlightJourneyEntity` | ❌ |
| 10 分钟超时弹窗 | `pagePopTimeout` | ❌ |

矩阵当前标注：**部分，筛选简化**（见 [机票模块.md §6](../../ryx/机票模块.md#6-与新-monorepo-对照)）。

---

## 3. 工作方式（Proxy 优先，Mock 最后）

与出行人模块一致：**先对齐 Legacy 真 API（`VITE_API_MODE=proxy`），Mock 作为最后一环补齐**，避免 Mock 先行导致字段/行为与线上一致性偏差。

```
Legacy 行为对照 → Gap 清单 → API 封装/校对（Proxy）
  → H5 页面增量 → Proxy 验收 → Mock 对齐 → 更新矩阵
```

| 阶段 | 环境 | 目的 |
|------|------|------|
| 开发 / 联调 | `proxy` | 以 Legacy Network / curl 为金标准 |
| 本地无登录快速浏览 | `mock` | **最后**按 Proxy 实测响应补 handler |
| CI | `mock` | 依赖最后一轮 Mock 对齐后的稳定 fixture |

**验收顺序**：

1. `pnpm dev:h5` + `VITE_API_MODE=proxy`：同条件与 Legacy 列表可比
2. `pnpm dev:h5:mock`：离线可复现相同 UI 状态（Mock 完成后）

---

## 4. 职责拆分（避免一次吞掉列表页全部复杂度）

Legacy 列表页实际承担多块职责，分阶段交付：

```mermaid
flowchart LR
  A[搜索条件入参] --> B[拉列表 Home-Index]
  B --> C[客户端筛选排序]
  C --> D[选航班]
  D --> E[舱位页 Home-Detail]

  subgraph 列表页 scope
    A
    B
    C
    D
  end

  subgraph 下一页
    E
  end
```

### Phase A — 列表页可独立验收（当前迭代）

- [x] 刷新策略：2min stale、出行人变化 refetch、`doRefresh` query
- [x] 10 分钟超时弹窗（Legacy `pagePopTimeout`）
- [x] 空态文案对齐 Legacy `getNoMoreDataDesc`
- [x] 选航班跳转 cabins 携带 `flightNumber` / 机场 / `detailKey`
- [ ] Proxy 真环境验收（需登录态手动验证）

### Phase B — 舱位页（列表下游）

- [x] 封装 / 校对 `Home-Detail`（Proxy 先通）
- [x] 实现 `FlightCabinsPage`（舱位列表 + 摘要 + 退改签）
- [ ] Policy 完整色标 / 过滤差标（填单链依赖部分可后置，见填单策略）

> Phase B 详情与验收见已完成提交；**填单 Phase C** 见 [flight-book-migration-strategy.md](./flight-book-migration-strategy.md)。

### Phase C — 填单与下单（当前迭代）

- 舱位「预订」→ `/flight/book`
- `Flight-Initialize` / `Flight-Book`（Proxy 优先）
- 填单页 MVP + 下单后跳转

→ 完整策略：[flight-book-migration-strategy.md](./flight-book-migration-strategy.md)

### 延期（列表/预订增强，非 Phase C v1）

| 项 | 原因 |
|----|------|
| 改签 `isExchange` + `Home-Exchange` | 依赖订单详情入口 |
| 往返双段 | **产品决策排除**（Legacy ryx 国内往返 UI 已关；见 [flight-book-migration-strategy.md §13](./flight-book-migration-strategy.md#13-已拍板)） |
| 多人按乘客分别选航班 | 需 bookInfos + 汇总页 |
| `isClearBookInfos` 路由守卫 | 填单链稳定后再接 |

---

## 5. 状态设计（替代 Legacy `TmcFlightService`）

Legacy 用全局 Service + RxJS；新 H5 **不要**搬 2200 行 god service。

| 状态 | 存放 | 说明 |
|------|------|------|
| 搜索条件 | URL query | `date/fromCode/toCode/fromAsAirport/...`（已有） |
| 列表数据 | TanStack Query | `useFlightList(params)`（已有） |
| 筛选 / 排序 | 页面 `useState` | filterDraft / filterApplied（已有） |
| 已选出行人 | `usePassengerSelection(Flight)` | 需接 refetch |
| 预订上下文 bookInfos | Phase B+ 新 hook | 如 `useFlightBookContext`，勿过早引入 |

---

## 6. 执行顺序（Mock 置后）

### 6.1 对照与审计

1. 读 `beeantmobile-main/.../tmc-flight-list_ryx.base.page.ts`，提取：
   - 生命周期、刷新条件、筛选字段、跳转参数、空态文案
2. 审计现有代码：
   - `apps/h5/src/pages/flight/FlightListPage.tsx`
   - `apps/h5/src/utils/flight-list.ts`
   - `apps/h5/src/hooks/useFlight.ts`
   - `packages/api/src/apis/flight.ts`
3. 输出 Gap 表：✅ 已有 / ⚠️ 部分 / ❌ 缺失

### 6.2 API 层（Proxy 金标准）

1. 抓 Legacy / Proxy Network：`Home-Index` 请求体、Version `2.0`、Timeout 60s
2. 校对 `@ryx/api` `searchFlights()` 与 `resolve-url` 直连路径
3. 若做 Phase B：同样方式校对 `Home-Detail`
4. **此阶段不改 Mock**（或仅保证不阻塞 typecheck 的最小 fixture）

### 6.3 H5 列表页增量

按优先级小步提交（每步 Proxy 可验）：

1. 刷新策略（城市 / 出行人 / 时间间隔）
2. 超时弹窗
3. 空态文案
4. 出行人联动 refetch
5. 选航班路由参数

### 6.4 Proxy 真环境验收

- 登录态下与 Legacy 同城市、同日期对比列表条数 / 首条航班
- 参考出行人迁移：payload 与 Legacy curl 不一致时，以 Legacy 为准改 client
- 记录实测 request/response 样例（供 Mock 最后一轮使用）

### 6.5 Mock 对齐（最后）

1. 用 Proxy 实测响应更新 `packages/mock/src/fixtures/flight.ts`
2. 更新 `packages/mock/src/handlers/flight.ts` 覆盖边界（空列表、筛选后无结果）
3. `pnpm dev:h5:mock` + `verify:mock` / 相关 Vitest

### 6.6 文档

- 更新 [PAGE-API-MATRIX.md](../PAGE-API-MATRIX.md) 机票列表 H5 列
- 更新 [机票模块.md §6](../../ryx/机票模块.md#6-与新-monorepo-对照) 迁移状态
- 勾选 [task-list.md](../task-list.md) Wave 5

---

## 7. MVP 边界（第一版交付定义）

**包含**：

- 单程、国内列表
- `Home-Index` Proxy 拉数 + 客户端筛选排序
- 日期条 / 修改搜索 / 出行人入口
- 选航班跳转 cabins（Detail Proxy 至少通；UI 可简）

**不包含（v1 Out of Scope）**：

- 改签、往返、按人分选、Policy 弹层、填单 Initialize

---

## 8. 与酒店链的可复用经验

酒店链已验证路径：**Proxy 对齐 Legacy payload → 页面消费 → Mock 补 fixture**。

机票列表同样：

1. **Proxy 端到端优先**
2. Legacy Network / curl 为请求体金标准
3. UI 改版可与 API 并行，但不阻塞 Proxy 行为验收

---

## 9. 待拍板

列表页迁移是否 **连带 Phase B（舱位页）** 同一迭代：

| 选项 | 结果 |
|------|------|
| 仅 Phase A | 列表浏览完整，点航班仍可能进占位页 → 矩阵 `[~]` |
| Phase A + B | 可选 `[x]`，并可继续推填单 |

---

## 10. 关键文件索引

| 用途 | 路径 |
|------|------|
| Legacy 列表逻辑 | `beeantmobile-main/projects/ryx/src/app/tmc/tmc-flight/tmc-flight-list_ryx/` |
| H5 列表页 | `apps/h5/src/pages/flight/FlightListPage.tsx` |
| 筛选排序 | `apps/h5/src/utils/flight-list.ts` |
| 列表 hook | `apps/h5/src/hooks/useFlight.ts` |
| API | `packages/api/src/apis/flight.ts` |
| Mock（最后改） | `packages/mock/src/handlers/flight.ts` |
| 舱位占位 | `apps/h5/src/pages/flight/FlightCabinsPage.tsx` |

---

## 11. 相关文档

| 文档 | 说明 |
|------|------|
| [机票模块.md](../../ryx/机票模块.md) | Legacy 全流程、API、依赖 |
| [PAGE-API-MATRIX.md](../PAGE-API-MATRIX.md) | 页面 → Method 矩阵 |
| [H5-RYX-MIGRATION.md](../H5-RYX-MIGRATION.md) | 迁移总原则 |
| [passenger-module-design.md](./passenger-module-design.md) | 同系 Picker / 出行人可参考 |
