# 需求PRD文档
## 一、基础信息
- Jira号：r-001
- 需求类型：业务feature
- 英文简称：business-private-travel-migration
- 文件夹名称：20260630-r-001-业务feature-business-private-travel-migration

## 二、业务背景
当前 H5 已完成首页、机票、火车、酒店等一版页面与主要流程，但目前「因公出行 / 因私出行」主要停留在 UI Tab 和部分 `TravelType` 字段层面，尚未按 legacy ryx 的因公 / 因私接口域、上下文、字段和出差单规则做真实区分。

本需求目标不是复刻 legacy Ionic 页面或新增后端接口，而是在当前 H5 已有产品页面和重新设计的 UI 体验上，迁移 legacy 因公 / 因私的接口调用规则与业务差异：因公继续走 `TmcApi*`，因私按 legacy 走 `TmcTourist*` / public 语义；交互按 H5 规范微调，接口 Method、请求上下文和提交字段需与 legacy 保持一致。需求需给出可执行测试 case，避免迁移后出现因私入口走因公接口、出差单上下文泄漏、订单 TravelType 错误等问题。

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

4. 因私 public 产品链路：
   - legacy ryx 存在独立 public 产品模块，不是简单在 TMC 页面中改 `TravelType=2`。
   - public 首页入口在 `tab-public-home_ryx` 中分别跳转 `public-flight-search`、`public-hotel-search`、`public-train-search`。
   - `ryx-routing.module.ts` 显式注册 `PublicFlightRyxModule`、`PublicTrainRyxModule`、`PublicHotelRyxModule`、`PublicOrderModule`。
   - public 机票链路包含 `public-flight-search_ryx`、`public-flight-list_ryx`、`public-flight-book_ryx`、乘客选择/新增/编辑等页面；接口使用 `TmcTouristFlightUrl-*`、`TmcTouristBookUrl-Flight-*`。
   - public 火车链路包含 `public-train-search_ryx`、`public-train-list_ryx`、`public-train-book_ryx`；接口使用 `TmcTouristTrainUrl-*`、`TmcTouristBookUrl-Train-*`，并包含 12306 绑定/校验能力。
   - public 酒店链路包含 `public-hotel-search_ryx`、`public-hotel-list_ryx`、`public-hotel-detail_ryx`、`public-hotel-room-detail_ryx`、`public-hotel-book_ryx`、入住人选择/新增等页面；搜索列表接口使用 `TmcTouristHotelUrl-*`，下单初始化/提交使用 `TmcTouristBookUrl-Hotel-*`。
   - public 链路通过 `PublicService.addTouristTmcMmsIds()` 获取并追加 `TouristTmcId` / `TouristMmsId` 对应的 `TmcId` / `MmsId`，该上下文不同于 TMC 因公链路。
   - public 填单页的支付类型来自 public 初始化接口返回的 `PayTypes`，例如 `InitialPublicBookDtoModel.PayTypes`；legacy public 机票/酒店默认取返回列表第一项，火车默认值为 `OrderTravelPayType.Person`。
   - public 填单页未发现乘客级 `TravelType=2` 的显式赋值；因私语义主要由 public 路由、`TmcTourist*` 接口域、tourist TMC/MMS 上下文、个人支付/校验链路共同承载。
   - public 链路不调用 `TmcService.hasGetTravelUrl()` / `TmcApiBookUrl-Home-GetTravelUrl`，不展示因公 `TravelNumber` 选择入口。

5. 员工预订权限：
   - `HrService.isSelfBookType()` 根据 Staff `BookType` 判断本人预订 / 代订能力。
   - 该能力决定是否自动补本人、是否允许添加乘客、是否展示新增证件等。
   - `BookType` 不是因公 / 因私标识，H5 不得将本人预订误判为因私。

