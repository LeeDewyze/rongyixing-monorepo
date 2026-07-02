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
   - public 填单页的支付类型来自 public 初始化接口返回的 `PayTypes` 或产品默认值，例如 `InitialPublicBookDtoModel.PayTypes`；legacy public 机票 / 酒店默认取返回列表第一项，public 火车下单确认页不展示支付方式选择，默认 `OrderTravelPayType.Person`，金额确认页取 `PayTypes[0]` 用于后续支付。
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
   - legacy public 机票 / 火车旅客来自常旅客体系，提交 `PassengerDto` 主要写旅客证件、手机号、产品资源、保险 / 座位等字段；未见因公审批、组织、成本中心、TravelNumber。
   - legacy public 酒店以房间为核心填写入住人：每间房填写 1 个住客姓名，可带入常旅客，也可手填姓名、证件类型、证件号、联系人手机号、到店时间；到店付 / 担保场景展示信用卡与持卡人证件信息。
   - public 酒店不是简单复用因公员工 passenger 表单；H5 personal 酒店需要按房间入住人模型迁移。

8. 审批相关：
   - 待我审批 / 已审任务入口为 `tmc-approval-task`。
   - 首页待办角标来自 `TmcApiHomeUrl-Home-GetAccountWaitingTasks`。
   - 任务列表来自 TMC/Workflow 相关接口；任务详情 legacy 会拼接 `HandleUrl`、`taskid`、`ticket`、`isApp=true` 打开。

### 3.2 H5 现状对比
1. 已有能力：
   - 首页已有「因公出行 / 因私出行」Tab，代码位于 `apps/h5/src/components/home/HomeHeroSection.tsx`。
   - H5 使用 `sessionStorage` 保存 `ryx_home_travel_mode`，并通过 `resolveFlightTravelType()` 映射：business → `1`，personal → `2`。
   - 机票、酒店、火车下单已读取该映射并写入订单 DTO 的 `TravelType`。
   - H5 当前 `flight-book.ts`、`train-book.ts`、`hotel-book.ts` 已具备因公字段构造能力，包括审批、组织、成本中心、超标原因、外部编号、授权联系人、出差单上下文；personal 模式需要新增字段清理与 public DTO 分支。
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

### 3.3 列表页 / 详情页公私差异
#### 3.3.1 机票列表页 / 详情页
1. legacy 因公机票：
   - 页面链路为 `tmc-flight-search` → `tmc-flight-list_ryx` → `tmc-flight-item-cabins_ryx` → `tmc-flight-book_ryx`。
   - 列表接口为 `TmcApiFlightUrl-Home-Index`，请求 `Data` 包含 `Date`、`FromCode`、`ToCode`、`FromAsAirport`、`ToAsAirport`。
   - 详情 / 舱位接口为 `TmcApiFlightUrl-Home-Detail`，请求 `Data` 包含 `Date`、`FromCode`、`ToCode`、`FlightNumber`、`FromAsAirport`、`ToAsAirport`、`ADTPtcs`、`DetailKey`、`BookType`，并在有 `Language` 时追加 `Lang`。
   - `ADTPtcs` 来自当前已选乘机人数；本人预订时固定为 `1`；超过 9 人阻断。
   - 舱位页会结合 `TmcApiFlightUrl-Home-Policy`、员工白名单、`CheckPolicyUrl`、乘客 `AccountId` 做差标筛选和不可预订阻断；多乘客时可按乘客筛选差标舱位。
   - 点击预订后进入 TMC 因公填单页，后续初始化使用 `TmcApiBookUrl-Flight-Initialize`，并保留因公审批、组织、成本中心、超标原因、出差单等字段能力。

