# 机票接口与 Legacy 对应

> 范围：国内机票 H5 迁移接口与 legacy ryx 实现对照。  
> Legacy 因公源码：`beeantmobile-main/projects/ryx/src/app/tmc/tmc-flight/`  
> Legacy 因私源码：`beeantmobile-main/projects/ryx/src/app/public/public-flight/`  
> H5 API 封装：`rongyixing-monorepo/packages/api/src/apis/flight.ts`

## 1. 核心结论

- 因公机票使用 `TmcApiFlightUrl-*` / `TmcApiBookUrl-*`。
- 因私机票使用 `TmcTouristFlightUrl-*` / `TmcTouristBookUrl-*`。
- `TmcApiFlightUrl-Home-Policy` 是因公差标接口；legacy 因私 public 机票没有实际走 `Home-Policy`，H5 因私链路也不应调用因公差标接口。
- 支付最终会跳到支付域或支付服务页面，不继续受 H5 页面本身控制；H5 只负责发起支付前的订单、渠道、金额与跳转。

## 2. 因公机票接口

| 阶段 | Method | Legacy 对应 | 说明 |
| --- | --- | --- | --- |
| 机场资源 | `TmcApiHomeUrl-Resource-Airport` | `TmcService.getDomesticAirports()` | 国内机场 / 城市资源 |
| 国际机场资源 | `TmcApiHomeUrl-Resource-InternationalAirport` | `TmcService.getInternationalAirports()` | 国际机场资源，国内机票主流程通常不使用 |
| 出差单 | `TmcApiBookUrl-Home-GetTravelUrl` | `TmcService.getTravelUrl()` | 因公出差单列表 |
| 航班列表 | `TmcApiFlightUrl-Home-Index` | `tmc-flight.service.ts` / `getFlightList()` | 因公列表查询，`Version=2.0`，`Timeout=60` |
| 航班 / 舱位详情 | `TmcApiFlightUrl-Home-Detail` | `getFlightSegmentDetail()` | 舱位页拉取详情 |
| 差标 / 违标 | `TmcApiFlightUrl-Home-Policy` | `getPolicyflightsAsync()` | 仅因公调用；返回 `FlightPolicies` |
| 填单初始化 | `TmcApiBookUrl-Flight-Initialize` | `getInitializeBookDto()` | 填单页初始化 |
| 提交订单 | `TmcApiBookUrl-Flight-Book` | `bookFlight()` | 提交机票订单 |
| NDC 舱位规则 | `TmcApiBookUrl-Flight-GetTravelNDCFlightCabinRuleResult` | `getTravelNDCFlightCabinRuleResult()` | NDC 舱位规则文案 |
| 改签列表 | `TmcApiFlightUrl-Home-Exchange` | `getExchangeFlightList()` | 改签航班列表 |
| 改签详情 | `TmcApiFlightUrl-Home-ExchangeDetail` | `getFlightExchangeDetailFromServer()` | 改签舱位详情 |
| 改签下单 | `TmcApiBookUrl-Flight-ExchangeBook` | `TmcOrderService` / `TmcFlightService` | 改签提交 |

## 3. 因私机票接口

| 阶段 | Method | Legacy 对应 | 说明 |
| --- | --- | --- | --- |
| 航班列表 | `TmcTouristFlightUrl-Home-Index` | `public-flight.service.ts` | 因私列表查询 |
| 航班 / 舱位详情 | `TmcTouristFlightUrl-Home-Detail` | `public-flight.service.ts` | 因私舱位详情 |
| 填单初始化 | `TmcTouristBookUrl-Flight-Initialize` | `public-flight.service.ts` | 因私填单初始化 |
| 提交订单 | `TmcTouristBookUrl-Flight-Book` | `public-flight.service.ts` | 因私提交订单 |
| 预订校验 | `TmcTouristBookUrl-Flight-Validate` | `public-flight.service.ts` | 因私预订校验 |
| 下单后可支付检查 | `TmcTouristBookUrl-Flight-CheckPay` | `tourist-book.service.ts` / `PublicFlightService.checkPay()` | `Flight-Book` 返回 `IsCheckPay=true` 时轮询 |
| 改签列表 | `TmcTouristFlightUrl-Home-Exchange` | `public-flight.service.ts` | 因私改签列表 |
| 改签详情 | `TmcTouristFlightUrl-Home-ExchangeDetail` | `public-flight.service.ts` | 因私改签详情 |
| 改签初始化 | `TmcTouristBookUrl-Flight-ExchangeInitialize` | `public-flight.service.ts` | 因私改签初始化 |
| 改签下单 | `TmcTouristBookUrl-Flight-ExchangeBook` | `public-flight.service.ts` | 因私改签提交 |

### 3.1 Legacy 因私机票填单流程

Legacy 因私机票入口为 `public-flight-book_ryx`，不是因公 `tmc-flight-book_ryx` 的简单参数分支。