6. 出差单上下文：
   - 出差单上下文仅属于因公 / TMC 预订链路；因私 / public 链路不应调用出差单能力。
   - `TmcService.hasGetTravelUrl()` 判断 TMC 是否开启出差单能力，只应在当前出行模式为因公时触发。
   - `getStaffTravelNumber()` 调用 `TmcApiBookUrl-Home-GetTravelUrl` 获取出差单，只应服务于因公填单页的 `TravelNumber` 选择。
   - `getBkPassengerInfo()` 将 `TravelFormId`、`TravelNumber` 写入乘客 `travelFormId`、`travelNumber`。
   - 有出差单上下文时，legacy 会禁用普通加乘客、删除、重选，并按出差单乘客和行程约束继续预订。
   - `checkIfShouldAddTravelNumberPassenger()` 在配置要求先申请出差单且当前未绑定出差单时弹窗提示「选择申请单预订 / 继续查询」。
   - 因私模式不得展示 `TravelNumber` 出差单选择入口，不得触发“先申请出差单”提示，不得提交 `travelFormId` / `travelNumber`。

7. 产品填单与提交：
   - 机票、火车、酒店 TMC 填单页默认 `combineInfo.travelType = OrderTravelType.Business`。
   - 提交时将 `combineInfo.travelType` 写入乘客级 `Passenger.TravelType`。
   - 同时写入 `TravelPayType`、审批人、成本中心、组织、差旅政策、违规原因、外部编号、出差单号等字段。

8. 审批相关：
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

2. 待迁移 / 待核对能力逐项分析：

| 序号 | 能力项 | 确定 / 不确定 | 分析结论 | 本期处理 |
| ---- | ---- | ---- | ---- | ---- |
| 1 | 因私 Tab 是否按 legacy 走 public / tourist 接口链路 | 已确定，必须迁移 | legacy 因私由 `public-flight/train/hotel-*` 页面承载，但迁移到 H5 时不要求复制这些 Angular/Ionic 路由和视觉；真正必须迁移的是 `TmcTourist*` 接口域、tourist `TmcId/MmsId` 上下文、public 初始化、支付与字段规则。当前 H5 产品搜索、列表、详情、填单仍以 `TmcApi*` / `TmcApiBookUrl-*` 主链路为主，`TravelType=2` 只能表达订单字段，不能等价 legacy 因私。 | 本期纳入迁移重点：在 H5 现有页面内按模式切换到 `TmcTouristFlightUrl` / `TmcTouristTrainUrl` / `TmcTouristHotelUrl` / `TmcTouristBookUrl` / `TmcTouristOrderUrl`。 |
| 2 | 首页产品入口是否区分因公 / 因私的搜索、列表、详情、填单、支付差异 | 已确定 legacy 区分，H5 未完整区分 | legacy 因公入口走 TMC 产品页面与 `TmcApi*` 接口；因私入口走 public 产品页面与 `TmcTourist*` 接口。H5 当前主要通过 `sessionStorage` + `resolveFlightTravelType()` 在订单 DTO 写 `TravelType=1/2`，尚未按 legacy 切换产品接口域、public 初始化、public 支付/订单链路。 | 本期必须补齐域名 / Method / 上下文隔离：因公继续走 `TmcApi*`，因私在 H5 页面内走 `TmcTourist*` 并注入 `TouristTmcId/TouristMmsId`。 |
| 3 | Workbench 动态入口、权限显隐、角标 | 确定但本期不做 | legacy 首页入口来自 Workbench 动态配置；H5 目前为静态入口。用户明确本期不做 Workbench 动态入口、权限显隐、待办角标。 | 本期不做；不作为当前需求设计、开发、验收范围。 |
| 4 | 出差单上下文跨页面保留 | 确定 | 因公选择 `TravelNumber` 后必须保留 `travelFormId`、`travelNumber`、乘客和行程约束，并在填单/提交时带入；不能只保留乘客姓名或证件。 | 本期纳入迁移重点。 |
| 5 | `GetTravelUrl` 开关、必填外部编号、出差单弹窗、禁用编辑 | 确定 | `TmcService.hasGetTravelUrl()` 和 `TmcApiBookUrl-Home-GetTravelUrl` 只属于因公 / TMC 链路；因私不调用、不展示 `TravelNumber`、不触发出差单必选提示、不提交 `travelFormId/travelNumber`。 | 本期纳入迁移重点。 |
| 6 | 审批任务列表、详情跳转、ticket 拼接、iframe / 全页打开策略 | 确定但本期暂缓 | legacy 审批入口和任务详情逻辑明确，但用户要求审批先不要动。 | 本期不改审批能力；仅保留现状，不新增列表、角标、详情跳转相关工作。 |