2. legacy 因私机票：
   - 页面链路为 `public-flight-search` → `public-flight-list_ryx` → `public-flight-item-cabins_ryx` → `public-flight-book_ryx`。
   - 列表接口为 `TmcTouristFlightUrl-Home-Index`，基础请求字段与因公列表一致。
   - 详情 / 舱位接口为 `TmcTouristFlightUrl-Home-Detail`，请求 `Data` 包含 `Date`、`FromCode`、`ToCode`、`FlightNumber`、`FromAsAirport`、`ToAsAirport`、`ADTPtcs`、`DetailKey`；legacy public 详情代码未发现像因公一样显式传 `BookType`。
   - 因私机票服务维护 public 常旅客、常用卡、乘客预订信息，不使用 TMC 员工审批 / 成本中心 / 出差单语义。
   - 点击预订后进入 public 因私填单页，后续初始化、校验、提交分别使用 `TmcTouristBookUrl-Flight-Initialize`、`TmcTouristBookUrl-Flight-Validate`、`TmcTouristBookUrl-Flight-Book`。
   - public 列表接口在 NDC 开启时会给 `Home-Index` 追加 `BookType=TravelNDC`；H5 迁移时需核对当前租户是否仍需要该开关能力，不能默认把所有因私机票都固定为普通 BookType。

3. H5 当前差异与迁移要求：
   - 当前 H5 `flight-search.ts` 已按 legacy 因公构造 `Home-Index` 请求字段，`FlightListPage.tsx` → `prefetchFlightCabinsPolicy()` → `flight-detail.ts` 已按 `Home-Detail` + policy 预取进入 `/flight/cabins`。
   - 当前 H5 机票列表 / 舱位详情仍以 `api.flight.getFlightList`、`api.flight.getFlightDetail`、`api.flight.getFlightPolicy` 为主链路；本需求需要按出行模式切换接口 Method：因公继续 `TmcApiFlightUrl-*`，因私改为 `TmcTouristFlightUrl-*`。
   - 因私列表页应复用 H5 新 UI，但请求域、tourist `TmcId/MmsId` 注入、常旅客上下文、预订跳转必须按 public 链路处理；不得只在下单 DTO 写 `TravelType=2`。
   - 因私详情 / 舱位页应保留舱位展示、经济舱 / 其他舱位分组、余票、退改签、行李等展示能力；差标筛选、因公不可订阻断、审批相关提示需按 public 能力降级或隐藏，避免展示因公规则。
   - 因私机票进入填单时必须保存 public 选舱结果，并进入 personal/public 填单分支，不得复用因公 `TravelNumber`、审批、组织、成本中心和授权联系人字段。

#### 3.3.2 酒店列表页 / 详情页
1. legacy 因公酒店：
   - 页面链路为 `tmc-hotel-search` → `tmc-hotel-list_ryx` → `tmc-hotel-detail_ryx` → `tmc-hotel-room-detail_ryx` / `tmc-hotel-book_ryx`。
   - 条件接口为 `TmcApiHotelUrl-Condition-Gets`，关键字接口为 `TmcApiHotelUrl-Home-SearchHotel`。
   - 列表接口为 `TmcApiHotelUrl-Home-List`，请求会合并酒店查询条件，核心包含 `CityCode`、`BeginDate`、`EndDate`、`IsLoadDetail=true`、`Tag`、`travelformid`、`hotelType`，并按条件传入 `SearchKey`、`HotelId`、`Lat`、`Lng`、`searchGeoId` 等。
   - 详情接口为 `TmcApiHotelUrl-Home-Detail`，请求包含 `HotelId`、`CityCode`、`BeginDate`、`EndDate`、`IsLoadDetail=true`、`Tag`、`travelformid`、`hotelType`。
   - 酒店详情 / 房型选择会调用 `TmcApiHotelUrl-Home-Policy`，按员工乘客和 `RoomPlanUniqueId` 返回可订 / 超标 / 禁订状态；选房时会检查员工差标、是否允许自付、是否满房 / 无权限。
   - 点击预订后进入 TMC 因公酒店填单页，后续初始化 / 提交使用 `TmcApiBookUrl-Hotel-Initialize`、`TmcApiBookUrl-Hotel-Book`，并携带因公入住人、组织、成本中心、审批、TravelNumber 等字段。

