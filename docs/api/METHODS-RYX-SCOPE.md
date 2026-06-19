# ryx Method 迁移范围分析

> Generated: 2026-06-19T11:47:19.132Z

## 结论（354 不等于要迁 354）

| 层级 | 数量 | 含义 |
|------|------|------|
| 全库 inventory | 364 | core+ryx+jyx 登记 |
| ryx 静态扫描上界 | 354 | ryx/src/app 出现过的 Method 字符串 |
| 非主线（CRM/MMS/BPM/游客） | 144 | 建议不纳入 /rl/ 替换 |
| 去掉非主线后 | 210 | 仍含改密/账户等 |
| **/rl/ 主 Tab 合理预算** | **159** | TMC+登录+会员+出差 |
| 已封装 | 25 | @ryx/api 当前进度 |
| **页面矩阵** | **29** | [PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md) · 迁移 KPI |

重新生成：`pnpm analyze-ryx-scope`

**逐页迁移**：[PAGE-API-MATRIX.md](./PAGE-API-MATRIX.md) · `pnpm analyze-ryx-pages`

详见 [task-list.md](./task-list.md)