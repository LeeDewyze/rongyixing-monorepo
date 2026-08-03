# Legacy 因私 public 链路分析

## 1. 结论
legacy ryx 的因私出行必须按 `public-*` 路由与 `TmcTourist*` 接口族迁移，不能用当前 H5 TMC 主链路加 `TravelType=2` 替代。

关键原因：
- 因私链路使用独立路由：`public-flight-*`、`public-train-*`、`public-hotel-*`、`public-order-*`。
- 因私链路使用独立 UrlKey 与真实服务域名：`TmcTouristFlightUrl`、`TmcTouristTrainUrl`、`TmcTouristHotelUrl`、`TmcTouristBookUrl`、`TmcTouristOrderUrl`。
- 因私请求必须注入 `TouristTmcId` / `TouristMmsId`，legacy `PublicService.addTouristTmcMmsIds()` 会把 tourist TMC/MMS 写入请求顶层，并把 `Data.TmcId` 替换为 tourist TMC。
- 因私初始化、支付、订单能力来自 tourist 域返回的规则和 PayTypes，不等同 TMC 因公初始化。
- 因私链路不调用 `TmcApiBookUrl-Home-GetTravelUrl`，不展示 / 提交因公出差单上下文。

## 2. UrlKey 与真实域名
来源：`beeantmobile-main/projects/ryx/config_com.ronglvonline.app/test-download-apk-files/ApiConfig.json`

| 链路 | UrlKey | 测试环境真实域名 | 说明 |
|------|--------|------------------|------|
| 因公首页 / 资源 | `TmcApiHomeUrl` | `http://api-tmc.rtesp.cn` | TMC 首页、资源、Tourist 初始化入口 |
| 因公机票 | `TmcApiFlightUrl` | `http://flight-api-tmc.rtesp.cn` | 因公机票搜索 / 详情 |
| 因公火车 | `TmcApiTrainUrl` | `http://train-api-tmc.rtesp.cn` | 因公火车搜索 / 车次 |
| 因公酒店 | `TmcApiHotelUrl` | `http://hotel-api-tmc.rtesp.cn` | 因公酒店条件 / 列表 / 详情 |
| 因公填单 | `TmcApiBookUrl` | `http://book-api-tmc.rtesp.cn` | 因公初始化 / 下单 / 出差单 |
| 因公订单 / 支付 | `TmcApiOrderUrl` | `http://order-api-tmc.rtesp.cn` | 因公订单、支付、审批任务 |
| 因私机票 | `TmcTouristFlightUrl` | `http://flight-tourist-tmc.rtesp.cn` | 因私机票搜索 / 详情 |
| 因私火车 | `TmcTouristTrainUrl` | `http://train-tourist-tmc.rtesp.cn` | 因私火车搜索 / 车次 / 退票信息 |
| 因私酒店 | `TmcTouristHotelUrl` | `http://hotel-tourist-tmc.rtesp.cn` | 因私酒店城市 / 条件 / 列表 / 详情 / 酒店支付 |
| 因私填单 | `TmcTouristBookUrl` | `http://book-tourist-tmc.rtesp.cn` | 因私初始化 / 下单 / 12306 |
| 因私订单 / 支付 | `TmcTouristOrderUrl` | `http://order-tourist-tmc.rtesp.cn` | 因私订单 / 支付 / 订单详情 |

H5 `packages/api/src/proxy/resolve-url.ts` 已按 Method 首段 UrlKey 从 `ApiConfig.Urls` 解析真实服务 URL，因此底层 URL 解析能力可复用；仍需补齐 tourist API 封装、上下文注入和页面分支。

## 3. public 公共上下文
legacy 文件：`beeantmobile-main/projects/ryx/src/app/public/public.service.ts`

