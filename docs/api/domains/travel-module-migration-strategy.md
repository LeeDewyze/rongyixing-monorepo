# 出差模块迁移策略（Wave 7 · 首页入口 → 申请/审批）

> **Legacy 入口**：`tab-tmc-home_ryx` 工作台 · `goBusiness()` · `tmc-approval-task` · `workflow-list`  
> **新 H5 入口**：首页「因公」→ `HomeBusinessPanel`（Figma 10:326）  
> **业务域总览**：[核心业务逻辑.md](../../ryx/核心业务逻辑.md) · [MVP-SCOPE.md](../MVP-SCOPE.md)  
> **页面矩阵**：[PAGE-API-MATRIX.md](../PAGE-API-MATRIX.md) Wave 7  
> **已交付（预订内嵌）**：[hotel.md](./hotel.md) §出差单 · `GetTravelUrl`

---

## 1. 目标

在 H5 交付 **出差模块 MVP**：

```
首页因公面板 → 出差申请 / 我的审批 / 待我审批 / 已审任务
            →（预订链路）选择出差单 → 酒店/机票/火车填单
```

**两件不同的事**（不可混用 jyx 接口）：

| 动作 | ryx Method | 状态 |
|------|------------|------|
| **选择出差单**（预订关联） | `TmcApiBookUrl-Home-GetTravelUrl` | ✅ 酒店/机票填单已接 |
| **申请出差单**（填表提交） | 待 `/rl/` 抓包 | ⬜ Phase B |
| **审批任务**（订单/TMC） | `TmcApiOrderUrl-Task-List` | 🔄 Phase A |
| **工作流审批**（通用 BPM） | `WorkflowApiUrl-*-List` | 🔄 Phase A |

---

## 2. 现状对照

| 维度 | Legacy（ryx） | 新 H5 现状 |
|------|---------------|------------|
| 首页出差面板 | Workbench-Load 动态入口 + `onJump` | ⚠️ `HomeBusinessPanel` UI 已有，按钮无跳转 |
| 出差申请 | `goBusiness()` → `business-list` | ❌ **路由不在 beeant 仓库**，需抓包 |
| 待我审批 / 已审任务 | `tmc-approval-task` · Task-List Type 1/2 | ❌ |
| 我的审批 | `workflow-list` · History-List | ❌ |
| 待办角标 | `Home-GetAccountWaitingTasks` | ❌ |
| 选出差单 | GetTravelUrl | ✅ |

---

## 3. Legacy 对照基准

### 3.1 首页入口映射（Figma → Legacy）

| H5 快捷入口 | Legacy 行为 | API |
|-------------|-------------|-----|
| 出差申请 | `goBusiness()` → `business-list` | ⚠️ 待抓包 |
| 我的审批 | `workflow-list` 默认「我审批的」 | `WorkflowApiUrl-History-List` |
| 待我审批 | `tmc-approval-task` · 待我审批 | `TmcApiOrderUrl-Task-List` · `Type: 1` |
| 已审任务 | `tmc-approval-task` · 已审任务 | `TmcApiOrderUrl-Task-List` · `Type: 2` |

Legacy 源码：

- 申请：`tmc-home.base.page.ts` · `goBusiness()`
- TMC 审批：`tmc-approval-task.page.ts` · `getOrderTasks` · 点击 `HandleUrl` + ticket 打开 H5
- 工作流：`workflow-list.page.ts` · `WorkflowApiService`

### 3.2 任务详情打开方式

Legacy `getTaskHandleUrl`：在 `HandleUrl` 上追加 `taskid`、`ticket`、`isApp=true`。  
H5 **不照搬 WebView 弹层**，Phase A 使用 **全页跳转**（`window.location` 或内嵌 iframe 页，后续迭代）。

### 3.3 出差申请（Phase B · 已抓包）

**结论**：ryx **没有**独立的 Proxy 提交 Method；`goBusiness()` → `business-list` 在 beeant 源码中缺失，实际能力来自 **Workbench-Load 配置的外链**。

| 入口 | Workbench Name | 外链 URL（需带 `ticket`） |
|------|----------------|---------------------------|
| 出差申请 | `出差申请` | `http://workflow.rtesp.com/Form/Flow?flowtag=Travel&ticket={ticket}` |
| 我的审批 | `我的审批` | `http://workflow.rtesp.com/Task/Index?ticket={ticket}` |

抓包脚本：`packages/api/scripts/verify-travel-proxy.mjs`  
Fixture：`docs/api/fixtures/travel-proxy/`（2026-06-24 · `Test15011350510`）

