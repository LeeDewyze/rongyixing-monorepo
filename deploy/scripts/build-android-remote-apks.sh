#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/../.." && pwd)
ANDROID_APP_DIR="$REPO_ROOT/apps/android-pad/android/app"
GRADLEW="$REPO_ROOT/apps/android-pad/android/gradlew"
OUTPUT_ROOT="${RYX_ANDROID_APK_OUTPUT_DIR:-$REPO_ROOT/deploy/release/out/android-remote-apks}"
BUILD_STAMP=$(date '+%Y%m%d%H%M%S')
OUTPUT_DIR="$OUTPUT_ROOT/$BUILD_STAMP"
SIGNING_DIR="${RYX_ANDROID_SIGNING_DIR:-$REPO_ROOT/apps/android-pad/android/app/signing}"
SIGNING_PROPERTIES="$SIGNING_DIR/release-signing.properties"
KEYSTORE="$SIGNING_DIR/rongyixing-release.keystore"
KEY_ALIAS="${RYX_ANDROID_KEY_ALIAS:-rongyixing-release}"

TEST_URL="${RYX_ANDROID_TEST_H5_URL:-https://h5.songguoren.site/}"
PROD_URL="${RYX_ANDROID_PROD_H5_URL:-https://app.rongtrip.cn/}"

log() {
  printf '[android remote apks] %s\n' "$*"
}

fail() {
  printf '[android remote apks] error: %s\n' "$*" >&2
  exit 1
}

ensure_release_signing() {
  mkdir -p "$SIGNING_DIR"
  chmod 700 "$SIGNING_DIR"

  if [[ ! -f "$KEYSTORE" ]]; then
    command -v keytool >/dev/null 2>&1 || fail "未找到 keytool，无法生成 release 签名文件"
    local store_password key_password
    store_password="${RYX_ANDROID_KEYSTORE_PASSWORD:-$(openssl rand -hex 24)}"
    key_password="${RYX_ANDROID_KEY_PASSWORD:-$store_password}"
    log "首次生成 Android release 签名文件: $KEYSTORE"
    keytool -genkeypair \
      -alias "$KEY_ALIAS" \
      -keyalg RSA \
      -keysize 4096 \
      -validity 10000 \
      -keystore "$KEYSTORE" \
      -storepass "$store_password" \
      -keypass "$key_password" \
      -dname "CN=RongYiXing, OU=RongYiXing, O=RongYiXing, L=Beijing, ST=Beijing, C=CN" \
      >/dev/null
    umask 077
    printf 'storeFile=signing/rongyixing-release.keystore\nstorePassword=%s\nkeyAlias=%s\nkeyPassword=%s\n' \
      "$store_password" "$KEY_ALIAS" "$key_password" > "$SIGNING_PROPERTIES"
    chmod 600 "$KEYSTORE" "$SIGNING_PROPERTIES"
  elif [[ ! -f "$SIGNING_PROPERTIES" ]]; then
    fail "已有 keystore 但缺少签名配置: $SIGNING_PROPERTIES；不能安全猜测密码"
  fi

  [[ -r "$SIGNING_PROPERTIES" ]] || fail "签名配置不可读: $SIGNING_PROPERTIES"
  export RYX_ANDROID_SIGNING_PROPERTIES="$SIGNING_PROPERTIES"
  log "使用 release 签名文件: $KEYSTORE"
}

java_major_version() {
  local version
  version=$($(printf '%q' "$1/bin/java") -version 2>&1 | sed -nE 's/.*version "([0-9]+)(\.[0-9]+)?.*/\1/p' | head -1)
  if [[ "$version" == "1" ]]; then
    "$1/bin/java" -version 2>&1 | sed -nE 's/.*version "1\.([0-9]+).*/\1/p' | head -1
  else
    printf '%s\n' "${version:-0}"
  fi
}

