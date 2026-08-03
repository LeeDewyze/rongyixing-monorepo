# Legacy 订单支付流程梳理

> 来源：`beeantmobile-main/projects/ryx` legacy 代码梳理。本文记录因私个付、因公个付、因公公付款在 legacy 中的下单后状态流转、支付接口域和按钮展示规则，供 H5 迁移与联调对齐。

## 1. 核心结论

1. 因私与因公不是同一套接口域：
   - 因私使用 `TmcTouristOrderUrl-*` / `TmcTouristBookUrl-*`。
   - 因公使用 `TmcApiOrderUrl-*` / `TmcApiBookUrl-*`。
2. 是否进入个人支付不只看因公/因私，还要看 `OrderTravelPayType`：
   - `Company = 1`：公付，不进入个人支付。
   - `Person = 2`：个付，需要个人支付。
   - `Balance = 3`：余额/公司账户类，不进入个人支付。
   - `Credit = 4`：信用/授信支付，legacy 也按个人支付类处理。
3. 支付方式的 legacy `PaylineType`：
   - `2`：支付宝。
   - `3`：微信。
   - `7`：工行。
4. 点击“确认支付”后，前端只负责发起 `Pay-Create` 或跳转 `/home/Pay`。一旦跳到支付服务或支付渠道页面，后续页面已不受 H5 本程序控制；H5 后续只能通过订单详情/列表重新查询订单状态，或处理支付渠道支持的回跳。
5. 填单页“个付（请在 X 分钟内完成支付）”文案：legacy 因公火车/机票模板硬编码为 20 分钟；H5 迁移时以服务端初始化返回为准，火车票使用 `Tmc.TrainHoldMinute`，没有返回时再兜底 20 分钟。

## 2. 因私个付

因私订单走 tourist 域，订单与支付服务在 `public-order.service.ts` 中。

下单后流程：

```text
Book 返回 TradeNo / HasTasks / IsCheckPay
  -> IsCheckPay=true 时轮询 TmcTouristBookUrl-Home-CheckPay
  -> checkPay 通过后进入订单详情或订单列表
  -> 在详情/列表点击“去支付”
  -> TmcTouristOrderUrl-Pay-GetTotalPayAmount
  -> TmcTouristOrderUrl-Order-GetOrderPays
  -> TmcTouristOrderUrl-Pay-Create
  -> 部分渠道完成后 TmcTouristOrderUrl-Pay-Process
```

H5 场景中，支付宝/微信会走 legacy 移动支付入口：

```text
/home/Pay?ticket=...&path=&openid=&Method=TmcTouristOrderUrl-Pay-Create&Data=...
```

服务端会把 `Method=TmcTouristOrderUrl-Pay-Create` 解析到真实订单支付创建地址，例如：

```text
order-tourist-tmc.rongtrip.cn/Pay/Create
```

请求体关键字段：

| 字段 | 说明 |
| --- | --- |
| `Channel` | 固定为 `App` |
| `Type` | `2` 支付宝，`3` 微信，`7` 工行 |
| `OrderId` | 订单号 |
| `IsApp` | H5 为 `false` |
| `CreateType` | H5 支付宝/微信为 `Mobile` |
| `TmcId` / `MmsId` | tourist 上下文必带 |

注意：legacy 因私火车新版填单页在 checkPay 成功后，直接拉起 `payOrder` 的代码已被注释，实际更偏向先进入订单详情/列表，再从订单入口支付。

## 3. 因公个付

因公订单走 TMC 域，订单与支付服务在 `tmc-order.service.ts` 中。

下单后流程：

```text
Book 返回 TradeNo / HasTasks / IsCheckPay
  -> IsCheckPay=true 时轮询 TmcApiBookUrl-Home-CheckPay
  -> 如果本人预订且有审批任务：提示等待审批后支付
  -> 如果不需要等待审批，且 TravelPayType 为 Person 或 Credit：拉起个人支付
  -> TmcApiOrderUrl-Pay-GetTotalPayAmount
  -> TmcApiOrderUrl-Order-GetOrderPays
  -> TmcApiOrderUrl-Pay-Create
  -> 部分渠道完成后 TmcApiOrderUrl-Pay-Process
  -> 进入订单详情或刷新详情状态
```

