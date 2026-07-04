#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/deploy/docker/docker-compose.yml"
SERVER_NGINX_CONF="${ROOT_DIR}/deploy/nginx/rtesp.songguoren.site.conf"
SERVER_NGINX_TARGET="${SERVER_NGINX_TARGET:-/etc/nginx/conf.d/rtesp.songguoren.site.conf}"
RYX_H5_PORT="${RYX_H5_PORT:-18080}"
INSTALL_SERVER_NGINX="${INSTALL_SERVER_NGINX:-0}"

usage() {
  cat <<'EOF'
Usage:
  deploy/scripts/deploy-h5.sh

Environment:
  RYX_H5_PORT=18080              Local host port bound by Docker compose.
  INSTALL_SERVER_NGINX=1         Also install/reload server Nginx entry config.
  SERVER_NGINX_TARGET=...        Target path for server Nginx config.
  VITE_APP_ID=...                Docker build arg; default com.ronglvonline.app.
  VITE_API_MODE=proxy            Docker build arg.
  VITE_API_BASE_URL=             Docker build arg; empty means same-origin proxy.
  VITE_API_DOMAIN=rtesp.com      Docker build arg.
EOF
}

log() {
  printf '[ryx-h5 deploy] %s\n' "$*"
}

dump_compose_debug() {
  log "container status"
  docker compose -f "${COMPOSE_FILE}" ps || true
  log "container logs"
  docker compose -f "${COMPOSE_FILE}" logs --tail=160 ryx-h5 || true
}

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
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

log "build and start Docker service on 127.0.0.1:${RYX_H5_PORT}"
RYX_H5_PORT="${RYX_H5_PORT}" docker compose -f "${COMPOSE_FILE}" up -d --build

if command -v curl >/dev/null 2>&1; then
  log "health check http://127.0.0.1:${RYX_H5_PORT}/"
  health_ok=0
  for attempt in $(seq 1 20); do
    if curl --fail --silent --show-error --head "http://127.0.0.1:${RYX_H5_PORT}/" >/dev/null; then
      health_ok=1
      break
    fi
    log "health check attempt ${attempt}/20 failed; retrying"
    sleep 1
  done

  if [[ "${health_ok}" != "1" ]]; then
    log "health check failed"
    dump_compose_debug
    exit 1
  fi
else
  log "curl not found; skipped local health check"
fi

if [[ "${INSTALL_SERVER_NGINX}" == "1" ]]; then
  if ! command -v nginx >/dev/null 2>&1; then
    log "nginx is not installed or not in PATH"
    exit 1
  fi

  log "install server Nginx config to ${SERVER_NGINX_TARGET}"
  run_sudo install -m 0644 "${SERVER_NGINX_CONF}" "${SERVER_NGINX_TARGET}"

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
