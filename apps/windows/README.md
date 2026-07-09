# RongYiXing Windows

Electron shell for `@ryx/web`.

Development:

```bash
pnpm dev:web
pnpm native:windows:dev
```

Remote shell package:

```bash
RYX_WINDOWS_SERVER_URL=https://<domain>/web/ pnpm native:windows:dist
```

Without `RYX_WINDOWS_SERVER_URL`, Electron loads bundled `web-dist` through `ryx://app/`.

