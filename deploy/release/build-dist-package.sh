#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUT_ROOT="${OUT_ROOT:-${SCRIPT_DIR}/out}"
INSTALL_SCRIPT_TEMPLATE="${INSTALL_SCRIPT_TEMPLATE:-${SCRIPT_DIR}/templates/install-dist.sh}"
STATIC_INSTALL_SCRIPT_TEMPLATE="${STATIC_INSTALL_SCRIPT_TEMPLATE:-${SCRIPT_DIR}/templates/install-static-dist.sh}"
DEPLOYMENT_GUIDE="${DEPLOYMENT_GUIDE:-${ROOT_DIR}/docs/nginx-static-deployment-step-by-step.md}"
NGINX_TEMPLATE="${NGINX_TEMPLATE:-${SCRIPT_DIR}/nginx/rongyixing-dist.conf.template}"
NGINX_PROXY_TEMPLATE="${NGINX_PROXY_TEMPLATE:-${SCRIPT_DIR}/nginx/rongyixing-proxy-locations.conf.template}"
NGINX_DOMAIN_TEMPLATE="${NGINX_DOMAIN_TEMPLATE:-${SCRIPT_DIR}/nginx/rongyixing-domain-root.conf.template}"
DEPLOY_ENV="${DEPLOY_ENV:-all}"
PACKAGE_NAME="${PACKAGE_NAME:-}"
PACKAGE_NAME_PREFIX="${PACKAGE_NAME_PREFIX:-rongyixing-h5-web-dist}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d%H%M%S)}"
CREATE_ARCHIVE="${CREATE_ARCHIVE:-0}"

log() {
  printf '[ryx-dist-package] %s\n' "$*"
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  deploy/release/build-dist-package.sh

Environment:
  OUT_ROOT=deploy/release/out              Output directory for generated packages.
  DEPLOY_ENV=all|test|prod                 Build target environment; all builds test and prod.
  PACKAGE_NAME_PREFIX=rongyixing-h5-web-dist
                                            Prefix used for all/test/prod package names.
  PACKAGE_NAME=                            Single-env package name override.
  TIMESTAMP=YYYYmmddHHMMSS                 Optional fixed package timestamp.
  VITE_H5_BASE_PATH=/                      H5 public base path.
  VITE_WEB_BASE_PATH=/                     Web public base path.
  VITE_API_BASE_URL=                       Single-env app portal base URL override.
  VITE_API_DOMAIN=                         Single-env legacy domain fallback override.
  VITE_API_MODE=proxy                     API mode embedded into the bundle.
  SKIP_WORKSPACE_BUILD=0                   Set to 1 when called by an outer release script.
  CREATE_ARCHIVE=0                         Only create the uploadable package directory.
  CREATE_ARCHIVE=1                         Also create tar.gz archive after directory package.
EOF
  exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  log "pnpm is not installed or not in PATH"
  exit 1
fi

cd "${ROOT_DIR}"

H5_BASE_PATH="${VITE_H5_BASE_PATH:-/}"
WEB_BASE_PATH="${VITE_WEB_BASE_PATH:-/}"
VITE_API_MODE="${VITE_API_MODE:-proxy}"

case "${DEPLOY_ENV}" in
  all)
    BUILD_ENVS=(test prod)
    ;;
  test|prod)
    BUILD_ENVS=("${DEPLOY_ENV}")
    ;;
  *)
    log "unsupported DEPLOY_ENV: ${DEPLOY_ENV}"
    exit 1
    ;;
esac

if [[ "${DEPLOY_ENV}" == "all" && -n "${PACKAGE_NAME}" ]]; then
  log "PACKAGE_NAME is only supported for single-env builds; use PACKAGE_NAME_PREFIX with DEPLOY_ENV=all"
  exit 1
fi

resolve_env_defaults() {
  local env_name="$1"
  case "${env_name}" in
    test)
      ENV_API_BASE_URL="http://app.rtesp.com"
      ENV_API_DOMAIN="rtesp.com"
      ENV_ACCESS_BASE_URL="http://<server-ip>"
      ENV_H5_PORT="18080"
      ENV_WEB_PORT="18081"
      ;;
    prod)
      ENV_API_BASE_URL="https://app.rongtrip.cn"
      ENV_API_DOMAIN="rongtrip.cn"
      ENV_ACCESS_BASE_URL="http://<server-ip>"
      ENV_H5_PORT="18088"
      ENV_WEB_PORT="18089"
      ;;
    *)
      log "unsupported build env: ${env_name}"
      exit 1
      ;;
  esac
}

package_name_for_env() {
  local env_name="$1"
  if [[ -n "${PACKAGE_NAME}" ]]; then
    printf '%s' "${PACKAGE_NAME}"
  else
    printf '%s-%s' "${PACKAGE_NAME_PREFIX}" "${env_name}"
  fi
}

