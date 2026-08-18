# RongYiXing Business Same-Origin H5 prod Build 20260819003417

这个包用于交付业务方部署到 legacy 同源站点。

部署方式：

```text
把本目录下的 www/ 整个目录内容，替换到业务方服务器的 wwwroot/www。
```

典型访问：

```text
/www/index.html?wechatopenid=&ticketname=ticket&root=www&ticket=xxxx
```

运行方式：

- 应用：H5
- 环境：prod
- 静态资源 base：/www/
- API 配置：请求当前访问域名下的 /Home/Setting
- 后续接口：按 /Home/Setting 返回的 Urls 直接访问 legacy 后端服务
- Request root：www
- Domain：从当前访问域名推导，也可以由 URL query 的 domain 覆盖
- vConsole：true
- vConsole 默认启动：false
- vConsole 开启方式：设置页点击版本号 5 次（2 秒内）

构建信息：

- build_time: 2026-08-18T16:34:36Z
- git_branch: main
- git_commit: e719b0f1b9040d4af2ca5188c61e89be9be49d95
