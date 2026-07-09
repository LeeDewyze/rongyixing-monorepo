# RongYiXing Android Pad

Capacitor shell for `@ryx/web`.

```bash
pnpm native:android:init
pnpm native:android:sync
pnpm native:android:open
```

Remote shell:

```bash
RYX_PAD_SERVER_URL=https://<domain>/web/ pnpm native:android:sync
```

Without `RYX_PAD_SERVER_URL`, Capacitor loads the bundled `web-dist`.

Dev server shell:

```bash
VITE_FORCE_API_MODE=proxy VITE_API_MODE=proxy pnpm --filter @ryx/web dev -- --host 0.0.0.0
RYX_PAD_SERVER_URL=http://<computer-lan-ip>:5174 pnpm --filter @ryx/android-pad exec capacitor sync android
```
