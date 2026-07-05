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
| 改签列表 | `TmcTouristFlightUrl-Home-Exchange` | `public-flight.service.ts` | 因私改签列表 |
| 改签详情 | `TmcTouristFlightUrl-Home-ExchangeDetail` | `public-flight.service.ts` | 因私改签详情 |
| 改签初始化 | `TmcTouristBookUrl-Flight-ExchangeInitialize` | `public-flight.service.ts` | 因私改签初始化 |
| 改签下单 | `TmcTouristBookUrl-Flight-ExchangeBook` | `public-flight.service.ts` | 因私改签提交 |

## 4. 订单、退改、支付接口

| 阶段 | Method | Legacy 对应 | 说明 |
| --- | --- | --- | --- |
| 下单后可支付检查 | `TmcApiBookUrl-Home-CheckPay` | `TmcService.checkPay()` | `Flight-Book` 后轮询 |
| 订单详情 | `TmcApiOrderUrl-Order-Detail` | `tmc-order.service.ts` | 机票订单详情 |
| 支付渠道 | `TmcApiOrderUrl-Order-GetOrderPays` | `TmcOrderService.payOrder()` | 支付方式列表 |
| 应付金额 | `TmcApiOrderUrl-Pay-GetTotalPayAmount` | `payOrder` 链路 | 支付页金额 |
| 发起支付 | `TmcApiOrderUrl-Pay-Create` | `payOrder` 链路 | 最终会跳支付域 |
| 支付进度 | `TmcApiOrderUrl-Pay-Process` | `payOrder` 链路 | 部分支付渠道使用 |
| 自愿退票 | `TmcApiOrderUrl-Order-RefundFlight` | `tmc-order.service.ts` | 自愿退票 |
| 非自愿退票 | `TmcApiOrderUrl-Order-NonVoluntaryRefundFlight` | `tmc-order.service.ts` | 非自愿退票 |
| 改签初始化 | `TmcApiOrderUrl-Order-ExchangeFlightInitalize` | `tmc-order.service.ts` | 从订单进入改签 |

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
