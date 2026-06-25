# 出差模块 — 提交与审批接口契约

> 抓包版本：2026-06-25  
> 机器可读副本：`docs/api/fixtures/travel-proxy/submit-api-contract.json`  
> 抓包脚本：`packages/api/scripts/capture-travel-submit.mjs`

## 测试账号

| 用途 | 账号 | 姓名 | 说明 |
|------|------|------|------|
| 出差申请提交 | `T18610773065` | 姜茗豪 | 无待办，用于 `Form/Add` |
| 审批提交 | `T289G003` | 孙雪 | 有待办，用于 `FormTask/Approval` |

密码均为 `Temp123456`（staging）。

## 架构说明

出差**新增**与**审批**不走 `app.rtesp.com/Home/Proxy`，而是直连 workflow 站点，登录 ticket 透传：

| 站点 | 用途 |
|------|------|
| `workflow.rtesp.com` | 表单页、任务 Handle/Detail、Form/Add、FormTask/Approval |
| `api-workflow.rtesp.com` | 人员/部门/城市等 Ctrl 默认值 |
| `expense-bpm.rtesp.com` | 差旅单号、出差类型选项 |

前端动态表单由 `flowform.js` 序列化，**不能**用扁平字段名（如 `TravelType=国内机票`）直接 POST，必须使用 `FormDetails[]` / `FormTimes[]` 数组结构。

---

## 一、出差申请 — `Form/Add`

### 1.1 打开表单

```
GET {WorkflowWebsiteUrl}/Form/Flow?flowtag=Travel&ticket={ticket}
```

HTML 内嵌 `var datas = [...]` 字段定义，以及 `AddUrl` / `GetUrl`。

### 1.2 提交

```
POST {WorkflowWebsiteUrl}/Form/Add?SaveNotifyUrl=&ticket={ticket}&CheckFlowType=&FlowTag=Travel
Content-Type: application/x-www-form-urlencoded
```

### 1.3 顶层字段

| 字段 | 值 | 说明 |
|------|-----|------|
| `Workflow.Id` | `318` | 工作流 ID |
| `Tag` | `Travel` | 流程标签 |
| `Name` | `出差申请` | 表单名称 |
| `formvalues` | `8` | 顶层控件数量 |
| `LastId` | `""` | 隐藏字段 |
| `LastDateTime` | `""` | 隐藏字段 |
| `ListCount` | `""` | 隐藏字段 |

### 1.4 字段编码规则（flowform.js）

| 控件类型 | 编码目标 | 说明 |
|----------|----------|------|
| Input / Check / Combo / Abc / Textarea / Hidden | `FormDetails[n].*` | 文本类 |
| Date | `FormTimes[n].*` | 日期类，**不是** FormDetails |
| Slave 子表 | `Slave` + `SlaveRow` | 如 `TravelAccount`、`TravelDetail` |

**FormDetails 结构：**

```
FormDetails[n].Id       — 通常空
FormDetails[n].Slave    — "" | TravelAccount | TravelDetail
FormDetails[n].SlaveRow — 子表行号，首行 0
FormDetails[n].Name     — 字段中文名
FormDetails[n].Tag      — 字段 tag（申请人/部门/职位/事由可为空）
FormDetails[n].Content  — 展示值；Check 为多选 label 逗号拼接，如 国内机票,火车票
FormDetails[n].Sequence — 0 递增
FormDetails[n].Number   — Combo/Abc 的 hidden id
```

**FormTimes 结构：**

```
FormTimes[n].Tag   — StartDate | EndDate
FormTimes[n].Time  — YYYY-MM-DD
FormTimes[n].Slave — TravelDetail（行程子表内）
```

### 1.5 表单字段清单

| 标签 | Tag | 类型 | Slave | 辅助 API |
|------|-----|------|-------|----------|
| 差旅单号 | TravelNumber | Input | — | `expense-bpm…/TravelNumberCtrl/DefaultData` |
| 申请人 | — | Combo | — | `api-workflow…/StaffCtrl/DefaultApplicant` |
| 所属部门 | — | Combo | — | `api-workflow…/OrganizationCtrl/DefaultData` |
| 所属职位 | — | Combo | — | `api-workflow…/PositionCtrl/DefaultData` |
| 出差类型 | TravelType | Check | — | `expense-bpm…/TravelTask/GetTravelType` |
| 出差事由 | — | Textarea | — | — |
| 出差人 | AccountId | Combo | TravelAccount | `StaffCtrl/DefaultData` / `GetDatas` |
| PolicyId | PolicyId | Hidden | TravelAccount | `StaffCtrl/GetDefaultPolicy` |
| 开始日期 | StartDate | Date | TravelDetail | — |
| 结束日期 | EndDate | Date | TravelDetail | — |
| 出发城市 | FromCityName | Abc | TravelDetail | `CityCtrl/GetDatas` |
| 目的城市 | ToCityName | Abc | TravelDetail | `CityCtrl/GetDatas` |

**出差类型选项：** 国内机票、国内酒店、火车票、网约车、租车（value 与 label 相同）。

### 1.6 请求样例（节选）

