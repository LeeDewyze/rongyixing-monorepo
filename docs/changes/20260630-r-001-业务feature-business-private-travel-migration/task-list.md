# 开发任务清单
## 基础信息
- 关联 Jira：r-001
- 需求文件夹：20260630-r-001-业务feature-business-private-travel-migration
- [设计文档](design.md)
- [public 链路分析](public-chain-analysis.md)

## 任务列表（按功能点拆分 · 唯一标号 · 含验证标准）
| 任务标号 | 任务名称 | 任务描述 | 验证标准 | 完成状态 |
|----------|----------|----------|----------|----------|
| T001 | 出行模式与产品通道收敛 | 在 H5 收敛因公 / 因私模式判断，明确 business → TMC 通道、personal → tourist 通道；保留因公默认值，避免把 `BookType` 当作出行模式。 | 1. 无 session 默认 business。 2. personal 模式产品入口解析为 tourist 通道。 3. business 模式产品入口解析为 TMC 通道。 4. Staff `BookType` 不影响通道判断。 | ❌ 未完成 |
| T002 | tourist context 获取与注入 | 新增 H5 tourist context，优先读取 URL query 中 `TouristTmcId/TouristMmsId`，缺失时调用 `TmcApiHomeUrl-Home-Tourist`；所有 `TmcTourist*` 请求注入顶层 `TmcId/MmsId` 和 `Data.TmcId`。 | 1. URL 带 tourist ids 时不重复初始化。 2. URL 未带时可通过 `Home-Tourist` 获取。 3. tourist 请求顶层 `TmcId/MmsId` 正确。 4. `Data.TmcId` 等于 tourist TMC。 5. context 失败不降级到 TMC 域下单。 | ❌ 未完成 |
| T003 | public/tourist Method alias 与 URL 解析测试 | 在 `packages/api/src/methods/*-flow.ts` 新增 public/tourist flow alias，并补 `resolve-url` 测试，覆盖 tourist UrlKey 在 dev proxy 和真实域名下的解析。 | 1. `TmcTouristFlightUrl` 解析到 flight tourist 域。 2. `TmcTouristTrainUrl` 解析到 train tourist 域。 3. `TmcTouristHotelUrl` 解析到 hotel tourist 域。 4. `TmcTouristBookUrl` / `TmcTouristOrderUrl` 解析正确。 5. 页面层不直接使用自动生成的 `_30/_47` 类常量名。 | ❌ 未完成 |
| T004 | 因公 GetTravelUrl 门禁 | 保留因公出差单能力，并保证 `TmcApiBookUrl-Home-GetTravelUrl` 仅 business 通道可用；personal/tourist 通道禁止出差单入口、提示和提交字段。 | 1. business 且 `Tmc.GetTravelUrl=true` 时可调用。 2. personal 时调用次数为 0。 3. personal 不展示 `TravelNumber`。 4. personal DTO 不含 `TravelFormId/travelFormId/travelNumber`。 | ❌ 未完成 |
| T005 | 因私酒店 tourist 链路迁移 | personal 酒店搜索、条件、关键字、列表、详情、初始化、下单切换到 `TmcTouristHotelUrl-*` 与 `TmcTouristBookUrl-Hotel-*`，入住人走 public 体系。 | 1. 条件接口走 `TmcTouristHotelUrl-Condition-Gets`。 2. 关键字走 `TmcTouristHotelUrl-Home-SearchHotel`。 3. 列表 / 详情走 `TmcTouristHotelUrl-Home-List/Detail`。 4. 初始化 / 下单走 `TmcTouristBookUrl-Hotel-Initialize/Book`。 5. 不携带因公出差单和审批字段。 | ❌ 未完成 |
| T006 | 因私机票 tourist 链路迁移 | personal 机票搜索、列表、详情、舱位、初始化、校验、下单切换到 `TmcTouristFlightUrl-*` 与 `TmcTouristBookUrl-Flight-*`，乘客走 public 常旅客体系。 | 1. 列表走 `TmcTouristFlightUrl-Home-Index`。 2. 详情走 `TmcTouristFlightUrl-Home-Detail`。 3. 初始化走 `TmcTouristBookUrl-Flight-Initialize`。 4. 校验 / 下单走 `TmcTouristBookUrl-Flight-Validate/Book`。 5. 不调用因公审批、成本中心、出差单接口。 | ❌ 未完成 |
| T007 | 因私火车 tourist 链路迁移 | personal 火车搜索、列表、时刻表、初始化、下单切换到 `TmcTouristTrainUrl-*` 与 `TmcTouristBookUrl-Train-*`，并迁移 12306 绑定 / 校验能力。 | 1. 搜索走 `TmcTouristTrainUrl-Home-Search`。 2. 时刻表走 `TmcTouristTrainUrl-Home-Schedule`。 3. 初始化 / 下单走 `TmcTouristBookUrl-Train-Initialize/Book`。 4. 12306 bind/validate/contact 使用 tourist book Method。 5. 不调用因公出差单接口。 | ❌ 未完成 |
| T008 | 因私公共填单辅助能力迁移 | personal 乘客 / 入住人证件、国家 / 国籍、支付状态检查切换到 public tourist book 能力，覆盖 `TmcTouristBookUrl-Home-Country`、`Home-Credentials`、`{Flight|Train|Hotel}-CheckPay`。 | 1. 证件获取走 `TmcTouristBookUrl-Home-Credentials`。 2. 国家数据走 `TmcTouristBookUrl-Home-Country`。 3. 机票 CheckPay 走 `TmcTouristBookUrl-Flight-CheckPay`。 4. 火车 CheckPay 走 `TmcTouristBookUrl-Train-CheckPay`。 5. 酒店 CheckPay 走 `TmcTouristBookUrl-Hotel-CheckPay`。 | ❌ 未完成 |
| T009 | 因私订单、支付及已有售后入口域切换 | personal 下单后的订单详情、支付金额、支付方式、支付创建处理等 H5 已有链路切换到 `TmcTouristOrderUrl-*`；若当前 H5 已有订单列表、待出行、取消、退改签、出票 / 退票、酒店短信核验入口，也同步切换 tourist order Method；酒店支付兼容 `TmcTouristHotelUrl-Pay-Create/Process`。 | 1. H5 已有的因私订单详情 / 列表入口走 `TmcTouristOrderUrl-Order-Detail/List`。 2. H5 已有待出行入口时走 `TmcTouristOrderUrl-Travel-List`。 3. 支付金额 / 支付方式 / 支付创建处理走 tourist pay Method。 4. H5 已有火车出票取消、机票退票、酒店短信核验 / 取消入口时走 tourist order Method。 5. 酒店支付走 `TmcTouristHotelUrl-Pay-*` 特例。 6. business 订单 / 支付仍走 `TmcApiOrderUrl-*`。 7. 当前 H5 未覆盖的 legacy public 订单 / 售后独立页面不作为本任务新增范围。 | ❌ 未完成 |
| T010 | 因公 TMC 回归与字段隔离 | 回归 business 机票、火车、酒店仍走 `TmcApi*` / `TmcApiBookUrl-*`，保留出差单、审批、组织、成本中心等因公能力；personal 不泄漏这些字段。 | 1. business 三产品请求 Method 均为 `TmcApi*`。 2. business 可选出差单并提交。 3. personal 不携带审批人、组织、成本中心、出差单号。 4. 切换模式不会污染另一模式上下文。 | ❌ 未完成 |
| T011 | 自动化测试与真实接口联调 | 补充单元测试、API adapter 测试、页面集成测试和必要真实接口联调记录，覆盖 PRD TC-01 至 TC-27。 | 1. tourist context、resolve-url、三产品 Method 分支均有测试。 2. public 证件 / CheckPay / 订单支付售后 Method 有测试。 3. 因私误调用 TMC 产品域测试失败。 4. 因私缺 tourist ids 测试失败。 5. `pnpm --filter @ryx/h5 typecheck` 通过。 6. 真实接口联调记录包含酒店、机票、火车至少一条主路径。 | ❌ 未完成 |
| T012 | 文档同步与验收说明 | 实现完成后同步模块文档，记录因公 / 因私域名矩阵、tourist 上下文、public 公共填单、public 支付售后特例和本期仍排除的审批 / Workbench / 角标范围。 | 1. 文档明确 `TravelType=2` 不是完成标准。 2. 文档列出 `TmcApi*` 与 `TmcTourist*` 域名矩阵。 3. 验收说明排除待办角标、审批和 Workbench 动态入口。 4. public-chain-analysis 与最终实现一致。 | ❌ 未完成 |

