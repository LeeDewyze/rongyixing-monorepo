# 酒店关键字搜索迁移 PRD

> 需求对象：Legacy `tmc-hotel-searchtext_ryx` 酒店关键字搜索页  
> 迁移目标：H5 国内酒店搜索页与酒店列表页关键字搜索能力  
> 更新时间：2026-06-30  
> 状态：PRD 草案。待补齐 Jira 号、需求类型、英文简称后，可转入正式 Spec 流程。

## 1. 背景与目标

### 1.1 背景

当前 H5 酒店链路已具备酒店搜索首页、酒店列表页和列表筛选能力，但关键字搜索仍是本地输入直传列表，尚未迁移 Legacy `tmc-hotel-searchtext_ryx` 的酒店名/地标/地址联想能力。

Legacy 关键字搜索通过 `TmcApiHotelUrl-Home-SearchHotel` 返回酒店和地址类候选项。用户选择候选项后，列表页请求参数会按候选类型差异化回填：命中酒店时使用 `HotelId`，命中地理地址时使用 `SearchKey + Lat/Lng`。

### 1.2 目标

- 在 H5 中迁移 Legacy 酒店关键字搜索页能力，支持酒店名、地标、地址等关键字联想。
- 搜索接口、入参、结果类型、列表页回填规则与 Legacy 保持一致。
- 从酒店搜索首页和酒店列表页修改关键字时，均进入统一关键字搜索体验。
- 选择关键字结果后刷新酒店列表第一页，并清理旧关键字相关参数，避免 `HotelId`、`SearchKey`、`Lat/Lng` 混传。
- 若 Legacy `tmc-hotel-searchtext_ryx` 存在搜索历史或热门关键字能力，则一并迁移；若 Legacy 无该能力，H5 不额外新增。

### 1.3 非目标

- 不改造酒店城市选择、日期选择、乘客选择主流程。
- 不改变列表页位置区域筛选中 `Geos/searchGeoId` 的既有规则。
- 不新增非 Legacy 已存在的推荐词、运营词、搜索纠错、拼音搜索等能力。
- 不改变酒店列表页排序、星级价格、品牌、设施等筛选功能。

## 2. Legacy 依据

### 2.1 页面与入口

- Legacy 关键字搜索页：`tmc-hotel-searchtext_ryx`
- Legacy 酒店搜索首页：`tmc-hotel-search_ryx`
- Legacy 酒店列表页：`tmc-hotel-list_ryx`

列表页修改关键词时，Legacy 行为为跳转 `tmc-hotel-searchtext_ryx`，关键词返回后刷新列表。

### 2.2 搜索接口

接口地址：

```text
POST http://hotel-api-tmc.rtesp.com/Home/SearchHotel
```

方法名：

```text
TmcApiHotelUrl-Home-SearchHotel
```

请求 `Data` 示例：

