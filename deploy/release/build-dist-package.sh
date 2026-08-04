#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUT_ROOT="${OUT_ROOT:-${SCRIPT_DIR}/out}"
INSTALL_SCRIPT_TEMPLATE="${INSTALL_SCRIPT_TEMPLATE:-${SCRIPT_DIR}/templates/install-dist.sh}"
STATIC_INSTALL_SCRIPT_TEMPLATE="${STATIC_INSTALL_SCRIPT_TEMPLATE:-${SCRIPT_DIR}/templates/install-static-dist.sh}"
DEPLOYMENT_GUIDE="${DEPLOYMENT_GUIDE:-${ROOT_DIR}/docs/nginx-static-deployment-step-by-step.md}"
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
  VITE_H5_BASE_PATH=/h5/                   H5 public base path.
  VITE_WEB_BASE_PATH=/web/                 Web public base path.
  VITE_API_BASE_URL=                       Single-env app portal base URL override.
  VITE_API_DOMAIN=                         Single-env legacy domain fallback override.
  VITE_API_MODE=proxy                     API mode embedded into the bundle.
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

H5_BASE_PATH="${VITE_H5_BASE_PATH:-/h5/}"
WEB_BASE_PATH="${VITE_WEB_BASE_PATH:-/web/}"
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
      ;;
    prod)
      ENV_API_BASE_URL="https://app.rongtrip.cn"
      ENV_API_DOMAIN="rongtrip.cn"
      ENV_ACCESS_BASE_URL="http://<server-ip>:18088"
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
  local build_time git_commit git_branch build_readme

  build_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  git_commit="$(git rev-parse HEAD 2>/dev/null || true)"
  git_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  build_readme="${package_dir}/README-${TIMESTAMP}.md"

  cp -a "${ROOT_DIR}/apps/h5/dist" "${package_dir}/h5/dist"
  cp -a "${ROOT_DIR}/apps/web/dist" "${package_dir}/web/dist"
  cp "${INSTALL_SCRIPT_TEMPLATE}" "${package_dir}/install-dist.sh"
  cp "${STATIC_INSTALL_SCRIPT_TEMPLATE}" "${package_dir}/install-static-dist.sh"
  cp "${DEPLOYMENT_GUIDE}" "${package_dir}/DEPLOYMENT.md"
  cp "${SCRIPT_DIR}/README.md" "${package_dir}/README.md"
  cp "${SCRIPT_DIR}/nginx/rongyixing-dist.conf.template" "${package_dir}/nginx/rongyixing-dist.conf.template"
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
${access_base_url}/h5/
${access_base_url}/web/
${access_base_url}/?ticket=xxxx
\`\`\`
EOF
}

build_env_package() {
  local env_name="$1"
  local package_name package_dir archive_path api_base_url api_domain access_base_url

  resolve_env_defaults "${env_name}"
  api_base_url="${VITE_API_BASE_URL:-${ENV_API_BASE_URL}}"
  api_domain="${VITE_API_DOMAIN:-${ENV_API_DOMAIN}}"
  access_base_url="${ENV_ACCESS_BASE_URL}"
  package_name="$(package_name_for_env "${env_name}")"
  package_dir="${OUT_ROOT}/${package_name}"
  archive_path="${OUT_ROOT}/${package_name}-${TIMESTAMP}.tar.gz"

  log "build ${env_name} H5 with VITE_BASE_PATH=${H5_BASE_PATH}, VITE_API_BASE_URL=${api_base_url}"
  VITE_BASE_PATH="${H5_BASE_PATH}" \
  VITE_API_BASE_URL="${api_base_url}" \
  VITE_API_DOMAIN="${api_domain}" \
  VITE_API_MODE="${VITE_API_MODE}" \
  pnpm --filter @ryx/h5 build

  log "build ${env_name} Web with VITE_BASE_PATH=${WEB_BASE_PATH}, VITE_API_BASE_URL=${api_base_url}"
  VITE_BASE_PATH="${WEB_BASE_PATH}" \
  VITE_API_BASE_URL="${api_base_url}" \
  VITE_API_DOMAIN="${api_domain}" \
  VITE_API_MODE="${VITE_API_MODE}" \
  pnpm --filter @ryx/web build

  log "prepare package directory ${package_dir}"
  rm -rf "${package_dir}" "${archive_path}"
  mkdir -p "${package_dir}/h5" "${package_dir}/web" "${package_dir}/nginx"
  write_package_files "${env_name}" "${package_name}" "${package_dir}" "${api_base_url}" "${api_domain}" "${access_base_url}"

  if [[ "${CREATE_ARCHIVE}" == "1" ]]; then
    log "create archive ${archive_path}"
    tar -C "${OUT_ROOT}" -czf "${archive_path}" "$(basename "${package_dir}")"
  fi

  log "package directory: ${package_dir}"
  if [[ "${CREATE_ARCHIVE}" == "1" ]]; then
    log "archive: ${archive_path}"
  fi
}

log "build workspace packages"
pnpm build:workspace

for env_name in "${BUILD_ENVS[@]}"; do
  build_env_package "${env_name}"
done

log "done"
