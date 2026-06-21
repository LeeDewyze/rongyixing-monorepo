# 酒店域 API（S2 / Wave 3）

> 页面矩阵：[PAGE-API-MATRIX.md](../PAGE-API-MATRIX.md) · Wave 3 酒店链  
> 对齐 Android `easy-go-jacky` 与 beeantmobile `TmcApiHotelUrl` / `TmcApiBookUrl` / `TmcApiOrderUrl`

## Method 清单

| 用途 | Method | `@ryx/api` 方法 |
|------|--------|-----------------|
| 国内城市 | `TmcApiHomeUrl-Resource-DomesticHotelCity` | `hotel.getCities()` |
| 酒店列表 | `TmcApiHotelUrl-Home-List` | `hotel.getList()` |
| 酒店详情 | `TmcApiHotelUrl-Home-Detail` | `hotel.getDetail()` |
| 违标策略 | `TmcApiHotelUrl-Home-Policy` | `hotel.getPolicy()` |
| 预订初始化 | `TmcApiBookUrl-Hotel-Initialize` | `hotel.initBook()` |
| 提交订单 | `TmcApiBookUrl-Hotel-Book` | `hotel.submitBook()` |
| 订单详情 | `TmcApiOrderUrl-Order-Detail` | `order.getDetail()` |
| 取消酒店订单 | `TmcApiOrderUrl-Order-CancelOrderHotel` | `order.cancelHotel()` |
| 支付渠道 | `TmcApiOrderUrl-Order-GetOrderPays` | `pay.getOrderPays()` |
| 发起支付 | `TmcApiOrderUrl-Pay-Create` | `pay.create()` |
| 出差单（ryx） | `TmcApiBookUrl-Home-GetTravelUrl` | `travel.getTravelUrl()` / `travel.getTravelForms()` |

常量定义：`packages/api/src/methods/hotel-flow.ts`、`order-flow.ts`、`travel-flow.ts`

## 出差单（ryx）

融易行预订页通过 **GetTravelUrl**（非 jyx 的 `FeatureRonglvUrl-jyx-GetTravelForms`）拉取出差单：

```typescript
// 原始响应
const raw = await getApi().travel.getTravelUrl({
  staffNumber: null,
  staffOutNumber: null,
  name: null,
  travelType: 'Hotel',
})

// UI 列表（映射 TravelFormDto）
const forms = await getApi().travel.getTravelForms({ travelType: 'Hotel' })
```

预订时传 `TravelFormId`；不选则个人支付。

## Mock

- Fixtures：`packages/mock/src/fixtures/hotel.ts`、`order.ts`
- Handlers：`packages/mock/src/handlers/hotel.ts`
- 订单轮询：Mock 订单初始 `Booking` / `isShowPayButton=false`，3s 后变为 `WaitPay`

## H5 页面路由

| 路由 | 页面 |
|------|------|
| `/hotel` | 列表 |
| `/hotel/:hotelId` | 详情 |
| `/hotel/:hotelId/book` | 填单 |
| `/hotel/result/:orderId` | 结果（轮询） |
| `/hotel/pay/:orderId` | 支付 |

## 调用示例

```typescript
import { getApi } from '@/lib/api'

const list = await getApi().hotel.getList({ CityCode: '010' })
const detail = await getApi().hotel.getDetail({ HotelId: 'H10001' })
const book = await getApi().hotel.submitBook({ ... })
const order = await getApi().order.getDetail({ OrderId: book.OrderId })
```

## 相关文档

| 文档 | 说明 |
|------|------|
| [passenger.md](./passenger.md) | 出行人 / 常旅客选择（填单入住人） |

## 环境

```env
VITE_API_MODE=mock
VITE_API_MOCK_DELAY=300
```
