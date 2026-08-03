#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/deploy/docker/docker-compose.yml"

usage() {
  cat <<'EOF'
Usage:
  deploy/scripts/stop-h5.sh

Environment:
  REMOVE_IMAGE=1     Also remove the ryx-h5:latest image after stopping.
EOF
}

log() {
  printf '[ryx-h5 stop] %s\n' "$*"
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

log "stop Docker service"
docker compose -f "${COMPOSE_FILE}" down

if [[ "${REMOVE_IMAGE:-0}" == "1" ]]; then
  log "remove image ryx-h5:latest"
  docker image rm ryx-h5:latest
fi

log "done"

