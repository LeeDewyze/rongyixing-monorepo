# 出差模块未完成任务清单

> 更新：2026-06-25 · Phase B 交付后  
> 参考：`travel-module-migration-strategy.md` · `PAGE-API-MATRIX.md` · `task-list.md`

---

## 一、出差申请（`/travel/apply`）完善

| 优先级 | 任务 | 状态 | 说明 | 涉及文件 |
|--------|------|------|------|---------|
| P1 | **编辑申请单** | ✅ **已完成** | 调用 `Form/Modify` + `Form/Get` 加载主表字段（出差类型、事由）。**已知限制**：workflow API 不返回 slave 行数据（TravelAccount/TravelDetail），编辑时出差人/行程需用户手动重新添加。 | `travel-apply.ts`、`TravelApplyPage.tsx` |
| P1 | **撤回申请单** | ⚠️ **代码已完成** | `FormTask/Revoke` API 已封装，列表页已加撤回按钮。但联调发现当前环境的表单提交后直接变为 `Status=3（已通过）`，无审批节点，导致无法撤回（返回"单据已处理"）。需工作流配置审批节点后方可生效。 | `travel-apply.ts`、`TravelApprovalPage.tsx` |
| P1 | **出差单只读详情** | ❌ **未开始** | 查看已提交出差单的完整详情（含多人、多段），需 `Form/Detail` 或 `Form/Get` 渲染只读页。 | 新页面 或 嵌入 iframe |
| P2 | **被驳回后重新提交** | ✅ **已完成** | 与编辑申请单同路线（`Form/Modify`），编辑模式下已覆盖。 | `TravelApplyPage.tsx` |
| P2 | **PolicyId 抓包完善** | 🔄 **待确认** | `StaffCtrl/GetDefaultPolicy` 当前 return 404，导致 `policyId` 为空。联调查看 defaultUrl 已拼入 formId，但仍返回 404。暂不影响基本提交。 | `travel-apply.ts` |
| P2 | **出差人搜索文案** | ❌ **未开始** | `StaffCtrl/GetDatas` 返回 `label` 为 `工号-姓名` 格式，建议搜索也按姓名/工号都支持（ResourcePicker 已有 searchText）。 | `TravelApplyPage.tsx` |

### 编辑模式已知问题

- **Form/Get 不返 slave 数据**：所有读接口（Form/Get、Form/Flow with Id、Form/List）均不返回 TravelAccount / TravelDetail 的已保存行数据。`slaveDatas` 始终为空数组，slave 子控件的 `defaultValue` 始终为 null/空。因此编辑时不能恢复出差人和行程，需要用户手动重新添加。
- **Form/Modify 已通过联调**：提交 `Form/Modify` 成功，返回 `{"Status":true,"Message":"保存成功"}`。

---

## 二、审批体验

| 优先级 | 任务 | 状态 | 说明 | 涉及文件 |
|--------|------|------|------|---------|
| P1 | **待审批角标** | ❌ **未开始** | 首页「待我审批」图标右上角显示待审批数量。API：`TmcApiHomeUrl-Home-GetAccountWaitingTasks`，已定义在 `approval-flow.ts`。 | `HomeBusinessPanel.tsx` |
| P1 | **审批——驳回** | ❌ **未开始** | 审批通过已对接，但驳回（`isPass=false`）未在 UI 测试。确认备注输入 + 驳回功能完整。 | `TravelApprovalPage.tsx` 或 iframe 页 |
| P2 | **审批——抄送人** | ❌ **未开始** | `FormTask/Approval` 支持 `notifiers` 参数，需要抄送人选择 UI。 | 审批页 |
| P2 | **X-Frame-Options 拦截处理** | ❌ **未开始** | 如果 workflow 详情页被 `X-Frame-Options` 拦截，改为全页跳转（`window.location`）替代 iframe。已实现 `workflow-embed.ts` 作为 fallback。 | `TravelIframeView.tsx` |

### 审批流程现状

