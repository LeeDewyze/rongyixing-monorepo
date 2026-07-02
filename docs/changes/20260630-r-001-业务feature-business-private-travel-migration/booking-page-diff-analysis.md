# 下单页公私差异分析

## 一、分析目标
本文件补充 PRD 中「下单页」维度的 legacy 代码分析，重点明确因公 / 因私在人员信息填写、旅客 / 入住人选择、联系人、支付方式、审批 / 成本中心 / 出差单字段上的差异。

本需求目标仍是：在当前 H5 版本上迁移 legacy 的接口与业务行为差异，UI 按 H5 新规范重做，不做 legacy Ionic 页面一比一搬迁。

## 二、总览结论
| 维度 | legacy 因公 `tmc-*` | legacy 因私 `public-*` | H5 迁移要求 |
| ---- | ---- | ---- | ---- |
| 页面域 | `tmc-flight/train/hotel-book_ryx` | `public-flight/train/hotel-book_ryx` | H5 可复用当前页面，但必须按 travelMode 分支接口和字段 |
| 人员来源 | 员工 / TMC passenger，受 Staff `BookType`、出差单、差标约束 | public frequent passenger / 手填入住人 | 因私不能复用因公员工乘客作为唯一来源 |
| 证件来源 | 员工证件、非员工证件、出差单乘客证件；因公调用 TMC 证件接口 | 常旅客证件 / public 证件；需走 `TmcTouristBookUrl-Home-Credentials` | H5 因私证件改 tourist book 域 |
| 出差单 | 可通过 `TmcApiBookUrl-Home-GetTravelUrl` 选 `TravelNumber`，并锁定乘客 / 行程 | 不调用、不展示、不提交 | personal 模式三层清理：UI、接口、DTO |
| 审批 | 按产品审批规则显示审批人、可选审批、跳过审批 | public 国内机票 / 火车 / 酒店填单未见审批字段 | personal 不显示 / 不提交审批字段 |
| 组织 / 成本中心 | 可显示默认值、手动选组织 / 成本中心、其他组织 / 成本中心 | public 国内链路未见组织 / 成本中心字段 | personal 不显示 / 不提交组织、成本中心 |
| 超标原因 | 根据差标、政策、TMC 配置展示 / 必填 | public 国内链路未见差标超标原因 | personal 不复用因公差标原因 |
| 授权联系人 | 因公支持授权账号查看订单 `AddContact` | public 机票 / 火车主要是订单联系人；酒店是入住手机号 / 担保信息 | personal 不复用因公授权联系人作为必填能力 |
| 支付方式 | 因公填单页通常有 `OrderTravelPayType` 单选；火车/酒店明确可选 | public 机票/酒店取初始化 `PayTypes[0]`；public 火车普通下单页不选支付方式，默认个人支付语义，金额确认页取 `PayTypes[0]` | personal 按 public 产品差异处理，不能直接复用因公支付单选 |

## 三、legacy 因公下单页
### 3.1 因公机票
代码位置：
- `beeantmobile-main/projects/ryx/src/app/tmc/tmc-flight/tmc-flight-book_ryx/tmc-flight-book_ryx.base.page.ts`
- `beeantmobile-main/projects/ryx/src/app/tmc/tmc-flight/tmc-flight-book_ryx/tmc-flight-book_ryx.page.html`

关键行为：
1. 下单页围绕员工乘客 `PassengerBookInfo` 构造 `ICombindInfo`，并从初始化结果、员工信息、差标策略补齐证件、手机号、邮箱、审批人、组织、成本中心。
2. `initOrderTravelPayTypes()` 从 TMC 配置生成可选支付类型，并在页面展示支付方式单选。
3. 外部编号来自 `InitialBookDtoModel.OutNumbers`；当字段名是 `TravelNumber` 且 `TmcService.hasGetTravelUrl()` 为真时，允许加载出差单。
4. `getStaffsTravelNumbers(args, "Flight")` 仅服务因公出差单，选择后回填 `TravelNumber`、组织、成本中心等。
5. 提交 `PassengerDto` 时写入 `TravelType`、`TravelPayType`、`ApprovalId`、`CostCenterCode/Name`、`OrganizationCode/Name`、`IllegalPolicy/IllegalReason`、`OutNumbers`、`travelFormId/travelNumber`、授权联系人 `Linkmans`。

### 3.2 因公火车
代码位置：
- `beeantmobile-main/projects/ryx/src/app/tmc/tmc-train/tmc-train-book_ryx/tmc-train-book_ryx.base.page.ts`
- `beeantmobile-main/projects/ryx/src/app/tmc/tmc-train/tmc-train-book_ryx/tmc-train-book_ryx.page.html`

