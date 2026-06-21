# H5 Picker 设计规范（城市 / 出行人）

> **适用范围**：全屏选择类页面 — `CityPicker`、出行人选择、后续资源 Picker  
> **参考实现**：`apps/h5/src/components/search/CityPicker.tsx`  
> **设计稿**：MasterGo「选择出发城市」、机票「选择出行人 — 公司员工」

与业务页公用蓝色 `AppHeader`（`#5099fe`）不同，**Picker 全屏页**使用 **渐变顶区 + 浅灰内容区**，形成独立的「选择器」视觉语言。

---

## 1. 设计原则

| 原则 | 说明 |
|------|------|
| 全屏沉浸 | `fixed inset-0 z-[60]`，覆盖业务页 Header |
| 渐变顶栏 | 顶部 `#d6e4ff → #f5f7fa`，与城市选择器一致 |
| 内嵌搜索 | 白底圆角搜索条 + 右侧「搜索」胶囊按钮 |
| 内容区 | 背景 `#f5f7fa`，列表/卡片 `#ffffff` |
| 触控优先 | 最小点击区域 44px，卡片间距 ≥ 12px |
| 安全区 | `pt-[env(safe-area-inset-top)]` / `pb-[env(safe-area-inset-bottom)]` |

---

## 2. 设计 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `picker-gradient-from` | `#d6e4ff` | 顶栏渐变起点 |
| `picker-gradient-to` | `#f5f7fa` | 顶栏渐变终点 / 页面底色 |
| `picker-surface` | `#ffffff` | 搜索条、卡片、列表行 |
| `picker-text-primary` | `#333333` | 标题、姓名 |
| `picker-text-secondary` | `#666666` | 分组标题、部门 |
| `picker-text-muted` | `#999999` | 占位符、证件类型前缀 |
| `picker-text-placeholder` | `#bbbbbb` | 搜索 placeholder |
| `picker-border` | `#eeeeee` | 列表分割线 |
| `picker-accent` | `#5099fe` | 选中态、Tab 激活、主按钮（与 `BRAND_HEADER_BG` 一致） |
| `picker-accent-soft` | `#e8eeff` | 「搜索」按钮背景 |
| `picker-letter-bar` | `#e8eef8` | 字母索引条（城市 Picker） |
| `picker-danger` | `#ff4d4f` | 删除图标 |
| `picker-radius-card` | `12px`（`rounded-xl`） | 人员卡片 |
| `picker-radius-search` | `9999px`（`rounded-full`） | 搜索条 |
| `picker-radius-chip` | `8px`（`rounded-lg`） | 热门/历史 Chip |
| `picker-shadow-sm` | `shadow-sm` | 搜索条、卡片轻阴影 |

---

## 3. 布局骨架（PickerShell）

所有 Picker 页共用同一垂直结构：

```
┌─────────────────────────────────────┐
│ 渐变顶区 (#d6e4ff → #f5f7fa)        │
│  ┌─────────────────────────────┐   │
│  │ ‹        标题（居中）          │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🔍  搜索 placeholder    [搜索] │   │  ← 白底 rounded-full h-10
│  └─────────────────────────────┘   │
│  [ 可选：Segment Tab ]              │  ← 出行人：公司员工 | 非公司员工
├─────────────────────────────────────┤
│ 可滚动内容区 (#f5f7fa)               │
│  · 列表 / 卡片 / 字母分组            │
├─────────────────────────────────────┤
│ 固定底栏（白底或透明 + 主按钮）       │
│  [ 确认 ]  或  [已选 N 人] [确认]    │
└─────────────────────────────────────┘
```

### 3.1 顶栏

| 元素 | 规范 |
|------|------|
| 高度 | 工具栏 `h-11`（44px） |
| 返回 | 左 `‹`，`w-11 h-11`，`text-2xl text-[#333333]` |
| 标题 | 居中 `text-base font-semibold text-[#333333]`，单行截断 |
| 副标题 | 不出现在渐变区；产品类型（机票/酒店）可放标题括号或省略 |

### 3.2 搜索条

与 `CityPicker` 完全一致：

```tsx
<div className="flex h-10 items-center gap-2 rounded-full bg-white px-3 shadow-sm">
  <span className="text-sm text-[#999999]">🔍</span>
  <input className="min-w-0 flex-1 bg-transparent text-sm text-[#333333] outline-none placeholder:text-[#bbbbbb]" />
  <button className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-[#5099fe]" style={{ backgroundColor: '#e8eeff' }}>
    搜索
  </button>
</div>
```

| Picker | placeholder 文案 |
|--------|-------------------|
| 城市 | `搜索城市或车站名称` |
| 出行人 | `请输入姓名、手机号` |

交互：输入即过滤（出行人）或聚焦触发搜索（城市）；「搜索」按钮至少聚焦输入框。

### 3.3 Segment Tab（出行人专用）

位于搜索条下方、内容区上方，**仍在渐变至灰底的过渡带**：

| 状态 | 样式 |
|------|------|
| 容器 | `flex mx-4 mb-2 rounded-full bg-white/80 p-0.5` 或底部分割线 Tab（设计稿为胶囊分段） |
| 激活 | `bg-[#5099fe] text-white rounded-full` |
| 未激活 | `text-[#666666]` |
| 项 | `公司员工` / `非公司员工` |

