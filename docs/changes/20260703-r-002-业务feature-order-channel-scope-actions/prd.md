# 需求PRD文档
## 一、基础信息
- Jira号：r-002
- 需求类型：业务feature
- 英文简称：order-channel-scope-actions
- 文件夹名称：20260703-r-002-业务feature-order-channel-scope-actions

## 二、业务背景
当前 H5 订单列表只有一个入口 `/home/orders`，页面上仅按机票、火车、酒店与全部 / 待出行进行筛选。随着因私 public/tourist 链路迁移完成，订单中心不再只是三品类列表，而是同时承载因公 TMC 订单与因私 tourist 订单。

因公与因私的订单列表、待出行、详情、支付、取消、退改签等后续流程使用不同接口域。若列表入口不显式区分因公 / 因私，用户从列表进入详情或执行操作时容易出现接口串域、按钮状态来源不准确、详情返回后列表模式丢失等问题。

本需求目标是将订单中心调整为清晰的两层筛选和一层内容结构：
1. 第一层：因公机票、因公火车、因公酒店、因私机票、因私火车、因私酒店。
2. 第二层：全部、待出行。
3. 第三层：订单列表内容。

第一层每个入口同时决定订单归属 `channel` 与产品品类 `tab`，第二层决定订单范围 `scope`，后续详情与操作链路必须持续透传当前 `channel`。

## 三、需求详情
1. 订单列表页第一层展示 6 个订单类型入口：
   - 因公机票
   - 因公火车
   - 因公酒店
   - 因私机票
   - 因私火车
   - 因私酒店

2. 6 个入口的业务含义：
   - 因公机票：`channel=tmc&tab=flight`
   - 因公火车：`channel=tmc&tab=train`
   - 因公酒店：`channel=tmc&tab=hotel`
   - 因私机票：`channel=tourist&tab=flight`
   - 因私火车：`channel=tourist&tab=train`
   - 因私酒店：`channel=tourist&tab=hotel`

3. 第一层入口需要明确区分因公与因私视觉：
   - 因公与因私字体颜色不同。
   - 当前选中的入口需要有明显选中效果。
   - 选中效果需要同时体现当前订单归属与品类，避免用户误以为只切换了品类。

4. 第二层保留现有范围筛选：
   - 全部：`scope=all`
   - 待出行：`scope=pendingTravel`
   - 切换第二层时保留当前第一层的 `channel` 与 `tab`。

5. URL 需要显式表达当前订单列表状态：
   - `/home/orders?channel=tmc&tab=flight&scope=all`
   - `/home/orders?channel=tourist&tab=train&scope=pendingTravel`
   - 兼容历史 URL `/home/orders?tab=flight`，缺失 `channel` 时按当前首页出行模式兜底，并规范化写回 URL。

6. 订单列表接口按当前 `channel` 区分：
   - 因公全部列表走 `TmcApiOrderUrl-Order-List`。
   - 因私全部列表走 `TmcTouristOrderUrl-Order-List`。
   - 因公待出行走 `TmcApiOrderUrl-Travel-List`。
   - 因私待出行走 `TmcTouristOrderUrl-Travel-List`。

7. 从订单列表进入详情时必须透传当前 `channel`：
   - 因公详情 URL 可使用 `channel=tmc` 或省略，但内部需明确按 TMC 通道。
   - 因私详情 URL 必须带 `channel=tourist`。
   - 详情返回订单列表时需要回到原来的第一层和第二层组合。

8. 从订单列表直接发起的后续操作必须按当前 `channel` 区分：
   - 支付
   - 取消订单 / 取消出票
   - 票级取消 / 废票
   - 退票
   - 改签
   - 酒店取消 / 短信验证

9. 订单详情页后续流程也必须按详情 URL 的 `channel` 区分：
   - 详情请求
   - 支付
   - 火车确认出票 / 取消出票
   - 火车退票 / 改签 / 票级取消
   - 机票退票 / 票级废票
   - 酒店取消 / 短信验证

10. 因私火车详情动作规则需要完整覆盖：
    - 订单级支付：展示立即支付，跳转因私支付链路。
    - 订单级取消 / 确认出票：走 `TmcTouristOrderUrl-Order-CancelTrain` / `IssueTrain`。
    - 票级退票：走 tourist train 退票信息与退票链路。
    - 票级改签：走 tourist train 改签信息与 tourist book 改签下单链路。
    - 票级取消 / 废票：走 `TmcTouristOrderUrl-Order-AbolishTicket`，`Tag=train`。

