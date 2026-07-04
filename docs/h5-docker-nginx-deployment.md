# H5 Docker + Nginx 部署方案

## 目标

将本地 `localhost:5173` 的 Vite dev proxy 模式迁移到服务器生产部署：

```text
浏览器 -> https://rtesp.songguoren.site
服务器 Nginx -> 127.0.0.1:18080
Docker 内 Nginx -> H5 静态文件 + rtesp 后端代理
```

浏览器只访问 `rtesp.songguoren.site`，接口请求也使用同域路径，例如 `/Home/Setting`、`/Jyx/LoginByRyx`、`/__ryx/TmcTouristTrainUrl/Home/Search`。真实 rtesp 后端由 Docker 内 Nginx 代发，从而避免浏览器跨域和 HTTPS 页面访问 HTTP 后端的 mixed content 问题。

## 本地与生产的对应关系

本地开发：

```text
浏览器 -> http://localhost:5173/Home/Setting
Vite proxy -> http://app.rtesp.com/Home/Setting
```

生产部署：

```text
浏览器 -> https://rtesp.songguoren.site/Home/Setting
Nginx proxy -> http://app.rtesp.com/Home/Setting
```

本质一致：浏览器只看到一个同源域名，跨域请求发生在服务端代理层。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `.dockerignore` | 排除 `node_modules`、构建产物、环境文件等 Docker 上下文噪音 |
| `deploy/docker/Dockerfile.h5` | 多阶段构建：Node 20 构建 H5，Nginx 运行静态产物 |
| `deploy/docker/docker-compose.yml` | 本机绑定 `127.0.0.1:18080`，避免容器端口直接暴露公网 |
| `deploy/scripts/deploy-h5.sh` | 一键构建并启动 H5 Docker 服务，可选安装服务器 Nginx 入口配置 |
| `deploy/scripts/stop-h5.sh` | 停止 H5 Docker 服务，可选删除镜像 |
| `deploy/nginx/h5.conf` | Docker 内 Nginx：托管 SPA，并复刻 Vite dev proxy 的后端转发 |
| `deploy/nginx/rtesp.songguoren.site.conf` | 服务器公网 Nginx 入口示例：域名转发到本机 Docker 服务 |

## 构建顺序

Docker 镜像内是干净环境，H5 构建前必须先构建 workspace 依赖：

```bash
pnpm build:workspace
pnpm --filter @ryx/h5 build
```

原因是 `@ryx/shared-types`、`@ryx/api`、`@ryx/mock` 的包入口和类型声明都指向各自的 `dist/`。如果跳过 workspace 构建，H5 的 `tsc -b` 会在服务器镜像内报 `Cannot find module '@ryx/shared-types'`、`Cannot find module '@ryx/api'` 等错误。

## 构建参数

默认构建参数：

```bash
VITE_APP_ID=com.ronglvonline.app
VITE_API_MODE=proxy
VITE_API_BASE_URL=
VITE_API_DOMAIN=rtesp.com
```

关键点：

- `VITE_API_MODE=proxy`：前端使用同源代理路径。
- `VITE_API_BASE_URL=`：让 API baseUrl 为空，生成 `/Home/*` 和 `/__ryx/*` 这类相对路径。
- `VITE_API_DOMAIN=rtesp.com`：请求签名和 legacy 域参数使用 rtesp.com。

## 一键部署与停止

在仓库根目录执行：

```bash
./deploy/scripts/deploy-h5.sh
```

默认容器只监听本机：

```text
127.0.0.1:18080 -> container:80
```

如果需要部署脚本同时安装并重载服务器公网 Nginx 入口配置：

```bash
INSTALL_SERVER_NGINX=1 ./deploy/scripts/deploy-h5.sh
```

这会将：

```text
deploy/nginx/rtesp.songguoren.site.conf
```

安装到：

```text
/etc/nginx/conf.d/rtesp.songguoren.site.conf
```

然后执行 `nginx -t` 和 reload。

停止 H5 Docker 服务：

```bash
./deploy/scripts/stop-h5.sh
```

停止并删除本地镜像：

