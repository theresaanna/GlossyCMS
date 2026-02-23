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

  for cmd in vercel openssl pnpm curl python3 psql; do
    if ! command -v "${cmd}" &>/dev/null; then
      missing+=("${cmd}")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "Error: Missing required tools: ${missing[*]}"
    echo ""
    echo "Install them:"
    echo "  vercel:  npm i -g vercel"
    echo "  openssl: Usually pre-installed on macOS"
    echo "  pnpm:    npm i -g pnpm"
    echo "  curl:    Usually pre-installed on macOS"
    echo "  python3: Usually pre-installed on macOS"
    echo "  psql:    brew install libpq (macOS) or apt install postgresql-client (Linux)"
    exit 1
  fi

  if [[ -z "${VERCEL_TOKEN:-}" ]]; then
    echo "Error: VERCEL_TOKEN environment variable is required."
    echo "Generate one at: https://vercel.com/account/tokens"
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

# Create a Vercel storage store (postgres or blob) via REST API
# Usage: create_vercel_storage TYPE NAME VERCEL_TEAM
# TYPE: "postgres" or "blob"
# Outputs JSON response from the API
create_vercel_storage() {
  local store_type="$1"
  local store_name="$2"
  local team="$3"

  local team_param=""
  if [[ -n "${team}" ]]; then
    team_param="?teamId=${team}"
  fi

  # Check if store already exists
  local existing_id
  existing_id=$(curl -s \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    "https://api.vercel.com/v1/storage/stores${team_param}" \
    | python3 -c "
import sys, json
data = json.load(sys.stdin)
for store in data.get('stores', []):
    if store.get('name') == '${store_name}' and store.get('type') == '${store_type}':
        print(store['id'])
        break
" 2>/dev/null)

  if [[ -n "${existing_id}" ]]; then
    echo "Storage '${store_name}' already exists (ID: ${existing_id}), reusing." >&2
    echo "${existing_id}"
    return 0
  fi

  # Create new store
  local response
  response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.vercel.com/v1/storage/stores${team_param}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"${store_type}\",\"name\":\"${store_name}\"}")

  local http_code
  http_code=$(echo "${response}" | tail -1)
  local body
  body=$(echo "${response}" | sed '$d')

  if [[ "${http_code}" -lt 200 || "${http_code}" -ge 300 ]]; then
    echo "Error: Failed to create ${store_type} store '${store_name}' (HTTP ${http_code}): ${body}" >&2
    return 1
  fi

  local store_id
  store_id=$(echo "${body}" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "${store_id}"
}

# Link a storage store to a Vercel project via REST API
# Usage: link_storage_to_project STORE_ID PROJECT_NAME VERCEL_TEAM
link_storage_to_project() {
  local store_id="$1"
  local project_name="$2"
  local team="$3"

  local team_param=""
  if [[ -n "${team}" ]]; then
    team_param="?teamId=${team}"
  fi

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.vercel.com/v1/storage/stores/${store_id}/connections${team_param}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"projectId\":\"${project_name}\"}")

  local http_code
  http_code=$(echo "${response}" | tail -1)

  if [[ "${http_code}" -lt 200 || "${http_code}" -ge 300 ]]; then
    local body
    body=$(echo "${response}" | sed '$d')
    # Already connected is OK
    if echo "${body}" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('error',{}).get('code')=='already_connected' else 1)" 2>/dev/null; then
      echo "Storage already linked to project." >&2
      return 0
    fi
    echo "Error: Failed to link storage to project (HTTP ${http_code}): ${body}" >&2
    return 1
  fi
}

# =============================================================================
# Neon Branching Functions
# =============================================================================