2. legacy 因私酒店：
   - 页面链路为 `public-hotel-search` → `public-hotel-list_ryx` → `public-hotel-detail_ryx` → `public-hotel-room-detail_ryx` / `public-hotel-book_ryx`。
   - 条件接口为 `TmcTouristHotelUrl-Condition-Gets`，关键字接口为 `TmcTouristHotelUrl-Home-SearchHotel`。
   - 列表接口为 `TmcTouristHotelUrl-Home-List`，请求字段与因公列表相近，同样包含 `CityCode`、`BeginDate`、`EndDate`、`IsLoadDetail=true`、`Tag`、`travelformid`、`hotelType`，并按条件传 `SearchKey`、`HotelId`、`Lat`、`Lng`、`searchGeoId`。
   - 详情接口为 `TmcTouristHotelUrl-Home-Detail`，请求字段与因公详情相近，但接口域切换到 tourist。
   - public 酒店详情页保留酒店图片、房型、房价、规则、房间详情、地图等展示；从代码看 `initBookButtonColors()` 中差标数据为空数组，选房主要按 public 房型库存 / 规则处理，不走因公员工差标阻断。
   - 点击房型后只保存一个 public `bookInfo`，包含 `roomPlan`、`hotelRoom`、`hotelEntity`、信用卡担保信息等，然后跳转 `public-hotel-book_ryx`；填单按每间房入住人模型继续，不使用因公员工 passenger 表单。

3. H5 当前差异与迁移要求：
   - 当前 H5 已有 `/hotel/list`、`/hotel/detail/:hotelId`、`/hotel/room/:hotelId/:roomId`、`/hotel/book`，列表 / 详情 UI 可以继续复用。
   - 当前 H5 `HotelDetailPage.tsx` 对房型预订强依赖 `selectedPassengers`、`useHotelPolicy`、`HotelPolicyFilterSheet` 和因公差标颜色；personal 模式下需要改为 public 酒店预订语义：不要求先选 TMC 员工，不展示因公差标筛选，不阻断因公差标规则。
   - 因私酒店列表、详情、关键字、条件必须切换到 `TmcTouristHotelUrl-*`，并注入 tourist `TmcId/MmsId`；不能只复用 `TmcApiHotelUrl-*` 加 `TravelType=2`。
   - 因私酒店应保留当前 H5 酒店列表筛选、关键字、位置区域、地铁三栏、品牌分类等新 UI 能力，但接口 Method、请求字段、选房上下文和填单模型必须按 public 链路。
   - 因私选房进入填单时应保存 public room-based selection：酒店、房型、房价计划、房间数、担保 / 到店信息等；不得带入因公员工差标、审批、组织、成本中心、TravelNumber。
   - 因公酒店仍保留现有 H5 员工乘客、差标筛选、超标提示、自付规则、TravelNumber 和审批字段能力。

#### 3.3.3 火车票列表页 / 详情页
1. legacy 因公火车：
   - 页面链路为 `tmc-train-search` → `tmc-train-list_ryx` → 列表项席别展开 / 经停时刻 → `tmc-train-book`。
   - 火车票没有独立详情页文件；legacy 的详情能力主要体现在列表项展开席别、席位偏好组件、经停时刻弹层。
   - 搜索接口为 `TmcApiTrainUrl-Home-Search`，请求 `Data` 包含 `Date`、`FromStation`、`ToStation`、`TrainCode`，`Version=1.0`。
   - 经停时刻接口为 `TmcApiTrainUrl-Home-Schedule`，请求包含 `Date`、`FromStation`、`ToStation`、`TrainNo`、`TrainCode`，`Version=1.0`。
   - 车次列表加载后调用 `TmcApiTrainUrl-Home-Policy`，请求 `Passengers` 和序列化后的 `Trains`；如果乘客来自出差单，会追加 `TravelFromId`。
   - 席别选择会按乘客 `AccountId` 匹配差标，非代理人对 `IsAllowBook=false` 的席别阻断；代理人可继续但需展示超标提示。
   - 12306 绑定 / 校验接口走 `TmcApiBookUrl-Train-Bind`、`Unbind`、`AccountValidate`、`CodeValidate`、`GetContacts`、`GetBindAccountNumber`。
   - 点击席别后进入 `tmc-train-book`，初始化 / 提交使用 `TmcApiBookUrl-Train-Initialize`、`TmcApiBookUrl-Train-Book`，并携带因公乘客、审批、差标、TravelNumber 等字段。

