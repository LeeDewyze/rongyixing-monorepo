#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/deploy/docker/docker-compose.ip-prefix.yml"
SERVER_NGINX_CONF="${ROOT_DIR}/deploy/nginx/ip-prefix.conf"
SERVER_NGINX_TARGET="${SERVER_NGINX_TARGET:-/etc/nginx/conf.d/rtesp.songguoren.site.conf}"
STALE_SERVER_NGINX_TARGET="${STALE_SERVER_NGINX_TARGET:-/etc/nginx/conf.d/rongyixing-ip-prefix.conf}"
RYX_H5_PORT="${RYX_H5_PORT:-18080}"
RYX_WEB_PORT="${RYX_WEB_PORT:-18081}"
INSTALL_SERVER_NGINX="${INSTALL_SERVER_NGINX:-1}"

usage() {
  cat <<'EOF'
Usage:
  deploy/scripts/deploy-ip-prefix.sh

Environment:
  RYX_H5_PORT=18080              Local host port bound by H5 container.
  RYX_WEB_PORT=18081             Local host port bound by Web container.
  RYX_H5_BASE_PATH=/h5/          H5 browser base path.
  RYX_WEB_BASE_PATH=/web/        Web browser base path.
  INSTALL_SERVER_NGINX=1         Install/reload server Nginx entry config by default.
  INSTALL_SERVER_NGINX=0         Only build/start Docker services; skip server Nginx.
  SERVER_NGINX_TARGET=...        Target path for server Nginx config.
                                  Default overwrites the old H5 entry to avoid duplicate default_server.
  STALE_SERVER_NGINX_TARGET=...  Stale previous target to remove before nginx -t.
  VITE_APP_ID=...                Docker build arg; default com.ronglvonline.app.
  VITE_API_MODE=proxy            Docker build arg.
  VITE_API_BASE_URL=             Docker build arg; empty means same-origin proxy.
  VITE_API_DOMAIN=rtesp.com      Docker build arg.
EOF
}

log() {
  printf '[ryx-ip-prefix deploy] %s\n' "$*"
}

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

health_check() {
  local url="$1"
  local label="$2"
  log "health check ${url}"
  local health_ok=0
  for attempt in $(seq 1 20); do
    if curl --fail --silent --show-error --head "${url}" >/dev/null; then
      health_ok=1
      break
    fi
    log "${label} health check attempt ${attempt}/20 failed; retrying"
    sleep 1
  done

  if [[ "${health_ok}" != "1" ]]; then
    log "${label} health check failed"
    docker compose -f "${COMPOSE_FILE}" ps || true
    docker compose -f "${COMPOSE_FILE}" logs --tail=160 || true
    exit 1
  fi
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  log "docker is not installed or not in PATH"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  log "docker compose is unavailable"
  exit 1
fi

cd "${ROOT_DIR}"

log "compose config: ${COMPOSE_FILE}"
docker compose -f "${COMPOSE_FILE}" config >/dev/null

log "build and start Docker services"
RYX_H5_PORT="${RYX_H5_PORT}" RYX_WEB_PORT="${RYX_WEB_PORT}" \
  docker compose -f "${COMPOSE_FILE}" up -d --build

if command -v curl >/dev/null 2>&1; then
  health_check "http://127.0.0.1:${RYX_H5_PORT}/" "h5"
  health_check "http://127.0.0.1:${RYX_WEB_PORT}/" "web"
else
  log "curl not found; skipped local health checks"
fi

if [[ "${INSTALL_SERVER_NGINX}" == "1" ]]; then
  if ! command -v nginx >/dev/null 2>&1; then
    log "nginx is not installed or not in PATH"
    exit 1
  fi

  log "install server Nginx config to ${SERVER_NGINX_TARGET}"
  run_sudo install -m 0644 "${SERVER_NGINX_CONF}" "${SERVER_NGINX_TARGET}"

  if [[ "${STALE_SERVER_NGINX_TARGET}" != "${SERVER_NGINX_TARGET}" ]]; then
    log "remove stale server Nginx config ${STALE_SERVER_NGINX_TARGET}"
    run_sudo rm -f "${STALE_SERVER_NGINX_TARGET}"
  fi

  log "validate server Nginx config"
  run_sudo nginx -t

  log "reload server Nginx"
  if command -v systemctl >/dev/null 2>&1; then
    run_sudo systemctl reload nginx
  else
    run_sudo nginx -s reload
  fi
fi

log "done"