**已排除**（ryx 账号调用失败）：

- `FeatureRonglvUrl-jyx-GetTravelForms` / `SaveTravelForms`（jyx 专用）
- `BpmApiExpenseUrl-Home-List`（502）

**H5 实现**：`TravelApplyPage` / `TravelWorkflowPage` 通过 `TmcApiHomeUrl-Workbench-Load` 解析 URL + iframe 嵌入 workflow 站点（Legacy 等价 `CoreHelper.jump`）。

---

## 4. 工作方式

```
Legacy 审计 → Gap 清单 → API（Proxy 优先）→ H5 页面 → Mock 对齐 → 矩阵
```

| 阶段 | 交付 |
|------|------|
| **Phase A** | 策略文档 · 审批 API · `/travel/approval` · `/travel/workflow` · 首页入口 · Mock |
| **Phase B** | 抓包后 · `/travel/apply` 表单 · 提交闭环 |
| **Phase C** | Workbench-Load 动态入口（可选）· 角标 · 任务详情内嵌页优化 |

---

## 5. H5 路由规划

| 路由 | Legacy | Phase |
|------|--------|-------|
| `/travel/apply` | `business-list` | B（A 为占位 + 抓包说明） |
| `/travel/approval?tab=pending\|done` | `tmc-approval-task` | A |
| `/travel/workflow?tab=task\|history\|notify` | `workflow-list` | A（默认 `history` = 我的审批） |

---

## 6. API 封装清单

| Method | 用途 | `@ryx/api` |
|--------|------|------------|
| `TmcApiOrderUrl-Task-List` | 待我审批 / 已审任务 | `approval.getOrderTasks()` |
| `WorkflowApiUrl-Task-List` | 工作流待办 | `approval.getWorkflowTasks()` |
| `WorkflowApiUrl-History-List` | 我审批的 | `approval.getWorkflowHistory()` |
| `WorkflowApiUrl-Notify-List` | 抄送我的 | `approval.getWorkflowNotifies()` |
| `TmcApiHomeUrl-Home-GetAccountWaitingTasks` | 待审批角标 | `approval.getWaitingTaskCount()` |
| `TmcApiBookUrl-Home-GetTravelUrl` | 预订选单 | ✅ `travel.getTravelForms()` |

常量：`packages/api/src/methods/approval-flow.ts`

**完整抓包目录**（2026-06-24 · 推荐账号 `T289G003` / 孙雪 · 有待办数据）：

- 结构化清单：`docs/api/fixtures/travel-proxy/api-catalog.json`（23 个 endpoint · 4 层 transport）
- 原始响应：`capture-primary.json` / `workflow-http-probes.json` / `workflow-form-meta.json`
- 重跑：`node packages/api/scripts/capture-travel-workflow.mjs`

---

## 7. 交付清单

### Phase A（当前迭代）

- [x] 本策略文档
- [x] `approval` API + task normalize adapter
- [x] Mock：Task-List / Workflow-History
- [x] `TravelApprovalPage` · `TravelWorkflowPage`
- [x] `TravelApplyPage` 占位（含抓包指引）
- [x] `HomeBusinessPanel` 四入口跳转
- [x] 更新 PAGE-API-MATRIX / task-list

### Phase B（抓包完成 · 2026-06-24）

- [x] Workbench-Load 抓包 → workflow 外链确认
- [x] `/travel/apply` iframe 打开 `Form/Flow?flowtag=Travel`
- [x] `/travel/workflow` iframe 打开 `Task/Index`（我的审批）
- [ ] 若 iframe 被 X-Frame-Options 拦截 → 改全页跳转（浏览器打开已提供）

### Phase B+（可选）

- [ ] 出差申请表单 **原生重写**（需 workflow 表单 API 文档，当前为外链托管）
- [ ] Proxy E2E：申请 → 审批 → 预订选单

---

## 8. MVP 边界

**包含**：首页四入口、TMC 审批列表、工作流「我审批的」列表、任务 URL 跳转、Mock 闭环。

**不包含**：出差申请表单（无抓包）、Workbench 全量动态配置、BPM 报销全套、任务详情内嵌 WebView 完整验签。

---

## 9. 相关文档

| 文档 | 说明 |
|------|------|
| [MVP-SCOPE.md](../MVP-SCOPE.md) | 产品边界 |
| [passenger.md](./passenger.md) | 出差单带入乘客 |
| [proxy-test-known-issues.md](../proxy-test-known-issues.md) | Proxy 阻塞项 |
