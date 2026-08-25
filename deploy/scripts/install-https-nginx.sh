#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

H5_DOMAIN="${H5_DOMAIN:-h5.songguoren.site}"
WEB_DOMAIN="${WEB_DOMAIN:-web.songguoren.site}"
CERT_EMAIL="${CERT_EMAIL:-343415207@qq.com}"
CERT_NAME="${CERT_NAME:-rongyixing-https}"
NGINX_TARGET="${NGINX_TARGET:-/etc/nginx/conf.d/rongyixing-prod-domains.conf}"
ACME_WEBROOT="${ACME_WEBROOT:-/var/www/rongyixing-acme}"
H5_UPSTREAM="${H5_UPSTREAM:-http://127.0.0.1:18088}"
WEB_UPSTREAM="${WEB_UPSTREAM:-http://127.0.0.1:18089}"
FORCE_REISSUE="${FORCE_REISSUE:-0}"
STAGING="${STAGING:-0}"

usage() {
  cat <<'EOF'
Usage:
  deploy/scripts/install-https-nginx.sh

Environment:
  H5_DOMAIN=h5.songguoren.site     H5 HTTPS domain.
  WEB_DOMAIN=web.songguoren.site   Web HTTPS domain.
  CERT_EMAIL=343415207@qq.com      Email used by certbot.
  CERT_NAME=rongyixing-https       Certbot certificate name.
  NGINX_TARGET=/etc/nginx/conf.d/rongyixing-prod-domains.conf
                                   Target Nginx config file.
  ACME_WEBROOT=/var/www/rongyixing-acme
                                   Webroot used for ACME HTTP-01 challenge.
  H5_UPSTREAM=http://127.0.0.1:18088
                                   H5 upstream for proxy_pass.
  WEB_UPSTREAM=http://127.0.0.1:18089
                                   Web upstream for proxy_pass.
  FORCE_REISSUE=1                  Re-issue certificate even if one exists.
  STAGING=1                        Use Let's Encrypt staging environment.
EOF
}

log() {
  printf '[ryx https deploy] %s\n' "$*"
}

run_sudo() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

backup_existing() {
  local file="$1"
  if [[ -f "${file}" ]]; then
    local backup="${file}.bak.$(date +%Y%m%d%H%M%S)"
    log "backup existing ${file} -> ${backup}"
    run_sudo cp -a "${file}" "${backup}"
  fi
}

escape_sed_replacement() {
  printf '%s' "$1" | sed 's/[\/&]/\\&/g'
}

render_http_bootstrap_conf() {
  cat <<EOF
server {
  listen 80;
  server_name ${H5_DOMAIN} ${WEB_DOMAIN};

  client_max_body_size 20m;

  location ^~ /.well-known/acme-challenge/ {
    root ${ACME_WEBROOT};
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}
EOF
}

render_https_conf() {
  local cert_dir="/etc/letsencrypt/live/${CERT_NAME}"
  cat <<EOF
server {
  listen 80;
  server_name ${H5_DOMAIN} ${WEB_DOMAIN};

  client_max_body_size 20m;

  location ^~ /.well-known/acme-challenge/ {
    root ${ACME_WEBROOT};
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}

server {
  listen 443 ssl http2;
  server_name ${H5_DOMAIN};

  client_max_body_size 20m;

  ssl_certificate ${cert_dir}/fullchain.pem;
  ssl_certificate_key ${cert_dir}/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_pass ${H5_UPSTREAM};
  }
}

server {
  listen 443 ssl http2;
  server_name ${WEB_DOMAIN};

  client_max_body_size 20m;

  ssl_certificate ${cert_dir}/fullchain.pem;
  ssl_certificate_key ${cert_dir}/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;

  location / {
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_pass ${WEB_UPSTREAM};
  }
}
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v nginx >/dev/null 2>&1; then
  log "nginx is not installed or not in PATH"
  exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
  log "certbot is not installed or not in PATH"
  exit 1
fi

cd "${ROOT_DIR}"

log "prepare ACME webroot at ${ACME_WEBROOT}"
run_sudo install -d -m 0755 "${ACME_WEBROOT}/.well-known/acme-challenge"
run_sudo install -d -m 0755 "$(dirname "${NGINX_TARGET}")"
backup_existing "${NGINX_TARGET}"

tmp_conf="$(mktemp)"
final_conf="$(mktemp)"
trap 'rm -f "${tmp_conf:-}" "${final_conf:-}"' EXIT

log "write bootstrap HTTP Nginx config"
render_http_bootstrap_conf >"${tmp_conf}"
run_sudo install -m 0644 "${tmp_conf}" "${NGINX_TARGET}"

log "validate bootstrap Nginx config"
run_sudo nginx -t

log "reload Nginx for ACME challenge"
if command -v systemctl >/dev/null 2>&1; then
  run_sudo systemctl reload nginx
else
  run_sudo nginx -s reload
fi

cert_args=(
  certonly
  --webroot
  --webroot-path "${ACME_WEBROOT}"
  --cert-name "${CERT_NAME}"
  --email "${CERT_EMAIL}"
  --agree-tos
  --non-interactive
  --keep-until-expiring
  -d "${H5_DOMAIN}"
  -d "${WEB_DOMAIN}"
)

if [[ "${STAGING}" == "1" ]]; then
  cert_args+=(--staging)
fi

if [[ "${FORCE_REISSUE}" == "1" ]]; then
  cert_args+=(--force-renewal)
fi

log "request certificate via certbot for ${H5_DOMAIN} and ${WEB_DOMAIN}"
run_sudo certbot "${cert_args[@]}"

log "write final HTTPS Nginx config"
render_https_conf >"${final_conf}"
run_sudo install -m 0644 "${final_conf}" "${NGINX_TARGET}"

log "validate final Nginx config"
run_sudo nginx -t

log "reload Nginx"
if command -v systemctl >/dev/null 2>&1; then
  run_sudo systemctl reload nginx
else
  run_sudo nginx -s reload
fi

log "done"
log "https://$(printf '%s' "${H5_DOMAIN}")/"
log "https://$(printf '%s' "${WEB_DOMAIN}")/"
