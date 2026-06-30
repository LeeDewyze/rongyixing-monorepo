# 需求PRD文档
## 一、基础信息
- Jira号：r-001
- 需求类型：业务feature
- 英文简称：business-private-travel-migration
- 文件夹名称：20260630-r-001-业务feature-business-private-travel-migration

## 二、业务背景
当前 H5 已迁移首页、机票、火车、酒店、出差申请/审批等部分能力，但「因公出行 / 因私出行」在 legacy ryx 中不是单一 UI Tab，而是贯穿入口路由、Workbench 配置、员工预订权限、出差单上下文、订单提交参数与审批任务的组合逻辑。

本需求目标是系统梳理 `beeantmobile-main/projects/ryx` 中因公、因私相关逻辑，与当前 `rongyixing-monorepo/apps/h5` 已实现能力进行对比，明确 H5 后续需要迁移、补齐或显式排除的能力，并给出可执行测试 case，避免迁移后出现因私入口走因公链路、出差单上下文丢失、订单 TravelType 错误、审批入口不可用等问题。

## 三、需求详情
### 3.1 Legacy 业务规则梳理
1. 因公 / 因私基础枚举：
   - legacy 枚举定义在 `beeantmobile-main/projects/models/src/order/OrderTravelEntity.ts`。
   - `OrderTravelType.Business = 1`，代表因公 / 公司。
   - `OrderTravelType.Person = 2`，代表因私 / 个人。
   - `OrderTravelPayType.Company = 1`、`Person = 2`、`Balance = 3`、`Credit = 4`，支付类型与出行类型是两个独立字段。

2. 首页与路由域：
   - legacy ryx 企业首页通过 `tab-tmc-home_ryx`、`tmc-*` 路由承载因公链路。
   - 因私入口通过 `public-*` 路由承载个人出行链路。
   - `HrService.isTmcHome()` 判断 `Numbers.TmcId` 或 `Numbers.AgentId`，`HrService.isPublicHome()` 判断非 TMC/BPM，`roleSource` 仅表达当前首页角色域，不等同最终订单 `TravelType`。
   - `tab-tmc-home/tmc-home.base.page.ts` 中 `goBusiness()` 跳转 `business-list`，`onWaitingtask()` 跳转 `tmc-approval-task`。

3. Workbench 动态入口：
   - legacy 首页入口来自 `HrApiUrl-Workbench-Load` / Workbench 数据。
   - 因公出行包含机票、火车票、酒店等 TMC 入口，path 分别指向 `tmc-flight-search`、`tmc-train-search`、`tmc-hotel-search`。
   - 因私出行包含 public 入口，path 指向 `public-flight-search`、`public-train-search`、`public-hotel-search` 等。
   - 出差申请在 legacy 实际为 Workbench 外链：`workflow.rtesp.com/Form/Flow?flowtag=Travel&ticket={ticket}`；我的审批为 `workflow.rtesp.com/Task/Index?ticket={ticket}`。

4. 员工预订权限：
   - `HrService.isSelfBookType()` 根据 Staff `BookType` 判断本人预订 / 代订能力。
   - 该能力决定是否自动补本人、是否允许添加乘客、是否展示新增证件等。
   - `BookType` 不是因公 / 因私标识，H5 不得将本人预订误判为因私。

5. 出差单上下文：
   - 出差单上下文仅属于因公 / TMC 预订链路；因私 / public 链路不应调用出差单能力。
   - `TmcService.hasGetTravelUrl()` 判断 TMC 是否开启出差单能力，只应在当前出行模式为因公时触发。
   - `getStaffTravelNumber()` 调用 `TmcApiBookUrl-Home-GetTravelUrl` 获取出差单，只应服务于因公填单页的 `TravelNumber` 选择。
   - `getBkPassengerInfo()` 将 `TravelFormId`、`TravelNumber` 写入乘客 `travelFormId`、`travelNumber`。
   - 有出差单上下文时，legacy 会禁用普通加乘客、删除、重选，并按出差单乘客和行程约束继续预订。
   - `checkIfShouldAddTravelNumberPassenger()` 在配置要求先申请出差单且当前未绑定出差单时弹窗提示「选择申请单预订 / 继续查询」。
   - 因私模式不得展示 `TravelNumber` 出差单选择入口，不得触发“先申请出差单”提示，不得提交 `travelFormId` / `travelNumber`。

6. 产品填单与提交：
   - 机票、火车、酒店 TMC 填单页默认 `combineInfo.travelType = OrderTravelType.Business`。
   - 提交时将 `combineInfo.travelType` 写入乘客级 `Passenger.TravelType`。
   - 同时写入 `TravelPayType`、审批人、成本中心、组织、差旅政策、违规原因、外部编号、出差单号等字段。

