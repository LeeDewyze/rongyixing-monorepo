# 融易行 H5 迁移看板

> **目标**：H5 版 ryx → `apps/h5`，替换 [app.rtesp.com/rl](http://app.rtesp.com/rl/index.html)  
> **方案**：[接口迁移方案.md](../接口迁移方案.md)  
> **版本**：v3.0 · **更新**：2026-06-15  
> **状态图例**：`[x]` 完成 · `[~]` 部分 · `[ ]` 待做 · `[-]` 不做/延期

---

## 一、工作方式（页面驱动）

**不按 354/364 Method 全量推进，按 [PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md) 逐页迁移。**

```
Wave 选页 → 补齐该页 Method（API + Mock）→ 迁 H5 → 更新矩阵 H5 列
```

| 文档 | 用途 |
|------|------|
| [PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md) | **主操作手册**：29 页 × Method × 迁移顺序 |
| [H5-RYX-MIGRATION.md](./H5-RYX-MIGRATION.md) | Tab 架构、路由对照、Out of Scope |
| [METHODS.json](./METHODS.json) | 364 条字典（备查） |
| [METHODS-RYX-SCOPE.md](./METHODS-RYX-SCOPE.md) | 354 扫描 / 144 非主线 |

---

## 二、进度总览

```
── 范围 ───────────────────────────────────────────
364 字典 · 354 扫描上界 · 144 非主线(不做)
29 页矩阵（/rl/ 企业主线）
── 页面迁移（KPI）──────────────────────────────────
H5 页面    ███░░░░░░░░░  ≈28%   6 done + 4 partial / 29
── 接口（随页面滚动）──────────────────────────────
@ryx/api   25 条已封装 · 下一批：首页 Workbench + 订单列表页
```

| 指标 | 值 |
|------|-----|
| 矩阵内页面 | 29 |
| H5 `[x]` | 6（酒店链 5 + 选出差单） |
| H5 `[~]` | 4（登录×2、酒店搜索、常旅客） |
| H5 `[ ]` | 19 |
| 下一批 Wave | **2** Tab 壳 + 首页工作台 |

---

## 三、Wave 里程碑

| Wave | 主题 | 页面 | H5 状态 | 下一动作 |
|------|------|------|---------|----------|
| **1** | 登录与会话 | 2 | [~] | identity.get + logout 接页面 |
| **2** | Tab + 首页/待出行/我的 | 4 | [ ] | **TabLayout + Workbench-Load** |
| **3** | 酒店预订链 | 6 | [~] | 城市/SearchHotel/Policy UI |
| **4** | 订单列表 + 详情 | 4 | [ ] | `/orders` + 酒店详情页 |
| **5** | 机票链 | 3 | [ ] | 封装 flight domain |
| **6** | 火车链 | 3 | [ ] | 封装 train domain |
| **7** | 出差 + 常旅客 | 3 | [~] | 出差申请抓包 |
| **8** | 账户/审批 P2 | 4 | [ ] | 可选 |

---

## 四、基础设施（已完成）

| Phase | 名称 | 状态 |
|-------|------|------|
| P0 | 接口资产登记 `METHODS.json` | [x] |
| P1 | Proxy 适配层 | [x] |
| P2 | Mock / `VITE_API_MODE` | [x] |
| P5 | CI / verify:mock / Vitest | [x] |

---

## 五、页面迁移勾选（29 页）

> 明细 Method 见 [PAGE-API-MATRIX.md §4](./PAGE-API-MATRIX.md#4-页面总表)

### Wave 1 — 登录 `[~]`

- [~] 手机登录 `/login`
- [~] 密码登录 `/login/password`
- [ ] 登录后 `identity.get` + DeviceLogin 续票
- [ ] 登出

### Wave 2 — Tab + 首页 `[ ]` ← **当前建议**

- [ ] Tab 壳（首页 / 待出行 / 我的）
- [ ] 首页工作台 `tab-tmc-home_ryx`
- [ ] 待出行 Tab `tab-tmc-trip_ryx`
- [ ] 我的 Tab `tab-tmc-my_ryx`

### Wave 3 — 酒店 `[~]`

- [~] 酒店搜索（缺城市/日期 UI）
- [x] 酒店列表 `/hotel`
- [x] 酒店详情 `/hotel/:id`
- [x] 酒店填单（含选出差单）
- [x] 下单结果 `/hotel/result/:orderId`
- [x] 支付 `/hotel/pay/:orderId`
- [ ] Policy / SearchHotel / Pay-Process

### Wave 4 — 订单 `[ ]`

- [ ] 订单列表 `/orders`
- [ ] 酒店订单详情 `/orders/hotel/:id`
- [ ] 机票订单详情
- [ ] 火车订单详情

### Wave 5–8

- [ ] 机票搜索 / 列表 / 填单
- [ ] 火车搜索 / 车次 / 填单
- [ ] 出差申请（抓包）
- [x] 选择出差单（预订内嵌）
- [~] 选择常旅客（独立页 `/passenger/select`；酒店填单已消费，机票/火车待接填单）→ [passenger.md](./domains/passenger.md)
- [ ] 账户设置 / 安全 / 证件 / 审批（P2）

---

## 六、域级 Method 状态（随页面引用更新）

> 完整 Flow 表；**新增 Method 只在页面迁移到该 Flow 时封装**。

### 6.1 登录 / 身份

| Method | API | Mock | H5 | 关联页 |
|--------|-----|------|-----|--------|
| `ApiLoginUrl-Home-Login` | [x] | [x] | [x] | Wave 1 |
| `ApiLoginUrl-Home-MobileLogin` | [x] | [x] | [x] | Wave 1 |
| `ApiLoginUrl-Home-DeviceLogin` | [x] | [x] | [~] | Wave 1 |
| `ApiLoginUrl-Home-Logout` | [x] | [x] | [ ] | Wave 1 / 我的 |
| `ApiHomeUrl-Identity-Get` | [x] | [x] | [ ] | Wave 1 |
| `ApiHomeUrl-Identity-Check` | [x] | [x] | [ ] | Wave 1 |
| `/Home/SendLoginMobileCode` | gateway | — | [x] | Wave 1 |

### 6.2 首页 / 工作台（Wave 2 待做）

| Method | API | Mock | H5 | 关联页 |
|--------|-----|------|-----|--------|
| `TmcApiHomeUrl-Workbench-Load` | [ ] | [ ] | [ ] | 首页 |
| `TmcApiHomeUrl-Banner-List` | [ ] | [ ] | [ ] | 首页 |
| `TmcApiHomeUrl-Notice-List` | [ ] | [ ] | [ ] | 首页 |
| `TmcApiOrderUrl-Travel-List` | [ ] | [ ] | [ ] | 首页/待出行 |
| `TmcApiHomeUrl-Home-GetAccountWaitingTasks` | [ ] | [ ] | [ ] | 首页 |

### 6.3 酒店（Wave 3）

| Method | API | Mock | H5 | 关联页 |
|--------|-----|------|-----|--------|
| `TmcApiHomeUrl-Resource-DomesticHotelCity` | [x] | [x] | [ ] | 酒店搜索 |
| `TmcApiHotelUrl-Home-List` | [x] | [x] | [x] | 列表 |
| `TmcApiHotelUrl-Home-Detail` | [x] | [x] | [x] | 详情 |
| `TmcApiHotelUrl-Home-Policy` | [x] | [x] | [ ] | 详情/填单 |
| `TmcApiHotelUrl-Home-SearchHotel` | [ ] | [ ] | [ ] | 搜索 |
| `TmcApiHotelUrl-Condition-Gets` | [ ] | [ ] | [ ] | 搜索 |
| `TmcApiBookUrl-Hotel-Initialize` | [x] | [x] | [x] | 填单 |
| `TmcApiBookUrl-Hotel-Book` | [x] | [x] | [x] | 填单 |
| `TmcApiBookUrl-Home-GetTravelUrl` | [x] | [x] | [x] | 填单 |

→ [domains/hotel.md](./domains/hotel.md)

### 6.4 订单 / 支付

| Method | API | Mock | H5 | 关联页 |
|--------|-----|------|-----|--------|
| `TmcApiOrderUrl-Order-List` | [x] | [x] | [ ] | 订单列表 |
| `TmcApiOrderUrl-Order-Detail` | [x] | [x] | [~] | 结果页/详情 |
| `TmcApiOrderUrl-Order-CancelOrderHotel` | [x] | [x] | [ ] | 酒店详情 |
| `TmcApiOrderUrl-Order-GetOrderPays` | [x] | [x] | [x] | 支付 |
| `TmcApiOrderUrl-Pay-Create` | [x] | [x] | [x] | 支付 |
| `TmcApiOrderUrl-Pay-Process` | [x] | [x] | [ ] | 支付 |

### 6.5 会员 / 出差

| Method | API | Mock | H5 | 关联页 |
|--------|-----|------|-----|--------|
| `ApiMemberUrl-Member-Get` | [x] | [x] | [ ] | 我的 |
| `ApiMemberUrl-Passenger-List` | [x] | [x] | [x] | 填单 |
| `ApiMemberUrl-Passenger-Add` | [x] | [x] | [ ] | 常旅客 |
| `HrApiUrl-Staff-Get` | [x] | [x] | [ ] | 出差 |
| 出差申请提交 | [ ] | [ ] | [ ] | Wave 7 · 抓包 |

### 6.6 机票 / 火车 `[-]`

Wave 5–6 启动时再展开；见 [PAGE-API-MATRIX.md §5](./PAGE-API-MATRIX.md#wave-5--机票待封装)。

### Out of Scope `[-]`

jyx-only · MMS · CRM · 游客态 · 国际/租车 · BPM 全套

---

## 七、H5 已接线（13 处）

| 调用 | 页面/Hook |
|------|-----------|
| `authProxy.login` | PasswordLoginPage |
| `authProxy.mobileLogin` | PhoneLoginPage |
| `authProxy.deviceLogin` | useAuth |
| `gateway.sendLoginMobileCode` | PhoneLoginPage |
| `hotel.getList` | HotelListPage |
| `hotel.getDetail` | HotelDetailPage |
| `hotel.initBook` / `submitBook` | HotelBookPage |
| `travel.getTravelForms` | HotelBookPage |
| `member.getPassengerList` | HotelBookPage |
| `order.getDetail` | HotelResultPage |
| `pay.getOrderPays` / `create` | HotelPayPage |

---

## 八、验收命令

```bash
pnpm analyze-ryx-pages && pnpm analyze-ryx-scope
pnpm build && pnpm typecheck && pnpm test
pnpm check:mock-coverage -- --domain all
pnpm verify:mock
pnpm dev:h5:mock                    # Mock：/hotel
pnpm dev:h5:test                    # proxy 联调 app.rtesp.com
```

联调（`apps/h5/.env.staging`）：

```env
VITE_API_MODE=proxy
VITE_API_BASE_URL=http://app.rtesp.com
```

---

## 九、相关文档

| 文档 | 路径 |
|------|------|
| **页面→接口矩阵** | [PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md) |
| H5 路由对照 | [H5-RYX-MIGRATION.md](./H5-RYX-MIGRATION.md) |
| 迁移方案 | [../接口迁移方案.md](../接口迁移方案.md) |
| Method 字典 | [METHODS.json](./METHODS.json) |
| 范围分析 | [METHODS-RYX-SCOPE.md](./METHODS-RYX-SCOPE.md) |
| 酒店 Flow | [domains/hotel.md](./domains/hotel.md) |
