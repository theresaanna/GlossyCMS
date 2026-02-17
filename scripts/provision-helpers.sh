#!/usr/bin/env bash
# =============================================================================
# GlossyCMS Provisioning Helper Functions
# =============================================================================
# Sourceable helper functions for the provisioning script.
# Can be tested independently.

# Generate a cryptographically secure random hex string (64 chars / 32 bytes)
generate_secret() {
  openssl rand -hex 32
}

# Check that all required CLI tools are installed
check_prerequisites() {
  local missing=()

  for cmd in gh vercel openssl pnpm; do
    if ! command -v "${cmd}" &>/dev/null; then
      missing+=("${cmd}")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Error: Missing required tools: ${missing[*]}"
    echo ""
    echo "Install them:"
    echo "  gh:      https://cli.github.com/"
    echo "  vercel:  npm i -g vercel"
    echo "  openssl: Usually pre-installed on macOS"
    echo "  pnpm:    npm i -g pnpm"
    exit 1
  fi
}

# Set an environment variable on a Vercel project across all environments
# Usage: set_vercel_env KEY VALUE PROJECT_NAME TEAM_FLAG
set_vercel_env() {
  local key="$1"
  local value="$2"
  local project="$3"
  local team_flag="$4"

  echo "  Setting ${key}..."

  # Remove existing value first (ignore errors if it doesn't exist)
  vercel env rm "${key}" production preview development \
    --project "${project}" ${team_flag} --yes 2>/dev/null || true

  # Add the new value
  echo "${value}" | vercel env add "${key}" production preview development \
    --project "${project}" ${team_flag}
}

# Substitute placeholders in the client template file
# Usage: substitute_template INPUT_FILE OUTPUT_FILE VARS...
# Each VAR should be in the format __PLACEHOLDER__=value
substitute_template() {
  local input_file="$1"
  local output_file="$2"
  shift 2

  cp "${input_file}" "${output_file}"

  for var in "$@"; do
    local placeholder="${var%%=*}"
    local value="${var#*=}"
    # Use | as delimiter to avoid conflicts with URLs containing /
    sed -i.bak "s|${placeholder}|${value}|g" "${output_file}"
  done

  rm -f "${output_file}.bak"
}
