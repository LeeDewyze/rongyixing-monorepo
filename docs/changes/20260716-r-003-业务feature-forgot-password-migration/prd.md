# 忘记密码迁移 PRD

## 背景
当前迁移后的 H5 登录页有「忘记密码」入口，但 `/login/forgot-password` 路由未实现；Web/Pad 登录页仅展示「忘记密码请联系管理员」，没有自助找回流程。legacy 中「忘记密码」是独立于登录后「修改密码」的找回流程，不能直接复用 `/settings/password`。

## 目标
- 对齐 legacy 忘记密码流程：账号校验、验证方式选择、验证码校验、重置密码。
- H5 和 Web/Pad 均提供登录前可访问的 `/login/forgot-password` 页面。
- 登录后设置中的 `/settings/password` 继续保持“修改密码”语义，不与忘记密码混用。

## 验收标准
- H5 登录页点击忘记密码可进入找回密码流程。
- Web/Pad 登录页点击忘记密码可进入找回密码流程。
- 账号校验调用 `ApiPasswordUrl-Home-Action`，`Action=Check`。
- 发送验证码调用 `ApiPasswordUrl-Home-SendCode`。
- 验证码校验调用 `ApiPasswordUrl-Home-Action`，`Action=Valid`。
- 重置密码调用 `ApiPasswordUrl-Home-Action`，`Action=Reset`。
- 无可用验证方式时提示联系管理员。
- 重置成功后回到账号密码登录页。
