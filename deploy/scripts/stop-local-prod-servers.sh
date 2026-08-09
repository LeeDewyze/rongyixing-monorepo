#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.local/local-prod-servers"
PID_DIR="${RUNTIME_DIR}/pids"

PORTS=(
  "${H5_VITE_PORT:-5175}"
  "${WEB_VITE_PORT:-5176}"
  "${H5_NGINX_PORT:-18088}"
  "${WEB_NGINX_PORT:-18089}"
)

log() {
  printf '[ryx local prod stop] %s\n' "$*"
}

kill_pid() {
  local pid="$1"
  local label="$2"
  if [[ -z "${pid}" ]] || ! kill -0 "${pid}" 2>/dev/null; then
    return
  fi
  log "stop ${label} pid ${pid}"
  kill "${pid}" 2>/dev/null || true
}

if [[ -d "${PID_DIR}" ]]; then
  for pid_file in "${PID_DIR}"/*.pid; do
    [[ -f "${pid_file}" ]] || continue
    kill_pid "$(cat "${pid_file}")" "$(basename "${pid_file}" .pid)"
  done
fi

for port in "${PORTS[@]}"; do
  while read -r pid; do
    [[ -n "${pid}" ]] || continue
    kill_pid "${pid}" ":${port}"
  done < <(lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t 2>/dev/null || true)
done

log "done"
