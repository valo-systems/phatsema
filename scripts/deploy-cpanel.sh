#!/usr/bin/env bash

set -Eeuo pipefail

readonly DEPLOY_DOCROOT="/home/valosyst/public_html/phatsema.valosystems.co.za"
readonly DEPLOY_APPROOT="/home/valosyst/apps/phatsema-api"
readonly RELEASE_NAME="phatsema-portal-1.0.0"
readonly SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly PROJECT_ROOT="$(cd -- "${SCRIPT_DIRECTORY}/.." && pwd -P)"
readonly RELEASE_DIRECTORY="${PROJECT_ROOT}/release"
readonly RELEASE_ARCHIVE="${RELEASE_DIRECTORY}/${RELEASE_NAME}.tar.gz"
readonly RELEASE_CHECKSUM="${RELEASE_ARCHIVE}.sha256"

STAGING_DIRECTORY=""

cleanup_staging() {
    if [[ -n "${STAGING_DIRECTORY}" && -d "${STAGING_DIRECTORY}" ]]; then
        /bin/rm -rf -- "${STAGING_DIRECTORY}"
    fi
}

trap cleanup_staging EXIT

if [[ "${DEPLOY_DOCROOT}" != "/home/valosyst/public_html/phatsema.valosystems.co.za" ]]; then
    echo "Refusing deployment: unexpected document root." >&2
    exit 1
fi

if [[ "${DEPLOY_APPROOT}" != "/home/valosyst/apps/phatsema-api" ]]; then
    echo "Refusing deployment: unexpected application root." >&2
    exit 1
fi

if [[ ! -f "${RELEASE_ARCHIVE}" || ! -f "${RELEASE_CHECKSUM}" ]]; then
    echo "Release archive or checksum is missing. Run pnpm release locally and commit both files." >&2
    exit 1
fi

(
    cd -- "${RELEASE_DIRECTORY}"
    /usr/bin/env sha256sum --check --status "$(basename -- "${RELEASE_CHECKSUM}")"
)

STAGING_DIRECTORY="$(/usr/bin/mktemp -d "/tmp/phatsema-deploy.XXXXXX")"
/usr/bin/tar -xzf "${RELEASE_ARCHIVE}" -C "${STAGING_DIRECTORY}"

readonly RELEASE_ROOT="${STAGING_DIRECTORY}/${RELEASE_NAME}"
readonly RELEASE_PUBLIC="${RELEASE_ROOT}/public_html/portal"
readonly RELEASE_APPLICATION="${RELEASE_ROOT}/apps/phatsema-api"

if [[ ! -f "${RELEASE_PUBLIC}/index.html" ||
      ! -f "${RELEASE_PUBLIC}/index.php" ||
      ! -f "${RELEASE_PUBLIC}/.htaccess" ||
      ! -f "${RELEASE_APPLICATION}/artisan" ||
      ! -f "${RELEASE_APPLICATION}/vendor/autoload.php" ]]; then
    echo "Release contents are incomplete; deployment has not started." >&2
    exit 1
fi

if [[ "${1:-}" == "--check" ]]; then
    echo "cPanel deployment bundle is valid."
    echo "Document root: ${DEPLOY_DOCROOT}"
    echo "Application root: ${DEPLOY_APPROOT}"
    exit 0
fi

/bin/mkdir -p -- "${DEPLOY_DOCROOT}" "${DEPLOY_APPROOT}"

# Replace application code while retaining server configuration and runtime data.
/usr/bin/find "${DEPLOY_APPROOT}" -mindepth 1 -maxdepth 1 \
    ! -name ".env" \
    ! -name "storage" \
    -exec /bin/rm -rf -- {} +
/bin/cp -a "${RELEASE_APPLICATION}/." "${DEPLOY_APPROOT}/"

# Replace public files while retaining certificate challenges and the live rewrite file.
/usr/bin/find "${DEPLOY_DOCROOT}" -mindepth 1 -maxdepth 1 \
    ! -name ".well-known" \
    ! -name ".htaccess" \
    -exec /bin/rm -rf -- {} +
/bin/cp -a "${RELEASE_PUBLIC}/." "${DEPLOY_DOCROOT}/"

/usr/bin/find "${DEPLOY_DOCROOT}" -type d -exec /bin/chmod 755 {} +
/usr/bin/find "${DEPLOY_DOCROOT}" -type f -exec /bin/chmod 644 {} +
/bin/chmod -R u+rwX,g+rwX -- "${DEPLOY_APPROOT}/storage" "${DEPLOY_APPROOT}/bootstrap/cache"

if [[ -f "${DEPLOY_APPROOT}/.env" ]]; then
    (
        cd -- "${DEPLOY_APPROOT}"
        /usr/bin/env php artisan optimize
    )
else
    echo "Deployment copied successfully, but ${DEPLOY_APPROOT}/.env must be created before the portal can run." >&2
fi

echo "Phatsema Portal deployed to ${DEPLOY_DOCROOT} without redirect rules."
