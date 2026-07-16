#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="${PACKAGE_DIR:-${SCRIPT_DIR}}"
VERSION_FILE="${PACKAGE_DIR}/VERSION.txt"
INSTALL_NGINX="${INSTALL_NGINX:-1}"
SERVER_NAME="${SERVER_NAME:-_}"
RUN_HEALTH_CHECK="${RUN_HEALTH_CHECK:-1}"
TEMPLATE_PATH="${TEMPLATE_PATH:-${PACKAGE_DIR}/nginx/rongyixing-dist.conf.template}"
USE_SUDO="${USE_SUDO:-auto}"

log() {
  printf '[ryx-dist-install] %s\n' "$*"
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
    DEFAULT_SERVER_NGINX_TARGET="/etc/nginx/conf.d/rongyixing-test.conf"
    DEFAULT_LISTEN="80"
    DEFAULT_BACKEND_DOMAIN_SUFFIX="rtesp.com"
    ;;
  prod)
    DEFAULT_INSTALL_DIR="/opt/rongyixing-prod"
    DEFAULT_SERVER_NGINX_TARGET="/etc/nginx/conf.d/rongyixing-prod.conf"
    DEFAULT_LISTEN="18088"
    DEFAULT_BACKEND_DOMAIN_SUFFIX="rongtrip.cn"
    ;;
  *)
    log "unsupported DEPLOY_ENV: ${DEPLOY_ENV}"
    exit 1
    ;;
esac

INSTALL_DIR="${INSTALL_DIR:-${DEFAULT_INSTALL_DIR}}"
SERVER_NGINX_TARGET="${SERVER_NGINX_TARGET:-${DEFAULT_SERVER_NGINX_TARGET}}"
LISTEN="${LISTEN:-${DEFAULT_LISTEN}}"
BACKEND_DOMAIN_SUFFIX="${BACKEND_DOMAIN_SUFFIX:-${DEFAULT_BACKEND_DOMAIN_SUFFIX}}"
HEALTH_BASE_URL="${HEALTH_BASE_URL:-http://127.0.0.1:${LISTEN}}"

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  elif [[ "${USE_SUDO}" == "0" || "${USE_SUDO}" == "false" ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

escape_sed_replacement() {
  printf '%s' "$1" | sed 's/[\/&]/\\&/g'
}

render_template() {
  local target="$1"
  local escaped_install_dir escaped_server_name escaped_listen escaped_domain_suffix
  escaped_install_dir="$(escape_sed_replacement "${INSTALL_DIR}")"
  escaped_server_name="$(escape_sed_replacement "${SERVER_NAME}")"
  escaped_listen="$(escape_sed_replacement "${LISTEN}")"
  escaped_domain_suffix="$(escape_sed_replacement "${BACKEND_DOMAIN_SUFFIX}")"

  sed \
    -e "s/__RYX_INSTALL_DIR__/${escaped_install_dir}/g" \
    -e "s/__RYX_SERVER_NAME__/${escaped_server_name}/g" \
    -e "s/__RYX_LISTEN__/${escaped_listen}/g" \
    -e "s/rtesp\\.com/${escaped_domain_suffix}/g" \
    "${TEMPLATE_PATH}" >"${target}"
}

health_check() {
  local url="$1"
  local label="$2"
  log "health check ${url}"
  for attempt in $(seq 1 20); do
    if curl --fail --silent --show-error --head "${url}" >/dev/null; then
      return 0
    fi
    log "${label} health check attempt ${attempt}/20 failed; retrying"
    sleep 1
  done
  log "${label} health check failed"
  exit 1
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  ./install-dist.sh

Environment:
  DEPLOY_ENV=test|prod                                Deployment target inferred from VERSION.txt or package name.
  INSTALL_DIR=/opt/rongyixing                         Directory to install static dist files.
  INSTALL_NGINX=1                                     Install and reload Nginx config.
  INSTALL_NGINX=0                                     Only install static files.
  SERVER_NGINX_TARGET=/etc/nginx/conf.d/rongyixing-dist.conf
  SERVER_NAME=_                                       Nginx server_name, e.g. IP or domain.
  LISTEN=80                                           Nginx listen value.
  BACKEND_DOMAIN_SUFFIX=rtesp.com                     Backend domain suffix rendered into Nginx upstreams.
  RUN_HEALTH_CHECK=1                                  Check /h5/ and /web/ after reload.
  HEALTH_BASE_URL=http://127.0.0.1                    Health check base URL.
  USE_SUDO=auto                                       Use sudo when not running as root.
  USE_SUDO=0                                          Do not use sudo; useful for writable test dirs.
EOF
  exit 0
fi

H5_DIST_SOURCE="${PACKAGE_DIR}/h5/dist"
WEB_DIST_SOURCE="${PACKAGE_DIR}/web/dist"

if [[ -z "${INSTALL_DIR// }" || "${INSTALL_DIR}" == "/" ]]; then
  log "invalid INSTALL_DIR: ${INSTALL_DIR}"
  exit 1
fi

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
run_sudo rm -rf "${INSTALL_DIR}/h5/dist" "${INSTALL_DIR}/web/dist"
run_sudo cp -a "${H5_DIST_SOURCE}" "${INSTALL_DIR}/h5/dist"
run_sudo cp -a "${WEB_DIST_SOURCE}" "${INSTALL_DIR}/web/dist"

if [[ "${INSTALL_NGINX}" == "1" ]]; then
  if [[ ! -f "${TEMPLATE_PATH}" ]]; then
    log "missing Nginx template: ${TEMPLATE_PATH}"
    exit 1
  fi

  if ! command -v nginx >/dev/null 2>&1; then
    log "nginx is not installed or not in PATH"
    exit 1
  fi

  tmp_conf="$(mktemp)"
  trap 'rm -f "${tmp_conf:-}"' EXIT
  render_template "${tmp_conf}"

  log "install Nginx config to ${SERVER_NGINX_TARGET}"
  run_sudo install -m 0644 "${tmp_conf}" "${SERVER_NGINX_TARGET}"

  log "validate Nginx config"
  run_sudo nginx -t

  log "reload Nginx"
  if command -v systemctl >/dev/null 2>&1; then
    if ! run_sudo systemctl reload nginx; then
      if ! run_sudo nginx -s reload; then
        log "reload failed; start Nginx"
        run_sudo nginx
      fi
    fi
  else
    if ! run_sudo nginx -s reload; then
      log "reload failed; start Nginx"
      run_sudo nginx
    fi
  fi

  if [[ "${RUN_HEALTH_CHECK}" == "1" ]]; then
    if command -v curl >/dev/null 2>&1; then
      health_check "${HEALTH_BASE_URL%/}/h5/" "h5"
      health_check "${HEALTH_BASE_URL%/}/web/" "web"
    else
      log "curl not found; skipped health checks"
    fi
  fi
fi

log "done"
log "deploy env: ${DEPLOY_ENV}"
log "H5: ${HEALTH_BASE_URL%/}/h5/"
log "Web: ${HEALTH_BASE_URL%/}/web/"
