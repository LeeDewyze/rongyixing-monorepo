# H5 版 ryx → rongyixing 迁移对照

> **源**：[app.rtesp.com/rl/index.html](http://app.rtesp.com/rl/index.html) · `beeantmobile-main/projects/ryx`  
> **目标**：`rongyixing-monorepo/apps/h5` + `packages/api` + `packages/mock`  
> **主操作手册**：[PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md)（29 页 × Method × Wave 顺序）  
> **执行看板**：[task-list.md](./task-list.md)

---

## 1. 迁移定义

| 项 | 说明 |
|----|------|
| **迁什么** | ryx H5 **页面 + 路由 + 业务 Flow** |
| **接口怎么迁** | **按页**从矩阵取 Method，按需封装 `@ryx/api`（不是 354/364 全量） |
| **进度 KPI** | **页面数**（29 页矩阵），不是 Method 条数 |
| **验收** | `/rl/` 同等操作在 `pnpm dev:h5:mock` / proxy 下可复现 |

**工作流**

```
Wave 选页 → 静态扫描/抓包 → API+Mock → 迁 H5 → 勾选 task-list
```

---

## 2. ryx H5 信息架构

底部 Tab（`tabs_ryx.page.html`，企业 `isTmcHome`）：

| Tab | 旧路由 | 新路由 | Wave |
|-----|--------|--------|------|
| 首页 | `tab-tmc-home_ryx` | `/home` | 2 |
| 待出行 | `tab-tmc-trip_ryx` | `/trips` | 2 |
| 我的 | `tab-tmc-my_ryx` | `/me` | 2 |

另有 `isPublicHome`（游客）、`isBpmHome`（BPM 壳）— **企业主线以 `isTmcHome` 为准**。

---

## 3. 迁移顺序（Wave）

| Wave | 主题 | 状态 |
|------|------|------|
| 1 | 登录与会话 | [~] |
| 2 | Tab 壳 + 首页/待出行/我的 | [ ] ← **建议下一批** |
| 3 | 酒店预订链 | [~] |
| 4 | 订单列表 + 详情 | [ ] |
| 5 | 机票链 | [ ] |
| 6 | 火车链 | [ ] |
| 7 | 出差申请 + 常旅客 | [~] |
| 8 | 账户/审批 P2 | [ ] |

完整页面表见 [PAGE-API-MATRIX.md §4](./PAGE-API-MATRIX.md#4-页面总表)。

---

## 4. 当前进度

| 维度 | 值 |
|------|-----|
| 矩阵内页面 | 29 |
| H5 完成 | 6 |
| H5 部分 | 4 |
| **页面迁移** | **≈28%** |
| 已封装 Method | 25（随页面滚动增加） |

**已完成页面**：酒店列表/详情/填单/结果/支付、预订内嵌选出差单。

**部分完成**：登录×2、酒店搜索、填单内常旅客。

---

## 5. Out of Scope

| 模块 | 说明 |
|------|------|
| `public/*` | 游客/会展 |
| `mms/*` | 商城 |
| `crm/*` | 客户管理 |
| `tmc-international-*` | 国际机酒 |
| `tmc-car` / 租车 | 非主线 |
| BPM 销售/日记/报价 | 非差旅填单 |
| Capacitor 原生 · jyx · `apps/web` | 另议 |

> 354 条静态扫描 ≠ 迁移清单。范围见 [METHODS-RYX-SCOPE.md](./METHODS-RYX-SCOPE.md)。

---

## 6. 技术栈对照

| 层 | 旧 ryx H5 | rongyixing |
|----|-----------|------------|
| UI | Angular 12 + Ionic | React 19 + `@ryx/ui` |
| 路由 | Ionic tabs | react-router v7 |
| API | `ApiService` + `RequestEntity` | `getApi()` + `@ryx/api` |
| 状态 | RxJS | TanStack Query |
| Mock | 无 | `@ryx/mock` + `VITE_API_MODE` |

---

## 7. 相关文档

| 文档 | 说明 |
|------|------|
| [PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md) | **页面→接口（主文档）** |
| [task-list.md](./task-list.md) | 看板 + Wave 勾选 |
| [接口迁移方案.md](../接口迁移方案.md) | 接口层方案 |
| [METHODS-RYX-SCOPE.md](./METHODS-RYX-SCOPE.md) | 354 vs 非主线 |
| [domains/hotel.md](./domains/hotel.md) | 酒店 Flow 详解 |
