# RongYiXing 部署与验证 README

这份文档只回答四件事：

1. 本地 Vite 怎么验
2. 本地 Nginx 怎么验
3. 我自己的服务器怎么用 IP + 域名验
4. 客户服务器怎么部署

如果你只想先记住一句话：

- 开发调试用 `pnpm dev:*`
- 本地/自有服务器验部署形态用 `rongyixing-h5-web-dist-test|prod`
- 客户服务器交付用 `rongyixing-business-*-test|prod`

## 0. 先看结论

| 场景 | 用什么包 | 访问方式 | 说明 |
| --- | --- | --- | --- |
| 本地快速开发 | Vite | `http://localhost:5173~5176/` | 不走 Nginx，适合改代码和看效果 |
| 本地部署验证 | 内部 test/prod 包 | `http://localhost:18080~18089/` 或本机 IP | 模拟真实 Nginx 和反向代理 |
| 自己的服务器验证 | 内部 test/prod 包 | IP + 端口 + 域名 | 先验 IP，再验域名 |
| 客户服务器部署 | 业务方 test/prod 包 | `https://app.rongtrip.cn/www`、`/web` | 同源静态部署，不走我们自己的内部代理 |

---

## 1. 先生成发布包

一键生成全部产物：

```bash
pnpm release:all
```

默认会生成六类目录：

```text
deploy/release/out/rongyixing-business-h5-test/
deploy/release/out/rongyixing-business-h5-prod/
deploy/release/out/rongyixing-business-web-test/
deploy/release/out/rongyixing-business-web-prod/
deploy/release/out/rongyixing-h5-web-dist-test/
deploy/release/out/rongyixing-h5-web-dist-prod/
```

含义如下：

- `rongyixing-business-*`：给客户服务器用
- `rongyixing-h5-web-dist-*`：给我们自己本地和自有服务器验证用

如果只想生成某一类：

```bash
BUILD_INTERNAL=0 pnpm release:all
BUILD_BUSINESS_WWW=0 pnpm release:all
```

如果还要压缩包：

```bash
CREATE_ARCHIVE=1 pnpm release:all
```

---

## 2. 本地 Vite 验证

本地 Vite 是最快的验证方式，适合开发时直接看页面。

### 启动命令

```bash
pnpm dev:h5:test
pnpm dev:web:test
pnpm dev:h5:prod
pnpm dev:web:prod
```

### 访问地址

| 命令 | 地址 | 后端环境 |
| --- | --- | --- |
| `pnpm dev:h5:test` | `http://localhost:5173/` | `rtesp.com` |
| `pnpm dev:web:test` | `http://localhost:5174/` | `rtesp.com` |
| `pnpm dev:h5:prod` | `http://localhost:5175/` | `rongtrip.cn` |
| `pnpm dev:web:prod` | `http://localhost:5176/` | `rongtrip.cn` |

### 常用入口

```text
http://localhost:5173/login/password
http://localhost:5174/login/password
http://localhost:5175/login/password
http://localhost:5176/login/password
```

### ticket 直跳

```text
http://localhost:5173/?ticket=xxxx
http://localhost:5174/?ticket=xxxx
http://localhost:5175/?ticket=xxxx
http://localhost:5176/?ticket=xxxx
```

### 说明

- 本地 Vite 也是根路径 `/`
- 不再用 `/h5/`、`/web/` 作为应用入口
- 适合快速开发，但不能完全代表真实 Nginx 行为

---

## 3. 本地 Nginx 验证

本地 Nginx 是为了模拟真实部署，不走 Vite。

### 推荐做法

先用内部验证包安装：

```bash
cd deploy/release/out/rongyixing-h5-web-dist-test
sudo ./install-dist.sh

cd deploy/release/out/rongyixing-h5-web-dist-prod
sudo ./install-dist.sh
```

如果只想更新静态文件：

```bash
cd deploy/release/out/rongyixing-h5-web-dist-test
sudo ./install-static-dist.sh
```

### 本地访问地址

```text
http://localhost:18080/
http://localhost:18081/
http://localhost:18088/
http://localhost:18089/
```

如果你更习惯用本机 IP，也可以直接访问：

```text
http://<本机IP>:18080/
http://<本机IP>:18081/
http://<本机IP>:18088/
http://<本机IP>:18089/
```

### 本地 Nginx 验证重点

- 静态资源由 Nginx 提供
- `/Home/Setting` 能返回配置
- `/Home/Proxy`、`/Jyx`、`/Identity`、`/__ryx/*` 能正常转发
- 登录、酒店、机票、火车票、订单都能走通

