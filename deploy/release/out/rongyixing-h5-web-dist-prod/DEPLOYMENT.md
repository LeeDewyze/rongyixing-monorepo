# RongYiXing H5/Web Release Package Deployment

这是一份给部署人员的操作手册。部署人员只需要拿到已经构建好的
`rongyixing-h5-web-dist-test` 或 `rongyixing-h5-web-dist-prod` 交付包，
不需要源码、Node.js、pnpm 或重新构建项目。

## 1. 交付包内容

完整交付包结构如下：

```text
rongyixing-h5-web-dist-prod/
├── VERSION.txt
├── README.md
├── DEPLOYMENT.md
├── install-dist.sh
├── install-static-dist.sh
├── h5/
│   └── dist/
├── web/
│   └── dist/
└── nginx/
    └── rongyixing-dist.conf.template
```

不要只上传 `h5/dist` 或 `web/dist`。登录、酒店、机票、火车票和订单接口
依赖交付包中的 Nginx 反向代理配置。

## 2. 环境默认值

| 项目 | Test | Prod |
| --- | --- | --- |
| 交付包名称 | `rongyixing-h5-web-dist-test` | `rongyixing-h5-web-dist-prod` |
| 静态文件目录 | `/opt/rongyixing-test` | `/opt/rongyixing-prod` |
| Nginx 配置 | `/etc/nginx/conf.d/rongyixing-test.conf` | `/etc/nginx/conf.d/rongyixing-prod.conf` |
| Nginx 端口 | `80` | `18088` |
| 后端域名 | `rtesp.com` | `rongtrip.cn` |
| H5 地址 | `http://<server>/h5/` | `http://<server>:18088/h5/` |
| Web 地址 | `http://<server>/web/` | `http://<server>:18088/web/` |

内置 Nginx 模板同时支持以下固定域名入口：

```text
http://h5.songguoren.site/   -> /h5/
http://web.songguoren.site/  -> /web/
```

跳转会保留 `ticket` 等 query 参数，例如
`http://web.songguoren.site/?ticket=xxx` 会进入 `/web/?ticket=xxx`。

如果交付方在 `VERSION.txt` 中提供了不同参数，以 `VERSION.txt` 和交付方说明为准。

## 3. 服务器准备

服务器只需要安装：

- Nginx
- curl
- rsync（推荐，静态更新时使用）

Debian / Ubuntu：

```bash
sudo apt-get update
sudo apt-get install -y nginx curl rsync
```

RHEL / CentOS / Rocky Linux：

```bash
sudo dnf install -y nginx curl rsync
```

确认 Nginx 可用：

```bash
nginx -V
sudo nginx -T | grep -n "conf.d"
```

服务器还需要能够解析并访问对应环境的后端域名。

## 4. 上传并解压交付包

交付方可以提供目录或压缩包。上传时必须保留整个目录结构。

压缩包示例：

```bash
scp rongyixing-h5-web-dist-prod-<timestamp>.tar.gz \
  <user>@<server>:/tmp/
```

登录服务器并解压：

```bash
cd /tmp
tar -xzf rongyixing-h5-web-dist-prod-<timestamp>.tar.gz
cd rongyixing-h5-web-dist-prod
chmod +x install-dist.sh install-static-dist.sh
cat VERSION.txt
```

确认 `deploy_env` 是预期环境，并确认 `git_commit` 与交付单中的版本一致。

## 5. 首次部署

### 5.1 部署 Test

```bash
cd /tmp/rongyixing-h5-web-dist-test
sudo ./install-dist.sh
```

### 5.2 部署 Prod

```bash
cd /tmp/rongyixing-h5-web-dist-prod
sudo ./install-dist.sh
```

`install-dist.sh` 会自动执行以下操作：

1. 将 H5 文件复制到环境对应的静态目录。
2. 将 Web 文件复制到环境对应的静态目录。
3. 根据 `VERSION.txt` 识别 test 或 prod。
4. 生成对应的 Nginx 配置。
5. 安装 Nginx 配置文件。
6. 执行 `nginx -t`。
7. Reload Nginx。
8. 检查 `/h5/` 和 `/web/`。

部署人员不需要手动修改 Nginx 配置模板。

## 6. 自定义服务器参数

如果服务器端口、域名或 Nginx 配置路径不同，可以在安装时覆盖：

