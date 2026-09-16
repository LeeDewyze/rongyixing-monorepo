# RongYiXing Android

Capacitor shell for `@ryx/h5`.

The Android phone app supports Android 10 / API level 29 and above and is
locked to portrait orientation.

Android keeps a native branded splash for the process startup handoff. The
Capacitor runtime skips the H5 `SplashPage` and immediately routes to the home
or login page after the WebView is ready. Normal browser visits still show the
H5 splash.

The shell keeps the remote H5 at a fixed 100% text scale and disables legacy
WebView auto-zoom. The H5 production build also emits compatibility fallbacks
for older Android WebViews such as Chrome 83; the APK remains a container and
does not maintain a second copy of the business UI.

```bash
pnpm native:android:init
pnpm native:android:sync
pnpm native:android:open
```

Remote Android shell:

```bash
RYX_ANDROID_SERVER_URL=https://<domain>/ pnpm native:android:sync
```

Without `RYX_ANDROID_SERVER_URL`, Capacitor loads the bundled H5 `web-dist`.

The default production APK opens the final `/www/index.html` entry directly
instead of relying on the production domain root redirect. The remote H5
still needs to be deployed separately; the APK remains a WebView shell.

Dev server shell:

```bash
VITE_FORCE_API_MODE=proxy VITE_API_MODE=proxy pnpm --filter @ryx/h5 dev -- --host 0.0.0.0
RYX_ANDROID_SERVER_URL=http://<computer-lan-ip>:5173 pnpm --filter @ryx/android-pad exec capacitor sync android
```

Build four remote-H5 APKs:

```bash
./deploy/scripts/build-android-remote-apks.sh
```

The reusable release keystore and `release-signing.properties` are stored under
`apps/android-pad/android/app/signing/` so all developers in this private repository use
the same release identity. Keep this directory restricted; changing the keystore prevents
upgrades of already-installed release APKs.
```