```json
{
  "PageIndex": 0,
  "CityName": "北京",
  "CityCode": "1101",
  "Keyword": "北京商大春公寓"
}
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `PageIndex` | 是 | 页码，从 `0` 开始。关键字联想首期按 Legacy 传 `0`。 |
| `CityName` | 是 | 当前酒店目的地城市名称。 |
| `CityCode` | 是 | 当前酒店目的地城市编码。 |
| `Keyword` | 是 | 用户输入的关键字，提交前需要 trim。 |

响应示例：

```json
{
  "Data": [
    {
      "Text": "北京商大春公寓",
      "Value": "7",
      "IsHotel": true
    },
    {
      "Text": "北京贾里公寓(店)",
      "IsAddress": true,
      "Lat": "40.439774",
      "Lng": "116.76753"
    }
  ],
  "Status": true,
  "Code": "Success",
  "Message": ""
}
```

结果类型：

| 类型 | 判定字段 | 关键字段 | 说明 |
| --- | --- | --- | --- |
| 酒店 | `IsHotel === true` | `Text`、`Value` | `Text` 为展示名称，`Value` 为酒店 ID。 |
| 地址/地标 | `IsAddress === true` | `Text`、`Lat`、`Lng` | `Text` 为展示名称，`Lat/Lng` 为经纬度。 |

### 2.3 与列表页请求的关系

Legacy 列表页迁移分析中已确认：

- `SearchKey`：酒店名、地标、关键字文本。
- `HotelId`：关键词命中具体酒店时传酒店 ID，并清空 `SearchKey`。
- `Lat/Lng`：关键词地理点或当前位置。
- `Geos/searchGeoId`：来自列表页位置区域筛选，不用于 `SearchHotel` 地址结果回填。

因此，本需求默认按以下规则迁移：

| 用户选择 | 列表页展示 | 列表请求参数 | 清理规则 |
| --- | --- | --- | --- |
| 酒店结果 `IsHotel` | 展示 `Text` | `HotelId = Value` | 清空 `SearchKey`、`Lat`、`Lng`；保留非关键字类筛选规则按 Legacy。 |
| 地址结果 `IsAddress` | 展示 `Text` | `SearchKey = Text`、`Lat = Lat`、`Lng = Lng` | 清空 `HotelId`；不写 `Geos/searchGeoId`。 |
| 直接输入搜索 | 展示输入文本 | `SearchKey = Keyword` | 清空 `HotelId`、`Lat`、`Lng`。 |

## 3. H5 现状

### 3.1 已有能力

- H5 酒店搜索首页 `/hotel` 已有城市、入住/离店日期、关键词输入框和搜索按钮。
- H5 酒店列表页 `/hotel/list` 已展示城市、日期、关键词，并能通过 URL 参数发起列表查询。
- `HotelListParams` 已包含 `HotelId`、`Lat`、`Lng`、`Geos`、`searchGeoId` 等字段。
- API 层 `buildHotelListRequest()` 已将 `Keyword` 映射为 `SearchKey`，并透传 `HotelId`、`Lat`、`Lng`、`Geos` 等字段。

### 3.2 差距

- H5 尚未实现 `TmcApiHotelUrl-Home-SearchHotel` 搜索接口封装。
- 酒店首页关键字输入仍是纯文本，没有 Legacy 联想结果页。
- 酒店列表页点击关键字目前未进入 Legacy 对应的关键字搜索页体验。
- 当前列表页关键字参数只有 `keyword`，缺少候选类型、`hotelId`、`lat/lng` 的 URL 状态承接。
- 尚未确认 Legacy `tmc-hotel-searchtext_ryx` 是否有搜索历史/热门关键字；H5 不应在未确认前额外新增。

## 4. 需求详情

### 4.1 页面入口

H5 需要提供统一的酒店关键字搜索页面，建议路由：

```text
/hotel/keyword
```

入口来源：

| 来源 | 入口行为 |
| --- | --- |
| 酒店搜索首页 `/hotel` | 点击关键字输入区域进入关键字搜索页。 |
| 酒店列表页 `/hotel/list` | 点击顶部「地名/酒店/关键词」区域进入关键字搜索页。 |

进入关键字搜索页时，需要携带当前上下文：

| 参数 | 说明 |
| --- | --- |
| `cityCode` | 当前酒店目的地城市编码。 |
| `cityName` | 当前酒店目的地城市名称。 |
| `checkIn` | 入住日期。 |
| `checkOut` | 离店日期。 |
| `keyword` | 当前已选关键字，可为空。 |
| `hotelId` | 当前已选酒店 ID，仅酒店结果回填时存在。 |
| `lat` / `lng` | 当前已选地址经纬度，仅地址结果回填时存在。 |
| `returnTo` | 返回目标，区分来自搜索首页或列表页。 |

### 4.2 搜索页 UI

页面结构按 Legacy 关键字搜索页能力迁移，H5 视觉可复用现有机票/酒店列表的移动端样式：

- 顶部导航：
  - 返回按钮。
  - 搜索输入框。
  - 清空按钮。
- 输入框：
  - 默认聚焦。
  - 展示当前关键字。
  - 输入后触发联想搜索。
- 结果列表：
  - 展示酒店和地址结果。
  - 每行展示 `Text`。
  - 酒店结果和地址结果可用不同图标或辅助标识区分，但不改变 Legacy 选择语义。
- 空态：
  - 无输入时，展示历史/热门区域或空白态，具体按 Legacy 复核结果。
  - 有输入但无结果时，展示「暂无相关结果」。
- 错误态：
  - 接口失败时展示可重试提示，不阻断用户直接搜索输入文本。

### 4.3 搜索触发

- 用户输入关键字后，请求 `TmcApiHotelUrl-Home-SearchHotel`。
- `Keyword` 传 trim 后文本。
- `CityName`、`CityCode` 使用当前酒店目的地城市。
- `PageIndex` 首期固定传 `0`。
- 需要防抖，建议 300ms。
- 空关键字不请求接口。
- 多次输入时只展示最后一次请求结果，避免旧结果覆盖新结果。

### 4.4 选择结果

选择酒店结果：

- 取 `Text` 作为列表页展示关键字。
- 取 `Value` 作为 `HotelId`。
- 进入/刷新酒店列表第一页。
- 列表请求传 `HotelId = Value`。
- 不传 `SearchKey`。
- 清空旧的 `Lat/Lng`。

选择地址结果：

- 取 `Text` 作为列表页展示关键字。
- 取 `Lat/Lng` 作为经纬度。
- 进入/刷新酒店列表第一页。
- 列表请求传 `SearchKey = Text`、`Lat`、`Lng`。
- 清空旧的 `HotelId`。
- 不把地址结果写入 `Geos/searchGeoId`。

直接搜索输入文本：

- 用户点击键盘搜索或搜索按钮时，若未选择候选项，则按纯文本搜索。
- 列表请求传 `SearchKey = Keyword`。
- 清空旧的 `HotelId`、`Lat`、`Lng`。

### 4.5 从列表页修改关键字

从酒店列表页进入关键字搜索页并选择/提交新关键字后：

- 保留当前 `cityCode`、`cityName`、`checkIn`、`checkOut`。
- 保留乘客、出差单、酒店类型等 Legacy 需要保留的主上下文。
- 刷新列表第一页，`PageIndex = 0`。
- 清理旧关键字相关参数：
  - 新结果为酒店：清空 `keyword` 对应的 `SearchKey` 语义，仅保留展示文案和 `HotelId`。
  - 新结果为地址：清空 `hotelId`，写入 `lat/lng`。
  - 新结果为纯文本：清空 `hotelId`、`lat/lng`。
- 列表页筛选条件是否保留，按 Legacy 现有行为处理；若 Legacy 修改关键字会重置筛选，则 H5 同步重置。

### 4.6 城市变化联动

- 若酒店搜索首页或列表页切换城市，需清空已选关键字及其附属字段：
  - `keyword`
  - `hotelId`
  - `lat`
  - `lng`
- 位置区域筛选 `Geos/searchGeoId` 是否同时清空，按列表页城市切换的既有 Legacy 行为执行。

### 4.7 搜索历史/热门关键字

迁移原则：

- 若 Legacy `tmc-hotel-searchtext_ryx` 存在搜索历史：
  - H5 需要迁移。
  - 选择候选项或直接搜索成功后写入历史。
  - 历史需按城市隔离，避免不同城市酒店/地标混杂。
  - 支持清空历史，展示数量按 Legacy。
- 若 Legacy 存在热门关键字：
  - H5 需要迁移。
  - 热门来源、排序、展示数量按 Legacy。
- 若 Legacy 不存在搜索历史/热门关键字：
  - H5 不新增该能力。
  - 无输入态保持 Legacy 一致。

当前状态：需要复核 Legacy 源码确认是否存在搜索历史/热门关键字。已知 H5 城市选择器有热门城市和历史城市，不等同于酒店关键字搜索历史/热门关键字。

## 5. 数据与接口契约

### 5.1 API 封装

需要在 H5 API 层补充接口：

```ts
interface HotelKeywordSearchParams {
  PageIndex: number;
  CityName: string;
  CityCode: string;
  Keyword: string;
}