1. 舱位页选择舱位后，`public-flight-item-cabins_ryx` 将 `bookInfo.flightPolicy.Cabin` 与 `bookInfo.flightSegments` 写入 `PublicFlightService.passengerBookInfos`，再跳 `public-flight-book_ryx`。
2. 填单页进入后调用 `TmcTouristBookUrl-Flight-Initialize`，请求内 `Passengers[].FlightSegments`、`Passengers[].FlightCabin` 来自已选舱位；`PublicService.addTouristTmcMmsIds()` 会注入 tourist `TmcId/MmsId`。
3. Initialize 返回的 `Linkman` 会直接成为订单级联系人默认值；页面展示「联系人信息」，提交时写入 `bookDto.Linkmans = [orderLinkman]`。
4. Initialize 返回 `Insurances` 时，因私填单页展示保险单选；选中的保险会放入 `Passenger.FlightCabin.InsuranceProducts`。
5. Initialize 返回 `PayTypes` 会被转换为 `{Name, Value}`，但 legacy 因私普通填单页不展示支付方式单选；下单后进入因私订单支付链路，由 `PublicOrderService.payOrder()` 再取支付渠道。
6. 提交前本地校验联系人：乘客不能为空、联系人姓名必填、联系人手机号必填、手机号需匹配 `^1[0-9]{10}$`。邮箱格式校验代码存在但被注释，实际不强制。
7. 若所选舱位为协议价 / 军警类 `FlightCabinFareType.Agreement`，提交前会打开 `ValidateComComponent`，调用 `TmcTouristBookUrl-Flight-Validate` 做服务端预订校验。
8. 往返场景会校验回程起飞时间必须晚于去程到达时间，否则提示并返回回程列表。
9. `Flight-Book` 返回 `TradeNo` 后，如果 `IsCheckPay=true`，页面显示 `app-waiting-check-pay` 文案「正在预订中，请稍候...」，最多 5 次、每 3 秒轮询 `TmcTouristBookUrl-Flight-CheckPay`。
10. `CheckPay` 成功且 `HasTasks=false` 时调用 `PublicOrderService.payOrder({ orderId: TradeNo })`，支付渠道来自 `TmcTouristOrderUrl-Order-GetOrderPays`，金额来自 `TmcTouristOrderUrl-Pay-GetTotalPayAmount`，发起支付走 `TmcTouristOrderUrl-Pay-Create`。
11. 无论是否真正完成支付，legacy 下单后会清空已选乘客 / 航班缓存，然后跳 `public-order-list?tabId=plane&doRefresh=true`，不是直接进入订单详情。

### 3.2 当前 H5 因私机票填单与因私火车确认页差异

当前 `/flight/book?channel=tourist` 已使用 tourist 初始化 / 下单接口，但页面结构仍更接近因公机票填单，只是隐藏部分因公块；与因私火车 `/train/book` 及 legacy 因私机票相比，仍有以下缺口：

| 差异点 | 火车因私 / legacy 因私机票 | 当前 H5 因私机票 |
| --- | --- | --- |
| 订单联系人 | 从 Initialize `Linkman` 带默认值，展示订单级「联系人信息」，提交 `Linkmans` | 未展示订单级联系人，也未提交 `Linkmans` |
| 添加 / 移除旅客 | 填单页可添加，移除前有确认 | 有旅客后缺少明显添加 / 移除入口 |
| 本地校验弹框 | 使用统一业务弹框 / legacy 自定义弹框，并定位必填区域 | 仍有多处 `window.alert` |
| 下单后等待 | `IsCheckPay=true` 时显示 loading 并轮询 `CheckPay` | 提交成功后直接跳订单详情 |
| 支付衔接 | CheckPay 成功后进入因私订单支付链路，支付最终跳支付域 | 当前未按 legacy 在填单成功后衔接因私支付 |
| 支付方式 | 普通因私填单页不展示支付方式单选，支付页再选渠道 | 因私已隐藏支付方式，但没有完整支付衔接 |
| 保险 | legacy 因私展示 Initialize `Insurances` 并随乘客提交 | 当前机票保险展示被限制在因公逻辑内 |
| 预订校验 | 协议价 / 军警类舱位会调用 `Flight-Validate` | 当前未接入因私 `Flight-Validate` |
| 往返时间校验 | 回程起飞需晚于去程到达 | 当前未见同等提交前校验 |

后续实现建议：因私机票填单应参考因私火车确认页重组，而不是继续在因公机票填单内做零散隐藏。优先顺序为：订单联系人及提交字段、统一弹框、CheckPay loading 与支付衔接、旅客添加 / 移除、保险、`Flight-Validate`。

## 4. 订单、退改、支付接口