关键行为：
1. 与因公机票类似，乘客为员工 / TMC passenger，支持本人预订与代订限制。
2. 页面展示组织、成本中心、超标原因、审批人、外部编号 / TravelNumber、授权联系人。
3. 填单页明确展示支付方式单选，`viewModel.orderTravelPayType` 写入提交 DTO 的 `TravelPayType`。
4. 支持 12306 账号展示 / 切换 / 校验；这是火车产品能力，因公和因私都有，但接口域不同。
5. 选择 TravelNumber 时调用 `getStaffsTravelNumbers(args, "Train")`，并回填组织、成本中心、外部编号。

### 3.3 因公酒店
代码位置：
- `beeantmobile-main/projects/ryx/src/app/tmc/tmc-hotel/tmc-hotel-book_ryx/tmc-hotel-book_ryx.base.page.ts`
- `beeantmobile-main/projects/ryx/src/app/tmc/tmc-hotel/tmc-hotel-book_ryx/tmc-hotel-book_ryx.page.html`

关键行为：
1. 入住人仍是员工 / TMC passenger，按乘客生成入住表单。
2. 页面展示审批、组织、成本中心、超标原因、外部编号 / TravelNumber、授权联系人。
3. 酒店根据房型支付类型展示支付方式；到店付等场景可能展示信用卡担保信息。
4. 选择 TravelNumber 调用 `getStaffsTravelNumbers(args, "Hotel")`。
5. 提交字段包含 `TravelType`、`TravelPayType`、`ApprovalId`、`IsSkipApprove`、`CostCenterCode/Name`、`OrganizationCode/Name`、`OutNumbers`、信用卡担保 `OrderCard` 等。

## 四、legacy 因私下单页
### 4.1 因私机票
代码位置：
- `beeantmobile-main/projects/ryx/src/app/public/public-flight/public-flight-book_ryx/public-flight-book_ryx.page.ts`
- `beeantmobile-main/projects/ryx/src/app/public/public-flight/public-flight-book_ryx/public-flight-book_ryx.page.html`

关键行为：
1. 旅客来源是 public 常旅客 `selectedFrequents`，选择页为 `public-flight-passenger-list_ryx` 等 public 旅客页面。
2. 页面标题为「旅客信息」，支持添加 / 删除旅客，展示常旅客姓名、证件类型、证件号脱敏。
3. 联系人信息为订单联系人：姓名、手机号、邮箱；提交写入 `bookDto.Linkmans = [orderLinkman]`。
4. 初始化接口返回 `PayTypes`，legacy 默认取 `PayTypes[0]`，但下单页支付方式校验代码被注释，实际交互不等同因公支付单选。
5. `fillBookPassengers()` 使用常旅客证件构造 `PassengerDto`，写入机票舱位、保险、手机号等；未见因公审批、组织、成本中心、TravelNumber、TravelType 显式赋值。
6. 下单走 `touristFlightService.bookFlight()`，CheckPay 走 tourist book / order 相关链路。

### 4.2 因私火车
代码位置：
- `beeantmobile-main/projects/ryx/src/app/public/public-train/public-train-book_ryx/public-train-book_ryx.base.page.ts`
- `beeantmobile-main/projects/ryx/src/app/public/public-train/public-train-book_ryx/public-train-book_ryx.page.html`
- `beeantmobile-main/projects/ryx/src/app/public/public-train/public-train-bookinfos/public-train-bookinfos.page.ts`
- `beeantmobile-main/projects/ryx/src/app/public/public-train/public-train-freq-passenger-list/public-train-freq-passenger-list.page.ts`