| 能力 | legacy 行为 | H5 迁移要求 |
|------|-------------|-------------|
| 获取 tourist TMC/MMS | 优先读取 URL query 中 `TouristTmcId` / `TouristMmsId`，否则调用 `TmcApiHomeUrl-Home-Tourist`，请求 `Data.AppId` | H5 需要新增 public context API：读取 query、缓存 tourist ids、按需调用 Tourist 初始化 |
| 注入请求 | `addTouristTmcMmsIds(req)` 删除原 `TmcId`，设置 `req.TmcId`、`req.MmsId`，并在 `getPromiseData/getPromise` 中设置 `req.Data.TmcId=req.TmcId` | H5 tourist API 调用必须统一注入顶层 `TmcId/MmsId` 与 `Data.TmcId` |
| roleSource | `HrService.getRoleSource()` 为 `public` 时进入 public 域 | H5 首页 personal 模式应驱动 tourist 链路，而不是只写 `TravelType=2` |
| 出差单 | public service 不调用 `TmcApiBookUrl-Home-GetTravelUrl` | 因私全链路禁止出差单查询、展示、提交 |

## 4. public 公共填单能力
legacy 文件：`beeantmobile-main/projects/ryx/src/app/public/tourist-book.service.ts`

| 能力 | Method | UrlKey 域 | H5 迁移要求 |
|------|--------|-----------|-------------|
| 国家 / 国籍 | `TmcTouristBookUrl-Home-Country` | `book-tourist-tmc` | public 常旅客、证件、国际化输入若依赖国家数据，必须走 tourist book 域 |
| 乘客证件 | `TmcTouristBookUrl-Home-Credentials` | `book-tourist-tmc` | 因私机票 / 火车 / 酒店选择乘客后获取证件，不复用因公员工证件接口作为唯一来源 |
| 支付前检查 | `TmcTouristBookUrl-{Flight|Train|Hotel}-CheckPay` | `book-tourist-tmc` | public 下单后若接口返回需查支付状态，需按产品走 tourist CheckPay |
| 国内机场资源 | `TmcApiHomeUrl-Resource-Airport` | `api-tmc` | legacy public 机票城市资源仍复用 TMC Home 资源接口，可作为 H5 资源复用项 |
| 国际机场资源 | `TmcApiHomeUrl-Resource-InternationalAirport` | `api-tmc` | 国际 public 本期不做，仅记录依赖 |

迁移重点：
- `TmcTouristBookUrl-Home-Credentials` 是 public 乘客证件主入口，H5 因私乘客 / 入住人能力不能只套用因公员工信息。
- `CheckPay` 是下单成功后支付状态衔接能力，需纳入因私下单验收，尤其是 `IsCheckPay=true` 时的等待 / 查验路径。
- 国家、机场资源接口虽不全是 `TmcTourist*` UrlKey，但在 legacy public 填单中被复用，迁移时需按用途保留。

## 5. public 机票链路
legacy 路由：`public-flight_ryx.routing.module.ts`

| 页面 | legacy 路由 |
|------|-------------|
| 搜索 | `public-flight-search_ryx` |
| 列表 | `public-flight-list_ryx` |
| 舱位 | `public-flight-item-cabins_ryx` |
| 填单 | `public-flight-book_ryx` |
| 乘客列表 | `public-flight-passenger-list_ryx` |
| 新增乘客 | `public-flight-passenger-add_ryx` |
| 编辑乘客 | `public-flight-passenger-update_ryx` |

legacy 方法族：

| 能力 | Method | UrlKey 域 |
|------|--------|-----------|
| 机票列表 | `TmcTouristFlightUrl-Home-Index` | `flight-tourist-tmc` |
| 机票详情 / 舱位 | `TmcTouristFlightUrl-Home-Detail` | `flight-tourist-tmc` |
| 改签列表 | `TmcTouristFlightUrl-Home-Exchange` | `flight-tourist-tmc` |
| 改签详情 | `TmcTouristFlightUrl-Home-ExchangeDetail` | `flight-tourist-tmc` |
| 填单初始化 | `TmcTouristBookUrl-Flight-Initialize` | `book-tourist-tmc` |
| 下单前校验 | `TmcTouristBookUrl-Flight-Validate` | `book-tourist-tmc` |
| 提交订单 | `TmcTouristBookUrl-Flight-Book` | `book-tourist-tmc` |
| 改签初始化 | `TmcTouristBookUrl-Flight-ExchangeInitialize` | `book-tourist-tmc` |
| 改签下单 | `TmcTouristBookUrl-Flight-ExchangeBook` | `book-tourist-tmc` |
| 支付 / 订单 | `TmcTouristOrderUrl-*` | `order-tourist-tmc` |

