#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_ROOT="${OUT_ROOT:-${SCRIPT_DIR}/out}"
REMOTE="${REMOTE:-}"
REMOTE_DIR="${REMOTE_DIR:-/tmp/rongyixing-release}"
DIST_DIR="${DIST_DIR:-}"
BUILD_FIRST="${BUILD_FIRST:-0}"
RSYNC_DELETE="${RSYNC_DELETE:-1}"

log() {
  printf '[ryx-dist-upload] %s\n' "$*"
}

usage() {
  cat <<'EOF'
Usage:
  REMOTE=root@<server-ip> deploy/release/upload-dist-to-server.sh

Environment:
  REMOTE=root@<server-ip>                 SSH target. Required.
  REMOTE_DIR=/tmp/rongyixing-release      Remote directory to receive dist package directory.
  DIST_DIR=deploy/release/out/<dir>       Local package directory. Defaults to latest generated directory.
  BUILD_FIRST=0                           Upload existing local package directory.
  BUILD_FIRST=1                           Build a new uncompressed package directory before upload.
  RSYNC_DELETE=1                          Delete remote files not present locally.
  RSYNC_DELETE=0                          Do not delete extra remote files.

After upload, install on server:
  cd /tmp/rongyixing-release/<package-dir>
  ./install-dist.sh
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -z "${REMOTE}" ]]; then
  log "REMOTE is required, e.g. REMOTE=root@1.2.3.4"
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  log "rsync is not installed or not in PATH"
  exit 1
fi

if [[ "${BUILD_FIRST}" == "1" ]]; then
  log "build uncompressed dist package directory"
  CREATE_ARCHIVE=0 "${SCRIPT_DIR}/build-dist-package.sh"
fi

if [[ -z "${DIST_DIR}" ]]; then
  DIST_DIR="$(find "${OUT_ROOT}" -maxdepth 1 -type d -name 'rongyixing-h5-web-dist-*' | sort | tail -n 1)"
fi

if [[ -z "${DIST_DIR}" || ! -d "${DIST_DIR}" ]]; then
  log "missing local dist package directory: ${DIST_DIR:-<empty>}"
  exit 1
fi

if [[ ! -f "${DIST_DIR}/install-dist.sh" || ! -f "${DIST_DIR}/h5/dist/index.html" || ! -f "${DIST_DIR}/web/dist/index.html" ]]; then
  log "invalid dist package directory: ${DIST_DIR}"
  exit 1
fi

package_name="$(basename "${DIST_DIR}")"
delete_arg=()
if [[ "${RSYNC_DELETE}" == "1" ]]; then
  delete_arg=(--delete)
fi

log "ensure remote directory ${REMOTE}:${REMOTE_DIR}"
ssh "${REMOTE}" "mkdir -p '${REMOTE_DIR}'"

log "upload ${DIST_DIR}/ to ${REMOTE}:${REMOTE_DIR}/${package_name}/"
rsync -az --info=progress2 "${delete_arg[@]}" "${DIST_DIR}/" "${REMOTE}:${REMOTE_DIR}/${package_name}/"

log "done"
log "remote package: ${REMOTE_DIR}/${package_name}"
log "install command: cd ${REMOTE_DIR}/${package_name} && ./install-dist.sh"
