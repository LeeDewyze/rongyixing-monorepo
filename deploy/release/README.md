# H5/Web Dist 交付部署

这个目录用于生成和安装只包含构建产物的交付包。交付包包含：

- `h5/dist`：H5 静态资源
- `web/dist`：Pad/PC Web 静态资源
- `install-dist.sh`：服务器安装脚本
- `nginx/rongyixing-dist.conf.template`：Nginx 配置模板

交付包不包含 `apps/`、`packages/` 等源码目录。

## 生成交付包

在开发机仓库根目录执行：

```bash
deploy/release/build-dist-package.sh
```

脚本会按固定前缀构建：

```text
H5  -> /h5/
Web -> /web/
```

产物位置：

```text
deploy/release/out/rongyixing-h5-web-dist-<timestamp>.tar.gz
```

如需调整前缀，可以在构建时指定：

```bash
VITE_H5_BASE_PATH=/h5/ VITE_WEB_BASE_PATH=/web/ deploy/release/build-dist-package.sh
```

## 服务器安装

把 tar.gz 上传到服务器后执行：

```bash
tar -xzf rongyixing-h5-web-dist-<timestamp>.tar.gz
cd rongyixing-h5-web-dist-<timestamp>
./install-dist.sh
```

默认行为：

```text
静态文件安装目录：/opt/rongyixing
Nginx 配置文件：  /etc/nginx/conf.d/rongyixing-dist.conf
监听端口：        80
server_name：     _
```

访问地址：

```text
http://<server-ip>/      -> 默认跳转到 /h5/，并保留 ticket 等查询参数
http://<server-ip>/h5/
http://<server-ip>/web/
```

单点登录带 ticket：

```text
http://<server-ip>/h5/?ticket=xxxx
http://<server-ip>/web/?ticket=xxxx
```

## 常用变量

```bash
INSTALL_DIR=/data/rongyixing \
SERVER_NAME=192.168.1.10 \
LISTEN=80 \
./install-dist.sh
```

只安装静态文件，不改 Nginx：

```bash
INSTALL_NGINX=0 ./install-dist.sh
```

安装到当前用户有权限的临时目录时，可以关闭 sudo：

```bash
USE_SUDO=0 INSTALL_NGINX=0 INSTALL_DIR=/tmp/rongyixing ./install-dist.sh
```

如果健康检查需要访问公网 IP 或域名：

```bash
HEALTH_BASE_URL=http://192.168.1.10 ./install-dist.sh
```

## Nginx 说明

模板会同时处理三类路由：

- `/h5/`、`/web/`：静态资源和 SPA history fallback
- `/Home/`、`/Jyx/`、`/Identity/`：legacy 网关/身份/融旅功能入口
- `/__ryx/<UrlKey>/`：TMC、登录、会员、HR、流程、因私订单等接口的同源反向代理

如果客户环境的后端域名不同，需要调整 `nginx/rongyixing-dist.conf.template` 里的 `proxy_pass` 目标后再执行安装。
