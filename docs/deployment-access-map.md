# RongYiXing 启动与访问地址对照

本文记录本地 Vite 调试、服务器静态部署、域名访问之间的对应关系，后续启动和部署时优先按这里核对。

## 1. 本地 Vite 启动

本地 test/prod 都使用根路径 `/`，与服务器静态部署保持一致，不再通过 `/h5/` 或 `/web/` 区分应用。

| 场景 | 启动命令 | 本地访问地址 | 后端环境 |
| --- | --- | --- | --- |
| H5 Test | `pnpm dev:h5:test` | `http://localhost:5173/` | `http://app.rtesp.com` |
| Web Test | `pnpm dev:web:test` | `http://localhost:5174/` | `http://app.rtesp.com` |
| H5 Prod | `pnpm dev:h5:prod` | `http://localhost:5175/` | `https://app.rongtrip.cn` |
| Web Prod | `pnpm dev:web:prod` | `http://localhost:5176/` | `https://app.rongtrip.cn` |

常用登录入口示例：

```text
http://localhost:5173/login/password
http://localhost:5174/login/password
http://localhost:5175/login/password
http://localhost:5176/login/password
```

URL ticket 入口也直接挂在根路径：

```text
http://localhost:5173/?ticket=xxxx
http://localhost:5174/?ticket=xxxx
http://localhost:5175/?ticket=xxxx
http://localhost:5176/?ticket=xxxx
```

## 2. 服务器静态部署

交付包仍然按环境分成两份：

| 环境 | 交付包 |
| --- | --- |
| Test | `rongyixing-h5-web-dist-test` |
| Prod | `rongyixing-h5-web-dist-prod` |

每个交付包内都有两份独立根路径产物：

```text
h5/dist
web/dist
```

服务器上通过不同端口区分 H5 和 Web：

| 场景 | 服务器访问地址 | 静态目录 | 后端环境 |
| --- | --- | --- | --- |
| H5 Test | `http://<server-ip>:80/` | `h5/dist` | `rtesp.com` |
| Web Test | `http://<server-ip>:81/` | `web/dist` | `rtesp.com` |
| H5 Prod | `http://<server-ip>:18088/` | `h5/dist` | `rongtrip.cn` |
| Web Prod | `http://<server-ip>:18089/` | `web/dist` | `rongtrip.cn` |

示例：

```text
http://<server-ip>:18088/login/password
http://<server-ip>:18089/login/password
http://<server-ip>:18088/?ticket=xxxx
http://<server-ip>:18089/?ticket=xxxx
```

## 3. Prod 域名访问

Prod 额外支持两个固定域名，域名访问同样是根路径，不跳转 `/h5/` 或 `/web/`。

| 域名 | 对应应用 | 静态目录 | 等价 IP 入口 |
| --- | --- | --- | --- |
| `http://h5.songguoren.site/` | H5 Prod | `h5/dist` | `http://<server-ip>:18088/` |
| `http://web.songguoren.site/` | Web Prod | `web/dist` | `http://<server-ip>:18089/` |

示例：

```text
http://h5.songguoren.site/login/password
http://web.songguoren.site/login/password
http://h5.songguoren.site/?ticket=xxxx
http://web.songguoren.site/?ticket=xxxx
```

## 4. 对应关系总表

| 类型 | H5 Test | Web Test | H5 Prod | Web Prod |
| --- | --- | --- | --- | --- |
| 本地 Vite | `http://localhost:5173/` | `http://localhost:5174/` | `http://localhost:5175/` | `http://localhost:5176/` |
| 服务器 IP | `http://<server-ip>:80/` | `http://<server-ip>:81/` | `http://<server-ip>:18088/` | `http://<server-ip>:18089/` |
| Prod 域名 | - | - | `http://h5.songguoren.site/` | `http://web.songguoren.site/` |
| 后端环境 | `rtesp.com` | `rtesp.com` | `rongtrip.cn` | `rongtrip.cn` |

## 5. 注意事项

- 本地 Vite 和服务器静态部署都使用根路径 `/`。
- 不要再用 `/h5/` 或 `/web/` 作为应用访问前缀。
- 如果要临时打开 vConsole，在任意入口后追加 `?vconsole=1`。
- 如果要关闭 vConsole，在任意入口后追加 `?vconsole=0`。