### 3.3 迁移范围
1. 首页因公 / 因私模式：
   - 保留 H5 当前首页模式选择能力，UI 可按新的 H5 设计规范调整，不复刻 legacy Ionic 样式。
   - 明确模式选择后对产品入口、路由、订单参数的影响。
   - 因公默认 `TravelType=1`，因私默认 `TravelType=2`。

2. 因公产品入口：
   - 机票、火车、酒店进入 TMC 预订链路。
   - 本期聚焦产品预订链路的因公 / 因私模式隔离，不新增审批入口能力。
   - 待办角标本期不做。
   - Workbench 动态入口和权限显隐本期不做。

3. 因私产品入口：
   - 本期必须迁移 legacy public / tourist 接口链路，不再把 `TravelType=2` 作为因私迁移完成标准。
   - 迁移方式是在当前 H5 机票、火车、酒店页面内按出行模式切换接口、DTO 和字段展示；不要求新增 `public-flight-*` / `public-train-*` / `public-hotel-*` 旧路由，也不复刻 legacy 页面视觉。
   - 因私机票搜索、列表、详情、填单、校验、下单在 H5 对应页面中切换到 `TmcTouristFlightUrl-*`、`TmcTouristBookUrl-Flight-*`。
   - 因私火车搜索、列表、填单、12306 绑定 / 校验、下单在 H5 对应页面中切换到 `TmcTouristTrainUrl-*`、`TmcTouristBookUrl-Train-*`。
   - 因私酒店城市、条件、关键字、列表、详情、填单、下单在 H5 对应页面中切换到 `TmcTouristHotelUrl-*`、`TmcTouristBookUrl-Hotel-*`。
   - 因私公共填单能力需覆盖 `TmcTouristBookUrl-Home-Country`、`TmcTouristBookUrl-Home-Credentials`、`TmcTouristBookUrl-{Flight|Train|Hotel}-CheckPay`，用于国家 / 证件 / 支付状态检查等 public 辅助能力。
   - 因私订单、支付、订单详情等 H5 已覆盖的后续链路需切换到 `TmcTouristOrderUrl-*`；若当前 H5 已实现待出行、取消、退改签、出票 / 退票、酒店短信核验等能力，也必须按 legacy 切换 tourist order Method。未在当前 H5 版本覆盖的 legacy public 订单 / 售后页面，不因本需求强制新增完整页面。
   - H5 需新增 tourist context：从 URL query 或 `TmcApiHomeUrl-Home-Tourist` 获取 `TouristTmcId` / `TouristMmsId`，并按 legacy `PublicService.addTouristTmcMmsIds()` 规则注入请求顶层 `TmcId/MmsId` 及 `Data.TmcId`。
   - public 填单页支付类型来自 tourist 初始化接口返回的 `PayTypes`，不能沿用因公审批 / 组织 / 成本中心逻辑。
   - 因私模式不调用 `TmcService.hasGetTravelUrl()`，不调用 `TmcApiBookUrl-Home-GetTravelUrl`，不展示 `TravelNumber` 出差单选择入口。

4. 出差单能力：
   - 仅在因公模式通过 `TmcApiBookUrl-Home-GetTravelUrl` 获取出差单。
   - 支持按产品类型 `Flight` / `Train` / `Hotel` 过滤。
   - 选择出差单后保留 `travelFormId`、`travelNumber`、乘客、行程约束。
   - 有出差单时禁用不应编辑的乘客与外部编号字段。

5. 审批能力：
   - 本期不迁移 `tmc-approval-task` 待我审批 / 已审任务。
   - 本期不新增「我的申请 / 我的审批」外链或 Workflow 列表能力。
   - 本期不处理审批任务详情跳转、ticket 拼接、iframe / 全页打开策略。