if [[ -z "${JAVA_HOME:-}" || "$(java_major_version "${JAVA_HOME:-}")" -lt 17 ]]; then
  JAVA_HOME=""
  for candidate in \
    "$HOME/Library/Java/JavaVirtualMachines"/*/Contents/Home \
    "/Library/Java/JavaVirtualMachines"/*/Contents/Home \
    "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" \
    "/opt/homebrew/Cellar/openjdk@21"/*/libexec/openjdk.jdk/Contents/Home; do
    if [[ -x "$candidate/bin/java" ]] && [[ "$(java_major_version "$candidate")" -ge 17 ]]; then
      JAVA_HOME="$candidate"
      break
    fi
  done
  export JAVA_HOME
fi
[[ -x "${JAVA_HOME:-}/bin/java" ]] || fail "未找到 JDK 17+，请设置 JAVA_HOME"

if [[ -z "${ANDROID_HOME:-}" ]]; then
  for candidate in "$HOME/Library/Android/sdk" "${ANDROID_SDK_ROOT:-}"; do
    if [[ -d "$candidate" ]]; then
      ANDROID_HOME="$candidate"
      break
    fi
  done
  export ANDROID_HOME
fi
[[ -d "${ANDROID_HOME:-}" ]] || fail "未找到 Android SDK，请设置 ANDROID_HOME"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

NODE_BIN_DIR=""
if [[ -n "${RYX_NODE_BIN:-}" && -x "$RYX_NODE_BIN/node" ]]; then
  NODE_BIN_DIR="$RYX_NODE_BIN"
elif command -v node >/dev/null 2>&1 && [[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 22 ]]; then
  NODE_BIN_DIR=$(dirname "$(command -v node)")
else
  for candidate in \
    "/opt/homebrew/bin" \
    "/usr/local/bin" \
    "$HOME/.nvm/versions/node"/*/bin \
    "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"; do
    if [[ -x "$candidate/node" ]] && [[ "$($candidate/node -p 'Number(process.versions.node.split(".")[0])')" -ge 22 ]]; then
      NODE_BIN_DIR="$candidate"
      break
    fi
  done
fi
[[ -n "$NODE_BIN_DIR" ]] || fail "未找到 Node 22+，请设置 RYX_NODE_BIN"

export PATH="$NODE_BIN_DIR:/usr/local/bin:/opt/homebrew/bin:$PATH"
command -v pnpm >/dev/null 2>&1 || fail "未找到 pnpm"
[[ -x "$GRADLEW" ]] || fail "未找到 Gradle wrapper: $GRADLEW"

unset JAVA_OPTS
unset GRADLE_OPTS

cd "$REPO_ROOT"
mkdir -p "$OUTPUT_DIR"

log "使用 JDK: $JAVA_HOME"
log "使用 Android SDK: $ANDROID_HOME"
log "使用 Node: $(node --version)"
log "测试 H5: $TEST_URL"
log "生产 H5: $PROD_URL"
log "输出目录: $OUTPUT_DIR"
ensure_release_signing

build_variant() {
  local env_name="$1"
  local h5_url="$2"
  local gradle_task="$3"
  local apk_source="$4"
  local apk_name="$5"

  log "sync $env_name -> $h5_url"
  RYX_PAD_SERVER_URL="$h5_url" pnpm --filter @ryx/android-pad exec capacitor sync android

  log "build $env_name ${gradle_task}"
  (
    cd "$REPO_ROOT/apps/android-pad/android"
    ./gradlew "$gradle_task"
  )

  [[ -f "$ANDROID_APP_DIR/build/outputs/apk/$apk_source" ]] || \
    fail "未找到 APK: $ANDROID_APP_DIR/build/outputs/apk/$apk_source"
  cp "$ANDROID_APP_DIR/build/outputs/apk/$apk_source" "$OUTPUT_DIR/$apk_name"
}

build_variant "test" "$TEST_URL" "assembleDebug" "debug/app-debug.apk" "rongyixing-test-debug.apk"
build_variant "test" "$TEST_URL" "assembleRelease" "release/app-release.apk" "rongyixing-test-release.apk"
build_variant "prod" "$PROD_URL" "assembleDebug" "debug/app-debug.apk" "rongyixing-prod-debug.apk"
build_variant "prod" "$PROD_URL" "assembleRelease" "release/app-release.apk" "rongyixing-prod-release.apk"

log "构建完成"
for apk in "$OUTPUT_DIR"/*.apk; do
  log "$(basename "$apk") $(du -h "$apk" | awk '{print $1}') sha256=$(shasum -a 256 "$apk" | awk '{print $1}')"
done
log "四个 APK: $OUTPUT_DIR"
