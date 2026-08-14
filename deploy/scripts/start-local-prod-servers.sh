#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/.local/local-prod-servers"
NGINX_PREFIX="${RUNTIME_DIR}/nginx"
PID_DIR="${RUNTIME_DIR}/pids"
LOG_DIR="${RUNTIME_DIR}/logs"

H5_VITE_PORT="${H5_VITE_PORT:-5175}"
WEB_VITE_PORT="${WEB_VITE_PORT:-5176}"
H5_NGINX_PORT="${H5_NGINX_PORT:-18088}"
WEB_NGINX_PORT="${WEB_NGINX_PORT:-18089}"
BUILD_DIST="${BUILD_DIST:-1}"
START_VITE="${START_VITE:-1}"
START_NGINX="${START_NGINX:-1}"
API_BASE_URL="${VITE_API_BASE_URL:-https://app.rongtrip.cn}"
API_DOMAIN="${VITE_API_DOMAIN:-rongtrip.cn}"
NGINX_MIME_TYPES="${NGINX_MIME_TYPES:-}"

SERVICE_HOST_PREFIXES=(
  "TmcApiHomeUrl:api-tmc"
  "MmsApiHomeUrl:api-mms"
  "TmcApiHotelUrl:hotel-api-tmc"
  "TmcApiFlightUrl:flight-api-tmc"
  "TmcApiTrainUrl:train-api-tmc"
  "TmcApiBookUrl:book-api-tmc"
  "TmcApiOrderUrl:order-api-tmc"
  "WorkflowApiUrl:api-workflow"
  "ApiMemberUrl:member-api"
  "ApiAccountUrl:account-api"
  "HrApiUrl:api-hr"
  "ApiPasswordUrl:pass-api"
  "ApiLoginUrl:login-api"
  "ApiHomeUrl:api"
  "FeatureRonglvUrl:ronglv-feature"
  "BpmApiExpenseUrl:expense-api-bpm"
  "TmcTouristFlightUrl:flight-tourist-tmc"
  "TmcTouristTrainUrl:train-tourist-tmc"
  "TmcTouristHotelUrl:hotel-tourist-tmc"
  "TmcTouristBookUrl:book-tourist-tmc"
  "TmcTouristOrderUrl:order-tourist-tmc"
)

usage() {
  cat <<'EOF'
Usage:
  pnpm local:prod
  deploy/scripts/start-local-prod-servers.sh

Starts all local prod validation servers:
  H5 Vite prod    http://localhost:5175/
  Web Vite prod   http://localhost:5176/
  H5 Nginx prod   http://localhost:18088/
  Web Nginx prod  http://localhost:18089/

Environment:
  BUILD_DIST=1|0       Build H5/Web dist before starting Nginx. Default: 1.
  START_VITE=1|0       Start H5/Web Vite prod servers. Default: 1.
  START_NGINX=1|0      Start local Nginx prod static servers. Default: 1.
  H5_VITE_PORT=5175
  WEB_VITE_PORT=5176
  H5_NGINX_PORT=18088
  WEB_NGINX_PORT=18089
  VITE_API_BASE_URL=https://app.rongtrip.cn
  VITE_API_DOMAIN=rongtrip.cn

Logs and pid files:
  .local/local-prod-servers/
EOF
}

log() {
  printf '[ryx local prod] %s\n' "$*"
}

port_pid() {
  local port="$1"
  lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local ok=0
  for attempt in $(seq 1 30); do
    if curl --fail --silent --show-error --head "${url}" >/dev/null; then
      ok=1
      break
    fi
    sleep 1
    log "waiting for ${label} ${attempt}/30"
  done

  if [[ "${ok}" != "1" ]]; then
    log "${label} failed to start: ${url}"
    return 1
  fi
}

start_background() {
  local name="$1"
  local command="$2"
  local port="$3"
  local log_file="${LOG_DIR}/${name}.log"
  local pid_file="${PID_DIR}/${name}.pid"
  local existing_pid

  existing_pid="$(port_pid "${port}")"
  if [[ -n "${existing_pid}" ]]; then
    log "${name} already listening on :${port} (pid ${existing_pid})"
    printf '%s\n' "${existing_pid}" >"${pid_file}"
    return
  fi

  log "start ${name} on :${port}"
  (
    cd "${ROOT_DIR}"
    exec nohup bash -lc "${command}"
  ) >"${log_file}" 2>&1 &
  printf '%s\n' "$!" >"${pid_file}"
}