因公个付的支付方式 Type 与因私一致，但 Method 前缀不同：

| 支付渠道 | Type | Create Method | Process Method |
| --- | --- | --- | --- |
| 支付宝 | `2` | `TmcApiOrderUrl-Pay-Create` | `TmcApiOrderUrl-Pay-Process` |
| 微信 | `3` | `TmcApiOrderUrl-Pay-Create` | `TmcApiOrderUrl-Pay-Process` |
| 工行 | `7` | `TmcApiOrderUrl-Pay-Create` | 由返回 `Url` 后的支付服务接管 |

详情页“去支付”按钮只应在满足以下条件时展示：

```text
TotalPayAmount > 0
且 TravelPayType == Person
且订单/票状态已允许支付
```

列表侧支付判断也把 `Person` 与 `Credit` 归为需要支付类，但详情页火车实现中按钮展示更严格地使用 `Person`。

## 4. 因公公付款

公付款包括：

```text
TravelPayType == Company
或 TravelPayType == Balance
```

该流程不进入个人支付选择页，也不展示“去支付”作为主动作。下单后主要流转为：

```text
Book 返回 TradeNo / HasTasks / IsCheckPay
  -> checkPay 轮询订单是否进入可处理状态
  -> 如需审批，进入审批流
  -> 进入订单详情
  -> 详情展示确认出票、确认提交、取消、退改等订单动作
```

对于火车票，公付场景下详情页可能展示“确认出票/确认提交”类按钮；个付场景下则应优先展示支付入口。

## 5. H5 对齐规则

H5 实现应按以下规则选择接口域与后续动作：

| 场景 | 接口域 | 下单后 | 支付页 |
| --- | --- | --- | --- |
| 因私个付 | `TmcTouristOrderUrl-*` / `TmcTouristBookUrl-*` | checkPay 后进入订单详情/列表 | `/train/pay/:id?channel=tourist` 等 |
| 因公个付 | `TmcApiOrderUrl-*` / `TmcApiBookUrl-*` | checkPay 后按审批与支付状态进入详情/支付 | `/train/pay/:id?channel=tmc` 等 |
| 因公公付 | `TmcApiOrderUrl-*` / `TmcApiBookUrl-*` | checkPay 后进入审批/详情 | 不进入个人支付页 |

落地约束：

1. `channel=tourist` 的详情、支付、取消、退改签不能降级到 TMC 接口域。
2. `channel=tmc` 的详情、支付、取消、退改签不能使用 tourist 接口域。
3. 个人支付页必须带 `channel`，并按 `channel` 选择 `Pay-GetTotalPayAmount`、`Order-GetOrderPays`、`Pay-Create`、`Pay-Process`。
4. 公付或余额场景不要跳个人支付页；应留在订单详情并展示订单动作。
5. 支付跳转后的渠道页面不受 H5 控制，H5 只保证发起支付前的 Method、Type、Ticket、Token、TmcId、MmsId、OrderId 等参数与 legacy 对齐。

### 5.1 支付时限文案

legacy 因公火车/机票填单页在支付方式旁展示：

```text
个付（请在20分钟内完成支付）
```

该文案在 legacy 模板中是硬编码，不随初始化接口动态变化。H5 迁移时，为与服务端配置保持一致，填单页不继续照搬固定 20 分钟，而是使用初始化返回的服务端时限：

```text
Tmc.TrainHoldMinute
```

火车票 H5 展示规则：

```text
优先 Tmc.TrainHoldMinute
其次 Tmc.FlightHoldMinute（兼容服务端字段）
最后兜底 20 分钟
```

订单详情页和独立支付页的倒计时仍应以后续订单/支付接口返回的 `OrderPayHoldTime` / `PayHoldTime` 为准。