| 阶段 | Method | Legacy 对应 | 说明 |
| --- | --- | --- | --- |
| 因公下单后可支付检查 | `TmcApiBookUrl-Home-CheckPay` | `TmcService.checkPay()` | 因公 `Flight-Book` 后轮询 |
| 因私下单后可支付检查 | `TmcTouristBookUrl-Flight-CheckPay` | `TouristBookService.checkPay("Flight")` | 因私 `Flight-Book` 后轮询 |
| 因公订单详情 | `TmcApiOrderUrl-Order-Detail` | `tmc-order.service.ts` | 因公机票订单详情 |
| 因私订单详情 | `TmcTouristOrderUrl-Order-Detail` | `public-order.service.ts` | 因私机票订单详情 |
| 因公支付渠道 | `TmcApiOrderUrl-Order-GetOrderPays` | `TmcOrderService.payOrder()` | 因公支付方式列表 |
| 因私支付渠道 | `TmcTouristOrderUrl-Order-GetOrderPays` | `PublicOrderService.payOrder()` | 因私支付方式列表 |
| 因公应付金额 | `TmcApiOrderUrl-Pay-GetTotalPayAmount` | `payOrder` 链路 | 因公支付页金额 |
| 因私应付金额 | `TmcTouristOrderUrl-Pay-GetTotalPayAmount` | `PublicOrderService.getTotalPayAmount()` | 因私支付页金额 |
| 因公发起支付 | `TmcApiOrderUrl-Pay-Create` | `payOrder` 链路 | 最终会跳支付域 |
| 因私发起支付 | `TmcTouristOrderUrl-Pay-Create` | `PublicOrderService.{aliPay,wechatPay,IcbcPay}` | 最终会跳支付域 |
| 因公支付进度 | `TmcApiOrderUrl-Pay-Process` | `payOrder` 链路 | 部分支付渠道使用 |
| 因私支付进度 | `TmcTouristOrderUrl-Pay-Process` | `PublicOrderService.process()` | 部分支付渠道使用 |
| 因公自愿退票 | `TmcApiOrderUrl-Order-RefundFlight` | `tmc-order.service.ts` | 自愿退票 |
| 因私自愿退票 | `TmcTouristOrderUrl-Order-RefundFlight` | `public-order.service.ts` | 自愿退票 |
| 因公非自愿退票 | `TmcApiOrderUrl-Order-NonVoluntaryRefundFlight` | `tmc-order.service.ts` | 非自愿退票 |
| 因公改签初始化 | `TmcApiOrderUrl-Order-ExchangeFlightInitalize` | `tmc-order.service.ts` | 从订单进入改签 |

支付与公私链路的完整规则见 `docs/api/domains/order-payment-legacy-flow.md`。

## 5. 航班动态接口

| Method | Legacy 对应 | 说明 |
| --- | --- | --- |
| `TmcApiFlightDynamicUrl-Home-Search` | `tmc-flight-dynamic.service.ts` | 航班动态搜索 |
| `TmcApiFlightDynamicUrl-Home-Detail` | `tmc-flight-dynamic.service.ts` / `public-flight-dynamic.service.ts` | 航班动态详情 |

## 6. H5 API 封装对照

| H5 API | 因公 Method | 因私 Method |
| --- | --- | --- |
| `searchFlights` | `TmcApiFlightUrl-Home-Index` | `TmcTouristFlightUrl-Home-Index` |
| `getFlightDetail` | `TmcApiFlightUrl-Home-Detail` | `TmcTouristFlightUrl-Home-Detail` |
| `getFlightPolicy` | `TmcApiFlightUrl-Home-Policy` | 不应调用 |
| `initializeBook` | `TmcApiBookUrl-Flight-Initialize` | `TmcTouristBookUrl-Flight-Initialize` |
| `submitBook` | `TmcApiBookUrl-Flight-Book` | `TmcTouristBookUrl-Flight-Book` |
| `checkPay` | `TmcApiBookUrl-Home-CheckPay` | `TmcTouristBookUrl-Flight-CheckPay` |
| `getOrderPays` | `TmcApiOrderUrl-Order-GetOrderPays` | `TmcTouristOrderUrl-Order-GetOrderPays` |
| `createPay` | `TmcApiOrderUrl-Pay-Create` | `TmcTouristOrderUrl-Pay-Create` |

## 7. Legacy 重点源码索引

| 文件 | 关注方法 / 行为 |
| --- | --- |
| `tmc/tmc-flight/tmc-flight.service.ts` | 因公列表、详情、差标、初始化、下单、改签 |
| `tmc/tmc-flight/tmc-flight-item-cabins_ryx/tmc-flight-item-cabins_ryx.base.page.ts` | 因公舱位选择与差标拦截 |
| `tmc/tmc-flight/tmc-flight-book_ryx/tmc-flight-book_ryx.base.page.ts` | 因公填单、初始化、提交、支付前置 |
| `public/public-flight/public-flight.service.ts` | 因私列表、详情、初始化、下单、改签 |
| `tmc/tmc-order/tmc-order.service.ts` | 订单详情、支付、退改 |
| `tmc/tmc-flight-dynamic/tmc-flight-dynamic.service.ts` | 因公航班动态 |
| `public/public-flight-dynamic/public-flight-dynamic.service.ts` | 因私航班动态 |