write_nginx_proxy_conf() {
  local proxy_conf="${NGINX_PREFIX}/prod-proxy.conf"
  local api_scheme api_host
  api_scheme="$(printf '%s' "${API_BASE_URL}" | sed -E 's#^([a-zA-Z][a-zA-Z0-9+.-]*)://.*#\1#')"
  if [[ "${api_scheme}" == "${API_BASE_URL}" ]]; then
    api_scheme="https"
  fi
  api_host="$(printf '%s' "${API_BASE_URL}" | sed -E 's#^[a-zA-Z][a-zA-Z0-9+.-]*://([^/]+).*#\1#')"
  if [[ -z "${api_host}" || "${api_host}" == "${API_BASE_URL}" ]]; then
    api_host="app.rongtrip.cn"
  fi

  cat >"${proxy_conf}" <<EOF
location ~ ^/Home/ {
  proxy_http_version 1.1;
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_pass ${api_scheme}://${api_host};
}

location = /home/GetWechatCode {
  proxy_http_version 1.1;
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_pass ${api_scheme}://${api_host};
}

location = /home/GetDingTalkCode {
  proxy_http_version 1.1;
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_pass ${api_scheme}://${api_host};
}

location = /home/Pay {
  proxy_http_version 1.1;
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_pass ${api_scheme}://${api_host};
}

location ^~ /legal-doc/ {
  proxy_http_version 1.1;
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_pass ${api_scheme}://${api_host}/;
}

location ^~ /Identity/ {
  proxy_http_version 1.1;
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_pass http://api.${API_DOMAIN};
}

location ^~ /Jyx/ {
  proxy_http_version 1.1;
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_pass http://ronglv-feature.${API_DOMAIN};
}
EOF

  local entry key host_prefix
  for entry in "${SERVICE_HOST_PREFIXES[@]}"; do
    key="${entry%%:*}"
    host_prefix="${entry##*:}"
    cat >>"${proxy_conf}" <<EOF

location ^~ /__ryx/${key}/ {
  proxy_http_version 1.1;
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Real-IP \$remote_addr;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_pass http://${host_prefix}.${API_DOMAIN}/;
}
EOF
  done
}

write_nginx_conf() {
  local mime_types="${NGINX_MIME_TYPES}"
  if [[ -z "${mime_types}" ]]; then
    if [[ -f /opt/homebrew/etc/nginx/mime.types ]]; then
      mime_types="/opt/homebrew/etc/nginx/mime.types"
    elif [[ -f /usr/local/etc/nginx/mime.types ]]; then
      mime_types="/usr/local/etc/nginx/mime.types"
    elif [[ -f /etc/nginx/mime.types ]]; then
      mime_types="/etc/nginx/mime.types"
    else
      log "unable to find nginx mime.types; set NGINX_MIME_TYPES=/path/to/mime.types"
      exit 1
    fi
  fi

  mkdir -p \
    "${NGINX_PREFIX}/logs" \
    "${NGINX_PREFIX}/client_body_temp" \
    "${NGINX_PREFIX}/proxy_temp" \
    "${NGINX_PREFIX}/fastcgi_temp" \
    "${NGINX_PREFIX}/uwsgi_temp" \
    "${NGINX_PREFIX}/scgi_temp"

  write_nginx_proxy_conf

cat >"${NGINX_PREFIX}/nginx.conf" <<EOF
worker_processes 1;

error_log logs/error.log info;
pid logs/nginx.pid;

events {
  worker_connections 1024;
}

http {
  include ${mime_types};
  default_type application/octet-stream;

  access_log logs/access.log;
  sendfile on;
  keepalive_timeout 65;
  client_max_body_size 20m;

  gzip on;
  gzip_comp_level 5;
  gzip_min_length 1024;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

  server {
    listen ${H5_NGINX_PORT};
    server_name localhost 127.0.0.1;
    index index.html;

    location ^~ /assets/ {
      alias ${ROOT_DIR}/apps/h5/dist/assets/;
      expires 30d;
      add_header Cache-Control "public, immutable";
    }

    location ~ ^/home/(?!GetWechatCode(?:/|$)|GetDingTalkCode(?:/|$)|Pay(?:/|$)) {
      root ${ROOT_DIR}/apps/h5/dist;
      try_files \$uri \$uri/ /index.html;
    }

    location / {
      root ${ROOT_DIR}/apps/h5/dist;
      try_files \$uri \$uri/ /index.html;
    }

    include ${NGINX_PREFIX}/prod-proxy.conf;
  }

  server {
    listen ${WEB_NGINX_PORT};
    server_name localhost 127.0.0.1;
    index index.html;

    location ^~ /assets/ {
      alias ${ROOT_DIR}/apps/web/dist/assets/;
      expires 30d;
      add_header Cache-Control "public, immutable";
    }

    location ~ ^/home/(?!GetWechatCode(?:/|$)|GetDingTalkCode(?:/|$)|Pay(?:/|$)) {
      root ${ROOT_DIR}/apps/web/dist;
      try_files \$uri \$uri/ /index.html;
    }

    location / {
      root ${ROOT_DIR}/apps/web/dist;
      try_files \$uri \$uri/ /index.html;
    }

    include ${NGINX_PREFIX}/prod-proxy.conf;
  }
}
EOF
}

