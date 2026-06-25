# Proxy 测试环境已知问题（待后续处理）

> **环境**：`pnpm dev:h5:test` · `VITE_API_MODE=proxy` · `VITE_API_BASE_URL=http://app.rtesp.com`  
> **记录日期**：2026-06-24  
> **状态**：阻塞 Proxy 联调验收，不阻塞 Mock / 单元测试

---

## 1. 机票订单详情无法加载（P0 · 后端）

| 项 | 说明 |
|----|------|
| **页面** | `/orders/flight/:orderId` · `OrderFlightDetailView` |
| **接口** | `TmcApiOrderUrl-Order-Detail`（`order.getDetail`） |
| **现象** | 页面红字：`系统错误: Unknown column 't3t1t0.FromCityName' in 'field list'` |
| **归属** | **Staging 后端 SQL / 库表**：查询引用了不存在的字段 `FromCityName` |
| **H5 侧** | 前端已实现详情页；`order-detail-map.ts` 仅做响应 normalize，不发起该 SQL |
| **影响** | 下单成功后无法查看订单详情；详情页「去支付」入口不可用 |

**后续动作（后端）**：修正 `Order-Detail` 相关 SQL 或补齐表字段；修好后用已有 `TradeNo` 回归 `/orders/flight/:id`。

---

## 2. Proxy 环境端到端支付不可验收（P0 · 依赖 #1 + 业务条件）

| 项 | 说明 |
|----|------|
| **填单后自动跳支付** | 仅当 `IsCheckPay` + `checkPay` 15s 内就绪 + **个付(2)/授信(4)** 时跳 `/flight/pay/:id` |
| **默认支付方式** | 填单默认 **公付(1)**（与 Legacy 一致），公付不会进支付页 |
| **checkPay** | `TmcApiBookUrl-Home-CheckPay`，最多 5 次 × 3s；超时则落订单详情 |
| **Proxy E2E** | [flight-pay-migration-strategy.md](./domains/flight-pay-migration-strategy.md) §7「Proxy 真环境个付 E2E」仍为 `[ ]` |

**当前联调结论**：测试环境 **无法从 UI 完整走通「下单 → 详情 → 支付」**；即使手动访问 `/flight/pay/:id`，`GetTotalPayAmount` / `GetOrderPays` 在 staging 上亦未验收。

**后续动作**：

1. 后端修复 #1 后，用个付账号复测填单 → checkPay → 支付页。
2. 运行 `FLIGHT_PROXY_SUBMIT=1 FLIGHT_PROXY_PAY=1 node packages/api/scripts/verify-flight-proxy.mjs` 留档响应。
3. （可选 H5）填单提交 dev 日志：打印 `IsCheckPay`、`travelPayType`、`checkPayReady`，便于区分未跳支付原因。

**代码参考**：

- 跳转条件：`apps/h5/src/pages/flight/FlightBookPage.tsx` · `shouldNavigateToPay`
- checkPay 轮询：`apps/h5/src/lib/flight-book-check-pay.ts`

---

## 3. 航班列表「获取失败」提示（P2 · 非 Legacy 文案）

| 项 | 说明 |
|----|------|
| **页面** | `/flight/list` · `FlightListPage` |
| **文案** | `航班列表获取失败，请确认出发/到达城市后重试；若仍失败请联系管理员` |
| **来源** | H5 `formatApiError.ts` 对后端错误「没有获取列表」的友好映射，**非 Legacy 原文** |
| **Legacy** | 列表接口失败时仅停 loading，易与「无航班」空态混淆 |

**后续动作**：待列表 Proxy 稳定后，视产品决定是否与 Legacy 空态/alert 对齐；或保留 H5 独立错误态。

---

## 4. Mock 与 Proxy 能力对照

| 能力 | Mock | Proxy（staging） |
|------|------|------------------|
| 航班列表 / 舱位 / 填单 | ✅ | ⚠️ 部分航线/城市依赖后端 |
| 下单 `Flight-Book` | ✅ | ✅（已观测可成单） |
| 订单详情 | ✅ | ❌ #1 |
| 填单后自动支付页 | ✅ | ❌ #2 |
| 支付页 Pay-Create/Process | ✅ | ⚠️ 未验收 |

**本地验 UI**：`pnpm dev:h5:mock` 或 DEV 面板切 Mock。

---

## 5. 相关文档

| 文档 | 说明 |
|------|------|
| [flight-pay-migration-strategy.md](./domains/flight-pay-migration-strategy.md) | 支付迁移与 Legacy 分支 |
| [flight-book-migration-strategy.md](./domains/flight-book-migration-strategy.md) | 填单与 checkPay |
| [PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md) | 页面 × 接口矩阵 |
| [h5-login-troubleshooting.md](../h5-login-troubleshooting.md) | 登录 / Proxy 排障 |
