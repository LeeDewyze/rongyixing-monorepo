#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="${PACKAGE_DIR:-${SCRIPT_DIR}}"
VERSION_FILE="${PACKAGE_DIR}/VERSION.txt"
INSTALL_DIR="${INSTALL_DIR:-}"
USE_SUDO="${USE_SUDO:-auto}"

log() {
  printf '[ryx-static-install] %s\n' "$*"
}

read_version_value() {
  local key="$1"
  if [[ ! -f "${VERSION_FILE}" ]]; then
    return 0
  fi
  sed -n "s/^${key}=//p" "${VERSION_FILE}" | head -n1
}

detect_deploy_env() {
  if [[ -n "${DEPLOY_ENV:-}" ]]; then
    printf '%s' "${DEPLOY_ENV}"
    return 0
  fi

  local from_version from_dir
  from_version="$(read_version_value deploy_env)"
  if [[ "${from_version}" == "test" || "${from_version}" == "prod" ]]; then
    printf '%s' "${from_version}"
    return 0
  fi

  from_dir="$(basename "${PACKAGE_DIR}")"
  case "${from_dir}" in
    *-prod) printf 'prod' ;;
    *-test) printf 'test' ;;
    *) printf 'test' ;;
  esac
}

DEPLOY_ENV="$(detect_deploy_env)"

case "${DEPLOY_ENV}" in
  test)
    DEFAULT_INSTALL_DIR="/opt/rongyixing-test"
    ;;
  prod)
    DEFAULT_INSTALL_DIR="/opt/rongyixing-prod"
    ;;
  *)
    log "unsupported DEPLOY_ENV: ${DEPLOY_ENV}"
    exit 1
    ;;
esac

INSTALL_DIR="${INSTALL_DIR:-${DEFAULT_INSTALL_DIR}}"

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  elif [[ "${USE_SUDO}" == "0" || "${USE_SUDO}" == "false" ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

if [[ -z "${INSTALL_DIR// }" || "${INSTALL_DIR}" == "/" ]]; then
  log "invalid INSTALL_DIR: ${INSTALL_DIR}"
  exit 1
fi

H5_DIST_SOURCE="${PACKAGE_DIR}/h5/dist"
WEB_DIST_SOURCE="${PACKAGE_DIR}/web/dist"

if [[ ! -f "${H5_DIST_SOURCE}/index.html" ]]; then
  log "missing H5 dist: ${H5_DIST_SOURCE}/index.html"
  exit 1
fi

if [[ ! -f "${WEB_DIST_SOURCE}/index.html" ]]; then
  log "missing Web dist: ${WEB_DIST_SOURCE}/index.html"
  exit 1
fi

log "install static files to ${INSTALL_DIR}"
run_sudo install -d "${INSTALL_DIR}/h5" "${INSTALL_DIR}/web"

sync_dist_dir() {
  local source_dir="$1"
  local target_dir="$2"

  log "clean ${target_dir}"
  run_sudo rm -rf "${target_dir}"

  if command -v rsync >/dev/null 2>&1; then
    run_sudo install -d "${target_dir}"
    run_sudo rsync -a --delete "${source_dir}/" "${target_dir}/"
  else
    run_sudo install -d "$(dirname "${target_dir}")"
    run_sudo cp -a "${source_dir}" "${target_dir}"
  fi
}

sync_dist_dir "${H5_DIST_SOURCE}" "${INSTALL_DIR}/h5/dist"
sync_dist_dir "${WEB_DIST_SOURCE}" "${INSTALL_DIR}/web/dist"

log "done"
log "deploy env: ${DEPLOY_ENV}"
log "H5: ${INSTALL_DIR}/h5/dist"
log "Web: ${INSTALL_DIR}/web/dist"