2. legacy 因私火车：
   - 页面链路为 `public-train-search` → `public-train-list_ryx` → 列表项席别展开 / 经停时刻 → `public-train-book`。
   - 搜索接口为 `TmcTouristTrainUrl-Home-Search`，请求字段与因公一致：`Date`、`FromStation`、`ToStation`、`TrainCode`，`Version=1.0`。
   - 经停时刻接口为 `TmcTouristTrainUrl-Home-Schedule`，请求字段与因公一致。
   - public 火车 12306 绑定 / 校验接口全部切换到 `TmcTouristBookUrl-Train-*`：`Bind`、`Unbind`、`AccountValidate`、`CodeValidate`、`GetContacts`、`GetBindAccountNumber`。
   - public 火车服务维护常旅客、常用卡、public bookInfos；点击席别时非改签场景会先清空原选择，再保存当前车次 / 席别并进入 `public-train-book`。
   - public 火车列表代码中未看到实际调用 `TmcTouristTrainUrl-Home-Policy`；对应 policy 方法为注释状态，列表仍可显示席别余票、价格、经停、席位偏好，但不应走因公差标阻断。
   - public 火车初始化 / 提交使用 `TmcTouristBookUrl-Train-Initialize`、`TmcTouristBookUrl-Train-Book`；前面已确认 public 火车下单页不展示支付方式选择。

3. H5 当前差异与迁移要求：
   - 当前 H5 `/train/list` 已覆盖搜索列表、排序筛选、席别预订、经停展示、policy 颜色和超标阻断，并将选择保存到 `/train/book`。
   - 因公模式应继续使用 `TmcApiTrainUrl-Home-Search`、`TmcApiTrainUrl-Home-Schedule`、`TmcApiTrainUrl-Home-Policy`、`TmcApiBookUrl-Train-*`，保留员工乘客、出差单 `TravelFromId`、差标阻断、12306 企业链路。
   - 因私模式必须切换到 `TmcTouristTrainUrl-Home-Search`、`TmcTouristTrainUrl-Home-Schedule`、`TmcTouristBookUrl-Train-*`，并注入 tourist `TmcId/MmsId`。
   - 因私列表页应复用当前 H5 UI，但 policy 查询、差标颜色、差标筛选、超标阻断应按 public 语义关闭或降级；不得调用 `TmcApiTrainUrl-Home-Policy`，也不得提交出差单 `TravelFromId`。
   - 因私点击席别进入填单时应保存 public train selection：车次、席别、席位偏好、常旅客上下文；不得携带因公审批、组织、成本中心、TravelNumber。
   - 因私火车 12306 绑定、验证码、联系人同步、账号状态检查必须走 `TmcTouristBookUrl-Train-*`，不能复用因公 `TmcApiBookUrl-Train-*`。

### 3.4 旅客 / 入住人 / 联系人确定规则
1. 因公通用规则：
   - 因公机票、火车、酒店的旅客主体来自 TMC 员工 / 代订乘客体系，不来自 public 常旅客体系。
   - legacy 在列表页或详情页提供 `tmc-select-passenger` 入口，按产品类型 `Flight` / `Train` / `Hotel` 写入对应产品服务的 `bookInfos`。
   - 本人预订 `BookType=Self` 时，legacy 会自动补本人或限制添加他人；代订时可先选择员工乘客。
   - 选择出差单时，乘客由出差单上下文约束，并写入 `travelFormId`、`travelNumber`，后续不能按普通流程随意删除 / 重选。
   - 因公填单页的主要工作是补全证件、手机号、审批人、组织、成本中心、超标原因、外部编号、TravelNumber 等；旅客主体通常已经在列表 / 详情选票前确定。
   - 因公联系人不是简单等于登录人；legacy 会按乘客 / 授权联系人 / 页面联系人表单生成 `OrderLinkmanDto`，并允许出现多个联系人。