迁移重点：
- H5 因私机票搜索、列表、详情、填单必须切到 tourist Method。
- 初始化返回的 public `PayTypes`、保险、服务费、联系人需要按 tourist DTO 显示。
- public 乘客为常旅客 / tourist passenger 体系，不等同因公员工乘客。
- 不提交审批人、成本中心、组织、出差单、`TravelNumber`。

## 6. public 火车链路
legacy 路由：`public-train_ryx-routing.module.ts`

| 页面 | legacy 路由 |
|------|-------------|
| 搜索 | `public-train-search_ryx` |
| 列表 | `public-train-list_ryx` |
| 填单 | `public-train-book_ryx` |

legacy 方法族：

| 能力 | Method | UrlKey 域 |
|------|--------|-----------|
| 火车搜索 | `TmcTouristTrainUrl-Home-Search` | `train-tourist-tmc` |
| 经停 / 时刻表 | `TmcTouristTrainUrl-Home-Schedule` | `train-tourist-tmc` |
| 改签信息 | `TmcTouristTrainUrl-Home-GetExchangeInfo` | `train-tourist-tmc` |
| 退票信息 | `TmcTouristTrainUrl-Home-Refund` / `TmcTouristTrainUrl-Home-GetTrainPassenger` | `train-tourist-tmc` |
| 填单初始化 | `TmcTouristBookUrl-Train-Initialize` | `book-tourist-tmc` |
| 提交订单 | `TmcTouristBookUrl-Train-Book` | `book-tourist-tmc` |
| 12306 绑定 | `TmcTouristBookUrl-Train-Bind` / `Unbind` | `book-tourist-tmc` |
| 12306 校验 | `TmcTouristBookUrl-Train-AccountValidate` / `CodeValidate` | `book-tourist-tmc` |
| 12306 联系人 | `TmcTouristBookUrl-Train-GetContacts` / `GetBindAccountNumber` | `book-tourist-tmc` |
| 改签初始化 / 下单 | `TmcTouristBookUrl-Train-ExchangeInitialize` / `ExchangeBook` | `book-tourist-tmc` |
| 支付 / 订单 | `TmcTouristOrderUrl-*` | `order-tourist-tmc` |

迁移重点：
- H5 因私火车需要 tourist 搜索、初始化、下单和 12306 绑定 / 校验能力。
- public 火车下单确认页不展示支付方式选择；默认个人支付语义来自 legacy 默认值，金额确认页取初始化 `PayTypes[0]` 用于后续支付，不应使用因公火车支付方式单选、审批 / 成本中心逻辑。
- 不调用出差单，不提交 `TravelFormId/travelNumber`。

## 7. public 酒店链路
legacy 路由：`public-hotel_ryx-routing.module.ts`

| 页面 | legacy 路由 |
|------|-------------|
| 搜索 | `public-hotel-search_ryx` |
| 列表 | `public-hotel-list_ryx` |
| 详情 | `public-hotel-detail_ryx` |
| 房型详情 | `public-hotel-room-detail_ryx` |
| 填单 | `public-hotel-book_ryx` |
| 图片 | `public-hotel-show-images_ryx` |
| 入住人选择 | `public-hotel-select-passenger_ryx` |
| 新增入住人 | `public-hotel-freq-passenger-add_ryx` |

legacy 方法族：