11. 不将因公订单与因私订单混在同一个“全部订单”数据源里展示。一个页面可以承载两个订单域，但当前列表请求一次只对应一个明确的 `channel + tab + scope`。

12. 本需求不新增后端接口，不新增数据库表；仅调整 H5 订单中心 UI、URL 状态、API channel 传递、详情后续动作链路与测试覆盖。

## 四、验收标准
1. 进入 `/home/orders` 后，页面第一层能看到 6 个入口：因公机票、因公火车、因公酒店、因私机票、因私火车、因私酒店。
2. 因公入口与因私入口字体颜色不同，当前选中入口有明确选中效果。
3. 点击任一第一层入口后，URL 同步更新 `channel` 与 `tab`，并保留或默认 `scope`。
4. 点击全部 / 待出行后，URL 同步更新 `scope`，并保留当前 `channel` 与 `tab`。
5. 因公机票 / 火车 / 酒店全部列表分别调用 `TmcApiOrderUrl-Order-List`，请求 `Type` 分别为 `Flight` / `Train` / `Hotel`。
6. 因私机票 / 火车 / 酒店全部列表分别调用 `TmcTouristOrderUrl-Order-List`，请求 `Type` 分别为 `Flight` / `Train` / `Hotel`。
7. 因公待出行调用 `TmcApiOrderUrl-Travel-List`，因私待出行调用 `TmcTouristOrderUrl-Travel-List`。
8. 从因私列表进入机票 / 火车 / 酒店详情，详情 URL 带 `channel=tourist`，详情接口走 `TmcTouristOrderUrl-Order-Detail`。
9. 从因公列表进入机票 / 火车 / 酒店详情，详情接口走 `TmcApiOrderUrl-Order-Detail`。
10. 从详情页返回订单列表时，能回到原来的第一层入口和全部 / 待出行状态。
11. 因私订单从列表或详情发起支付、取消、退票、改签时，不调用因公 `TmcApiOrderUrl-*` 订单接口。
12. 因公订单从列表或详情发起支付、取消、退票、改签时，不调用 `TmcTouristOrderUrl-*` 或 tourist train/book 链路。
13. 因私火车详情中不同订单状态展示对应按钮：待支付展示取消与立即支付，待确认出票展示取消订单与确认出票，已出票按票级变量展示退票、改签、票级取消。
14. 兼容历史链接 `/home/orders?tab=flight`，页面能自动补齐或内部解析为明确的 `channel`，不出现空白列表或接口域不确定。
15. 订单列表相关单元测试覆盖 `channel + tab + scope` 解析、URL 更新、query key 隔离、列表 Method 选择、详情跳转透传。

## 五、非功能要求（可选）
1. UI 保持当前订单页融易蓝视觉体系，移动端首屏不应因新增第一层入口导致列表内容被过度挤压。
2. 第一层入口支持横向滚动或紧凑排布，避免 375px 宽度下文字重叠。
3. 列表数据缓存必须按 `channel + tab + scope` 隔离，切换公私或品类不复用错误缓存。
4. 所有新增状态解析逻辑需要具备历史 URL 兼容能力。

## 六、关联模块/依赖
1. H5 订单列表：`apps/h5/src/pages/order/OrderListPage.tsx`
2. 订单分类与范围筛选：`apps/h5/src/components/order/OrderCategoryTabs.tsx`
3. 订单列表参数解析：`apps/h5/src/lib/order-list-params.ts`
4. 订单路由构造：`apps/h5/src/lib/order-routes.ts`
5. 订单列表 Hook：`apps/h5/src/hooks/useOrderList.ts`
6. 订单详情页：`OrderFlightDetailPage`、`OrderTrainDetailPage`、`OrderHotelDetailPage`
7. 订单支付页：`OrderPayPage`
8. API 订单域：`packages/api/src/apis/order.ts`、`packages/api/src/apis/pay.ts`
9. tourist 方法域：`packages/api/src/methods/order-flow.ts`、`packages/api/src/methods/train-flow.ts`
10. 既有文档：`docs/changes/20260630-r-001-业务feature-business-private-travel-migration/design.md`

## 七、备注
1. 项目根：`rongyixing-monorepo`
2. 变更根：`docs/changes`
3. 本需求聚焦订单中心与订单详情后续流程，不重复描述因私下单页迁移内容。
4. 火车 12306 相关接口不在本需求新增范围内。