### 3.4 不在本期范围
1. BPM 报销全流程。
2. legacy 所有 public 产品页面的完整视觉复刻。
3. legacy `public-*` Angular/Ionic 路由的一比一搬迁；本期以 H5 现有路由 / 页面为承载进行接口和交互迁移。
4. 出差申请表单原生重写，除非补充 workflow 表单 API 文档并单独立项。
5. 国际机票、国际酒店、用车等非当前 H5 主链路，除非后续明确纳入。
6. 待办角标能力，包括 `TmcApiHomeUrl-Home-GetAccountWaitingTasks` 展示。
7. 审批任务列表、审批详情跳转、审批 iframe / 全页打开策略。
8. Workbench 动态入口和权限显隐。
9. 国际 public 链路、用车 public 链路、public 动态航班等非本期三产品能力，除非后续明确纳入。
10. 当前 H5 尚未实现的 legacy public 订单 / 售后独立页面，除非后续明确纳入。

## 四、验收标准
### 4.1 功能验收
1. 首页切换「因公出行」后，进入机票、火车、酒店下单流程，订单 payload 中乘客级 `TravelType` 为 `1`。
2. 首页切换「因私出行」后，机票、火车、酒店搜索 / 列表 / 详情 / 填单 / 下单必须走 `TmcTourist*` 域名族，不得继续走对应 `TmcApi*` 产品域。
3. 因私请求必须注入 tourist `TmcId/MmsId`：顶层 `TmcId/MmsId` 与 `Data.TmcId` 均与 legacy `PublicService.addTouristTmcMmsIds()` 等价。
4. Staff `BookType=Self` 时，H5 按本人预订限制处理，不得改变因公 / 因私模式。
5. Staff `BookType=All` 或允许代订时，可按 legacy 选择乘客；因公模式仍走员工 / TMC 乘客链路，因私模式走 public 常旅客 / 入住人链路。
6. TMC 开启 `GetTravelUrl` 且当前为因公模式时，填单页可选择出差单，并能按产品类型过滤 `Flight` / `Train` / `Hotel`。
7. 当前为因私模式时，H5 不调用 `TmcService.hasGetTravelUrl()`，不调用 `TmcApiBookUrl-Home-GetTravelUrl`，不展示 `TravelNumber` 出差单选择入口，不触发出差单必选提示，不提交 `TravelFormId` / `travelFormId` / `travelNumber`。
8. 选择出差单后，H5 保留并提交 `travelFormId`、`travelNumber`，且乘客编辑、删除、重选限制与 legacy 一致。
9. 配置要求先申请出差单且未绑定出差单时，仅因公模式出现明确提示，并提供「选择申请单预订」与「继续查询」等价路径。
10. 本期不新增待办角标、审批列表、审批任务详情跳转能力；既有审批入口保持现状，不作为本需求验收项。
11. 因私机票必须覆盖 `TmcTouristFlightUrl-Home-Index`、`TmcTouristFlightUrl-Home-Detail`、`TmcTouristBookUrl-Flight-Initialize`、`TmcTouristBookUrl-Flight-Validate`、`TmcTouristBookUrl-Flight-Book`。
12. 因私火车必须覆盖 `TmcTouristTrainUrl-Home-Search`、`TmcTouristTrainUrl-Home-Schedule`、`TmcTouristBookUrl-Train-Initialize`、`TmcTouristBookUrl-Train-Book`，并保留 `TmcTouristBookUrl-Train-Bind` / `Unbind` / `AccountValidate` / `CodeValidate` / `GetContacts` / `GetBindAccountNumber` 等 12306 绑定 / 校验能力入口。
13. 因私酒店必须覆盖 `TmcTouristHotelUrl-Condition-Gets`、`TmcTouristHotelUrl-Home-SearchHotel`、`TmcTouristHotelUrl-Home-List`、`TmcTouristHotelUrl-Home-Detail`、`TmcTouristBookUrl-Hotel-Initialize`、`TmcTouristBookUrl-Hotel-Book`。
14. 因私公共填单能力必须覆盖 `TmcTouristBookUrl-Home-Credentials`、`TmcTouristBookUrl-Home-Country`、`TmcTouristBookUrl-{Flight|Train|Hotel}-CheckPay`，不能仅复用因公员工 / TMC 证件和支付检查能力。
15. 因私订单和支付必须走 tourist 订单 / 支付域；H5 已覆盖的订单列表 / 详情、支付、待出行、取消、退改签、出票 / 退票、酒店短信核验等链路，不得继续调用因公 `TmcApiOrderUrl-*`。酒店支付需兼容 `TmcTouristHotelUrl-Pay-Create` / `TmcTouristHotelUrl-Pay-Process`。
16. `TravelType=2` 只能作为 DTO 字段之一，不得作为因私迁移完成的唯一判断。