2. 因公机票旅客流程：
   - legacy 因公机票列表页 `onSelectPassenger()` 进入 `tmc-select-passenger`，并以 `forType=Flight` 写入 `TmcFlightService.bookInfos`。
   - 非本人预订且当前没有 TMC 乘客时，点击航班进入舱位前会提示「请先添加旅客」，并跳转 `tmc-select-passenger`；不能直接进入舱位 / 填单页。
   - 本人预订时，legacy 在进入舱位前调用 `addOneBookInfoToSelfBookType()` 自动补本人乘客，后续按本人证件、手机号、组织等信息生成订单旅客。
   - 舱位政策校验依赖已选 TMC 乘客：`initFlightSegmentCabinsPolicy()` 会按当前 `bookInfos` 计算差标 / 可订舱位；H5 因公机票不能脱离乘客上下文做最终舱位政策判断。
   - 因公机票填单提交时，`fillBookPassengers()` 以 `tmcFlightService.getBookInfos()` 组合出的乘客为主体，写入证件、手机号、邮箱、保险、航段、舱位、审批人、组织、成本中心、超标原因、外部编号、`TravelType=Business`、支付方式、出差单字段等。
   - 因公机票联系人由页面联系人 / 授权联系人逻辑生成 `OrderLinkmanDto`，支持多个联系人；不能简化为默认登录人，也不能复用 public 常旅客联系人规则。

3. 因私机票旅客流程：
   - legacy 因私机票列表 / 舱位页只确定航班、舱位、价格和 public `bookInfos`，不要求先选择真实乘机人，也不使用 TMC 员工乘客。
   - 点击舱位预订时，`public-flight-item-cabins_ryx.onBookTicket()` 将 `flightPolicy.Cabin` 与 `flightSegments` 写入 `touristFlightService.passengerBookInfos[0].bookInfo`，再进入 `public-flight-book`。
   - 因私机票填单页初始化时会基于已选航段 / 舱位构造轻量 `OrderBookDto.Passengers` 调用 `TmcTouristBookUrl-Flight-Initialize`；这里的 `Passengers` 只是用于初始化联系人、保险、服务和支付信息，不代表真实乘机人已经确定。
   - 填单页维护 `selectedFrequents`，点击「添加旅客」进入 `public-flight-passenger-list_ryx`，从 public 常旅客中选择 / 新增 / 编辑真实乘机人。
   - 提交前必须至少选择 1 名 public 常旅客；未选择时 legacy 提示「乘客不能为空,请添加乘客」。
   - 提交时 `fillBookPassengers()` 遍历 `selectedFrequents × bookInfos` 生成每位乘机人的 `PassengerDto`：证件类型、性别、证件号、姓、名、手机号来自常旅客，保险、航段、舱位来自已选资源，并设置 `IsSkipApprove=true`。
   - 因私机票 `PassengerDto` 不写入 TMC 员工组织、成本中心、审批人、超标原因、出差单 `TravelNumber` / `travelFormId` 等因公字段。
   - 联系人来自 public 初始化接口返回的 `initialBookDtoModel.Linkman` 并填充到 `orderLinkmanDto`；页面允许编辑联系人姓名、手机号、邮箱。联系人不是通过 TMC 员工组织关系推导，也不等同于每个旅客。

4. 因私火车：
   - 需要纠正：legacy public 火车不是列表页先选真实旅客再查票；列表页主要选择车次、席别、席位偏好，并保存 public train selection。
   - 因私火车进入 `public-train-book` 后才展示「旅客信息」和「添加旅客」，点击后进入 `public-train-freq-passenger-list`，从 public 常旅客中选择真实乘车人。
   - 填单页通过 `selectedFrequents` 保存已选常旅客；提交时 `fillBookPassengers()` 遍历 `selectedFrequents` 和已选车次 / 席别，生成 `PassengerDto`，写入旅客证件、手机号、车次、席别、保险和席位偏好。
   - 因私火车联系人由初始化接口返回的 `initialBookDto.Linkman` 填充到 `orderLinkmanDto`，页面展示联系人姓名 / 手机号 / 邮箱。H5 不再前端兜底联系人，如果接口返回为空，就说明初始化响应未提供联系人，页面仅允许用户手动填写。
   - 因私火车 12306 账号是购票账号 / 校验上下文，不等同于 H5 旅客主体；常旅客仍由 public frequent passenger 选择决定。

