#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUT_ROOT="${OUT_ROOT:-${SCRIPT_DIR}/out}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d%H%M%S)}"
CREATE_ARCHIVE="${CREATE_ARCHIVE:-0}"
BUILD_BUSINESS_WWW="${BUILD_BUSINESS_WWW:-1}"
BUILD_INTERNAL="${BUILD_INTERNAL:-1}"
BUSINESS_PACKAGE_PREFIX="${BUSINESS_PACKAGE_PREFIX:-rongyixing-business}"
BUSINESS_H5_TEST_BASE_PATH="${BUSINESS_H5_TEST_BASE_PATH:-/rl/}"
BUSINESS_H5_PROD_BASE_PATH="${BUSINESS_H5_PROD_BASE_PATH:-/www/}"
BUSINESS_WEB_BASE_PATH="${BUSINESS_WEB_BASE_PATH:-/web/}"
BUSINESS_ENVS="${BUSINESS_ENVS:-test prod}"
INTERNAL_PACKAGE_NAME_PREFIX="${INTERNAL_PACKAGE_NAME_PREFIX:-rongyixing-h5-web-dist}"
MANIFEST_PATH="${OUT_ROOT}/RELEASE-${TIMESTAMP}.md"

log() {
  printf '[ryx-release-all] %s\n' "$*"
}

usage() {
  cat <<'EOF'
Usage:
  deploy/release/release-all.sh

This is the one-shot release entrypoint. It builds:

  1. Business same-origin package:
     deploy/release/out/rongyixing-business-h5-test/
     deploy/release/out/rongyixing-business-h5-prod/
     deploy/release/out/rongyixing-business-web-test/
     deploy/release/out/rongyixing-business-web-prod/
     - H5 test static files under rl/
     - H5 prod static files under www/
     - Web static files under web/
     - Built with /rl/ (test), /www/ (prod), and /web/ base paths.
     - API calls use current origin + /Home/Setting, then legacy direct service URLs.
     - Intended for customer deployment under app.rongtrip.cn/www, /web, or test equivalent.

  2. Internal nginx validation packages:
     deploy/release/out/rongyixing-h5-web-dist-test/
     deploy/release/out/rongyixing-h5-web-dist-prod/
     - H5/Web root-path dist.
     - Includes our nginx proxy/install templates.
     - Intended for localhost, IP, or songguoren.site validation.

Environment:
  OUT_ROOT=deploy/release/out
  TIMESTAMP=YYYYmmddHHMMSS
  CREATE_ARCHIVE=0|1
  BUILD_BUSINESS_WWW=1|0
  BUILD_INTERNAL=1|0
  BUSINESS_PACKAGE_PREFIX=rongyixing-business
  BUSINESS_H5_TEST_BASE_PATH=/rl/
  BUSINESS_H5_PROD_BASE_PATH=/www/
  BUSINESS_WEB_BASE_PATH=/web/
  BUSINESS_ENVS="test prod"
  INTERNAL_PACKAGE_NAME_PREFIX=rongyixing-h5-web-dist
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
  log "pnpm is not installed or not in PATH"
  exit 1
fi

cd "${ROOT_DIR}"
mkdir -p "${OUT_ROOT}"

business_package_name() {
  local app_name="$1"
  local env_name="$2"
  printf '%s-%s-%s' "${BUSINESS_PACKAGE_PREFIX}" "${app_name}" "${env_name}"
}

base_path_to_dir() {
  local base_path="$1"
  local cleaned
  cleaned="${base_path#/}"
  cleaned="${cleaned%/}"
  if [[ -z "${cleaned}" ]]; then
    printf 'root'
  else
    printf '%s' "${cleaned}"
  fi
}

business_h5_base_path() {
  local env_name="$1"
  case "${env_name}" in
    test)
      printf '%s' "${BUSINESS_H5_TEST_BASE_PATH}"
      ;;
    prod)
      printf '%s' "${BUSINESS_H5_PROD_BASE_PATH}"
      ;;
    *)
      log "unsupported business env: ${env_name}"
      exit 1
      ;;
  esac
}