write_package_files() {
  local env_name="$1"
  local package_name="$2"
  local package_dir="$3"
  local api_base_url="$4"
  local api_domain="$5"
  local access_base_url="$6"
  local h5_port="$7"
  local web_port="$8"
  local build_time git_commit git_branch build_readme

  build_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  git_commit="$(git rev-parse HEAD 2>/dev/null || true)"
  git_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  build_readme="${package_dir}/README-${TIMESTAMP}.md"

  cp "${INSTALL_SCRIPT_TEMPLATE}" "${package_dir}/install-dist.sh"
  cp "${STATIC_INSTALL_SCRIPT_TEMPLATE}" "${package_dir}/install-static-dist.sh"
  cp "${DEPLOYMENT_GUIDE}" "${package_dir}/DEPLOYMENT.md"
  cp "${SCRIPT_DIR}/README.md" "${package_dir}/README.md"
  cp "${NGINX_TEMPLATE}" "${package_dir}/nginx/rongyixing-dist.conf.template"
  cp "${NGINX_PROXY_TEMPLATE}" "${package_dir}/nginx/rongyixing-proxy-locations.conf.template"
  if [[ "${env_name}" == "prod" ]]; then
    cp "${NGINX_DOMAIN_TEMPLATE}" "${package_dir}/nginx/rongyixing-domain-root.conf.template"
  fi
  chmod +x "${package_dir}/install-dist.sh"
  chmod +x "${package_dir}/install-static-dist.sh"

  cat >"${package_dir}/VERSION.txt" <<EOF
name=${package_name}
build_time=${build_time}
build_timestamp=${TIMESTAMP}
deploy_env=${env_name}
git_commit=${git_commit}
git_branch=${git_branch}
api_base_url=${api_base_url}
api_domain=${api_domain}
h5_base_path=${H5_BASE_PATH}
web_base_path=${WEB_BASE_PATH}
EOF

  cat >"${build_readme}" <<EOF
# RongYiXing H5/Web ${env_name} Dist Build ${TIMESTAMP}

Build time: ${build_time}

Git branch: ${git_branch}

Git commit: ${git_commit}

Install on server:

\`\`\`bash
cd deploy/release/out/${package_name}
./install-dist.sh
\`\`\`

Access after install:

\`\`\`text
H5:  ${access_base_url}:${h5_port}/
Web: ${access_base_url}:${web_port}/
H5:  ${access_base_url}:${h5_port}/?ticket=xxxx
Web: ${access_base_url}:${web_port}/?ticket=xxxx
\`\`\`
EOF

  if [[ "${env_name}" == "prod" ]]; then
    cat >>"${build_readme}" <<'EOF'

Prod domain root access:

```text
http://h5.songguoren.site/
http://web.songguoren.site/
```
EOF
  fi
}

build_app_dist() {
  local env_name="$1"
  local app_name="$2"
  local app_label="$3"
  local base_path="$4"
  local output_dir="$5"
  local api_base_url="$6"
  local api_domain="$7"

  log "build ${env_name} ${app_label} with VITE_BASE_PATH=${base_path}, VITE_API_BASE_URL=${api_base_url}"
  VITE_BASE_PATH="${base_path}" \
  VITE_API_BASE_URL="${api_base_url}" \
  VITE_API_DOMAIN="${api_domain}" \
  VITE_API_MODE="${VITE_API_MODE}" \
  pnpm --filter "@ryx/${app_name}" build

  mkdir -p "$(dirname "${output_dir}")"
  cp -a "${ROOT_DIR}/apps/${app_name}/dist" "${output_dir}"
}

build_env_package() {
  local env_name="$1"
  local package_name package_dir archive_path api_base_url api_domain access_base_url h5_port web_port

  resolve_env_defaults "${env_name}"
  api_base_url="${VITE_API_BASE_URL:-${ENV_API_BASE_URL}}"
  api_domain="${VITE_API_DOMAIN:-${ENV_API_DOMAIN}}"
  access_base_url="${ENV_ACCESS_BASE_URL}"
  h5_port="${ENV_H5_PORT}"
  web_port="${ENV_WEB_PORT}"
  package_name="$(package_name_for_env "${env_name}")"
  package_dir="${OUT_ROOT}/${package_name}"
  archive_path="${OUT_ROOT}/${package_name}-${TIMESTAMP}.tar.gz"

  log "prepare package directory ${package_dir}"
  rm -rf "${package_dir}" "${archive_path}"
  mkdir -p "${package_dir}/nginx"

  build_app_dist "${env_name}" "h5" "H5" "${H5_BASE_PATH}" \
    "${package_dir}/h5/dist" "${api_base_url}" "${api_domain}"
  build_app_dist "${env_name}" "web" "Web" "${WEB_BASE_PATH}" \
    "${package_dir}/web/dist" "${api_base_url}" "${api_domain}"

  write_package_files "${env_name}" "${package_name}" "${package_dir}" "${api_base_url}" "${api_domain}" \
    "${access_base_url}" "${h5_port}" "${web_port}"

  if [[ "${CREATE_ARCHIVE}" == "1" ]]; then
    log "create archive ${archive_path}"
    tar -C "${OUT_ROOT}" -czf "${archive_path}" "$(basename "${package_dir}")"
  fi

  log "package directory: ${package_dir}"
  if [[ "${CREATE_ARCHIVE}" == "1" ]]; then
    log "archive: ${archive_path}"
  fi
}

if [[ "${SKIP_WORKSPACE_BUILD:-0}" == "1" ]]; then
  log "skip workspace package build"
else
  log "build workspace packages"
  pnpm build:workspace
fi

for env_name in "${BUILD_ENVS[@]}"; do
  build_env_package "${env_name}"
done

log "done"
