# Pad / Windows Native Packaging Plan

## 目标

将现有 `apps/web` 打包为两类原生客户端：

| 平台 | 壳技术 | 业务入口 | 交付物 |
| --- | --- | --- | --- |
| Android Pad | Capacitor | `@ryx/web` | APK / AAB |
| Windows PC | Electron | `@ryx/web` | `.exe` 安装包 |

业务 UI、接口调用与路由继续只维护 `apps/web`。`apps/h5` 仍作为手机 H5，不参与 Pad / PC 客户端打包。

## 推荐运行模式

Android Pad 当前采用“内置静态包 + direct 接口”：

```text
Android Pad 原生壳
  -> 加载 APK 内置 apps/web/dist
  -> VITE_API_MODE=direct
  -> VITE_FORCE_API_MODE=direct
  -> VITE_API_BASE_URL=http://app.rtesp.com
```

原因：

- APK 自带页面资源，不依赖 Vite dev server。
- Android 客户端内没有 Vite / Nginx 同源代理，不能用 `proxy` 模式访问 `/Home/Setting` 等接口。
- direct 模式会直接请求真实 dev 后端，避免 mock。
- Android 构建会对 Tailwind v4 的 CSS cascade layer 做兼容后处理，避免旧 WebView 忽略整段样式。

Windows PC 可继续优先采用“远程壳”：

```text
Windows PC 原生壳
  -> 加载 https://<domain>/web/
  -> 服务器 Nginx 托管 apps/web/dist
  -> 同源代理 /Home、/Jyx、/Identity、/__ryx 到后端
```

原因：

- 当前 `@ryx/web` 默认 `VITE_API_MODE=proxy`，依赖同源路径代理。
- 远程壳可以复用现有 Docker + Nginx 部署，不需要在客户端内实现代理。
- Web 业务更新后无需重新发 APK / Windows 安装包。

Windows 也保留内置静态包模式：

```text
原生壳内置 apps/web/dist
```

此模式适合内网、弱网或客户要求离线启动的场景，但接口跨域、支付跳转、外链和更新机制需要单独验证。

## 工程结构

```text
apps/
  web/             # Pad + PC 业务应用
  android-pad/     # Capacitor Android Pad 壳
  windows/         # Electron Windows PC 壳
```

## Android Pad

### 关键配置

- AppId：默认 `com.ronglvonline.rongyixing.pad`
- AppName：默认 `融易行 Pad`
- Web 产物目录：`apps/android-pad/web-dist`
- Native 工程目录：`apps/android-pad/android`

### 常用命令

```bash
# 首次生成 Android 原生工程
pnpm native:android:init

# 构建 web 并同步到 Android 工程
pnpm native:android:sync

# 打开 Android Studio
pnpm native:android:open

# 构建 debug APK
pnpm native:android:apk
```

远程壳构建时指定：

```bash
RYX_PAD_SERVER_URL=https://<domain>/web/ pnpm native:android:sync
```

若 `RYX_PAD_SERVER_URL` 为空，则使用内置 `web-dist`。

### 待补原生项

- 应用图标与启动页资源。
- 横竖屏策略：Pad 建议先支持横竖屏，再按验收反馈限制。
- Android 返回键：Web 内有历史栈时返回上一页，无历史栈时二次确认退出。
- 权限：定位、相册/文件上传、下载目录。
- 签名：测试 keystore 与生产 keystore 分离。
- AAB：上架渠道如要求 AAB，再补 release bundle 脚本。

## Windows PC

### 关键配置

- AppId：默认 `cn.rongtrip.rongyixing.windows`
- ProductName：`融易行`
- Web 产物目录：`apps/windows/web-dist`
- 输出目录：`apps/windows/release`

### 常用命令

```bash
# 开发：先另起一个终端启动 web
pnpm dev:web

# 再启动 Electron 开发壳
pnpm native:windows:dev

# 打 Windows 安装包
RYX_WINDOWS_SERVER_URL=https://<domain>/web/ pnpm native:windows:dist
```

若 `RYX_WINDOWS_SERVER_URL` 为空，Electron 会加载内置 `web-dist`。内置模式使用 `ryx://app/` 自定义协议承载 SPA，避免 `file://` 下 BrowserRouter 刷新白屏。

### 待补原生项

- Windows 图标 `.ico`。
- 代码签名证书，降低安装和杀软拦截风险。
- 自动更新服务：可后续接 `electron-updater`。
- 外链和支付窗口策略。
- 崩溃日志、用户数据目录清理策略。

## 构建前置条件

- Node.js 20+
- pnpm 9+
- Android Studio / Android SDK / JDK 17+（Android 构建）
- Windows 打包建议在 Windows CI 或 Windows 本机执行（macOS 交叉打包 Windows 安装包通常还需要 Wine 和签名链路）

## 验收清单

- 登录、退出登录、登录态持久化。
- 首页、我的、订单、机票、酒店、火车、审批主流程。
- 支付跳转与返回。
- 外部工作流页面 `/open-url`。
- 文件上传、头像上传、图片预览。
- Android Pad 横屏、竖屏、返回键。
- Windows 安装、卸载、快捷方式、窗口缩放、刷新。
