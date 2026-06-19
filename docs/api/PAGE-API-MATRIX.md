# ryx H5 页面 → 接口矩阵

> **版本**：v1.0 · **更新**：2026-06-15  
> **源**：[app.rtesp.com/rl](http://app.rtesp.com/rl/index.html) · `beeantmobile-main/projects/ryx`  
> **目标**：`apps/h5` + `@ryx/api` + `@ryx/mock`  
> **重新生成明细**：`pnpm analyze-ryx-pages` → 本文件 + `PAGE-API-MATRIX.json`

---

## 1. 怎么用这份矩阵

**迁移单位是「页」，不是「Method 条数」。**

```
选 Wave → 读该页 Method 列表 → 封装缺失 API/Mock → 迁 H5 → 勾选 task-list
```

| 文档 | 角色 |
|------|------|
| **本文** | 页面 → Method 操作手册（迁移顺序） |
| [task-list.md](./task-list.md) | 总看板：阶段 + 域级 Method + H5 勾选 |
| [H5-RYX-MIGRATION.md](./H5-RYX-MIGRATION.md) | 路由对照、Tab 架构、Out of Scope |
| [METHODS.json](./METHODS.json) | 364 条全库字典（备查） |
| [METHODS-RYX-SCOPE.md](./METHODS-RYX-SCOPE.md) | 354 扫描 vs 144 非主线 |

**滚动推进**：每次只把 **接下来 2～3 页** 的 API/Mock 补齐，不必等全库整理完。

---

## 2. 进度快照

| 指标 | 值 |
|------|-----|
| 主线页面（矩阵内） | **29** |
| H5 `[x]` 完成 | **6** |
| H5 `[~]` 部分 | **4** |
| H5 `[ ]` 未开始 | **19** |
| 需抓包 | **1**（出差申请） |
| **页面迁移进度** | **≈28%**（6 + 4×0.5 / 29） |

---

## 3. Wave 总览

| Wave | 主题 | 页数 | 建议顺序 |
|------|------|------|----------|
| 1 | 登录与会话 | 2 | 先做 identity 续票 |
| 2 | Tab 壳 + 首页/待出行/我的 | 4 | **下一批** |
| 3 | 酒店预订链 | 6 | 进行中（补搜索 UI） |
| 4 | 订单列表 + 详情 | 4 | 酒店完成后 |
| 5 | 机票链 | 3 | — |
| 6 | 火车链 | 3 | — |
| 7 | 出差 + 常旅客 | 3 | 申请需抓包 |
| 8 | 账户/审批 P2 | 4 | 可选 |

---

## 4. 页面总表

| Wave | 页面 | 旧路由 | 新路由 | 核心 Method（摘要） | API | Mock | H5 | 备注 |
|------|------|--------|--------|----------------------|-----|------|----|------|
| 1 | 手机登录 | `login` | `/login` | Login, MobileLogin, SendLoginMobileCode | [~] | [~] | [~] | PhoneLoginPage |
| 1 | 密码登录 | `login/password` | `/login/password` | Login, DeviceLogin, Identity-Get | [~] | [~] | [~] | 缺 identity 续票 |
| 2 | Tab 壳 | `tabs` | `/home` | — | — | — | [ ] | 无 TabLayout |
| 2 | 首页工作台 | `tab-tmc-home_ryx` | `/home` | Workbench-Load, Banner-List, Notice-List, Travel-List | [ ] | [ ] | [ ] | **下一批** |
| 2 | 待出行 Tab | `tab-tmc-trip_ryx` | `/trips` | Travel-List, Task-List | [ ] | [ ] | [ ] | |
| 2 | 我的 Tab | `tab-tmc-my_ryx` | `/me` | Member-Get, 跳转订单列表 | [~] | [~] | [ ] | |
| 3 | 酒店搜索 | `tmc-hotel-search_ryx` | `/hotel` | DomesticHotelCity, SearchHotel, Condition-Gets | [~] | [~] | [~] | 缺城市/日期 UI |
| 3 | 酒店列表 | `tmc-hotel-list_ryx` | `/hotel` | Home-List | [x] | [x] | [x] | HotelListPage |
| 3 | 酒店详情 | `tmc-hotel-detail_ryx` | `/hotel/:id` | Home-Detail, Policy | [~] | [~] | [x] | Policy 未接 UI |
| 3 | 酒店填单 | `tmc-hotel-book_ryx` | `/hotel/:id/book` | Initialize, Book, GetTravelUrl, Passenger-List | [x] | [x] | [x] | HotelBookPage |
| 3 | 下单结果 | `tmc-checkout-success` | `/hotel/result/:orderId` | Order-Detail | [x] | [x] | [x] | 轮询 |
| 3 | 支付 | 支付子页 | `/hotel/pay/:orderId` | GetOrderPays, Pay-Create | [~] | [x] | [x] | 缺 Pay-Process |
| 4 | 订单列表 | `tmc-order-list_ryx` | `/orders` | Order-List | [x] | [x] | [ ] | API 有，无页面 |
| 4 | 酒店订单详情 | `tmc-order-hotel-detail_ryx` | `/orders/hotel/:id` | Detail, CancelOrderHotel, SMS 验证 | [~] | [~] | [ ] | |
| 4 | 机票订单详情 | `tmc-order-flight-detail_ryx` | `/orders/flight/:id` | Detail, RefundFlight, Exchange… | [ ] | [ ] | [ ] | |
| 4 | 火车订单详情 | `tmc-order-train-detail_ryx` | `/orders/train/:id` | Detail, IssueTrain, CancelTrain | [ ] | [ ] | [ ] | |
| 5 | 机票搜索 | `tmc-flight-search_ryx` | `/flight` | Home-Index, Policy | [ ] | [ ] | [ ] | |
| 5 | 机票列表 | `tmc-flight-list_ryx` | `/flight/list` | Home-Detail, Home-Exchange | [ ] | [ ] | [ ] | |
| 5 | 机票填单 | `tmc-flight-book_ryx` | `/flight/book` | Initialize, Book, GetTravelUrl | [ ] | [ ] | [ ] | |
| 6 | 火车搜索 | `tmc-train-search_ryx` | `/train` | TrainStation, Search | [ ] | [ ] | [ ] | |
| 6 | 火车车次 | `tmc-train-list_ryx` | `/train/list` | Schedule, Policy | [ ] | [ ] | [ ] | |
| 6 | 火车填单 | `tmc-train-book_ryx` | `/train/book` | Initialize, Book | [ ] | [ ] | [ ] | |
| 7 | 出差申请 | `goBusiness` | `/travel/apply` | ⚠️ 待抓包 | [ ] | [ ] | [ ] | 源码路由缺失 |
| 7 | 选择出差单 | GetTravelUrl | 预订内嵌 | GetTravelUrl | [x] | [x] | [x] | 酒店填单已接 |
| 7 | 选择常旅客 | `tmc-select-passenger_ryx` | 预订子流程 | Passenger-List, Add | [~] | [~] | [~] | 无独立页 |
| 8 | 账户设置 | `account-setting_ryx` | `/me/settings` | Account-* | [ ] | [ ] | [ ] | P2 |
| 8 | 账户安全 | `account-security_ryx` | `/me/security` | Password-* | [ ] | [ ] | [ ] | P2 |
| 8 | 证件管理 | `member-credential-list` | `/me/credentials` | Credentials-* | [ ] | [ ] | [ ] | P2 |
| 8 | 我的审批 | `tmc-approval-task` | `/me/approvals` | Task-List, Home-TaskReviewed | [ ] | [ ] | [ ] | P2 可选 |

图例：`[x]` 完成 · `[~]` 部分 · `[ ]` 未做

---

## 5. 各页 Method 明细（主线）

### Wave 1 · 登录

| Method | 用途 | API | Mock | H5 |
|--------|------|-----|------|-----|
| `ApiLoginUrl-Home-Login` | 密码登录 | [x] | [x] | [x] |
| `ApiLoginUrl-Home-MobileLogin` | 手机登录 | [x] | [x] | [x] |
| `ApiLoginUrl-Home-DeviceLogin` | 续票 | [x] | [x] | [~] hook 有，未完整 |
| `ApiLoginUrl-Home-Logout` | 登出 | [x] | [x] | [ ] |
| `ApiHomeUrl-Identity-Get` | 登录后身份 | [x] | [x] | [ ] |
| `ApiHomeUrl-Identity-Check` | 身份校验 | [x] | [x] | [ ] |
| `/Home/SendLoginMobileCode` | 短信（Gateway） | [x] | — | [x] |

### Wave 2 · Tab + 首页

| Method | 用途 | API | Mock | H5 |
|--------|------|-----|------|-----|
| `TmcApiHomeUrl-Workbench-Load` | 工作台入口 | [ ] | [ ] | [ ] |
| `TmcApiHomeUrl-Banner-List` | 轮播 | [ ] | [ ] | [ ] |
| `TmcApiHomeUrl-Notice-List` | 公告 | [ ] | [ ] | [ ] |
| `TmcApiOrderUrl-Travel-List` | 待出行/首页摘要 | [ ] | [ ] | [ ] |
| `TmcApiHomeUrl-Home-GetAccountWaitingTasks` | 审批角标 | [ ] | [ ] | [ ] |
| `ApiMemberUrl-Member-Get` | 我的页用户信息 | [x] | [x] | [ ] |

### Wave 3 · 酒店（续）

| Method | 用途 | API | Mock | H5 |
|--------|------|-----|------|-----|
| `TmcApiHomeUrl-Resource-DomesticHotelCity` | 城市 | [x] | [x] | [ ] |
| `TmcApiHotelUrl-Home-SearchHotel` | 搜索 | [ ] | [ ] | [ ] |
| `TmcApiHotelUrl-Condition-Gets` | 筛选 | [ ] | [ ] | [ ] |
| `TmcApiHotelUrl-Home-List` | 列表 | [x] | [x] | [x] |
| `TmcApiHotelUrl-Home-Detail` | 详情 | [x] | [x] | [x] |
| `TmcApiHotelUrl-Home-Policy` | 违标 | [x] | [x] | [ ] |
| `TmcApiBookUrl-Hotel-Initialize` | 初始化 | [x] | [x] | [x] |
| `TmcApiBookUrl-Hotel-Book` | 下单 | [x] | [x] | [x] |
| `TmcApiBookUrl-Home-GetTravelUrl` | 出差单 | [x] | [x] | [x] |
| `ApiMemberUrl-Passenger-List` | 常旅客 | [x] | [x] | [x] |
| `TmcApiOrderUrl-Order-Detail` | 结果轮询 | [x] | [x] | [x] |
| `TmcApiOrderUrl-Order-GetOrderPays` | 支付渠道 | [x] | [x] | [x] |
| `TmcApiOrderUrl-Pay-Create` | 发起支付 | [x] | [x] | [x] |
| `TmcApiOrderUrl-Pay-Process` | 支付回调 | [x] | [x] | [ ] |

### Wave 4 · 订单

| Method | 用途 | API | Mock | H5 |
|--------|------|-----|------|-----|
| `TmcApiOrderUrl-Order-List` | 订单列表 | [x] | [x] | [ ] |
| `TmcApiOrderUrl-Order-Detail` | 详情 | [x] | [x] | [~] 仅结果页 |
| `TmcApiOrderUrl-Order-CancelOrderHotel` | 取消酒店 | [x] | [x] | [ ] |
| `TmcApiOrderUrl-Order-SendVerifyOrderHotelSMSCode` | 取消短信 | [ ] | [ ] | [ ] |
| `TmcApiOrderUrl-Order-ConfirmVerifyOrderHotelSMSCode` | 短信确认 | [ ] | [ ] | [ ] |

### Wave 5 · 机票（待封装）

| Method | 用途 |
|--------|------|
| `TmcApiFlightUrl-Home-Index` | 搜索首页 |
| `TmcApiFlightUrl-Home-Detail` | 航班详情 |
| `TmcApiFlightUrl-Home-Policy` | 政策 |
| `TmcApiBookUrl-Flight-Initialize` | 初始化 |
| `TmcApiBookUrl-Flight-Book` | 下单 |

### Wave 6 · 火车（待封装）

| Method | 用途 |
|--------|------|
| `TmcApiHomeUrl-Resource-TrainStation` | 车站 |
| `TmcApiTrainUrl-*` | 搜索/车次/政策 |
| `TmcApiBookUrl-Train-*` | 初始化/下单 |

### Wave 7 · 出差申请（待抓包）

旧 H5 入口 `goBusiness()` → `business-list` **路由不在仓库**；提交 API 需在 `/rl/` **抓包一次**后再写入本表。

候选域：`WorkflowApiUrl-*`、`BpmApiExpenseUrl-*`、`FeatureRonglvUrl-*`（**非** jyx 的 SaveTravelForms）。

---

## 6. Out of Scope（矩阵外）

默认不纳入 `/rl/` 企业主线：

- `public/*` 游客/会展 · `mms/*` 商城 · `crm/*`
- `tmc-international-*` 国际机酒 · `tmc-car` / 租车
- BPM 销售/日记/报价全套

---

## 7. 相关命令

```bash
pnpm analyze-ryx-pages      # 从源码重新扫描，更新本文件 + JSON
pnpm analyze-ryx-scope      # 354 vs 非主线范围
pnpm extract-methods        # 刷新 METHODS.json
pnpm dev:h5:mock            # 当前可测：/hotel 全流程
```