build_business_app() {
  local app_name="$1"
  local env_name="$2"
  local base_path="$3"
  local package_name package_dir archive_path static_dir build_time git_commit git_branch app_label target_dir

  package_name="$(business_package_name "${app_name}" "${env_name}")"
  package_dir="${OUT_ROOT}/${package_name}"
  archive_path="${OUT_ROOT}/${package_name}-${TIMESTAMP}.tar.gz"
  static_dir="$(base_path_to_dir "${base_path}")"
  app_label="$(tr '[:lower:]' '[:upper:]' <<<"${app_name}")"
  target_dir="${package_dir}/${static_dir}"
  build_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  git_commit="$(git rev-parse HEAD 2>/dev/null || true)"
  git_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"

  log "prepare business same-origin ${env_name} ${app_label} package ${package_dir}"
  rm -rf "${package_dir}" "${archive_path}"
  mkdir -p "${target_dir}"

  log "build business ${env_name} ${app_label} with base ${base_path}"
  VITE_BASE_PATH="${base_path}" \
  VITE_API_MODE=direct \
  VITE_API_BASE_URL=__SAME_ORIGIN__ \
  VITE_API_DOMAIN=__AUTO__ \
  pnpm --filter "@ryx/${app_name}" build --mode "${env_name}"

  cp -a "${ROOT_DIR}/apps/${app_name}/dist/." "${target_dir}/"

  cat >"${package_dir}/VERSION.txt" <<EOF
name=${package_name}
build_time=${build_time}
build_timestamp=${TIMESTAMP}
deploy_env=business-same-origin-${env_name}
app=${app_name}
git_commit=${git_commit}
git_branch=${git_branch}
base_path=${base_path}
static_dir=${static_dir}
api_mode=direct
api_base_url=__SAME_ORIGIN__
api_domain=__AUTO__
EOF

  cat >"${package_dir}/README.md" <<EOF
# RongYiXing Business Same-Origin ${app_label} ${env_name} Build ${TIMESTAMP}

这个包用于交付业务方部署到 legacy 同源站点。

部署方式：

\`\`\`text
把本目录下的 ${static_dir}/ 整个目录内容，替换到业务方服务器的 wwwroot/${static_dir}。
\`\`\`

典型访问：

\`\`\`text
${base_path}index.html?wechatopenid=&ticketname=ticket&root=${static_dir}&ticket=xxxx
\`\`\`

运行方式：

- 应用：${app_label}
- 环境：${env_name}
- 静态资源 base：${base_path}
- API 配置：请求当前访问域名下的 /Home/Setting
- 后续接口：按 /Home/Setting 返回的 Urls 直接访问 legacy 后端服务
- Domain：从当前访问域名推导，也可以由 URL query 的 domain 覆盖

构建信息：

- build_time: ${build_time}
- git_branch: ${git_branch}
- git_commit: ${git_commit}
EOF

  if [[ "${CREATE_ARCHIVE}" == "1" ]]; then
    log "create business ${env_name} ${app_label} archive ${archive_path}"
    tar -C "${OUT_ROOT}" -czf "${archive_path}" "$(basename "${package_dir}")"
  fi
}

build_business_packages() {
  local env_name
  for env_name in ${BUSINESS_ENVS}; do
    case "${env_name}" in
      test|prod)
        build_business_app "h5" "${env_name}" "$(business_h5_base_path "${env_name}")"
        build_business_app "web" "${env_name}" "${BUSINESS_WEB_BASE_PATH}"
        ;;
      *)
        log "unsupported business env: ${env_name}"
        exit 1
        ;;
    esac
  done
}

build_internal_packages() {
  log "build internal nginx validation packages"
  SKIP_WORKSPACE_BUILD=1 \
  DEPLOY_ENV=all \
  PACKAGE_NAME_PREFIX="${INTERNAL_PACKAGE_NAME_PREFIX}" \
  CREATE_ARCHIVE="${CREATE_ARCHIVE}" \
  "${SCRIPT_DIR}/build-dist-package.sh"
}

write_manifest() {
  local archive_line

  archive_line="- Archives: disabled"
  if [[ "${CREATE_ARCHIVE}" == "1" ]]; then
    archive_line="- Archives: enabled, suffixed by ${TIMESTAMP}"
  fi

  cat >"${MANIFEST_PATH}" <<EOF
# RongYiXing Release ${TIMESTAMP}

${archive_line}

EOF

  if [[ "${BUILD_BUSINESS_WWW}" == "1" ]]; then
    local env_name
    for env_name in ${BUSINESS_ENVS}; do
      cat >>"${MANIFEST_PATH}" <<EOF
- Business H5 ${env_name} package: ${OUT_ROOT}/$(business_package_name h5 "${env_name}")/
- Business Web ${env_name} package: ${OUT_ROOT}/$(business_package_name web "${env_name}")/

EOF
    done
  fi

  if [[ "${BUILD_INTERNAL}" == "1" ]]; then
    cat >>"${MANIFEST_PATH}" <<EOF
- Internal test package: ${OUT_ROOT}/${INTERNAL_PACKAGE_NAME_PREFIX}-test/
- Internal prod package: ${OUT_ROOT}/${INTERNAL_PACKAGE_NAME_PREFIX}-prod/

EOF
  fi

  cat >>"${MANIFEST_PATH}" <<EOF

## Package Usage

EOF

  if [[ "${BUILD_BUSINESS_WWW}" == "1" ]]; then
    local env_name
    local h5_base_path
    cat >>"${MANIFEST_PATH}" <<EOF
业务方同源部署：

EOF
    for env_name in ${BUSINESS_ENVS}; do
      h5_base_path="$(business_h5_base_path "${env_name}")"
      cat >>"${MANIFEST_PATH}" <<EOF
\`\`\`text
$(business_package_name h5 "${env_name}")/$(base_path_to_dir "${h5_base_path}") -> customer ${env_name} wwwroot/$(base_path_to_dir "${h5_base_path}")
$(business_package_name web "${env_name}")/$(base_path_to_dir "${BUSINESS_WEB_BASE_PATH}") -> customer ${env_name} wwwroot/$(base_path_to_dir "${BUSINESS_WEB_BASE_PATH}")
\`\`\`

EOF
    done
  fi

  if [[ "${BUILD_INTERNAL}" == "1" ]]; then
    cat >>"${MANIFEST_PATH}" <<EOF
我们内部测试/生产模拟：

\`\`\`bash
cd ${OUT_ROOT}/${INTERNAL_PACKAGE_NAME_PREFIX}-test
./install-dist.sh

cd ${OUT_ROOT}/${INTERNAL_PACKAGE_NAME_PREFIX}-prod
./install-dist.sh
\`\`\`
EOF
  fi
}

log "build workspace packages"
pnpm build:workspace

if [[ "${BUILD_BUSINESS_WWW}" == "1" ]]; then
  build_business_packages
else
  log "skip business same-origin package"
fi

if [[ "${BUILD_INTERNAL}" == "1" ]]; then
  build_internal_packages
else
  log "skip internal nginx validation packages"
fi

write_manifest

log "manifest: ${MANIFEST_PATH}"
log "done"
