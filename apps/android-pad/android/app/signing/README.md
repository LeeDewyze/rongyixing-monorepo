# Android Release Signing

This directory contains the release signing identity used by the Legacy
`com.ronglvonline.app` Android application and the current Capacitor shell.

## Credentials

- Keystore: `rongtongRelease.keystore`
- Keystore password: `android`
- Alias: `androiddebugkey`
- Private key password: `android`
- SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- SHA-256: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`

## Usage

The Android Gradle project reads `release-signing.properties` automatically.
The standard release script validates this keystore and uses it for every
release APK:

```bash
cd rongyixing-monorepo
./deploy/scripts/build-android-remote-apks.sh
```

The release build type is signed with this keystore. Debug APKs continue to
use the standard Android debug signing configuration.

Do not replace this keystore. A different signing identity cannot upgrade an
APK already installed with the current application ID.