### 4.2 测试 Case
| 编号 | 场景 | 前置条件 | 操作 | 预期 |
| ---- | ---- | ---- | ---- | ---- |
| TC-01 | 因公默认模式 | 首次进入 H5，无 session | 打开首页 | 默认选中因公，产品搜索可用，`resolveFlightTravelType()` 返回 `1` |
| TC-02 | 切换因私模式 | 首页已加载 | 点击因私出行后进入机票搜索 / 列表 / 填单 | session 保存 personal，机票请求走 `TmcTouristFlightUrl-*` / `TmcTouristBookUrl-Flight-*`，并注入 tourist `TmcId/MmsId` |
| TC-03 | 因私模式切回因公 | session 为 personal | 点击因公出行后进入酒店填单 | session 保存 business，酒店提交 `TravelType=1` |
| TC-04 | 因公机票下单 | TMC 用户，有乘客 | 搜索机票、选舱、填单提交 | 每位乘客 `TravelType=1`，保留审批/组织/成本中心字段 |
| TC-05 | 因私机票下单 | 用户切到因私 | 搜索机票、选舱、填单提交 | 搜索 / 详情 / 初始化 / 校验 / 下单均走 `TmcTourist*`；不调用出差单；支付进入 tourist 订单域 |
| TC-06 | 因公火车下单 | TMC 用户，有乘客 | 搜索火车、选座、填单提交 | 每位乘客 `TravelType=1` |
| TC-07 | 因私火车下单 | 用户切到因私 | 搜索火车、选座、填单提交 | 搜索 / 时刻表 / 初始化 / 下单均走 `TmcTourist*`；12306 绑定 / 校验使用 `TmcTouristBookUrl-Train-*` |
| TC-08 | 因公酒店下单 | TMC 用户，有乘客 | 搜索酒店、选房型、填单提交 | 每位入住人 `TravelType=1` |
| TC-09 | 因私酒店下单 | 用户切到因私 | 搜索酒店、选房型、填单提交 | 条件 / 关键字 / 列表 / 详情 / 初始化 / 下单均走 `TmcTourist*`；不显示因公申请单强绑定 |
| TC-10 | Self 本人预订 | Staff.BookType=Self | 进入任一产品填单 | 自动带本人或限制加人，但不改变当前因公/因私 TravelType |
| TC-11 | 可代订 | Staff.BookType=All | 添加多名乘客 | 可选多人，每人按当前模式写入 TravelType |
| TC-12 | 开启 GetTravelUrl | TMC.GetTravelUrl 有效 | 填单页点击出差单/外部编号选择 | 调用 `TmcApiBookUrl-Home-GetTravelUrl`，按产品类型返回可选出差单 |
| TC-13 | 选择出差单 | 已返回出差单 | 选择一条 TravelNumber | 乘客写入 `travelFormId`、`travelNumber`，外部编号展示选中值 |
| TC-14 | 出差单锁定乘客 | 已选择出差单 | 尝试删除/重选乘客 | 与 legacy 一致限制操作，并给出提示 |
| TC-15 | 必须先申请单 | TMC 配置要求先申请，未选出差单 | 进入查询/填单 | 出现提示，可选择申请单预订或继续查询 |
| TC-16 | 因私不取出差单 | TMC.GetTravelUrl 有效，用户切到因私 | 进入任一产品填单 | 不调用 `hasGetTravelUrl` / `GetTravelUrl`，不展示 TravelNumber 选择，不提交 `travelFormId` / `travelNumber` |
| TC-17 | 因公才提示申请单 | TMC 配置要求先申请单 | 分别在因公、因私进入查询/填单 | 因公出现申请单提示；因私不出现该提示 |
| TC-18 | 审批与角标不变更 | 当前 H5 有既有出差申请/审批入口 | 打开首页查看因公面板 | 本需求不新增角标，不要求审批列表/详情变化，既有入口不因本需求回归 |
| TC-19 | GetTravelUrl 失败降级 | 因公模式，GetTravelUrl 接口失败 | 进入填单页选择 TravelNumber | 页面显示错误/空状态，不影响返回和其它产品搜索 |
| TC-20 | 刷新保持模式 | session 已保存 personal | 刷新首页 | 仍选中因私，后续产品请求继续走 `TmcTourist*` 链路，订单 DTO 写入 `TravelType=2` |
| TC-21 | 新会话默认值 | 新开无 session 会话 | 打开首页 | 默认因公，符合 legacy TMC 主流程 |
| TC-22 | 因私不触发因公接口 | 用户切到因私 | 进入机票、火车、酒店搜索、填单并提交 | 不调用 `TmcApiFlightUrl` / `TmcApiTrainUrl` / `TmcApiHotelUrl` / `TmcApiBookUrl-Home-GetTravelUrl`，不提交 `TravelFormId` / `TravelNumber` |
| TC-23 | Tourist 上下文注入 | URL 带 `TouristTmcId/TouristMmsId` 或可通过 `Home-Tourist` 获取 | 进入任一因私产品请求 | 请求顶层 `TmcId/MmsId` 和 `Data.TmcId` 使用 tourist ids |
| TC-24 | 因私订单 / 支付域 | 因私下单成功 | 跳转支付、订单详情、取消或退改签 | 订单 / 支付请求走 `TmcTouristOrderUrl-*`；酒店支付走 `TmcTouristHotelUrl-Pay-*` 特例 |
| TC-25 | 因私公共证件能力 | 用户切到因私并选择乘客 / 入住人 | 进入机票、火车、酒店填单 | 证件获取走 `TmcTouristBookUrl-Home-Credentials`，国家数据按需走 `TmcTouristBookUrl-Home-Country` |
| TC-26 | 因私 CheckPay | 因私下单返回 `IsCheckPay=true` | 进入支付等待 / 检查流程 | 按产品调用 `TmcTouristBookUrl-{Flight|Train|Hotel}-CheckPay`，不调用因公支付检查接口 |
| TC-27 | 因私待出行 / 售后 | 因私订单已生成，且当前 H5 已有对应入口 | 查看待出行、火车出票取消、机票退票、酒店短信核验 / 取消 | 已有入口走 tourist order 对应 Method；当前 H5 未覆盖的 legacy 售后入口不作为本期新增页面验收 |