联调测试发现：当前 staging 环境的工作流 "出差申请" 路由**未配置审批节点**。所有提交的 Form 的 `Tasks` 数组为空，`Status` 直接被置为 `3（已通过）`。审批相关功能（待审批、驳回、撤回）需后端配置审批节点后方可完整验证。

---

## 三、预订链完善

| 优先级 | 任务 | 状态 | 说明 | 涉及文件 |
|--------|------|------|------|---------|
| P1 | **酒店搜索页** | ❌ **未开始** | 当前 `/hotel` 直接跳列表，缺少城市/日期/关键词搜索 UI。 | 新页面 |
| P1 | **Policy / SearchHotel** | ❌ **未开始** | 酒店搜索时差标过滤、价格计算。`Hotel-Policy` 在详情页已实现，搜索页缺失。 | `useHotelSearch.ts` |
| P1 | **机票搜索/列表/舱位/填单** | ❌ **未开始** | 机票链当前是多个阶段交付（搜索→列表→舱位→填单），确认所有页面 UI 与 Legacy 对齐。 | 机票各页面 |
| P1 | **火车预订全链路** | ❌ **未开始** | 搜索→车次列表→填单→支付。Wave 6 全部未起步。 | 新建页面 |
| P2 | **支付——公付（公司支付）渠道** | ❌ **未开始** | 当前只接了个人支付和授信。`Order-GetOrderPays` 返回包含 `PayCompany`（Type=1 公付），需对接。 | `OrderPayPage.tsx` |
| P2 | **支付——App SDK / 微信 JSAPI** | ❌ **未开始** | Legacy 支持 Native SDK 调起支付，H5 暂未接入。 | 支付页 |
| P2 | **酒店/机票填单——选出差单后 travelFormId 自动填充** | ❌ **未开始** | 部分场景已做，需确保预订各品类完整。 | 各 BookPage |

---

## 四、订单与历史

| 优先级 | 任务 | 状态 | 说明 |
|--------|------|------|------|
| P1 | **订单列表页 `/orders`** | ❌ **未开始** | 统一展示酒店/机票/火车订单，入口在 home 或 tab |
| P2 | **酒店/机票/火车订单详情** | ❌ **未开始** | 每类订单的只读详情页 |
| P2 | **待出行 Tab** | ❌ **未开始** | 展示已预订未出行的行程聚合（app 首页底部 tab） |

---

## 五、账户与基础

| 优先级 | 任务 | 状态 | 说明 |
|--------|------|------|------|
| P1 | **登出** | ❌ **未开始** | `ApiLoginUrl-Home-Logout` API 已封装，H5 页面缺失 |
| P1 | **首页工作台** | ❌ **未开始** | Tab 壳 + Workbench-Load 动态入口，Wave 2 |
| P2 | **我的审批（个人中心）** | ❌ **未开始** | `/me/approvals` 已审批任务归档 |
| P2 | **账户设置 / 安全 / 证件管理** | ❌ **未开始** | Wave 8 |

---

## 六、已知技术债务

| 问题 | 说明 | 严重程度 |
|------|------|---------|
| `workflow.rtesp.com` 直连 | 当前 H5 端到端直连 workflow 站（fetch `Form/Flow`、`Form/Add`），不走 `app.rtesp.com/Home/Proxy`。如果 workflow 部署变更或跨域策略收紧，可能连不上。 | 中 |
| staging 登录反直觉 | `Message: "用户名或密码错误"` 但 Ticket 正常，登录后可正常使用。需排查 Login API `Message` 为何为错误。 | 低 |
| `GetDefaultPolicy` 404 | `StaffCtrl/GetDefaultPolicy` 返回 404，所有 policyId 为空。不影响提交，触发审批时可能校验失败。 | 中 |
| 工作流无审批节点 | 出差申请流程未配置审批节点，提交后直接 `Status=3（已通过）`，`Tasks` 为空。审批相关功能（待审批、驳回、撤回）需后端配合配置。 | 高 |
| Form/Get 不返 slave 数据 | 所有读接口的 `slaveDatas` 均为空数组，slave 子控件的 `defaultValue` 为 null。编辑时无法恢复已保存的出差人和行程，需用户手动重新添加。 | 中 |