## 完成状态说明
- ✅ 已完成：任务开发完成，验证标准全部通过
- ❌ 未完成：任务待开发或开发中

## 任务依赖说明
1. T001、T002、T003 是基础任务，必须先完成。
2. T004 可在 T001 后并行，但需要与 T005-T007 联动验证。
3. T005、T006、T007 可在 tourist context 和 Method alias 完成后按产品并行推进；建议先酒店，因为当前 H5 酒店迁移最深入。
4. T008 依赖 T005-T007 的填单与乘客 / 入住人选择能力。
5. T009 依赖 T005-T008 的下单结果和订单号。
6. T010、T011 贯穿开发过程，作为合并门槛。
7. T012 在实现和测试稳定后完成。

## 备注
1. 本期不做待办角标、审批列表 / 详情、Workbench 动态入口 / 权限显隐。
2. 本期必须在现有 H5 三产品页面内迁移 legacy `public-flight/train/hotel-*` 对应的 `TmcTourist*` 接口主链路，不做 legacy 路由和页面一比一搬迁。
3. 因私模式验收重点是 tourist 域名、tourist TMC/MMS 上下文、public 初始化、公共填单、CheckPay、支付 / 订单及 H5 已有售后入口链路正确，而不是只看 `TravelType=2`。
4. 开发完成后建议执行 `pnpm --filter @ryx/h5 typecheck` 与相关单元测试。
