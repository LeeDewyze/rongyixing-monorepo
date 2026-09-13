#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${SOURCE_DIR:-${SCRIPT_DIR}/www}"
INSTALL_DIR="${INSTALL_DIR:-/opt/rongyixing-legacy}"
TARGET_DIR="${INSTALL_DIR}/www"
USE_SUDO="${USE_SUDO:-auto}"

log() {
  printf '[ryx-legacy-install] %s\n' "$*"
}

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  elif [[ "${USE_SUDO}" == "0" || "${USE_SUDO}" == "false" ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  ./install-legacy-www.sh

Environment:
  SOURCE_DIR=/path/to/www       Legacy static package source directory.
  INSTALL_DIR=/opt/rongyixing-legacy
                                Installation root; files go to INSTALL_DIR/www.
  USE_SUDO=auto                  Use sudo when not running as root.
  USE_SUDO=0                     Do not use sudo.

This script only synchronizes static files. It does not change or reload Nginx.
EOF
  exit 0
fi

if [[ -z "${INSTALL_DIR// }" || "${INSTALL_DIR}" == "/" ]]; then
  log "invalid INSTALL_DIR: ${INSTALL_DIR}"
  exit 1
fi

if [[ ! -f "${SOURCE_DIR}/index.html" ]]; then
  log "missing Legacy entry file: ${SOURCE_DIR}/index.html"
  exit 1
fi

if ! grep -q '<base href="/www/">' "${SOURCE_DIR}/index.html"; then
  log "unexpected Legacy base href; expected /www/"
  exit 1
fi

log "synchronize Legacy files"
log "source: ${SOURCE_DIR}"
log "target: ${TARGET_DIR}"
run_sudo install -d "${INSTALL_DIR}"

if command -v rsync >/dev/null 2>&1; then
  run_sudo install -d "${TARGET_DIR}"
  run_sudo rsync -a --delete "${SOURCE_DIR}/" "${TARGET_DIR}/"
else
  log "rsync not found; replace target directory with cp"
  run_sudo rm -rf "${TARGET_DIR}"
  run_sudo cp -a "${SOURCE_DIR}" "${TARGET_DIR}"
fi

log "done"
log "Legacy URL: /www/"
log "Nginx was not changed or reloaded"
