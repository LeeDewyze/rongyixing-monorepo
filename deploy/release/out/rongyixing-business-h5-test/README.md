# RongYiXing Business Same-Origin H5 test Build 20260822135320

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
- Request root：rl
- Domain：从当前访问域名推导，也可以由 URL query 的 domain 覆盖
- vConsole：true
- vConsole 默认启动：false
- vConsole 开启方式：设置页点击版本号 5 次（2 秒内）

构建信息：

- build_time: 2026-08-22T05:53:27Z
- git_branch: main
- git_commit: dae4e6087f02d9d68a747084dcdc4dc1dfb4f6ad