## 五、非功能要求（可选）
1. 状态隔离：`channel` / `travelMode`、`bookPermission`、`travelFormContext`、`orderTravelType` / `orderTravelPayType` 必须分层管理，避免单个字段承载全部语义。
2. 可观测性：出行模式切换、出差单选择、GetTravelUrl 失败需保留 console 或埋点扩展点，便于排查真实环境问题。
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
   - `beeantmobile-main/projects/ryx/src/app/tabs/tab-public-home_ryx/tab-public-home_ryx.page.ts`
   - `beeantmobile-main/projects/ryx/src/app/tmc/ryx-routing.module.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public.service.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-flight/public-flight_ryx.routing.module.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-flight/public-flight.service.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-flight/public-flight-book_ryx/public-flight-book_ryx.page.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-train/public-train_ryx-routing.module.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-train/public-train.service.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-train/public-train-book_ryx/public-train-book_ryx.base.page.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-hotel/public-hotel_ryx-routing.module.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-hotel/public-hotel.service.ts`
   - `beeantmobile-main/projects/ryx/src/app/public/public-hotel/public-hotel-book_ryx/public-hotel-book_ryx.page.ts`
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
   - `rongyixing-monorepo/packages/api/src/methods/book.ts`
   - `rongyixing-monorepo/packages/api/src/methods/flight.ts`
   - `rongyixing-monorepo/packages/api/src/methods/train.ts`
   - `rongyixing-monorepo/packages/api/src/methods/hotel.ts`

