# H5/Web Dist 交付部署

这个目录用于生成只包含构建产物的交付包。生成后的交付包包含：

- `h5/dist`：H5 静态资源
- `web/dist`：Pad/PC Web 静态资源
- `install-dist.sh`：服务器安装脚本
- `nginx/rongyixing-dist.conf.template`：Nginx 配置模板

交付包不包含 `apps/`、`packages/` 等源码目录。
源码侧安装脚本模板位于 `templates/install-dist.sh`，不要在 `deploy/release`
根目录执行安装。

## 生成交付包

在开发机仓库根目录执行：

```bash
deploy/release/build-dist-package.sh
```

默认同时构建测试和生产两套环境，产物会写入固定目录：

```text
deploy/release/out/rongyixing-h5-web-dist-test/
deploy/release/out/rongyixing-h5-web-dist-prod/
```

默认会同时生成测试和生产两套包。如果只想构建其中一套：

```bash
DEPLOY_ENV=test deploy/release/build-dist-package.sh
DEPLOY_ENV=prod deploy/release/build-dist-package.sh
```

目录路径固定不带日期。每次构建会重建目标目录，并在目录内生成
`README-<timestamp>.md` 和 `VERSION.txt` 记录本次构建信息。

如需调整前缀，可以在构建时指定：

```bash
VITE_H5_BASE_PATH=/h5/ VITE_WEB_BASE_PATH=/web/ deploy/release/build-dist-package.sh
```

默认只生成可直接提交或上传的目录，不生成压缩包：

```bash
CREATE_ARCHIVE=0 deploy/release/build-dist-package.sh
```

如果确实需要压缩包，可以显式指定：

```bash
CREATE_ARCHIVE=1 deploy/release/build-dist-package.sh
```

## 服务器安装

安装脚本会根据包里的 `VERSION.txt` 自动识别 `test` 或 `prod`。
如果构建目录已经提交到 GitHub，服务器拉取代码后执行包内的：

```bash
cd deploy/release/out/rongyixing-h5-web-dist-test
./install-dist.sh
```

测试环境默认使用：

```text
安装目录：/opt/rongyixing-test
Nginx 文件：/etc/nginx/conf.d/rongyixing-test.conf
端口：80
后端域名：rtesp.com
```

生产环境默认使用：

```text
安装目录：/opt/rongyixing-prod
Nginx 文件：/etc/nginx/conf.d/rongyixing-prod.conf
端口：18088
后端域名：rongtrip.cn
```

如果要在同一台机器同时放两套环境，直接分别执行两次：

```bash
cd deploy/release/out/rongyixing-h5-web-dist-test
./install-dist.sh

cd deploy/release/out/rongyixing-h5-web-dist-prod
./install-dist.sh
```

如果要临时覆盖安装参数，也可以显式传参：

```bash
DEPLOY_ENV=test \
INSTALL_DIR=/opt/rongyixing-test \
SERVER_NGINX_TARGET=/etc/nginx/conf.d/rongyixing-test.conf \
LISTEN=80 \
./install-dist.sh
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

如果客户环境的后端域名不同，可以通过 `BACKEND_DOMAIN_SUFFIX` 覆盖；
如果差异不是单纯的域名后缀替换，再直接改 `nginx/rongyixing-dist.conf.template`。