关键行为：
1. 旅客来源是 public frequent passenger，选择页为 `public-train-freq-passenger-list`，可新增 / 编辑常旅客。
2. 普通下单页不展示支付方式选择，`orderTravelPayType` 初始为 `OrderTravelPayType.Person`。
3. 金额确认页 `public-train-bookinfos` 会读取初始化返回 `PayTypes` 并取 `PayTypes[0]`，这是下单后的金额 / 支付确认链路，不是普通填单页选择支付方式。
4. 普通下单页显示旅客信息、保险、12306 账号、服务费、联系人信息、供应商等；无因公审批、组织、成本中心、TravelNumber。
5. `fillBookPassengers()` 使用常旅客证件构造 `PassengerDto`，写入 `Train`、保险、选座偏好；未见 `TravelType=2` 显式赋值。
6. 12306 绑定 / 校验使用 tourist book train 接口，包括 `GetBindAccountNumber`、`Bind`、`AccountValidate`、`CodeValidate` 等。
7. 旅客人数上限按实际入口 `public-train-freq-passenger-list` 对齐为 5 人；超过 5 人提示“人数不能超过5人”，H5 选择页与填单页均需防御历史缓存超限。
8. 选座不是按每位旅客各自渲染一套选择器，而是填单页共享的整体座位偏好池：页面渲染第 1 排座位；当旅客数大于 1 时渲染第 2 排座位，生成 `1A/1C/2A/2C` 等编码，提交时再按旅客顺序写入各乘客 `Train.BookSeatLocation`。
9. 选座仅在高铁 / 动车可选座席展示：legacy 明确覆盖 `二等座`、`一等座`、`商务座`；H5 同时兼容 `特等座` 并沿用商务座布局。硬座、硬卧、软卧等普通席别不展示选座服务。
10. 联系人默认值只来自 Initialize 返回的 `Linkman`，回填到订单联系人姓名、手机号、邮箱；如果返回为空，说明初始化响应未提供联系人，H5 不再前端兜底。personal 火车提交时写入 `Linkmans`，不复用因公授权联系人语义。
11. 展开的旅客信息中，「联系方式」与「补充信息」在 H5 合并为连续字段区，不再保留两个分组标题；可录入的文本字段需要提供一键清空能力。

### 4.3 因私酒店
代码位置：
- `beeantmobile-main/projects/ryx/src/app/public/public-hotel/public-hotel-book_ryx/public-hotel-book_ryx.page.ts`
- `beeantmobile-main/projects/ryx/src/app/public/public-hotel/public-hotel-book_ryx/public-hotel-book_ryx.page.html`

关键行为：
1. 入住信息以房间为核心，不是因公员工 passenger 为核心：`checkInPassenger.rooms` 每间房填写 1 个住客姓名，最多受 `roomsCount` 限制。
2. 可点击常旅客图标带入入住人，但页面同时支持直接填写住客姓名、证件类型、证件号、联系人手机号、到店时间。
3. `IsNeedIdentity` 时住客证件号必填；“仅接待大陆客人”时要求中文姓名；英文名需用 `/` 分隔姓和名。
4. 到店付 / 担保场景会展示信用卡信息、持卡人证件信息、手机号等。
5. `fillBookPassengers()` 按每个房间创建一个 `PassengerDto`，写入 `RoomPlan`、`Mobile`、`RoomCount=1`、`CheckinTime`、`Credentials.Name/Number/Type`、`CustomerName`、`CustomerCredentials`。
6. public 酒店未见因公审批、组织、成本中心、TravelNumber、员工差标字段；支付类型来自 tourist 初始化与房型支付语义。

## 五、H5 当前实现对比
已确认的 H5 现状：
1. H5 目前的 `flight-book.ts`、`train-book.ts`、`hotel-book.ts` 已有因公 DTO 字段构造能力，包括 `TravelType`、`TravelPayType`、审批、组织、成本中心、超标原因、外部编号、授权联系人、出差单上下文。
2. H5 使用 `resolveFlightTravelType()` 将首页模式映射为 `TravelType=1/2`，但这不能等价 legacy public 链路。
3. H5 当前乘客模型主要是 `PassengerBookInfo`，偏员工 / TMC passenger 结构；因私需要接 public frequent passenger / 入住人体系。
4. H5 酒店当前下单仍以所选 passenger 为房间 / 入住人基础；legacy public 酒店则以房间手填住客为主，每间房一个住客，并支持常旅客带入。
5. H5 火车当前 `buildTrainOrderBookDto()` 会写入 `TravelPayType`、审批、组织、成本中心、外部编号；personal 火车必须按 legacy 清理这些因公字段，并隐藏支付方式选择。

## 六、确定项与不确定项
### 6.1 确定项
1. 因私三产品必须走 `TmcTourist*` 域名族与 tourist context，不能只写 `TravelType=2`。
2. 因私不调用 `TmcService.hasGetTravelUrl()` / `TmcApiBookUrl-Home-GetTravelUrl`。
3. 因私不展示 / 不提交 `TravelNumber`、`TravelFormId`、`travelFormId`、`travelNumber`。
4. 因私不展示 / 不提交因公审批、组织、成本中心、超标原因、授权账号查看订单。
5. 因私火车普通下单页不需要用户选择支付方式；默认个人支付语义，金额确认页再取初始化 `PayTypes[0]`。
6. 因私火车旅客上限为 5 人；选座为整体两排偏好池，按旅客顺序分配到 `Train.BookSeatLocation`，并仅对二等 / 一等 / 商务 / 特等座等可选座席展示。
7. 因私火车订单联系人从 Initialize `Linkman` 默认回填；用户可手动编辑，录入后提供清空按钮。
8. 因私酒店入住信息要支持按房间填写：住客姓名、证件类型、证件号、手机号、到店时间、担保信用卡。