7. 审批相关：
   - 待我审批 / 已审任务入口为 `tmc-approval-task`。
   - 首页待办角标来自 `TmcApiHomeUrl-Home-GetAccountWaitingTasks`。
   - 任务列表来自 TMC/Workflow 相关接口；任务详情 legacy 会拼接 `HandleUrl`、`taskid`、`ticket`、`isApp=true` 打开。

### 3.2 H5 现状对比
1. 已有能力：
   - 首页已有「因公出行 / 因私出行」Tab，代码位于 `apps/h5/src/components/home/HomeHeroSection.tsx`。
   - H5 使用 `sessionStorage` 保存 `ryx_home_travel_mode`，并通过 `resolveFlightTravelType()` 映射：business → `1`，personal → `2`。
   - 机票、酒店、火车下单已读取该映射并写入订单 DTO 的 `TravelType`。
   - 首页因公面板已有出差申请、我的申请、待我审批、已审任务四入口。
   - `/travel/apply`、`/travel/approval`、`/travel/task` 等路由已存在。

2. 待迁移 / 待核对能力：
   - 因私 Tab 目前主要影响订单 `TravelType=2`，但尚未完整验证是否按 legacy 走 `public-*` 产品链路。
   - 首页产品入口仍复用当前 H5 产品页面，需要明确因公、因私下搜索、列表、详情、填单、支付的接口和字段差异。
   - Workbench 动态入口目前未完全驱动首页产品入口和出差面板，需评估是否迁移 legacy 的动态配置、权限显隐、角标。
   - 出差单上下文需要跨搜索页、填单页、乘客选择页完整保留，不能只保留乘客姓名或证件。
   - `GetTravelUrl` 开关、必填外部编号、出差单弹窗提示、选择出差单后禁用编辑等 legacy 行为需要逐项对齐。
   - 审批任务的列表、角标、详情跳转、ticket 拼接、iframe / 全页打开策略需要形成一致体验。

### 3.3 迁移范围
1. 首页因公 / 因私模式：
   - 保留 H5 当前 Tab UI。
   - 明确模式选择后对产品入口、路由、订单参数的影响。
   - 因公默认 `TravelType=1`，因私默认 `TravelType=2`。

2. 因公产品入口：
   - 机票、火车、酒店进入 TMC 预订链路。
   - 支持出差申请、我的申请、待我审批、已审任务入口。
   - 支持待办角标和 Workbench 权限显隐，若本期不做需在 UI 上不展示误导信息。

3. 因私产品入口：
   - 按 legacy public 域语义梳理机票、火车、酒店入口。
   - 若当前 H5 暂无 public 接口链路，本期需至少保证不会错误携带因公出差单、审批、成本中心、组织等字段。
   - 下单时 `TravelType=2`，支付类型和可选字段按因私规则处理。
   - 因私模式不调用 `TmcService.hasGetTravelUrl()`，不调用 `TmcApiBookUrl-Home-GetTravelUrl`，不展示 `TravelNumber` 出差单选择入口。

4. 出差单能力：
   - 仅在因公模式通过 `TmcApiBookUrl-Home-GetTravelUrl` 获取出差单。
   - 支持按产品类型 `Flight` / `Train` / `Hotel` 过滤。
   - 选择出差单后保留 `travelFormId`、`travelNumber`、乘客、行程约束。
   - 有出差单时禁用不应编辑的乘客与外部编号字段。

5. 审批能力：
   - 迁移 `tmc-approval-task` 待我审批 / 已审任务。
   - 迁移「我的申请 / 我的审批」外链或 Workflow 列表。
   - 任务详情需按 legacy 拼接 ticket 与 task 参数，优先使用 H5 内打开策略；若受跨域或 X-Frame-Options 限制，应降级全页跳转。

### 3.4 不在本期范围
1. BPM 报销全流程。
2. legacy 所有 public 产品页面的完整视觉复刻。
3. 出差申请表单原生重写，除非补充 workflow 表单 API 文档并单独立项。
4. 国际机票、国际酒店、用车等非当前 H5 主链路，除非后续明确纳入。