| 能力 | Method | UrlKey 域 |
|------|--------|-----------|
| 城市条件 | `TmcTouristHotelUrl-Condition-Gets` | `hotel-tourist-tmc` |
| 城市列表 | `TmcTouristHotelUrl-City-Gets` | `hotel-tourist-tmc` |
| 地图反查城市 | `TmcTouristHotelUrl-City-GetCityByMap` | `hotel-tourist-tmc` |
| 酒店列表 | `TmcTouristHotelUrl-Home-List` | `hotel-tourist-tmc` |
| 酒店详情 | `TmcTouristHotelUrl-Home-Detail` | `hotel-tourist-tmc` |
| 关键字搜索 | `TmcTouristHotelUrl-Home-SearchHotel` | `hotel-tourist-tmc` |
| 填单初始化 | `TmcTouristBookUrl-Hotel-Initialize` | `book-tourist-tmc` |
| 提交订单 | `TmcTouristBookUrl-Hotel-Book` | `book-tourist-tmc` |
| 酒店支付 | `TmcTouristHotelUrl-Pay-Create` / `TmcTouristHotelUrl-Pay-Process` | `hotel-tourist-tmc` |
| 订单 / 支付 | `TmcTouristOrderUrl-*` | `order-tourist-tmc` |

迁移重点：
- H5 因私酒店列表、详情、关键字搜索、填单必须切 tourist Method。
- legacy public 酒店支付存在 `TmcTouristHotelUrl-Pay-*` 特例，不能只套 `TmcTouristOrderUrl-Pay-*`。
- 入住人选择为 public frequent passenger 体系，不应走因公员工 / 出差单乘客锁定逻辑。

## 8. public 订单 / 待出行 / 支付售后链路
legacy 文件：
- `beeantmobile-main/projects/ryx/src/app/public/public-order/public-order.service.ts`
- `beeantmobile-main/projects/ryx/src/app/tabs/tab-public-trip_ryx/tab-public-trip_ryx.page.ts`
- `beeantmobile-main/projects/ryx/src/app/tabs/tab-public-trip_ryx/tab-public-trip-buy-insurance/tab-public-trip-buy-insurance.component.ts`

| 能力 | Method | UrlKey 域 | H5 迁移要求 |
|------|--------|-----------|-------------|
| 订单列表 | `TmcTouristOrderUrl-Order-List` | `order-tourist-tmc` | 因私订单列表不能走 `TmcApiOrderUrl-Order-List` |
| 订单详情 | `TmcTouristOrderUrl-Order-Detail` | `order-tourist-tmc` | 因私机票 / 火车 / 酒店详情跳转到 public order detail |
| 待出行列表 | `TmcTouristOrderUrl-Travel-List` | `order-tourist-tmc` | public trip Tab / 待出行能力如迁移，必须走 tourist travel list |
| 火车出票 / 取消出票 | `TmcTouristOrderUrl-Order-IssueTrain` / `CancelTrain` | `order-tourist-tmc` | 因私火车出票确认、取消出票使用 tourist order 域 |
| 订单支付金额 | `TmcTouristOrderUrl-Pay-GetTotalPayAmount` | `order-tourist-tmc` | 因私支付金额、保留时间从 tourist order 域获取 |
| 订单支付方式 | `TmcTouristOrderUrl-Order-GetOrderPays` / `TmcTouristOrderUrl-Pay-GetOrderPays` | `order-tourist-tmc` | 因私支付方式不能复用因公支付方式接口 |
| 通用支付创建 / 处理 | `TmcTouristOrderUrl-Pay-Create` / `TmcTouristOrderUrl-Pay-Process` | `order-tourist-tmc` | 机票 / 火车通用支付使用 tourist order 域 |
| 机票退票 | `TmcTouristOrderUrl-Order-RefundFlight` | `order-tourist-tmc` | 因私机票售后使用 tourist order 域 |
| 机票改签初始化 | `TmcApiOrderUrl-Order-ExchangeFlightInitalize` | `order-api-tmc` | legacy public 服务中存在 TMC 域特例，H5 迁移前需真实联调确认是否仍需保留 |
| 酒店短信核验 | `TmcTouristOrderUrl-Order-SendVerifyOrderHotelSMSCode` / `ConfirmVerifyOrderHotelSMSCode` | `order-tourist-tmc` | 因私酒店取消 / 核验使用 tourist order 域 |
| 订单取消 / 废单 / 废票 | `TmcTouristOrderUrl-Order-AbolishOrder` / `AbolishTicket` / `CancelOrderHotel` | `order-tourist-tmc` | 因私取消、废票、酒店取消必须走 tourist order 域 |
| 保险下单 | `TmcTouristOrderUrl-Insurance-Book` | `order-tourist-tmc` | 待出行保险能力如迁移，必须走 tourist order 域 |
| 酒店支付特例 | `TmcTouristHotelUrl-Pay-Create` / `Pay-Process` | `hotel-tourist-tmc` | 酒店支付需优先兼容 legacy hotel pay 特例 |

