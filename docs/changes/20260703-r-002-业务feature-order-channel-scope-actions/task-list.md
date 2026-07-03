# 开发任务清单
## 基础信息
- 关联 Jira：r-002
- 需求文件夹：20260703-r-002-业务feature-order-channel-scope-actions
- [设计文档](design.md)

## 任务列表（按功能点拆分 · 唯一标号 · 含验证标准）

| 任务标号 | 任务名称 | 任务描述 | 验证标准 | 完成状态 |
|----------|----------|----------|----------|----------|
| T001 | 订单列表路由状态建模 | 在 `order-list-params` 或新增模块中收敛 `channel + tab + scope` 解析与构造，兼容历史 `tabId` 和缺省 `channel`。 | 1. `/home/orders?channel=tourist&tab=train&scope=all` 解析为因私火车全部。 2. `/home/orders?tab=flight` 可按首页模式补齐 channel。 3. 非法 channel 回退到明确默认值。 4. 单元测试覆盖 tmc / tourist / 历史 URL。 | ✅ 已完成 |
| T002 | 六入口订单类型 UI | 将订单列表第一层调整为因公机票、因公火车、因公酒店、因私机票、因私火车、因私酒店，并实现公私不同字体颜色和选中态。 | 1. 375px 宽度下 6 个入口可正常展示或横向滚动。 2. 因公与因私颜色不同。 3. 当前选中入口有明显选中效果。 4. 切换入口后 URL 同步更新 channel 和 tab。 | ✅ 已完成 |
| T003 | 全部 / 待出行筛选保留状态 | 保留第二层 `全部 / 待出行`，切换 scope 时不丢失当前 `channel` 与 `tab`。 | 1. 因私火车切待出行后 URL 为 `channel=tourist&tab=train&scope=pendingTravel`。 2. 再切全部后保留 `channel=tourist&tab=train`。 3. 切换 scope 后分页重置。 | ✅ 已完成 |
| T004 | 列表请求与缓存按 channel 隔离 | 确保 `useOrderList` 请求、query key、refresh 均包含 channel，全部 / 待出行按 channel 选择对应 Method。 | 1. 因公全部走 `TmcApiOrderUrl-Order-List`。 2. 因私全部走 `TmcTouristOrderUrl-Order-List`。 3. 因公待出行走 `TmcApiOrderUrl-Travel-List`。 4. 因私待出行走 `TmcTouristOrderUrl-Travel-List`。 5. 公私切换不会复用上一列表缓存。 | ✅ 已完成 |
| T005 | 列表跳转与动作透传 channel | 从列表进入详情、支付、取消、退票、改签时，使用当前 `channel` 构造 URL 或 mutation 参数。 | 1. 因私列表点击详情 URL 带 `channel=tourist`。 2. 因私列表点击支付 URL 带 `channel=tourist`。 3. 因私列表取消 / 退改签 mutation 参数带 `channel=tourist`。 4. 因公列表不误传 tourist。 | ✅ 已完成 |
| T006 | 详情返回列表保留订单类型 | 调整机票、火车、酒店详情页返回订单列表的 fallback URL，保留来源 `channel + tab + scope`。 | 1. 从因私火车待出行列表进详情后返回，仍回因私火车待出行。 2. 从因公机票全部列表进详情后返回，仍回因公机票全部。 3. 历史无来源详情 URL 返回时使用产品 tab 和当前 channel 兼容。 | ✅ 已完成 |
| T007 | 因私火车详情动作补齐 | 补齐因私火车详情的票级取消、tourist 退票、tourist 改签辅助接口，并修正退票提交 Method。 | 1. `isShowCancelButton` 的火车票展示票级取消。 2. 因私票级取消走 `TmcTouristOrderUrl-Order-AbolishTicket`，`Tag=train`。 3. 因私退票信息走 `TmcTouristTrainUrl-Home-GetTrainPassenger`。 4. 因私退票提交走 `TmcTouristTrainUrl-Home-Refund`。 5. 因私改签信息走 `TmcTouristTrainUrl-Home-GetExchangeInfo`。 | ✅ 已完成 |
| T008 | 详情后续流程 channel 回归 | 回归机票、火车、酒店详情页的支付、取消、退票、改签、酒店短信验证等后续流程，确保按详情 URL channel 选择接口。 | 1. 因私详情不调用 `TmcApiOrderUrl-*` 售后接口。 2. 因公详情不调用 `TmcTouristOrderUrl-*` 售后接口。 3. 支付页使用 URL channel，而不是重新读取首页模式。 4. 相关 hook 和 API 测试覆盖。 | ✅ 已完成 |
| T009 | 自动化测试与联调验证 | 补充单元测试、API adapter 测试和必要页面联调记录，覆盖 PRD 验收标准。 | 1. `order-list-params` 测试通过。 2. `useOrderList` query key / Method 分支测试通过。 3. 列表跳详情 URL 测试通过。 4. 火车退票 / 票级取消 Method 测试通过。 5. `pnpm --filter @ryx/h5 exec tsc -p tsconfig.app.json --noEmit` 通过。 | ✅ 已完成 |
| T010 | 文档与验收记录同步 | 开发完成后更新设计变更记录和任务状态，记录接口域联调结果。 | 1. `design.md` 变更记录追加实现版本。 2. `task-list.md` 完成状态与实际一致。 3. 验收记录包含关键测试命令和结果。 | ✅ 已完成 |

## 完成状态说明

- ✅ 已完成：任务开发完成，验证标准全部通过
- ❌ 未完成：任务待开发或开发中

## 任务依赖说明
1. T001 是基础任务，必须先完成。
2. T002、T003 依赖 T001 的路由状态模型。
3. T004 依赖 T001，且应与 T002、T003 联调。
4. T005、T006 依赖 T001 和 T004。
5. T007 可与 T005 并行，但需要在 T008 中统一回归。
6. T008 依赖 T005、T006、T007。
7. T009 贯穿开发过程，作为合并门槛。
8. T010 在实现和测试稳定后完成。

## 备注
1. 本需求不新增后端接口和数据库。
2. 火车 12306 相关接口不纳入本次新增范围。
3. 因私订单链路以 `channel=tourist` 为唯一显式来源，避免从首页模式二次推导造成串域。

## 验收记录

| 日期 | 验证项 | 结果 |
|------|--------|------|
| 2026-07-03 | `pnpm --filter @ryx/shared-types build` | 通过 |
| 2026-07-03 | `pnpm --filter @ryx/api build` | 通过 |
| 2026-07-03 | `pnpm --filter @ryx/h5 exec tsc -p tsconfig.app.json --noEmit` | 通过 |
| 2026-07-03 | `pnpm --filter @ryx/h5 exec vitest run src/lib/order-list-params.test.ts src/lib/order-routes.test.ts src/lib/train-order-actions.test.ts` | 通过 |
| 2026-07-03 | `pnpm --filter @ryx/api exec vitest run src/apis/order-train-mutations.test.ts src/apis/train.test.ts src/apis/order-detail-map.test.ts` | 通过 |
| 2026-07-03 | 订单中心六入口 UI：同一行展示、分组弱区分、选中短线区分 | 已联调 |
