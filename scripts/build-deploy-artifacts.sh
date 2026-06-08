#!/bin/bash
set -e

TARGET="${1:-all}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEPLOY_ROOT="$ROOT/.deploy"
DIST_ROOT="$ROOT/dist"
WEBSITE_SOURCE_BACKUP_ROOT="$ROOT/.website-build-excluded"
WEBSITE_EXCLUDED_SOURCES=(
  "src/pages/portal"
  "src/pages/api"
  "src/pages/health.json.ts"
  "public/sw.js"
  "public/manifest.webmanifest"
  "public/offline.html"
)

assert_repo_child() {
  local full_path="$(realpath -m "$1")"
  if [[ "$full_path" != "$ROOT"* ]]; then
    echo "Refusing to operate outside repository root: $full_path"
    return 1
  fi
  echo "$full_path"
}

reset_directory() {
  local full_path="$(assert_repo_child "$1")"
  rm -rf "$full_path"
  mkdir -p "$full_path"
}

restore_website_source_exclusions() {
  for relative_path in "${WEBSITE_EXCLUDED_SOURCES[@]}"; do
    local source_path="$(assert_repo_child "$ROOT/$relative_path")"
    local backup_path="$(assert_repo_child "$WEBSITE_SOURCE_BACKUP_ROOT/$relative_path")"

    if [ -e "$backup_path" ]; then
      if [ -e "$source_path" ]; then
        if [ -d "$backup_path" ] || [ -d "$source_path" ]; then
          echo "Cannot restore website build exclusion because source path already exists: $source_path"
          return 1
        fi
        rm -f "$source_path"
      fi
      mkdir -p "$(dirname "$source_path")"
      mv -f "$backup_path" "$source_path"
    fi
  done

  if [ -d "$WEBSITE_SOURCE_BACKUP_ROOT" ]; then
    rm -rf "$(assert_repo_child "$WEBSITE_SOURCE_BACKUP_ROOT")"
  fi
}

invoke_with_website_source_exclusions() {
  restore_website_source_exclusions || return 1
  reset_directory "$WEBSITE_SOURCE_BACKUP_ROOT"

  for relative_path in "${WEBSITE_EXCLUDED_SOURCES[@]}"; do
    local source_path="$(assert_repo_child "$ROOT/$relative_path")"
    if [ ! -e "$source_path" ]; then
      continue
    fi

    local backup_path="$(assert_repo_child "$WEBSITE_SOURCE_BACKUP_ROOT/$relative_path")"
    mkdir -p "$(dirname "$backup_path")"
    mv -f "$source_path" "$backup_path"
  done

  # Execute the passed command
  "$@"

  restore_website_source_exclusions
}

copy_directory_contents() {
  local source_full="$(assert_repo_child "$1")"
  local dest_full="$(assert_repo_child "$2")"

  if [ ! -d "$source_full" ]; then
    echo "Missing source directory: $source_full"
    return 1
  fi

  mkdir -p "$dest_full"
  cp -rf "$source_full"/* "$dest_full"/ 2>/dev/null || true
  cp -rf "$source_full"/.* "$dest_full"/ 2>/dev/null || true
}

remove_dev_vars() {
  local dir_path="$(assert_repo_child "$1")"
  find "$dir_path" -name ".dev.vars" -type f -delete 2>/dev/null || true
}

remove_wrangler_deploy_redirect() {
  local deploy_redirect="$ROOT/.wrangler/deploy"
  if [ -d "$deploy_redirect" ]; then
    rm -rf "$(assert_repo_child "$deploy_redirect")"
  fi
}

set_target_environment() {
  export BUILD_TARGET="$1"
  export PUBLIC_DEPLOY_TARGET="$1"
  export PUBLIC_SITE_URL="https://www.tequit.co.za"
  export PUBLIC_PORTAL_URL="https://portal.tequit.co.za"
  export PUBLIC_CONTACT_EMAIL="admin@kharon.co.za"

  if [ "$1" = "website" ]; then
    export CF_PAGES="true"
  else
    unset CF_PAGES
  fi
}

invoke_target_build() {
  echo "Building $1 target..."
  if [ -d "$DIST_ROOT" ]; then
    rm -rf "$(assert_repo_child "$DIST_ROOT")"
  fi

  set_target_environment "$1"
  if [ "$1" = "website" ]; then
    npm run build:astro
    npm run build:cron
    npm run build:css
  else
    npm run build
  fi
}

build_portal_artifact() {
  invoke_target_build "portal"

  local portal_root="$DEPLOY_ROOT/portal"
  reset_directory "$portal_root"
  copy_directory_contents "$DIST_ROOT/client" "$portal_root/client"
  copy_directory_contents "$DIST_ROOT/server" "$portal_root/server"
  remove_dev_vars "$portal_root"

  if [ ! -f "$portal_root/server/wrangler.json" ]; then
    echo "Portal artifact is missing server/wrangler.json."
    return 1
  fi
}

build_website_artifact_internal() {
  invoke_target_build "website"
}

build_website_artifact() {
  invoke_with_website_source_exclusions build_website_artifact_internal

  local website_root="$DEPLOY_ROOT/website"
  reset_directory "$website_root"
  copy_directory_contents "$DIST_ROOT/client" "$website_root"
  copy_directory_contents "$DIST_ROOT/server" "$website_root"
  remove_dev_vars "$website_root"

  local entry="$website_root/entry.mjs"
  local worker="$website_root/_worker.js"
  if [ -f "$entry" ]; then
    mv -f "$entry" "$worker"
  fi

  local generated_wrangler="$website_root/wrangler.json"
  if [ -f "$generated_wrangler" ]; then
    rm -f "$generated_wrangler"
  fi

  for asset in "sw.js" "manifest.webmanifest" "offline.html"; do
    local asset_path="$website_root/$asset"
    if [ -f "$asset_path" ]; then
      rm -f "$asset_path"
    fi
  done

  if [ ! -f "$worker" ]; then
    echo "Website artifact is missing _worker.js."
    return 1
  fi

  remove_wrangler_deploy_redirect
}

if [ "$TARGET" = "production" ]; then
  TARGET="all"
fi

# Trap to always restore exclusions on termination
trap restore_website_source_exclusions EXIT INT TERM
restore_website_source_exclusions

if [ "$TARGET" = "all" ]; then
  reset_directory "$DEPLOY_ROOT"
  build_portal_artifact
  build_website_artifact
elif [ "$TARGET" = "portal" ]; then
  build_portal_artifact
elif [ "$TARGET" = "website" ]; then
  build_website_artifact
fi

echo "Deployment artifacts ready under .deploy."
