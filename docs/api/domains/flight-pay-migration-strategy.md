# 机票支付迁移策略（Legacy `payOrder` → `/flight/pay/:orderId`）

> **Legacy 入口**：`TmcOrderService.payOrder`、`tmc-flight-book_ryx` 下单后分支、订单列表/详情「支付」  
> **新 H5 路由**：`/flight/pay/:orderId`、`/flight/result/:orderId`（可选）、`/orders/flight/:orderId`  
> **业务域总览**：[机票模块.md](../../ryx/机票模块.md)  
> **上游策略**：[flight-book-migration-strategy.md](./flight-book-migration-strategy.md)  
> **酒店参考**：[hotel.md](./hotel.md) · `/hotel/pay/:orderId`  
> **页面矩阵**：[PAGE-API-MATRIX.md](../PAGE-API-MATRIX.md) Wave 5

---

## 1. 目标

在 H5 中交付与 Legacy **业务行为对齐**的机票支付链路：

```
填单 Book → checkPay 轮询 →（个付/授信）支付页 → Pay-Create → Pay-Process / H5 跳转
         → 订单详情（ryx 默认落点，非 checkout-success 酒店页）
```

**产品决策**：H5 使用**独立支付页**（`/flight/pay`），API 与 Legacy `payOrder` 弹层相同，不照搬 Ionic Popover UI。

---

## 2. 现状对照

| 维度 | Legacy（ryx TMC 国内机票） | 新 H5 现状 |
|------|---------------------------|------------|
| 支付 UI | `TmcOrderService.payOrder` → `PayComponent` 弹层 | ⚠️ `FlightPayPage` 骨架，未接 Legacy 请求体 |
| 支付金额/倒计时 | `Pay-GetTotalPayAmount` | ❌ 未封装 |
| 支付渠道 | `Order-GetOrderPays` → `{ key: label }` | ⚠️ API 有，未 normalize 对象响应 |
| 发起支付 | `Pay-Create`（Channel/Type/OrderId/CreateType） | ⚠️ 当前传 PayType/Amount，与 Legacy 不一致 |
| 支付回调 | `Pay-Process`（OutTradeNo + Type） | ❌ H5 未接 |
| 下单后 | checkPay → payOrder → **订单详情** | ⚠️ 部分 checkPay；落订单列表 |
| 个付判定 | `OrderTravelPayType.Person \| Credit` | ⚠️ 仅 Person(2) |
| 审批+自订 | 弹窗提示，不立即 payOrder | ❌ 未区分 |

---

## 3. Legacy 对照基准

### 3.1 填单提交后（`tmc-flight-book_ryx.base.page.ts`）

1. `Flight-Book` 返回 `TradeNo`、`IsCheckPay`、`HasTasks`
2. 非保存：`IsCheckPay` 时轮询 `TmcService.checkPay`（5 次 × 3s）
3. checkPay 成功且支付方式为 **个付(2) 或 授信(4)**：
   - 自订 + 需审批：仅 alert，**不**调 payOrder
   - 否则：`orderService.payOrder({ orderId: TradeNo })`
4. 跳转：`CoreHelper.goRoot('tmc-order-flight-detail', { orderId })`

### 3.2 payOrder（`tmc-order.service.ts`）

1. `Pay-GetTotalPayAmount` → 金额 + `PayHoldTime`
2. `Order-GetOrderPays` → 渠道列表
3. 用户选渠道 → 按渠道调 `Pay-Create`（Type: 2=支付宝, 3=微信, 6=快捷…）
4. App：SDK 完成后调 `Pay-Process`
5. H5 浏览器：`CreateType: Mobile` → 跳转 `/home/Pay?...` 或返回 Url

### 3.3 订单列表/详情

「支付」按钮 → 同一套 `payOrder`；H5 统一跳 `/flight/pay/:orderId`。

---

## 4. 工作方式（Proxy 优先，Mock 最后）

```
Legacy 对照 → Gap 清单 → API 封装/校对（Proxy）
  → 共享 pay hook → FlightPayPage → 填单/详情分支 → Proxy 验收 → Mock → 更新矩阵
```

| 阶段 | 环境 | 目的 |
|------|------|------|
| 联调 | `proxy` | 以 Legacy Network / verify-flight-proxy 为金标准 |
| 离线 | `mock` | GetTotalPayAmount / Pay-Process 补齐 |
| CI | `mock` | verify:mock 覆盖 pay 链 |

---

## 5. API 映射

| 用途 | Method | `@ryx/api` |
|------|--------|------------|
| 是否可支付 | `TmcApiBookUrl-Home-CheckPay` | `book.checkPay()` |
| 应付金额 | `TmcApiOrderUrl-Pay-GetTotalPayAmount` | `pay.getTotalPayAmount()` |
| 支付渠道 | `TmcApiOrderUrl-Order-GetOrderPays` | `pay.getOrderPays()` |
| 发起支付 | `TmcApiOrderUrl-Pay-Create` | `pay.create()` |
| 支付处理 | `TmcApiOrderUrl-Pay-Process` | `pay.process()` |
| 订单详情 | `TmcApiOrderUrl-Order-Detail` | `order.getDetail()` |

---

## 6. H5 路由与页面

| 路由 | 职责 |
|------|------|
| `/flight/pay/:orderId` | 金额/倒计时、选渠道、Pay-Create、Process 或 H5 跳转 |
| `/flight/result/:orderId` | 轮询订单（酒店同源，机票可选） |
| `/orders/flight/:orderId` | 下单后默认落点 + 「去支付」入口 |

填单提交后：

- 个付/授信 + checkPay 就绪 → `/flight/pay/:orderId`
- 其他 → `/orders/flight/:orderId`

---

## 7. 交付清单

- [x] `pay.getTotalPayAmount` + adapter（GetOrderPays / Pay-Create Legacy 请求体）
- [x] 共享 `useOrderPay` hook + `order-pay` 工具
- [x] `FlightPayPage` 完整流程（含 Pay-Process / Url 跳转）
- [x] `shouldNavigateToPay` 含 Credit(4)
- [x] 填单后跳转订单详情
- [x] Mock：GetTotalPayAmount、Pay-Process
- [x] `verify-flight-proxy.mjs` 可选 pay 步骤
- [ ] Proxy 真环境个付账号 E2E（需测试订单；**当前阻塞**见 [proxy-test-known-issues.md](../proxy-test-known-issues.md) §1–§2）

---

## 8. MVP 边界

**包含**：个付/授信、微信/支付宝/服务端返回渠道、Mock 闭环、订单列表/详情支付入口。

**不包含**：ICBC/快捷支付 WebView 完整验签、微信 JsSdk/小程序、审批拦截 UI（仅保留 Legacy 等价 alert 占位）。

---

## 9. 相关文档

| 文档 | 说明 |
|------|------|
| [flight-book-migration-strategy.md](./flight-book-migration-strategy.md) | 填单与 checkPay |
| [hotel.md](./hotel.md) | 酒店支付参考 |
| [PAGE-API-MATRIX.md](../PAGE-API-MATRIX.md) | Wave 5 矩阵 |
