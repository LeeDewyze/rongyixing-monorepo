#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd -- "$SCRIPT_DIR/../.." && pwd)
ANDROID_DIR="$REPO_ROOT/apps/android-pad/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"

log() {
  printf '[android prod apk] %s\n' "$*"
}

fail() {
  printf '[android prod apk] error: %s\n' "$*" >&2
  exit 1
}

java_major_version() {
  local version
  version=$("$1/bin/java" -version 2>&1 | sed -nE 's/.*version "([0-9]+)(\.[0-9]+)?.*/\1/p' | head -1)
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
      ANDROID_HOME=$candidate
      break
    fi
  done
  export ANDROID_HOME
fi
[[ -d "${ANDROID_HOME:-}" ]] || fail "未找到 Android SDK，请设置 ANDROID_HOME"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

# Capacitor 8 requires Node 22+. Prefer an already installed modern Node.
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
    if [[ -x "$candidate/node" ]] && [[ "$("$candidate/node" -p 'Number(process.versions.node.split(".")[0])')" -ge 22 ]]; then
      NODE_BIN_DIR="$candidate"
      break
    fi
  done
fi
[[ -n "$NODE_BIN_DIR" ]] || fail "未找到 Node 22+，请设置 RYX_NODE_BIN"

export PATH="$NODE_BIN_DIR:/usr/local/bin:/opt/homebrew/bin:$PATH"
command -v pnpm >/dev/null 2>&1 || fail "未找到 pnpm"

# Old shell environments may inject a Java 8-only option and break Gradle 8+.
unset JAVA_OPTS
unset GRADLE_OPTS

cd "$REPO_ROOT"
log "使用 JDK: $JAVA_HOME"
log "使用 Android SDK: $ANDROID_HOME"
log "使用 Node: $(node --version)"
log "构建生产 API 配置的 Web 资源并同步 Android 工程"
pnpm native:android:apk

[[ -f "$APK_PATH" ]] || fail "APK 构建完成但未找到产物: $APK_PATH"
log "构建完成: $APK_PATH"
log "文件大小: $(du -h "$APK_PATH" | awk '{print $1}')"
log "SHA-256: $(shasum -a 256 "$APK_PATH" | awk '{print $1}')"
