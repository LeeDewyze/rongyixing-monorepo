#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  deploy/scripts/build-release.sh [option]

Options:
  --all              Build all business and internal packages (default)
  --business-only    Build only customer business H5/Web packages
  --internal-only    Build only internal nginx validation packages
  --archive          Also create tar.gz archives
  -h, --help         Show this help

Examples:
  deploy/scripts/build-release.sh
  deploy/scripts/build-release.sh --business-only
  deploy/scripts/build-release.sh --internal-only
  deploy/scripts/build-release.sh --all --archive
EOF
}

log() {
  printf '[ryx-build-release] %s\n' "$*"
}

find_node_bin() {
  local candidate major

  if [[ -n "${RYX_NODE_BIN:-}" && -x "${RYX_NODE_BIN}/node" ]]; then
    major="$("${RYX_NODE_BIN}/node" -p 'Number(process.versions.node.split(".")[0])')"
    if (( major >= 24 )); then
      printf '%s' "${RYX_NODE_BIN}"
      return
    fi
  fi

  for candidate in \
    "${HOME}/.nvm/versions/node/v24.11.1/bin" \
    "${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"; do
    if [[ -x "${candidate}/node" ]] && (( "$("${candidate}/node" -p 'Number(process.versions.node.split(".")[0])')" >= 24 )); then
      printf '%s' "${candidate}"
      return
    fi
  done

  if command -v node >/dev/null 2>&1; then
    major="$(node -p 'Number(process.versions.node.split(".")[0])')"
    if (( major >= 24 )); then
      dirname "$(command -v node)"
      return
    fi
  fi

  for candidate in "${HOME}"/.nvm/versions/node/*/bin; do
    [[ -x "${candidate}/node" ]] || continue
    major="$(${candidate}/node -p 'Number(process.versions.node.split(".")[0])')"
    if (( major >= 24 )); then
      printf '%s' "${candidate}"
      return
    fi
  done

  log "Node.js >= 24 is required for release builds; set RYX_NODE_BIN to override"
  exit 1
}

mode="all"
create_archive=0

for arg in "$@"; do
  case "${arg}" in
    --all)
      mode="all"
      ;;
    --business-only)
      mode="business"
      ;;
    --internal-only)
      mode="internal"
      ;;
    --archive)
      create_archive=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log "unknown option: ${arg}"
      usage >&2
      exit 2
      ;;
  esac
done

NODE_BIN="$(find_node_bin)"
export PATH="${NODE_BIN}:${PATH}"

if ! command -v pnpm >/dev/null 2>&1; then
  log "pnpm is not installed or not in PATH"
  exit 1
fi

cd "${ROOT_DIR}"
start_time="$(date +%s)"
log "using Node $(node --version), pnpm $(pnpm --version)"

case "${mode}" in
  all)
    log "building all release packages"
    CREATE_ARCHIVE="${create_archive}" pnpm release:all
    ;;
  business)
    log "building business release packages only"
    BUILD_INTERNAL=0 CREATE_ARCHIVE="${create_archive}" pnpm release:all
    ;;
  internal)
    log "building internal release packages only"
    BUILD_BUSINESS_WWW=0 CREATE_ARCHIVE="${create_archive}" pnpm release:all
    ;;
esac

elapsed=$(( $(date +%s) - start_time ))
log "done in ${elapsed}s"