3. 本期因公接口依赖：
   - `TmcApiBookUrl-Home-GetTravelUrl`

4. 本期因私 public/tourist 接口依赖：
   - `TmcTouristBookUrl-Home-Country`
   - `TmcTouristBookUrl-Home-Credentials`
   - `TmcTouristBookUrl-Flight-CheckPay`
   - `TmcTouristBookUrl-Train-CheckPay`
   - `TmcTouristBookUrl-Hotel-CheckPay`
   - `TmcTouristFlightUrl-Home-Index`
   - `TmcTouristFlightUrl-Home-Detail`
   - `TmcTouristBookUrl-Flight-Initialize`
   - `TmcTouristBookUrl-Flight-Validate`
   - `TmcTouristBookUrl-Flight-Book`
   - `TmcTouristTrainUrl-Home-Search`
   - `TmcTouristTrainUrl-Home-Schedule`
   - `TmcTouristBookUrl-Train-Initialize`
   - `TmcTouristBookUrl-Train-Book`
   - `TmcTouristBookUrl-Train-Bind`
   - `TmcTouristBookUrl-Train-Unbind`
   - `TmcTouristBookUrl-Train-AccountValidate`
   - `TmcTouristBookUrl-Train-CodeValidate`
   - `TmcTouristBookUrl-Train-GetContacts`
   - `TmcTouristBookUrl-Train-GetBindAccountNumber`
   - `TmcTouristHotelUrl-Condition-Gets`
   - `TmcTouristHotelUrl-Home-SearchHotel`
   - `TmcTouristHotelUrl-Home-List`
   - `TmcTouristHotelUrl-Home-Detail`
   - `TmcTouristBookUrl-Hotel-Initialize`
   - `TmcTouristBookUrl-Hotel-Book`
   - `TmcTouristHotelUrl-Pay-Create`
   - `TmcTouristHotelUrl-Pay-Process`
   - `TmcTouristOrderUrl-Order-List`
   - `TmcTouristOrderUrl-Order-Detail`
   - `TmcTouristOrderUrl-Travel-List`
   - `TmcTouristOrderUrl-Pay-GetTotalPayAmount`
   - `TmcTouristOrderUrl-Order-GetOrderPays`
   - `TmcTouristOrderUrl-Pay-GetOrderPays`
   - `TmcTouristOrderUrl-Pay-Create`
   - `TmcTouristOrderUrl-Pay-Process`
   - `TmcTouristOrderUrl-Order-IssueTrain`
   - `TmcTouristOrderUrl-Order-CancelTrain`
   - `TmcTouristOrderUrl-Order-RefundFlight`
   - `TmcTouristOrderUrl-Order-SendVerifyOrderHotelSMSCode`
   - `TmcTouristOrderUrl-Order-ConfirmVerifyOrderHotelSMSCode`
   - `TmcTouristOrderUrl-Order-AbolishOrder`
   - `TmcTouristOrderUrl-Order-AbolishTicket`
   - `TmcTouristOrderUrl-Order-CancelOrderHotel`

5. 后续参考接口 / 外链（本期不做）：
   - `HrApiUrl-Workbench-Load`
   - `TmcApiHomeUrl-Home-GetAccountWaitingTasks`
   - `TmcApiOrderUrl-Task-List`
   - Workflow 申请 / 审批外链：`workflow.rtesp.com/Form/Flow`、`workflow.rtesp.com/Task/Index`

6. 已有参考文档：
   - `docs/ryx/核心业务逻辑.md`
   - `docs/api/domains/travel-module-migration-strategy.md`
   - `docs/api/fixtures/travel-proxy/api-catalog.json`

## 七、备注
1. `{项目根}`：`/Users/jiangjiankang/work/self/rongyixing/rongyixing-monorepo`
2. `{变更根}`：`docs/changes`
3. 本 PRD 聚焦「在现有 H5 版本上迁移 legacy 因公 / 因私接口与业务差异」，不要求复刻 legacy 页面结构，不直接修改业务代码。
4. 后续技术设计阶段需进一步把测试 case 拆成具体实现任务、接口契约、组件状态模型和自动化测试清单。