迁移重点：
- 因私不是“下单后用同一个订单详情页”；订单列表、订单详情、待出行、支付、取消、售后均有 tourist 域。
- 支付前至少需要覆盖 `GetTotalPayAmount`、`GetOrderPays`、`Pay-Create`、`Pay-Process`，酒店另走 `TmcTouristHotelUrl-Pay-*`。
- `TmcApiOrderUrl-Order-ExchangeFlightInitalize` 是 public order 服务中发现的 TMC 域特例，不能直接认定为应迁移到 tourist；开发前需以真实接口或 legacy 运行链路复核。
- 待办 / 审批 `Task` 能力本期不做；若 public order service 中存在 `TmcTouristOrderUrl-Task-List`，本期只记录，不纳入验收。

## 9. H5 当前差距
| 层级 | 当前现状 | 缺口 |
|------|----------|------|
| URL 解析 | `resolveUrl()` 已支持按 Method UrlKey 解析到真实服务域；Method 常量中已有部分 `TmcTourist*` | 需要补 resolve-url 测试覆盖 tourist UrlKey，确保 dev proxy 与真实域名都正确 |
| API Flow alias | `flight-flow`、`train-flow`、`hotel-flow`、`order-flow` 当前主要暴露 `TmcApi*` | 需要新增 public/tourist flow alias，避免页面写带编号的自动生成常量名 |
| Tourist 上下文 | H5 暂无 `PublicService.addTouristTmcMmsIds()` 等价封装 | 需要新增 tourist context：获取 / 缓存 / 注入 `TouristTmcId/TouristMmsId` |
| 首页入口 | H5 personal Tab 当前仍进入现有产品主链路 | 需要 personal 模式路由到 public/tourist 产品分支 |
| 产品页面 | 当前机票 / 火车 / 酒店多为 TMC Method 与 TMC DTO | 需要按产品切换 Method、DTO adapter、初始化、提交、支付、订单跳转 |
| 公共填单 | H5 当前因私仍主要复用因公乘客 / 证件 / 支付状态能力 | 需要接 `TmcTouristBookUrl-Home-Credentials`、`Country`、`{Product}-CheckPay` 等 public 填单辅助接口 |
| 出差单 | 已接 `TmcApiBookUrl-Home-GetTravelUrl` | 因私必须全链路禁用 |
| 支付 / 订单 | 当前多用 `TmcApiOrderUrl` | 因私订单列表、详情、待出行、支付金额、支付方式、支付创建处理、取消、退改签需切 `TmcTouristOrderUrl`；酒店支付另有 `TmcTouristHotelUrl-Pay-*` |

## 10. 本期范围调整建议
本期必须从“只做模式隔离”升级为“因私 public/tourist 链路迁移”。建议拆成分阶段执行，但同属本需求：

1. P0：新增 tourist context 与 public Method alias，建立因私请求域名和上下文正确性。
2. P1：因私酒店 public 链路，因为酒店列表已在 H5 迁移较深，且用户当前正在酒店模块验证。
3. P2：因私机票 public 链路，覆盖搜索、列表、详情、填单、校验、下单。
4. P3：因私火车 public 链路，额外覆盖 12306 绑定 / 校验。
5. P4：因私公共填单辅助能力，覆盖证件、国家、CheckPay、支付前检查。
6. P5：因私订单 / 支付 / 订单详情 / 待出行 / 取消售后接 `TmcTouristOrderUrl`，酒店支付特例接 `TmcTouristHotelUrl-Pay-*`。
7. P6：回归因公 TMC 链路，确认因公仍走 `TmcApi*`，因私不再调用 `TmcApi*` 产品域和出差单。