5. 因私酒店：
   - 因私酒店不是“选择员工旅客”，而是以房间为核心填写入住人。
   - 详情页选房后只保存 hotel / room / roomPlan / 担保信息等 public `bookInfo`，进入 `public-hotel-book_ryx`。
   - 填单页按房间数维护 `checkInPassenger.rooms`，每间房至少 1 个住客姓名，可从 `public-hotel-select-passenger` 带入常旅客，也可手填姓名、证件类型、证件号。
   - 提交时按每个房间 / 住客创建 `PassengerDto`：`RoomPlan`、`RoomCount=1`、`CheckinTime`、`Credentials.Name`、`Credentials.Number`、`CustomerName`、`CustomerCredentials`、联系人手机号等来自填单页入住人模型。
   - 联系人手机号优先来自初始化接口 `Linkman.Mobile` 或接口返回的默认客户信息，页面必须允许编辑；到店付 / 担保时还需保留信用卡和持卡人证件信息。

6. H5 迁移要求：
   - H5 不能用一个统一的“乘客选择页”覆盖所有因公 / 因私产品。因公走 TMC 员工乘客，因私机票 / 火车走 public 常旅客，因私酒店走房间入住人。
   - H5 business 机票非本人预订且未选择 TMC 乘客时，不允许直接进入舱位 / 填单；本人预订按 legacy 自动补本人。
   - H5 personal 机票列表 / 舱位页不能强制要求已选择乘客；应先允许选舱进入填单页，再在填单页要求添加 public 常旅客。
   - H5 personal 火车列表点击席别时不能强制要求已选择乘客；应先允许进入填单页，再在填单页要求添加常旅客。
   - H5 personal 机票 / 火车填单提交前必须校验至少 1 名 public 常旅客；personal 酒店提交前必须校验每间房住客姓名、必要证件和联系人手机号。
   - 联系人默认值应以对应 public 初始化接口返回的 `Linkman` 为准；如果接口返回登录人信息则展示登录人，但前端不应绕过接口自行硬编码。
   - 切换因公 / 因私时必须清理不属于当前模式的选择缓存：TMC 员工 passenger 不得进入 public payload，public frequent passenger / hotel guest 不得进入 TMC 因公 payload。

### 3.5 迁移范围
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
   - 因私机票旅客选择、删除、证件展示按 public 常旅客体系处理；订单联系人保留姓名、手机号、邮箱，不展示因公授权账号查看订单、组织、成本中心、审批、TravelNumber。
   - 因私火车搜索、列表、填单、12306 绑定 / 校验、下单在 H5 对应页面中切换到 `TmcTouristTrainUrl-*`、`TmcTouristBookUrl-Train-*`。
   - 因私火车填单页按 legacy 不展示支付方式选择；提交时支付类型使用 public 火车默认个人支付语义，不允许复用因公火车的支付方式单选 UI。
   - 因私火车列表选席后进入填单页，再按 public frequent passenger 体系添加旅客；保留 12306 账号展示 / 切换 / 校验，但接口域必须是 tourist book train。
   - 因私酒店城市、条件、关键字、列表、详情、填单、下单在 H5 对应页面中切换到 `TmcTouristHotelUrl-*`、`TmcTouristBookUrl-Hotel-*`。
   - 因私酒店填单按房间填写入住人：房间数、住客姓名、证件类型、证件号、联系人手机号、到店时间、信用卡担保按 public 酒店规则处理；不展示因公员工组织、成本中心、审批、TravelNumber。
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

