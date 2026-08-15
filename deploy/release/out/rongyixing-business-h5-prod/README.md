# RongYiXing Business Same-Origin H5 prod Build 20260815125730

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
- vConsole：false

构建信息：

- build_time: 2026-08-15T04:57:49Z
- git_branch: main
- git_commit: 8c7a29d454cdd64fa9929ab4c219a0c7d9aa167a
