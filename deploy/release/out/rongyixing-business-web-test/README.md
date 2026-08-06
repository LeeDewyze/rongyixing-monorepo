# RongYiXing Business Same-Origin WEB test Build 20260806103159

这个包用于交付业务方部署到 legacy 同源站点。

部署方式：

```text
把本目录下的 web/ 整个目录内容，替换到业务方服务器的 wwwroot/web。
```

典型访问：

```text
/web/index.html?wechatopenid=&ticketname=ticket&root=web&ticket=xxxx
```

运行方式：

- 应用：WEB
- 环境：test
- 静态资源 base：/web/
- API 配置：请求当前访问域名下的 /Home/Setting
- 后续接口：按 /Home/Setting 返回的 Urls 直接访问 legacy 后端服务
- Domain：从当前访问域名推导，也可以由 URL query 的 domain 覆盖

构建信息：

- build_time: 2026-08-06T02:32:10Z
- git_branch: main
- git_commit: 219c9b1228e2eda7364558fcea9b03b4ac402881