### 自定义本机目录

如果你本机 Nginx 配置路径不同，可以显式覆盖：

```bash
sudo env \
  INSTALL_DIR=/data/rongyixing-test \
  SERVER_NGINX_TARGET=/etc/nginx/conf.d/rongyixing-test.conf \
  H5_LISTEN=18080 \
  WEB_LISTEN=18081 \
  ./install-dist.sh
```

---

## 4. 我自己的服务器验证

这里仍然使用内部验证包，因为你要验证的是：

- IP 访问
- 域名访问
- Nginx 反向代理
- 登录和业务流程

### Test

```bash
cd deploy/release/out/rongyixing-h5-web-dist-test
sudo ./install-dist.sh
```

默认访问：

```text
http://<server-ip>:18080/
http://<server-ip>:18081/
```

### Prod

```bash
cd deploy/release/out/rongyixing-h5-web-dist-prod
sudo ./install-dist.sh
```

默认访问：

```text
http://<server-ip>:18088/
http://<server-ip>:18089/
```

### Prod 域名

Prod 额外支持固定域名：

```text
http://h5.songguoren.site/
http://web.songguoren.site/
```

如果你自己服务器上要绑定自己的域名，也按同一套 `install-dist.sh` 来，只是把域名和 Nginx 配置参数换掉。

### 推荐验证顺序

1. 先用 IP + 端口确认静态页起来了
2. 再用域名确认同一套服务可访问
3. 最后登录并验证酒店、机票、火车票、订单

### 推荐检查点

```text
http://<server-ip>:18080/login/password
http://<server-ip>:18081/login/password
http://h5.songguoren.site/login/password
http://web.songguoren.site/login/password
```

### 只更新静态文件

如果 Nginx 配置不变，只替换前端版本：

```bash
cd deploy/release/out/rongyixing-h5-web-dist-prod
sudo ./install-static-dist.sh
```

---

## 5. 客户服务器部署

客户服务器用业务方同源包。

### 客户服务器目录

```text
/data/beeant/www/websites/Beeant.Presentation.Client.App/wwwroot/
```

### 需要替换的目录

```text
wwwroot/www
wwwroot/web
```

### 包和目录的对应关系

| 包 | 替换到客户服务器 |
| --- | --- |
| `rongyixing-business-h5-test/www` | `wwwroot/www` |
| `rongyixing-business-web-test/web` | `wwwroot/web` |
| `rongyixing-business-h5-prod/www` | `wwwroot/www` |
| `rongyixing-business-web-prod/web` | `wwwroot/web` |

### 客户访问方式

```text
https://app.rongtrip.cn/www/index.html
https://app.rongtrip.cn/web/index.html
```

如果客户还有 ticket 入口：

```text
https://app.rongtrip.cn/www/index.html?ticket=xxxx
https://app.rongtrip.cn/web/index.html?ticket=xxxx
```

### 客户包的运行方式

- 静态资源 base 固定为 `/www/` 或 `/web/`
- 先请求当前访问域名下的 `/Home/Setting`
- 再按 `/Home/Setting` 返回的 `Urls` 直接访问 legacy 后端
- 不走我们内部的 `/__ryx/*` 代理体系

### 这和内部包的区别

- 内部包：适合本地和自有服务器，保留 Nginx 代理和端口验证
- 客户包：适合同源部署，直接替换客户站点下的静态目录

---

## 6. 一眼看懂怎么选

| 你现在要做什么 | 用什么 |
| --- | --- |
| 快速改页面 | 本地 Vite |
| 看真实 Nginx 行为 | 本地 Nginx |
| 验证自己服务器上的 IP / 域名 | 内部 test/prod 包 |
| 交给客户部署 | 业务方 test/prod 包 |

---

## 7. 常见问题

### 为什么客户包不用 `/__ryx`

因为客户服务器是同源部署，`/Home/Setting` 和后续服务域名都按客户当前域名解析，不需要我们内部代理路径。

### 为什么自己服务器还要用内部包

因为你要同时验证 IP、端口、域名和 Nginx 代理行为，内部包保留了完整的安装和检查脚本。

### 为什么本地既有 Vite 又有 Nginx

Vite 用来快调，Nginx 用来验最终部署形态。两种都留着，最稳。

### 为什么不是只换 `index.html`

因为真实部署需要同时替换整套静态目录，还要保留路由回退和后端代理配置。