interface HotelKeywordSearchItem {
  Text: string;
  Value?: string;
  IsHotel?: boolean;
  IsAddress?: boolean;
  Lat?: string;
  Lng?: string;
}
```

建议归一化类型：

```ts
type HotelKeywordSearchResultType = "hotel" | "address";

interface HotelKeywordSearchResult {
  text: string;
  type: HotelKeywordSearchResultType;
  hotelId?: string;
  lat?: string;
  lng?: string;
}
```

### 5.2 URL 参数建议

为支持列表页刷新、详情返回恢复、浏览器返回，建议列表页 URL 承接关键字选择状态：

| URL 参数 | 来源 | 说明 |
| --- | --- | --- |
| `keyword` | `Text` 或输入文本 | 用于页面展示。 |
| `keywordType` | `hotel` / `address` / `text` | 用于恢复请求参数。 |
| `hotelId` | 酒店结果 `Value` | `keywordType=hotel` 时存在。 |
| `lat` / `lng` | 地址结果 `Lat/Lng` | `keywordType=address` 时存在。 |

### 5.3 列表请求映射

| URL 状态 | `Home-List` 请求 |
| --- | --- |
| `keywordType=hotel`、`hotelId` 有值 | `HotelId = hotelId`，不传 `SearchKey`。 |
| `keywordType=address`、`lat/lng` 有值 | `SearchKey = keyword`、`Lat = lat`、`Lng = lng`。 |
| `keywordType=text` 或无类型但有 `keyword` | `SearchKey = keyword`。 |

实现时需要调整当前 `buildHotelListRequest()` 的行为：当 `HotelId` 存在且来源为酒店关键字结果时，不能同时把 `Keyword` 映射为 `SearchKey`。

## 6. 验收标准

### 6.1 搜索接口

- 输入「北京商大春公寓」时，请求 `TmcApiHotelUrl-Home-SearchHotel`，`Data` 包含 `PageIndex=0`、`CityName=北京`、`CityCode=1101`、`Keyword=北京商大春公寓`。
- 能正确展示接口返回的酒店结果和地址结果。
- 接口失败时页面可恢复，用户仍可直接提交文本搜索。

### 6.2 酒店结果

- 选择 `IsHotel=true`、`Value=7` 的「北京商大春公寓」后进入列表页。
- 列表页顶部展示「北京商大春公寓」。
- 列表请求传 `HotelId=7`。
- 列表请求不传 `SearchKey=北京商大春公寓`。
- 旧的 `lat/lng` 不残留。

### 6.3 地址结果

- 选择 `IsAddress=true` 的候选项后进入列表页。
- 列表页顶部展示候选项 `Text`。
- 列表请求传 `SearchKey=Text`、`Lat`、`Lng`。
- 列表请求不传 `HotelId`。
- 不写入 `Geos/searchGeoId`。

### 6.4 直接文本搜索

- 输入关键字后直接搜索，进入列表页第一页。
- 列表请求传 `SearchKey=输入文本`。
- 不传旧的 `HotelId`、`Lat`、`Lng`。

### 6.5 列表页修改关键字

- 从 `/hotel/list` 点击关键字区域进入关键字搜索页。
- 修改关键字后返回列表页并刷新第一页。
- 城市、入住/离店日期保持不变。
- 旧关键字相关参数按新结果类型清理。

### 6.6 城市变化

- 切换酒店目的地城市后，已选关键字、`HotelId`、`Lat/Lng` 被清空。
- 新城市下搜索接口使用新 `CityName`、`CityCode`。

### 6.7 搜索历史/热门

- 若 Legacy 有关键字历史/热门，则 H5 展示和交互与 Legacy 一致。
- 若 Legacy 无该能力，H5 不出现额外历史/热门模块。

## 7. 待确认项

| 编号 | 问题 | 当前建议 |
| --- | --- | --- |
| Q1 | Legacy `tmc-hotel-searchtext_ryx` 是否存在搜索历史？ | 复核源码；有则迁移，无则不新增。 |
| Q2 | Legacy `tmc-hotel-searchtext_ryx` 是否存在热门关键字？ | 复核源码；有则迁移，无则不新增。 |
| Q3 | 从列表页修改关键字后，Legacy 是否重置排序/筛选条件？ | 以 Legacy 源码为准；当前列表分析显示非保留查询会重置筛选，需针对关键词修改场景再确认。 |
| Q4 | `SearchHotel` 是否支持分页加载更多？ | 当前真实请求为 `PageIndex=0`，首期按 Legacy 搜索页实际行为实现。若 Legacy 有滚动加载，再补充分页。 |
| Q5 | 酒店结果 `Value` 是否始终为 `Home-List` 可用的 `HotelId`？ | 以真实接口和 Legacy 使用方式验证；PRD 暂按酒店 ID 处理。 |

## 8. 实施任务建议

1. 复核 Legacy `tmc-hotel-searchtext_ryx` 源码，确认历史/热门、列表页返回、筛选重置规则。
2. 补充 shared-types 中酒店关键字搜索请求、响应、归一化类型。
3. 在 API 层实现 `hotel.searchHotel()`，调用 `TmcApiHotelUrl-Home-SearchHotel`。
4. 新增 H5 酒店关键字搜索页 `/hotel/keyword`。
5. 改造酒店搜索首页关键字入口，从本地输入改为进入关键字搜索页。
6. 改造酒店列表页关键字入口，从当前编辑行为改为进入关键字搜索页。
7. 扩展列表页 URL 状态，支持 `keywordType`、`hotelId`、`lat/lng`。
8. 调整列表请求构造，确保酒店结果不混传 `SearchKey`。
9. 根据 Legacy 复核结果补充历史/热门关键字。
10. 增加 API 映射、URL 映射、列表请求参数清理的单元测试。