# Create a Neon branch from the template project
# Usage: create_neon_branch BRANCH_NAME
# Outputs JSON: { "branchId": "...", "connectionUri": "..." }
# Requires: NEON_API_KEY, NEON_TEMPLATE_PROJECT_ID
create_neon_branch() {
  local branch_name="$1"
  local project_id="${NEON_TEMPLATE_PROJECT_ID}"
  local parent_id="${NEON_TEMPLATE_BRANCH_ID:-}"
  local db_name="${NEON_TEMPLATE_DB_NAME:-neondb}"
  local role_name="${NEON_TEMPLATE_ROLE_NAME:-neondb_owner}"

  # Build branch creation body
  local branch_body
  if [[ -n "${parent_id}" ]]; then
    branch_body="{\"branch\":{\"name\":\"${branch_name}\",\"parent_id\":\"${parent_id}\"},\"endpoints\":[{\"type\":\"read_write\"}]}"
  else
    branch_body="{\"branch\":{\"name\":\"${branch_name}\"},\"endpoints\":[{\"type\":\"read_write\"}]}"
  fi

  # Create branch
  local response
  response=$(curl -s -w "\n%{http_code}" -X POST \
    "https://console.neon.tech/api/v2/projects/${project_id}/branches" \
    -H "Authorization: Bearer ${NEON_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "${branch_body}")

  local http_code
  http_code=$(echo "${response}" | tail -1)
  local body
  body=$(echo "${response}" | sed '$d')

  if [[ "${http_code}" -lt 200 || "${http_code}" -ge 300 ]]; then
    echo "Error: Failed to create Neon branch '${branch_name}' (HTTP ${http_code}): ${body}" >&2
    return 1
  fi

  local branch_id
  branch_id=$(echo "${body}" | python3 -c "import sys,json; print(json.load(sys.stdin)['branch']['id'])")

  # Get connection URI
  local conn_response
  conn_response=$(curl -s -w "\n%{http_code}" \
    "https://console.neon.tech/api/v2/projects/${project_id}/connection_uri?branch_id=${branch_id}&database_name=${db_name}&role_name=${role_name}" \
    -H "Authorization: Bearer ${NEON_API_KEY}")

  local conn_http_code
  conn_http_code=$(echo "${conn_response}" | tail -1)
  local conn_body
  conn_body=$(echo "${conn_response}" | sed '$d')

  if [[ "${conn_http_code}" -lt 200 || "${conn_http_code}" -ge 300 ]]; then
    echo "Error: Failed to get connection URI for branch '${branch_id}' (HTTP ${conn_http_code}): ${conn_body}" >&2
    return 1
  fi

  local connection_uri
  connection_uri=$(echo "${conn_body}" | python3 -c "import sys,json; print(json.load(sys.stdin)['uri'])")

  # Ensure sslmode=require
  if [[ "${connection_uri}" != *"sslmode="* ]]; then
    if [[ "${connection_uri}" == *"?"* ]]; then
      connection_uri="${connection_uri}&sslmode=require"
    else
      connection_uri="${connection_uri}?sslmode=require"
    fi
  fi

  # Output as JSON for the caller to parse
  python3 -c "import json; print(json.dumps({'branchId': '${branch_id}', 'connectionUri': '${connection_uri}'}))"
}

# Clean sensitive tables from a branched database and set site settings
# Usage: clean_branched_database CONNECTION_URI SITE_NAME SITE_DESCRIPTION
clean_branched_database() {
  local conn_uri="$1"
  local site_name="$2"
  local site_description="$3"

  # Escape single quotes for SQL safety
  local escaped_name="${site_name//\'/\'\'}"
  local escaped_desc="${site_description//\'/\'\'}"

  psql "${conn_uri}" <<SQL
BEGIN;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE newsletter_recipients CASCADE;
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE search CASCADE;
TRUNCATE TABLE payload_locked_documents CASCADE;
TRUNCATE TABLE payload_locked_documents_rels CASCADE;
TRUNCATE TABLE payload_preferences CASCADE;
TRUNCATE TABLE payload_preferences_rels CASCADE;

UPDATE site_settings SET
  site_title = '${escaped_name}',
  site_description = '${escaped_desc}',
  og_image_id = NULL,
  favicon_id = NULL,
  header_image_id = NULL,
  user_image_id = NULL
WHERE id = 1;
COMMIT;
SQL
}

# Delete a Neon branch
# Usage: delete_neon_branch PROJECT_ID BRANCH_ID
delete_neon_branch() {
  local project_id="$1"
  local branch_id="$2"

  curl -s -X DELETE \
    "https://console.neon.tech/api/v2/projects/${project_id}/branches/${branch_id}" \
    -H "Authorization: Bearer ${NEON_API_KEY}" > /dev/null
}
