# 开发任务清单

## 基础信息
- 关联 Jira：r-003
- 需求文件夹：20260716-r-003-业务feature-forgot-password-migration
- [设计文档](design.md)

## 任务列表
| 任务标号 | 任务名称 | 任务描述 | 验证标准 | 完成状态 |
| --- | --- | --- | --- | --- |
| T001 | legacy 流程确认 | 阅读 legacy `password-check/password-valid/password-reset` 源码，确认接口、Action、payload 与页面步骤。 | 文档列出四个接口动作：Check、SendCode、Valid、Reset；明确与 `Password-Modify` 的区别。 | ✅ 已完成 |
| T002 | API 与类型封装 | 在 shared-types 和 packages/api 中补忘记密码 DTO、方法常量和 API 封装。 | 单元测试可捕获四个 API 方法分别发送正确 method 和 payload。 | ✅ 已完成 |
| T003 | H5 忘记密码页面 | 新增 H5 `/login/forgot-password` 页面和路由，支持账号校验、验证码、重置密码。 | H5 登录页入口可进入；三步流程状态正确；重置成功回登录页。 | ✅ 已完成 |
| T004 | Web/Pad 忘记密码页面 | 新增 Web/Pad `/login/forgot-password` 页面和路由，登录页入口改为可点击链接。 | Web/Pad 登录页入口可进入；页面视觉对齐当前登录页；重置成功回登录页。 | ✅ 已完成 |
| T005 | 校验与错误处理 | 复用或补充密码、验证码、无验证方式、接口错误提示。 | 空账号、空验证码、密码不合规、两次密码不一致、无验证方式都有明确提示。 | ✅ 已完成 |
| T006 | 验证 | 运行 API 测试、H5/Web typecheck，必要时补页面逻辑测试。 | `@ryx/api` 相关测试通过；H5/Web TypeScript 检查通过。 | ✅ 已完成 |

## 验证记录
- `pnpm --filter @ryx/shared-types build`：通过
- `pnpm --filter @ryx/api build`：通过
- `pnpm --filter @ryx/api exec vitest run src/apis/account-security.test.ts`：通过，4 条用例
- `pnpm --filter @ryx/h5 exec vitest run src/lib/account-settings.test.ts`：通过，4 条用例
- `pnpm --filter @ryx/web exec vitest run src/lib/account-settings.test.ts`：通过，4 条用例
- `pnpm --filter @ryx/h5 exec tsc -p tsconfig.app.json --noEmit`：通过
- `pnpm --filter @ryx/web exec tsc -p tsconfig.app.json --noEmit`：通过

## 备注
1. `/settings/password` 继续表示登录后修改密码，不作为忘记密码流程的一部分。
2. legacy 找回密码重置规则为 8-30 位且必须包含大小写字母，本页面按该规则处理。
3. 本期不迁移 legacy 滑块验证码组件；H5/Web 直接调用账号校验接口，后端仍负责业务校验。