### 6.2 仍需实现时联调确认
1. public 国内机票 / 火车提交 DTO 未显式写 `TravelType=2`，后端是否完全依赖 tourist 域判断因私；H5 可保留 `TravelType=2` 作为兼容字段，但验收不能只看它。
2. public 酒店 `PayTypes` 在不同房型支付类型下的真实结构：数组 / map 两种形态 legacy 均有处理，需要真实接口样本验证。
3. public 常旅客选择、新增、编辑接口与 H5 当前 passenger 页面如何合并：可以复用 UI，但数据源和保存接口必须分支。
4. 因公 TravelNumber 锁定乘客后，H5 当前 passenger 删除 / 重选限制是否已完整覆盖，需要实现回归。

## 七、迁移任务补充
1. 新增 `travelMode/channel` 到填单页字段构造层：business 走完整因公字段；personal 走 public DTO 清理分支。
2. 因私机票 / 火车旅客选择：接 public frequent passenger 列表、新增、编辑、证件接口；不要复用因公员工选择作为唯一来源。
3. 因私酒店入住人：支持按房间数量生成入住人表单，每间房必填住客姓名；按房型规则决定证件、到店时间、信用卡担保。
4. 因私火车支付 UI：隐藏因公支付方式单选，提交时按 public 火车默认个人支付语义；下单成功后的金额 / 支付确认再走 tourist order/pay。
5. DTO 清理：personal 提交前统一移除审批、组织、成本中心、超标原因、出差单、因公授权联系人字段。
6. 测试增加字段隔离断言：personal 下单 payload 不允许出现因公字段；business 下单 payload 保持 legacy 因公字段。

## 八、测试补充建议
| 编号 | 场景 | 重点断言 |
| ---- | ---- | ---- |
| TC-BK-01 | 因公机票填单 | 显示支付方式、审批 / 组织 / 成本中心 / 超标原因 / TravelNumber；提交含 `TravelType=1` 和因公字段 |
| TC-BK-02 | 因私机票填单 | 旅客来自 public 常旅客；提交走 tourist；payload 不含审批、组织、成本中心、TravelNumber |
| TC-BK-03 | 因公火车填单 | 支付方式单选可见；12306 能力走因公接口；TravelNumber 仅因公可选 |
| TC-BK-04 | 因私火车填单 | 不展示支付方式单选；12306 能力走 tourist；payload 不含因公字段 |
| TC-BK-04A | 因私火车选座 | 二等 / 一等 / 商务 / 特等座展示页面级整体选座；硬座 / 卧铺不展示；选择 `2C` 时提交保持 `2C`，不得转成 `12C` |
| TC-BK-04B | 因私火车旅客与联系人 | 最多选择 5 位旅客；联系人从 `Initialize.Linkman` 回填；姓名、电话、邮箱输入后可一键清空 |
| TC-BK-05 | 因公酒店填单 | 入住人为员工 passenger，支持差标、审批、成本中心、信用卡担保 |
| TC-BK-06 | 因私酒店填单 | 每房填写住客姓名 / 证件 / 手机 / 到店时间；不展示员工组织成本中心与 TravelNumber |
| TC-BK-07 | 模式切换污染 | 先因公选 TravelNumber，再切因私下单；personal payload 不含任何出差单字段 |
| TC-BK-08 | public 常旅客证件 | 因私选择 / 编辑常旅客后证件走 `TmcTouristBookUrl-Home-Credentials` |

## 九、接口适配教训
1. 初始化类 response 不能只按前端当前使用字段做白名单返回。后端初始化结果往往同时承载展示、默认值、开关与后续提交上下文，字段会随产品、因公 / 因私、TMC 配置变化。
2. 更稳的适配方式是先 `...raw` 透传后端返回，再覆盖需要规范化的字段，例如金额数值化、数组过滤、字段结构兼容。这样新增或暂未使用的后端字段不会无声消失。
3. 本次因私火车 `TmcTouristBookUrl-Train-Initialize` 已返回 `Linkman`，但 API 层初始化响应 normalizer 白名单未包含该字段，导致页面拿不到联系人默认值。问题不在初始化接口缺字段，而在前端 API 适配吞字段。
4. 同类风险已同步检查初始化接口：火车、酒店初始化 normalizer 均应使用 raw 透传模式；机票初始化当前直接返回后端 typed response，不存在同类白名单丢字段路径。