## 四、验收标准
### 4.1 功能验收
1. 首页切换「因公出行」后，进入机票、火车、酒店下单流程，订单 payload 中乘客级 `TravelType` 为 `1`。
2. 首页切换「因私出行」后，进入机票、火车、酒店下单流程，订单 payload 中乘客级 `TravelType` 为 `2`。
3. 因私下单不得默认携带因公出差单、审批人、组织、成本中心等因公专属字段；若接口要求字段存在，应按 legacy 因私规则置空或使用个人支付链路字段。
4. Staff `BookType=Self` 时，H5 按本人预订限制处理，不得改变因公 / 因私模式。
5. Staff `BookType=All` 或允许代订时，可按 legacy 选择乘客；因公模式仍应 `TravelType=1`，因私模式仍应 `TravelType=2`。
6. TMC 开启 `GetTravelUrl` 且当前为因公模式时，填单页可选择出差单，并能按产品类型过滤 `Flight` / `Train` / `Hotel`。
7. 当前为因私模式时，H5 不调用 `TmcService.hasGetTravelUrl()`，不调用 `TmcApiBookUrl-Home-GetTravelUrl`，不展示 `TravelNumber` 出差单选择入口，不触发出差单必选提示。
8. 选择出差单后，H5 保留并提交 `travelFormId`、`travelNumber`，且乘客编辑、删除、重选限制与 legacy 一致。
9. 配置要求先申请出差单且未绑定出差单时，仅因公模式出现明确提示，并提供「选择申请单预订」与「继续查询」等价路径。
10. 出差申请入口能打开 legacy workflow 申请页或 H5 等价页，并携带有效 ticket。
11. 我的申请、待我审批、已审任务能展示列表；无数据、加载失败、未登录、ticket 失效都有明确状态。
12. 审批任务详情跳转能携带 `taskid`、`ticket`、`isApp=true` 等必要参数；iframe 不可用时可全页打开。
13. 首页待办角标与 `GetAccountWaitingTasks` 数据一致；接口失败时不阻塞首页主流程。

### 4.2 测试 Case
| 编号 | 场景 | 前置条件 | 操作 | 预期 |
| ---- | ---- | ---- | ---- | ---- |
| TC-01 | 因公默认模式 | 首次进入 H5，无 session | 打开首页 | 默认选中因公，产品搜索可用，`resolveFlightTravelType()` 返回 `1` |
| TC-02 | 切换因私模式 | 首页已加载 | 点击因私出行后进入机票填单 | session 保存 personal，机票提交 `TravelType=2` |
| TC-03 | 因私模式切回因公 | session 为 personal | 点击因公出行后进入酒店填单 | session 保存 business，酒店提交 `TravelType=1` |
| TC-04 | 因公机票下单 | TMC 用户，有乘客 | 搜索机票、选舱、填单提交 | 每位乘客 `TravelType=1`，保留审批/组织/成本中心字段 |
| TC-05 | 因私机票下单 | 用户切到因私 | 搜索机票、选舱、填单提交 | 每位乘客 `TravelType=2`，不强制出差单 |
| TC-06 | 因公火车下单 | TMC 用户，有乘客 | 搜索火车、选座、填单提交 | 每位乘客 `TravelType=1` |
| TC-07 | 因私火车下单 | 用户切到因私 | 搜索火车、选座、填单提交 | 每位乘客 `TravelType=2` |
| TC-08 | 因公酒店下单 | TMC 用户，有乘客 | 搜索酒店、选房型、填单提交 | 每位入住人 `TravelType=1` |
| TC-09 | 因私酒店下单 | 用户切到因私 | 搜索酒店、选房型、填单提交 | 每位入住人 `TravelType=2`，不显示因公申请单强绑定 |
| TC-10 | Self 本人预订 | Staff.BookType=Self | 进入任一产品填单 | 自动带本人或限制加人，但不改变当前因公/因私 TravelType |
| TC-11 | 可代订 | Staff.BookType=All | 添加多名乘客 | 可选多人，每人按当前模式写入 TravelType |
| TC-12 | 开启 GetTravelUrl | TMC.GetTravelUrl 有效 | 填单页点击出差单/外部编号选择 | 调用 `TmcApiBookUrl-Home-GetTravelUrl`，按产品类型返回可选出差单 |
| TC-13 | 选择出差单 | 已返回出差单 | 选择一条 TravelNumber | 乘客写入 `travelFormId`、`travelNumber`，外部编号展示选中值 |
| TC-14 | 出差单锁定乘客 | 已选择出差单 | 尝试删除/重选乘客 | 与 legacy 一致限制操作，并给出提示 |
| TC-15 | 必须先申请单 | TMC 配置要求先申请，未选出差单 | 进入查询/填单 | 出现提示，可选择申请单预订或继续查询 |
| TC-16 | 因私不取出差单 | TMC.GetTravelUrl 有效，用户切到因私 | 进入任一产品填单 | 不调用 `hasGetTravelUrl` / `GetTravelUrl`，不展示 TravelNumber 选择，不提交 `travelFormId` / `travelNumber` |
| TC-17 | 因公才提示申请单 | TMC 配置要求先申请单 | 分别在因公、因私进入查询/填单 | 因公出现申请单提示；因私不出现该提示 |
| TC-18 | 出差申请入口 | 登录态有效 | 点击首页出差申请 | 打开 workflow 申请页或 H5 等价页，URL 带 ticket |
| TC-19 | 我的申请入口 | 登录态有效 | 点击我的申请 | 展示我的申请/审批列表或打开 workflow 任务页 |
| TC-20 | 待我审批 | 有待审批数据 | 点击待我审批 | 列表展示待审批任务，状态、标题、时间正确 |
| TC-21 | 已审任务 | 有已审数据 | 点击已审任务 | 列表展示已审任务 |
| TC-22 | 审批详情跳转 | 任务含 HandleUrl | 点击任务 | URL 拼接 taskid、ticket、isApp=true，可打开详情 |
| TC-23 | 待办角标 | 接口返回 DataCount>0 | 打开首页 | 因公入口显示对应角标或数量 |
| TC-24 | 接口失败降级 | GetTravelUrl / 审批接口失败 | 进入对应页面 | 页面显示错误/空状态，不影响返回和其它产品搜索 |
| TC-25 | Ticket 失效 | 登录 ticket 失效 | 进入申请或审批 | 跳转登录或展示授权失效，不出现白屏 |
| TC-26 | 刷新保持模式 | session 已保存 personal | 刷新首页 | 仍选中因私，后续订单 `TravelType=2` |
| TC-27 | 新会话默认值 | 新开无 session 会话 | 打开首页 | 默认因公，符合 legacy TMC 主流程 |