### 3.6 不在本期范围
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
12. 因私火车必须覆盖 `TmcTouristTrainUrl-Home-Search`、`TmcTouristTrainUrl-Home-Schedule`、`TmcTouristBookUrl-Train-Initialize`、`TmcTouristBookUrl-Train-Book`，并保留 `TmcTouristBookUrl-Train-Bind` / `Unbind` / `AccountValidate` / `CodeValidate` / `GetContacts` / `GetBindAccountNumber` 等 12306 绑定 / 校验能力入口；填单页不展示支付方式选择，支付类型按 legacy public 火车默认值处理。
13. 因私酒店必须覆盖 `TmcTouristHotelUrl-Condition-Gets`、`TmcTouristHotelUrl-Home-SearchHotel`、`TmcTouristHotelUrl-Home-List`、`TmcTouristHotelUrl-Home-Detail`、`TmcTouristBookUrl-Hotel-Initialize`、`TmcTouristBookUrl-Hotel-Book`。
14. 因私公共填单能力必须覆盖 `TmcTouristBookUrl-Home-Credentials`、`TmcTouristBookUrl-Home-Country`、`TmcTouristBookUrl-{Flight|Train|Hotel}-CheckPay`，不能仅复用因公员工 / TMC 证件和支付检查能力。
15. 因私订单和支付必须走 tourist 订单 / 支付域；H5 已覆盖的订单列表 / 详情、支付、待出行、取消、退改签、出票 / 退票、酒店短信核验等链路，不得继续调用因公 `TmcApiOrderUrl-*`。酒店支付需兼容 `TmcTouristHotelUrl-Pay-Create` / `TmcTouristHotelUrl-Pay-Process`。
16. `TravelType=2` 只能作为 DTO 字段之一，不得作为因私迁移完成的唯一判断。
17. 因私三产品提交前必须清理因公字段：审批人、组织、成本中心、超标原因、TravelNumber、TravelFormId、travelFormId、travelNumber、因公授权联系人不得出现在 personal payload 中。
18. 因私酒店必须支持 public 酒店的房间入住人模型：每间房 1 个住客姓名，按房型规则校验证件号 / 中文名 / 英文名格式，并支持到店时间与信用卡担保信息。
19. 因私火车必须允许用户先在列表页选择车次 / 席别进入填单页，再在填单页添加 public 常旅客；列表页不得复用因公“未选 TMC 乘客则不能选席”的阻断。
20. 因私机票必须允许用户先在列表 / 舱位页选择航班舱位进入填单页，再在填单页添加 public 常旅客；列表 / 舱位页不得复用因公“未选 TMC 乘客则不能进舱位”的阻断。
21. 因公机票非本人预订且未选 TMC 乘客时，点击航班进入舱位前必须提示添加旅客，并进入 TMC 乘客选择；本人预订按 legacy 自动补本人。
22. 因私机票 / 火车联系人默认值必须来自 tourist 初始化接口返回的 `Linkman`；若接口返回登录人信息则展示登录人，但前端不得硬编码联系人为登录人。
23. 因公 / 因私切换后，H5 必须清理跨模式旅客缓存，避免 TMC 员工乘客进入 public payload，或 public 常旅客 / 酒店入住人进入因公 payload。