```
Workflow.Id=318
Tag=Travel
Name=出差申请
formvalues=8
FormDetails[4].Tag=TravelType
FormDetails[4].Content=国内机票
FormDetails[6].Slave=TravelAccount
FormDetails[6].Tag=AccountId
FormDetails[6].Content=1611558-姜茗豪
FormDetails[6].Number=40390000000011
FormTimes[0].Slave=TravelDetail
FormTimes[0].Tag=StartDate
FormTimes[0].Time=2026-06-25
FormDetails[8].Slave=TravelDetail
FormDetails[8].Tag=FromCityName
FormDetails[8].Content=北京
FormDetails[8].Number=1101
```

完整 key-value 见 `submit-api-contract.json` → `formAdd.requestSample`。

### 1.7 响应

**成功（T18610773065 实测）：**

```json
{
  "Status": true,
  "Message": null,
  "Data": { "Id": 23540000000005 }
}
```

**常见校验失败：**

| 触发条件 | Message |
|----------|---------|
| 空 POST | 任务表单名称不能为空且长度不能超过100 |
| 扁平 `TravelType=国内机票` | 出差类型必填 |

---

## 二、审批 — `FormTask/Approval`

### 2.1 任务列表（Proxy）

待办：`TmcApiOrderUrl-Task-List`，`Type=1`。  
返回 `handleUrl`（如 `FormTask/Handle?flowtag=Travel`）和 `id`（taskId）。

### 2.2 打开审批页

```
GET {WorkflowWebsiteUrl}/FormTask/Handle?flowtag=Travel&taskid={taskId}&ticket={ticket}&isApp=true&lang=cn
```

> **注意：** 必须带 `flowtag=Travel` 和 `taskid`；仅用列表里的 `handleUrl` 不够。

页面暴露：

- `window.ApprovalUrl` → `/FormTask/Approval?ticket={ticket}`
- `window.TaskId` → 任务 ID
- `window.sign` → 通常为空

出差审批 Handle 页 `datas=[]`，审批 POST **无需** FormDetails。

### 2.3 只读详情

```
GET {WorkflowWebsiteUrl}/FormTask/Detail?flowtag=Travel&taskId={taskId}&sign={sign}&ticket={ticket}
```

`sign` 来自 Workflow 任务列表项的 `url` 参数。

### 2.4 提交审批

```
POST {WorkflowWebsiteUrl}/FormTask/Approval?ticket={ticket}
Content-Type: application/x-www-form-urlencoded
  （浏览器为 multipart/form-data，字段相同）
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `taskId` | 是 | 同 `window.TaskId` |
| `isPass` | 是 | `true` 通过 / `false` 拒绝 |
| `remark` | 否 | 备注，最长 50 |
| `sign` | 否 | Handle 页 `window.sign` |
| `channel` | 否 | 渠道 |
| `level` | 否 | 优先级 radio |
| `notifiers` | 否 | 抄送人 JSON：`[{"Id":"…","Name":"…"}]` |

逻辑来源：`workflow.rtesp.com/js/task.js` → `task.handle(sender, isPass)`。

### 2.5 抄送人搜索

```
POST {WorkflowWebsiteUrl}/FormTask/GetStaffs?taskid={taskId}&ticket={ticket}
Content-Type: application/x-www-form-urlencoded

name=
```

响应：`[{"Value":44880000000001,"Text":"孙雪"}, …]`

### 2.6 响应

**通过（T289G003 实测，taskId=44880000000004）：**

```json
{ "Status": true, "Message": null }
```

**任务已处理：**

```json
{ "Status": false, "Message": "任务已经处理" }
```

**无权限 / 过期（纯文本）：**

```
您没有权限查看或者任务已经过期
```

---

## 三、原生迁移建议

1. **封装 `buildTravelFormAddBody(datas, values)`**  
   按 `flowform.js` 规则生成 `FormDetails` / `FormTimes`；可从 `Form/Flow` HTML 解析 `var datas`。

2. **封装 `approveTravelTask({ taskId, isPass, remark, ticket })`**  
   POST `FormTask/Approval`；Travel 审批无需表单字段。

3. **Handle URL 拼装**

   ```
   {handleUrl}&taskid={id}&ticket={ticket}&isApp=true&lang=cn
   ```

4. **默认值预填**  
   提交前按需调用 `StaffCtrl` / `CityCtrl` / `TravelNumberCtrl` 等 DefaultData 接口。

---

## 四、重跑抓包

```bash
pnpm --filter @ryx/api build

TRAVEL_PROXY_USER=T18610773065 TRAVEL_PROXY_PASS=Temp123456 \
TRAVEL_PROXY_APPROVE_USER=T289G003 TRAVEL_PROXY_APPROVE_PASS=Temp123456 \
node packages/api/scripts/capture-travel-submit.mjs
```

仅生成结构、不实际提交：

```bash
TRAVEL_SUBMIT_DRY_RUN=1 TRAVEL_APPROVE_DRY_RUN=1 node packages/api/scripts/capture-travel-submit.mjs
```

## 五、相关文件

| 文件 | 说明 |
|------|------|
| `docs/api/fixtures/travel-proxy/submit-api-contract.json` | 完整 JSON 契约 + requestSample |
| `docs/api/fixtures/travel-proxy/form-field-schema.json` | 字段 schema |
| `docs/api/fixtures/travel-proxy/api-catalog.json` | 全量 endpoint 清单 |
| `docs/api/domains/travel-module-migration-strategy.md` | 出差模块整体迁移策略 |