## 五、非功能要求（可选）
1. 状态隔离：`channel` / `travelMode`、`bookPermission`、`travelFormContext`、`orderTravelType` / `orderTravelPayType` 必须分层管理，避免单个字段承载全部语义。
2. 可观测性：关键跳转、出差单选择、审批详情打开失败需保留 console 或埋点扩展点，便于排查真实环境问题。
3. 兼容性：移动端 WebView、浏览器、iframe 被拦截场景都需有可返回路径。
4. 安全性：ticket 只用于接口与跳转，不在页面日志或错误文案中明文展示。

## 六、关联模块/依赖
1. Legacy 源码：
   - `beeantmobile-main/projects/ryx/src/app/hr/hr.service.ts`
   - `beeantmobile-main/projects/ryx/src/app/tabs/tab-tmc-home/tmc-home.base.page.ts`
   - `beeantmobile-main/projects/ryx/src/app/tmc/tmc.service.ts`
   - `beeantmobile-main/projects/ryx/src/app/tmc/tmc-flight/tmc-flight-book_ryx/tmc-flight-book_ryx.base.page.ts`
   - `beeantmobile-main/projects/ryx/src/app/tmc/tmc-hotel/tmc-hotel-book_ryx/tmc-hotel-book_ryx.base.page.ts`
   - `beeantmobile-main/projects/ryx/src/app/tmc/tmc-train/tmc-train-book_ryx/tmc-train-book_ryx.base.page.ts`
   - `beeantmobile-main/projects/models/src/order/OrderTravelEntity.ts`

2. H5 当前实现：
   - `rongyixing-monorepo/apps/h5/src/components/home/HomeHeroSection.tsx`
   - `rongyixing-monorepo/apps/h5/src/components/home/HomeBusinessPanel.tsx`
   - `rongyixing-monorepo/apps/h5/src/pages/home/HomeTabPage.tsx`
   - `rongyixing-monorepo/apps/h5/src/lib/flight-travel-mode.ts`
   - `rongyixing-monorepo/apps/h5/src/lib/flight-book.ts`
   - `rongyixing-monorepo/apps/h5/src/lib/train-book.ts`
   - `rongyixing-monorepo/apps/h5/src/lib/hotel-book.ts`
   - `rongyixing-monorepo/apps/h5/src/pages/travel/TravelApplyPage.tsx`
   - `rongyixing-monorepo/apps/h5/src/pages/travel/TravelApprovalPage.tsx`

3. 接口依赖：
   - `HrApiUrl-Workbench-Load`
   - `TmcApiHomeUrl-Home-GetAccountWaitingTasks`
   - `TmcApiBookUrl-Home-GetTravelUrl`
   - `TmcApiOrderUrl-Task-List`
   - Workflow 申请 / 审批外链：`workflow.rtesp.com/Form/Flow`、`workflow.rtesp.com/Task/Index`

4. 已有参考文档：
   - `docs/ryx/核心业务逻辑.md`
   - `docs/api/domains/travel-module-migration-strategy.md`
   - `docs/api/fixtures/travel-proxy/api-catalog.json`

## 七、备注
1. `{项目根}`：`/Users/jiangjiankang/work/self/rongyixing/rongyixing-monorepo`
2. `{变更根}`：`docs/changes`
3. 本 PRD 聚焦「梳理 legacy 因公 / 因私逻辑并定义 H5 迁移范围」，不直接修改业务代码。
4. 后续技术设计阶段需进一步把测试 case 拆成具体实现任务、接口契约、组件状态模型和自动化测试清单。
