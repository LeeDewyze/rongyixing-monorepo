#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUT_ROOT="${OUT_ROOT:-${SCRIPT_DIR}/out}"
PACKAGE_NAME="${PACKAGE_NAME:-rongyixing-h5-web-dist}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d%H%M%S)}"
PACKAGE_DIR="${OUT_ROOT}/${PACKAGE_NAME}-${TIMESTAMP}"
ARCHIVE_PATH="${PACKAGE_DIR}.tar.gz"
CREATE_ARCHIVE="${CREATE_ARCHIVE:-1}"

log() {
  printf '[ryx-dist-package] %s\n' "$*"
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  deploy/release/build-dist-package.sh

Environment:
  OUT_ROOT=deploy/release/out              Output directory for generated package.
  PACKAGE_NAME=rongyixing-h5-web-dist      Package name prefix.
  TIMESTAMP=YYYYmmddHHMMSS                 Optional fixed package timestamp.
  VITE_H5_BASE_PATH=/h5/                   H5 public base path.
  VITE_WEB_BASE_PATH=/web/                 Web public base path.
  CREATE_ARCHIVE=1                         Create tar.gz archive after directory package.
  CREATE_ARCHIVE=0                         Only create the uploadable package directory.
EOF
  exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  log "pnpm is not installed or not in PATH"
  exit 1
fi

cd "${ROOT_DIR}"

H5_BASE_PATH="${VITE_H5_BASE_PATH:-/h5/}"
WEB_BASE_PATH="${VITE_WEB_BASE_PATH:-/web/}"

log "build workspace packages"
pnpm build:workspace

log "build H5 with VITE_BASE_PATH=${H5_BASE_PATH}"
VITE_BASE_PATH="${H5_BASE_PATH}" pnpm --filter @ryx/h5 build

log "build Web with VITE_BASE_PATH=${WEB_BASE_PATH}"
VITE_BASE_PATH="${WEB_BASE_PATH}" pnpm --filter @ryx/web build

log "prepare package directory ${PACKAGE_DIR}"
rm -rf "${PACKAGE_DIR}" "${ARCHIVE_PATH}"
mkdir -p "${PACKAGE_DIR}/h5" "${PACKAGE_DIR}/web" "${PACKAGE_DIR}/nginx"

cp -a "${ROOT_DIR}/apps/h5/dist" "${PACKAGE_DIR}/h5/dist"
cp -a "${ROOT_DIR}/apps/web/dist" "${PACKAGE_DIR}/web/dist"
cp "${SCRIPT_DIR}/install-dist.sh" "${PACKAGE_DIR}/install-dist.sh"
cp "${SCRIPT_DIR}/README.md" "${PACKAGE_DIR}/README.md"
cp "${SCRIPT_DIR}/nginx/rongyixing-dist.conf.template" "${PACKAGE_DIR}/nginx/rongyixing-dist.conf.template"
chmod +x "${PACKAGE_DIR}/install-dist.sh"

cat >"${PACKAGE_DIR}/VERSION.txt" <<EOF
name=${PACKAGE_NAME}
build_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
git_commit=$(git rev-parse HEAD 2>/dev/null || true)
git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
h5_base_path=${H5_BASE_PATH}
web_base_path=${WEB_BASE_PATH}
EOF

if [[ "${CREATE_ARCHIVE}" == "1" ]]; then
  log "create archive ${ARCHIVE_PATH}"
  tar -C "${OUT_ROOT}" -czf "${ARCHIVE_PATH}" "$(basename "${PACKAGE_DIR}")"
fi

log "done"
log "package directory: ${PACKAGE_DIR}"
if [[ "${CREATE_ARCHIVE}" == "1" ]]; then
  log "archive: ${ARCHIVE_PATH}"
fi