配置关闭非员工时（`AllowAddingNonTmcUser=false`）**整段 Tab 不渲染**。

### 3.4 底栏

| 模式 | 用于 | 规范 |
|------|------|------|
| **单主按钮** | 设计稿出行人 | 全宽 `h-11 rounded-full bg-[#5099fe] text-white font-medium` |
| **双按钮** | 当前 H5 实现 | 左 `已选择 N 人` outline，右 `确认` primary；可演进为单按钮 + 点击 N 打开 Sheet |

安全区：`pb-[max(0.75rem,env(safe-area-inset-bottom))]`

---

## 4. 列表与卡片

### 4.1 城市列表行

- 白底全宽行，`border-b border-[#eeeeee]`，`py-3.5 px-4`
- 主文案 `#333333`，次要 `#999999`

### 4.2 出行人卡片（公司员工）

白底卡片，`rounded-xl shadow-sm mx-4 mb-3 p-4`，左侧选择控件 + 右侧信息区。

```
┌──────────────────────────────────────────┐
│ (○)  王某某                    [编辑][删] │  ← 副证件行才有操作图标
│      融旅在线公司-技术研发部              │
│      身份证 110***********1814           │
│      +86-186****4035                     │
│      [ 添加其他证件 ▾ ]                   │
├──────────────────────────────────────────┤
│ ( )  王某某                               │  ← 展开的护照/台胞证
│      护照 E1***********234                │
│                              [编辑][删]   │
└──────────────────────────────────────────┘
```

| 元素 | 规范 |
|------|------|
| 选择控件 | **圆形 checkbox**（`appearance` 自定义或 `rounded-full border-2`）；选中：填充 `#5099fe` + 白色勾 |
| 姓名 | `text-base font-semibold text-[#333333]` |
| 部门 | `text-xs text-[#666666]` |
| 证件行 | 类型 `text-[#999999]` + 号码 `text-[#333333]` |
| 手机 | `text-sm text-[#666666]` |
| 添加其他证件 | `text-sm text-[#5099fe]`，带 `▾` / chevron |
| 编辑 | 铅笔图标，`text-[#999999]` |
| 删除 |  trash 图标，`text-[#ff4d4f]` |

**交互**：点击姓名行或圆形控件切换选中；展开区显示该员工其他可售证件；无证件号时控件 disabled + 提示维护证件。

### 4.3 出行人卡片（非公司员工）

- 结构与公司员工主证件行相同，**无**「添加其他证件」（列表顶单独放「新增出行人」）
- 「新增出行人」：`mx-4 mb-3 h-11 rounded-full border border-[#5099fe] text-[#5099fe] bg-white` + `+` 图标

### 4.4 空态 / 加载

| 状态 | 文案 | 样式 |
|------|------|------|
| 加载 | `加载中…` | `text-sm text-[#999999] text-center py-10` |
| 无数据 | `暂无员工数据` / `暂无常旅客` | 同上 |
| 搜索无结果 | `没有符合条件的数据` | 与城市 Picker 一致 |

---

## 5. 与城市 Picker 的差异

| 维度 | CityPicker | PassengerPicker |
|------|------------|-----------------|
| 挂载 | 业务页内 `open` overlay | 独立路由 `/passenger/select` |
| 选择模式 | 单选，点即关闭 | **多选** + 底部确认 |
| Tab | 无 | 公司员工 / 非公司员工 |
| 分组 | 热门 + 历史 + A–Z | 无字母索引（服务端搜索分页） |
| 底栏 | 无（选即关闭） | 固定「确认」 |
| 副流程 | 无 | 证件维护、新增常旅客 |

---

## 6. 组件映射（目标结构）

```
components/search/
  PickerShell.tsx          # 渐变顶 + 搜索条 + 可选 Tab + children + footer
  CityPicker.tsx           # 复用 PickerShell（ refactor 目标）

components/passenger/
  PassengerPickerPage.tsx  # 或保留 pages/passenger + 子组件
  EmployeePassengerCard.tsx
  ExternalPassengerCard.tsx
  PassengerSegmentTabs.tsx
  PassengerPickerFooter.tsx
  SelectedPassengersSheet.tsx
  PassengerCredentialForm.tsx   # 证件表单（Phase 2）
```

---

## 7. 无障碍

- 返回 / 确认：`aria-label`
- 选择控件：关联 `aria-labelledby` 指向姓名
- 搜索：`type="search"` + `enterKeyHint="search"`
- 错误提示：`role="alert"` 置于列表上方

---

## 8. 参考文件

| 文件 | 说明 |
|------|------|
| `apps/h5/src/components/search/CityPicker.tsx` | 渐变顶栏 + 搜索条实现 |
| `apps/h5/src/config/brand.ts` | `#5099fe` 品牌色 |
| [passenger-module-design.md](../../api/domains/passenger-module-design.md) | 出行人技术方案 |
| [passenger.md](../../api/domains/passenger.md) | 业务与 API 域文档 |