start_nginx() {
  local h5_pid web_pid
  h5_pid="$(port_pid "${H5_NGINX_PORT}")"
  web_pid="$(port_pid "${WEB_NGINX_PORT}")"
  if [[ -n "${h5_pid}" && -n "${web_pid}" ]]; then
    log "nginx prod already listening on :${H5_NGINX_PORT} and :${WEB_NGINX_PORT}"
    return
  fi

  write_nginx_conf
  log "validate local nginx config"
  nginx -p "${NGINX_PREFIX}" -c nginx.conf -t

  log "start local nginx prod on :${H5_NGINX_PORT}/:${WEB_NGINX_PORT}"
  nginx -p "${NGINX_PREFIX}" -c nginx.conf >"${LOG_DIR}/nginx.log" 2>&1
  if [[ -f "${NGINX_PREFIX}/logs/nginx.pid" ]]; then
    cp "${NGINX_PREFIX}/logs/nginx.pid" "${PID_DIR}/nginx.pid"
  fi
}

print_urls() {
  cat <<EOF

Local prod servers:
  H5 Vite:   http://localhost:${H5_VITE_PORT}/
  Web Vite:  http://localhost:${WEB_VITE_PORT}/
  H5 Nginx:  http://localhost:${H5_NGINX_PORT}/
  Web Nginx: http://localhost:${WEB_NGINX_PORT}/

Logs:
  ${LOG_DIR}
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

mkdir -p "${PID_DIR}" "${LOG_DIR}"
cd "${ROOT_DIR}"

if [[ "${BUILD_DIST}" == "1" && "${START_NGINX}" == "1" ]]; then
  log "build H5/Web prod dist for nginx"
  VITE_BASE_PATH=/ VITE_DEV_PORT="${H5_VITE_PORT}" pnpm --filter @ryx/h5 build
  VITE_BASE_PATH=/ VITE_DEV_PORT="${WEB_VITE_PORT}" pnpm --filter @ryx/web build
fi

if [[ "${START_VITE}" == "1" ]]; then
  start_background "h5-vite-prod" "pnpm dev:h5:prod" "${H5_VITE_PORT}"
  start_background "web-vite-prod" "pnpm dev:web:prod" "${WEB_VITE_PORT}"
fi

if [[ "${START_NGINX}" == "1" ]]; then
  start_nginx
fi

if [[ "${START_VITE}" == "1" ]]; then
  wait_for_url "http://localhost:${H5_VITE_PORT}/" "H5 Vite"
  wait_for_url "http://localhost:${WEB_VITE_PORT}/" "Web Vite"
fi

if [[ "${START_NGINX}" == "1" ]]; then
  wait_for_url "http://localhost:${H5_NGINX_PORT}/" "H5 Nginx"
  wait_for_url "http://localhost:${WEB_NGINX_PORT}/" "Web Nginx"
fi

print_urls