```bash
REMOVE_IMAGE=1 ./deploy/scripts/stop-h5.sh
```

检查：

```bash
curl -I http://127.0.0.1:18080/
curl -I 'http://127.0.0.1:18080/Home/Setting?appId=com.ronglvonline.app'
```

## 服务器 Nginx

服务器公网 Nginx 只负责域名入口，转发到本机 Docker 服务。示例文件见：

```text
deploy/nginx/rtesp.songguoren.site.conf
```

HTTP 版本：

```nginx
server {
  listen 80;
  server_name rtesp.songguoren.site;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:18080;
  }
}
```

启用后检查并重载：

```bash
nginx -t
systemctl reload nginx
```

HTTPS 建议用 certbot：

```bash
certbot --nginx -d rtesp.songguoren.site
```

## 后端代理规则

Docker 内 Nginx 代理规则与 `apps/h5/vite.config.ts` 的 Vite dev proxy 对齐。

固定路径：

| 浏览器路径 | 后端 |
| --- | --- |
| `/Home/*` | `http://app.rtesp.com` |
| `/Jyx/*` | `http://ronglv-feature.rtesp.com` |
| `/Identity/*` | `http://api.rtesp.com` |

业务服务路径：

| 浏览器路径前缀 | 后端 |
| --- | --- |
| `/__ryx/TmcApiHomeUrl/*` | `http://api-tmc.rtesp.com/*` |
| `/__ryx/TmcApiHotelUrl/*` | `http://hotel-api-tmc.rtesp.com/*` |
| `/__ryx/TmcApiFlightUrl/*` | `http://flight-api-tmc.rtesp.com/*` |
| `/__ryx/TmcApiTrainUrl/*` | `http://train-api-tmc.rtesp.com/*` |
| `/__ryx/TmcApiBookUrl/*` | `http://book-api-tmc.rtesp.com/*` |
| `/__ryx/TmcApiOrderUrl/*` | `http://order-api-tmc.rtesp.com/*` |
| `/__ryx/WorkflowApiUrl/*` | `http://api-workflow.rtesp.com/*` |
| `/__ryx/ApiMemberUrl/*` | `http://member-api.rtesp.com/*` |
| `/__ryx/ApiAccountUrl/*` | `http://account-api.rtesp.com/*` |
| `/__ryx/HrApiUrl/*` | `http://api-hr.rtesp.com/*` |
| `/__ryx/ApiPasswordUrl/*` | `http://pass-api.rtesp.com/*` |
| `/__ryx/ApiLoginUrl/*` | `http://login-api.rtesp.com/*` |
| `/__ryx/ApiHomeUrl/*` | `http://api.rtesp.com/*` |
| `/__ryx/TmcTouristFlightUrl/*` | `http://flight-tourist-tmc.rtesp.com/*` |
| `/__ryx/TmcTouristTrainUrl/*` | `http://train-tourist-tmc.rtesp.com/*` |
| `/__ryx/TmcTouristHotelUrl/*` | `http://hotel-tourist-tmc.rtesp.com/*` |
| `/__ryx/TmcTouristBookUrl/*` | `http://book-tourist-tmc.rtesp.com/*` |
| `/__ryx/TmcTouristOrderUrl/*` | `http://order-tourist-tmc.rtesp.com/*` |

## 新增 API 是否需要改 Nginx

一般不需要。

新增 API 如果仍属于已有 UrlKey，例如：

```text
TmcTouristTrainUrl-Home-NewApi
```

前端会请求：

```text
/__ryx/TmcTouristTrainUrl/Home/NewApi
```

现有 Nginx 规则会自动转发到：

```text
http://train-tourist-tmc.rtesp.com/Home/NewApi
```

只有新增后端服务域或新的 UrlKey 时，才需要补充一条 `/__ryx/{UrlKey}/` 代理规则。

## 前端配合改动

生产 proxy 模式下，前端登录地址也会重写为同域 `/Jyx/*`：

```text
http://ronglv-feature.rtesp.com/Jyx/LoginByRyx
-> /Jyx/LoginByRyx
```

这样登录请求与本地开发一致，均由代理层转发，避免跨域。