```bash
sudo env \
  SERVER_NAME=app.example.com \
  LISTEN=8080 \
  SERVER_NGINX_TARGET=/etc/nginx/conf.d/rongyixing-prod.conf \
  HEALTH_BASE_URL=http://127.0.0.1:8080 \
  ./install-dist.sh
```

常用参数：

| 参数 | 作用 |
| --- | --- |
| `INSTALL_DIR` | 静态文件安装目录 |
| `SERVER_NAME` | Nginx `server_name` |
| `LISTEN` | Nginx 监听端口 |
| `SERVER_NGINX_TARGET` | Nginx 配置文件路径 |
| `BACKEND_DOMAIN_SUFFIX` | 后端域名后缀 |
| `HEALTH_BASE_URL` | 健康检查地址 |
| `INSTALL_NGINX=0` | 只复制静态文件，不安装或 reload Nginx |
| `RUN_HEALTH_CHECK=0` | 跳过安装脚本内的健康检查 |

## 7. 部署验证

在服务器执行：

Test：

```bash
curl -I http://127.0.0.1/h5/
curl -I http://127.0.0.1/web/
```

Prod：

```bash
curl -I http://127.0.0.1:18088/h5/
curl -I http://127.0.0.1:18088/web/
```

正常情况下两个地址都返回 HTTP `200`。

检查根路径跳转：

```bash
curl -I http://127.0.0.1:18088/
```

正常情况下返回 HTTP `302`，并跳转到 `/h5/`。

浏览器验收：

1. 打开 H5 登录页并完成登录。
2. 进入首页。
3. 分别测试酒店、机票、火车票查询。
4. 酒店列表向下滚动，确认第二页能够继续加载。
5. 打开 Web 地址，重复登录和一次产品查询。
6. 线上排查问题时，可以在地址后增加 `?vconsole=1` 临时打开 vConsole。

## 8. 仅更新静态文件

如果 Nginx 配置、端口、域名和代理规则都没有变化，只更新前端版本：

```bash
cd /tmp/rongyixing-h5-web-dist-prod
sudo ./install-static-dist.sh
```

这个命令只更新：

```text
/opt/rongyixing-prod/h5/dist
/opt/rongyixing-prod/web/dist
```

它不会修改 Nginx，也不会 reload Nginx。

## 9. 回滚

部署前保留上一版完整交付包，例如：

```text
/opt/releases/rongyixing-h5-web-dist-prod-previous/
```

回滚静态文件和 Nginx 配置：

```bash
cd /opt/releases/rongyixing-h5-web-dist-prod-previous
sudo ./install-dist.sh
```

只回滚静态文件：

```bash
cd /opt/releases/rongyixing-h5-web-dist-prod-previous
sudo ./install-static-dist.sh
```

回滚后重新执行第 7 节验证。

## 10. 常见问题

### 页面空白或静态资源 404

确认交付包中的目录存在：

```text
h5/dist/index.html
web/dist/index.html
```

确认 Nginx 配置中的 SPA fallback 存在：

```nginx
try_files $uri $uri/ /h5/index.html;
try_files $uri $uri/ /web/index.html;
```

### 登录或业务接口 404 / CORS

确认不能使用只托管静态文件的通用 Nginx 配置。必须安装交付包中的
`install-dist.sh`，使以下路径通过 Nginx 反向代理：

```text
/Home/
/Jyx/
/Identity/
/__ryx/
```

检查并 reload：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 更新后仍显示旧版本

前端静态资源使用带 hash 的文件名，旧资源通常来自浏览器、CDN 或上游
反向代理缓存。先确认 HTML 已更新，再清理上游缓存或执行浏览器强制刷新。

## 11. 交付验收清单

- [ ] 收到的是完整 release 包，而不是单独的 `dist` 目录。
- [ ] `VERSION.txt` 中的环境和版本正确。
- [ ] `install-dist.sh` 执行成功。
- [ ] `nginx -t` 通过。
- [ ] `/h5/` 返回 HTTP 200。
- [ ] `/web/` 返回 HTTP 200。
- [ ] 登录成功。
- [ ] 酒店、机票、火车票至少各查询一次。
- [ ] 酒店列表滚动加载下一页成功。
- [ ] 上一版完整 release 包已保留，可用于回滚。
