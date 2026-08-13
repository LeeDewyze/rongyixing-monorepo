# RongYiXing Business Same-Origin H5 test Build 20260813113946

这个包用于交付业务方部署到 legacy 同源站点。

部署方式：

```text
把本目录下的 rl/ 整个目录内容，替换到业务方服务器的 wwwroot/rl。
```

典型访问：

```text
/rl/index.html?wechatopenid=&ticketname=ticket&root=rl&ticket=xxxx
```

运行方式：

- 应用：H5
- 环境：test
- 静态资源 base：/rl/
- API 配置：请求当前访问域名下的 /Home/Setting
- 后续接口：按 /Home/Setting 返回的 Urls 直接访问 legacy 后端服务
- Domain：从当前访问域名推导，也可以由 URL query 的 domain 覆盖

构建信息：

- build_time: 2026-08-13T03:39:51Z
- git_branch: main
- git_commit: 5dc432549b10e6cedcddac5e0cdcff753d7af6f4