### 4.2 测试 Case
| 编号 | 场景 | 前置条件 | 操作 | 预期 |
| ---- | ---- | ---- | ---- | ---- |
| TC-01 | 因公默认模式 | 首次进入 H5，无 session | 打开首页 | 默认选中因公，产品搜索可用，`resolveFlightTravelType()` 返回 `1` |
| TC-02 | 切换因私模式 | 首页已加载 | 点击因私出行后进入机票搜索 / 列表 / 填单 | session 保存 personal，机票请求走 `TmcTouristFlightUrl-*` / `TmcTouristBookUrl-Flight-*`，并注入 tourist `TmcId/MmsId` |
| TC-03 | 因私模式切回因公 | session 为 personal | 点击因公出行后进入酒店填单 | session 保存 business，酒店提交 `TravelType=1` |
| TC-04 | 因公机票下单 | TMC 用户，有乘客 | 搜索机票、选舱、填单提交 | 每位乘客 `TravelType=1`，保留审批/组织/成本中心字段 |
| TC-05 | 因私机票下单 | 用户切到因私 | 搜索机票、选舱、填单提交 | 搜索 / 详情 / 初始化 / 校验 / 下单均走 `TmcTourist*`；不调用出差单；支付进入 tourist 订单域 |
| TC-06 | 因公火车下单 | TMC 用户，有乘客 | 搜索火车、选座、填单提交 | 每位乘客 `TravelType=1` |
| TC-07 | 因私火车下单 | 用户切到因私 | 搜索火车、选座、填单提交 | 搜索 / 时刻表 / 初始化 / 下单均走 `TmcTourist*`；12306 绑定 / 校验使用 `TmcTouristBookUrl-Train-*`；填单页不展示支付方式选择，默认个人支付语义 |
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
| TC-28 | 因私字段隔离 | 先因公选择出差单 / 审批 / 成本中心，再切因私下单 | 分别提交机票、火车、酒店 personal 订单 | personal payload 不含审批、组织、成本中心、超标原因、TravelNumber、TravelFormId、travelFormId、travelNumber |
| TC-29 | 因私酒店入住人 | 因私酒店选择 2 间房 | 填写 2 个住客、证件、手机号、到店时间并提交 | 每间房生成一个 public hotel passenger；按 public 规则校验证件与姓名；不展示因公员工字段 |
| TC-30 | 因私火车先选席后选旅客 | 用户切到因私，未选择任何旅客 | 搜索火车，点击某车次席别 | 允许进入火车填单页；填单页展示「旅客信息 / 添加旅客」，未添加常旅客时提交提示乘客不能为空 |
| TC-31 | 因私火车添加常旅客 | 已进入因私火车填单页 | 点击添加旅客，选择 public 常旅客后提交 | `PassengerDto` 来自 selected frequent passenger；请求走 `TmcTouristBookUrl-Train-Book`，不含 TMC 员工组织 / 成本中心 / TravelNumber |
| TC-32 | 因公火车选席前需有 TMC 乘客 | 用户切到因公，当前非本人预订且未添加乘客 | 搜索火车，点击某车次席别 | legacy 等价提示先添加旅客并进入 TMC 乘客选择；不会直接进入因公填单页 |
| TC-33 | public 联系人默认值 | 因私机票 / 火车 / 酒店初始化接口返回 `Linkman` | 进入对应填单页 | 联系人姓名 / 手机号 / 邮箱按接口返回展示，可编辑；前端不自行硬编码为登录人 |
| TC-34 | 跨模式旅客缓存隔离 | 先因公选择 TMC 员工，再切因私；或先因私选择常旅客，再切因公 | 分别进入机票 / 火车 / 酒店填单并提交 | 当前模式只使用对应旅客体系，payload 不混入另一模式的旅客 / 入住人 / 组织字段 |
| TC-35 | 因私机票先选舱后选旅客 | 用户切到因私，未选择任何旅客 | 搜索机票，进入舱位页并点击预订 | 允许进入机票填单页；初始化走 `TmcTouristBookUrl-Flight-Initialize`，仅用航段 / 舱位初始化联系人、保险、支付等信息 |
| TC-36 | 因私机票添加常旅客 | 已进入因私机票填单页 | 点击添加旅客，选择 public 常旅客后提交 | `PassengerDto` 来自 selected frequent passenger 与已选航段 / 舱位；请求走 `TmcTouristBookUrl-Flight-Book`，不含 TMC 员工组织 / 成本中心 / TravelNumber |
| TC-37 | 因公机票进舱前需有 TMC 乘客 | 用户切到因公，当前非本人预订且未添加乘客 | 搜索机票，点击航班进入舱位 | 提示先添加旅客并进入 TMC 乘客选择；不会直接进入舱位或填单页 |
| TC-38 | 因公机票本人预订自动补本人 | 用户切到因公，`BookType=Self` | 搜索机票并点击航班进入舱位 | legacy 等价自动补本人乘客，舱位政策按本人乘客上下文计算 |

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
   - `rongyixing-monorepo/apps/h5/src/pages/passenger/PassengerSelectPage.tsx`
   - `rongyixing-monorepo/apps/h5/src/pages/travel/TravelApplyPage.tsx`
   - `rongyixing-monorepo/apps/h5/src/pages/travel/TravelApprovalPage.tsx`
   - `rongyixing-monorepo/packages/api/src/methods/book.ts`
   - `rongyixing-monorepo/packages/api/src/methods/flight.ts`
   - `rongyixing-monorepo/packages/api/src/methods/train.ts`
   - `rongyixing-monorepo/packages/api/src/methods/hotel.ts`

3. 补充分析文档：
   - [public 链路分析](public-chain-analysis.md)
   - [下单页公私差异分析](booking-page-diff-analysis.md)

4. 本期因公接口依赖：
   - `TmcApiBookUrl-Home-GetTravelUrl`

5. 本期因私 public/tourist 接口依赖：
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
