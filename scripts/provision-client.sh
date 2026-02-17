#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# GlossyCMS Client Provisioning Script
# =============================================================================
# Creates a new client instance with its own GitHub repo, Vercel project,
# environment variables, and database.
#
# Usage:
#   ./scripts/provision-client.sh --client-name <name> --org <github-org> --team <vercel-team>
#
# Prerequisites:
#   - gh CLI (authenticated)
#   - vercel CLI (authenticated)
#   - openssl
#   - pnpm
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source helper functions
source "${SCRIPT_DIR}/provision-helpers.sh"

# -----------------------------------------------------------------------------
# Argument parsing
# -----------------------------------------------------------------------------
CLIENT_NAME=""
GITHUB_ORG=""
VERCEL_TEAM=""
TEMPLATE_REPO="theresaanna/GlossyCMS"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --client-name)
      CLIENT_NAME="$2"
      shift 2
      ;;
    --org)
      GITHUB_ORG="$2"
      shift 2
      ;;
    --team)
      VERCEL_TEAM="$2"
      shift 2
      ;;
    --template)
      TEMPLATE_REPO="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 --client-name <name> --org <github-org> --team <vercel-team>"
      echo ""
      echo "Options:"
      echo "  --client-name  Client identifier (used for repo and project names)"
      echo "  --org          GitHub organization for the new repo"
      echo "  --team         Vercel team slug"
      echo "  --template     Template repo (default: theresaanna/GlossyCMS)"
      echo "  --help         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "${CLIENT_NAME}" ]]; then
  echo "Error: --client-name is required"
  exit 1
fi

if [[ -z "${GITHUB_ORG}" ]]; then
  echo "Error: --org is required"
  exit 1
fi

if [[ -z "${VERCEL_TEAM}" ]]; then
  echo "Error: --team is required"
  exit 1
fi

TEAM_FLAG="--scope ${VERCEL_TEAM}"
REPO_NAME="${GITHUB_ORG}/${CLIENT_NAME}"

# -----------------------------------------------------------------------------
# Step 1: Validate prerequisites
# -----------------------------------------------------------------------------
echo "=== Step 1: Validating prerequisites ==="

check_prerequisites

echo "Checking authentication..."
if ! gh auth status &>/dev/null; then
  echo "Error: Not authenticated with GitHub CLI. Run: gh auth login"
  exit 1
fi

if ! vercel whoami ${TEAM_FLAG} &>/dev/null; then
  echo "Error: Not authenticated with Vercel CLI. Run: vercel login"
  exit 1
fi

echo "All prerequisites met."
echo ""

# -----------------------------------------------------------------------------
# Step 2: Collect client configuration
# -----------------------------------------------------------------------------
echo "=== Step 2: Collecting client configuration ==="
echo "Press Enter to use the default value shown in brackets."
echo ""

read -rp "Client domain (e.g., client.example.com): " CLIENT_DOMAIN
read -rp "PostgreSQL connection string: " POSTGRES_URL
read -rp "Resend API key: " RESEND_API_KEY
read -rp "Vercel Blob token: " BLOB_TOKEN
read -rp "Sender email [hello@example.com]: " FROM_EMAIL
FROM_EMAIL="${FROM_EMAIL:-hello@example.com}"
read -rp "Sender name [${CLIENT_NAME}]: " FROM_NAME
FROM_NAME="${FROM_NAME:-${CLIENT_NAME}}"
read -rp "Site name [${CLIENT_NAME}]: " SITE_NAME
SITE_NAME="${SITE_NAME:-${CLIENT_NAME}}"
read -rp "Site description [A website powered by GlossyCMS.]: " SITE_DESCRIPTION
SITE_DESCRIPTION="${SITE_DESCRIPTION:-A website powered by GlossyCMS.}"
read -rp "Twitter/X handle (include @) []: " TWITTER_HANDLE
TWITTER_HANDLE="${TWITTER_HANDLE:-}"

# Validate required values
if [[ -z "${POSTGRES_URL}" ]]; then
  echo "Error: PostgreSQL connection string is required"
  exit 1
fi

if [[ -z "${RESEND_API_KEY}" ]]; then
  echo "Error: Resend API key is required"
  exit 1
fi

if [[ -z "${BLOB_TOKEN}" ]]; then
  echo "Error: Vercel Blob token is required"
  exit 1
fi

echo ""

# -----------------------------------------------------------------------------
# Step 3: Generate secrets
# -----------------------------------------------------------------------------
echo "=== Step 3: Generating secrets ==="

PAYLOAD_SECRET=$(generate_secret)
CRON_SECRET=$(generate_secret)
PREVIEW_SECRET=$(generate_secret)

echo "Generated PAYLOAD_SECRET, CRON_SECRET, PREVIEW_SECRET."

# Allow overriding secrets (useful for migrating existing instances)
read -rp "Override PAYLOAD_SECRET? (leave empty to use generated): " OVERRIDE
if [[ -n "${OVERRIDE}" ]]; then
  PAYLOAD_SECRET="${OVERRIDE}"
  echo "Using provided PAYLOAD_SECRET."
fi

read -rp "Override CRON_SECRET? (leave empty to use generated): " OVERRIDE
if [[ -n "${OVERRIDE}" ]]; then
  CRON_SECRET="${OVERRIDE}"
  echo "Using provided CRON_SECRET."
fi

read -rp "Override PREVIEW_SECRET? (leave empty to use generated): " OVERRIDE
if [[ -n "${OVERRIDE}" ]]; then
  PREVIEW_SECRET="${OVERRIDE}"
  echo "Using provided PREVIEW_SECRET."
fi

echo ""

# -----------------------------------------------------------------------------
# Step 4: Create GitHub repository
# -----------------------------------------------------------------------------
echo "=== Step 4: Creating GitHub repository ==="

if gh repo view "${REPO_NAME}" &>/dev/null; then
  echo "Repository ${REPO_NAME} already exists, skipping creation."
else
  echo "Creating repository ${REPO_NAME} from template ${TEMPLATE_REPO}..."
  gh repo create "${REPO_NAME}" \
    --template "${TEMPLATE_REPO}" \
    --private \
    --clone=false
  echo "Repository created: https://github.com/${REPO_NAME}"

  # Wait for GitHub to finish creating the repo from template
  echo "Waiting for repository to be ready..."
  sleep 10
fi

echo ""

# -----------------------------------------------------------------------------
# Step 5: Create Vercel project
# -----------------------------------------------------------------------------
echo "=== Step 5: Creating Vercel project ==="

if vercel project ls ${TEAM_FLAG} 2>/dev/null | grep -q "^${CLIENT_NAME}$"; then
  echo "Vercel project ${CLIENT_NAME} already exists, skipping creation."
else
  echo "Creating Vercel project ${CLIENT_NAME}..."
  vercel project add "${CLIENT_NAME}" ${TEAM_FLAG}

  echo "Connecting to GitHub repository..."
  vercel git connect "https://github.com/${REPO_NAME}" ${TEAM_FLAG} --yes
fi

echo ""

# -----------------------------------------------------------------------------
# Step 6: Set environment variables
# -----------------------------------------------------------------------------
echo "=== Step 6: Setting environment variables ==="

set_vercel_env "POSTGRES_URL" "${POSTGRES_URL}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "PAYLOAD_SECRET" "${PAYLOAD_SECRET}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "CRON_SECRET" "${CRON_SECRET}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "PREVIEW_SECRET" "${PREVIEW_SECRET}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "RESEND_API_KEY" "${RESEND_API_KEY}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "BLOB_READ_WRITE_TOKEN" "${BLOB_TOKEN}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "FROM_EMAIL" "${FROM_EMAIL}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "FROM_NAME" "${FROM_NAME}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "SITE_NAME" "${SITE_NAME}" "${CLIENT_NAME}" "${TEAM_FLAG}"
set_vercel_env "SITE_DESCRIPTION" "${SITE_DESCRIPTION}" "${CLIENT_NAME}" "${TEAM_FLAG}"

if [[ -n "${TWITTER_HANDLE}" ]]; then
  set_vercel_env "TWITTER_HANDLE" "${TWITTER_HANDLE}" "${CLIENT_NAME}" "${TEAM_FLAG}"
fi

if [[ -n "${CLIENT_DOMAIN}" ]]; then
  set_vercel_env "NEXT_PUBLIC_SERVER_URL" "https://${CLIENT_DOMAIN}" "${CLIENT_NAME}" "${TEAM_FLAG}"
fi

echo "All environment variables set."
echo ""

# -----------------------------------------------------------------------------
# Step 7: Add custom domain
# -----------------------------------------------------------------------------
if [[ -n "${CLIENT_DOMAIN}" ]]; then
  echo "=== Step 7: Adding custom domain ==="
  vercel domains add "${CLIENT_DOMAIN}" --project "${CLIENT_NAME}" ${TEAM_FLAG} || true
  echo ""
else
  echo "=== Step 7: Skipping custom domain (none provided) ==="
  echo ""
fi

# -----------------------------------------------------------------------------
# Step 8: Run initial database migration
# -----------------------------------------------------------------------------
echo "=== Step 8: Running initial database migration ==="

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "${TEMP_DIR}"' EXIT

echo "Cloning repository to temporary directory..."
gh repo clone "${REPO_NAME}" "${TEMP_DIR}" -- --depth 1

echo "Installing dependencies..."
(cd "${TEMP_DIR}" && pnpm install --frozen-lockfile)

echo "Creating temporary .env for migration..."
cat > "${TEMP_DIR}/.env" <<ENVEOF
POSTGRES_URL=${POSTGRES_URL}
PAYLOAD_SECRET=${PAYLOAD_SECRET}
RESEND_API_KEY=${RESEND_API_KEY}
FROM_EMAIL=${FROM_EMAIL}
FROM_NAME=${FROM_NAME}
ENVEOF

echo "Running database migrations..."
(cd "${TEMP_DIR}" && echo y | pnpm payload migrate)

echo "Migrations complete."
echo ""

# -----------------------------------------------------------------------------
# Step 9: Summary
# -----------------------------------------------------------------------------
echo "========================================"
echo "Client provisioned successfully!"
echo "========================================"
echo ""
echo "  GitHub Repo:     https://github.com/${REPO_NAME}"
echo "  Vercel Project:  ${CLIENT_NAME}"
if [[ -n "${CLIENT_DOMAIN}" ]]; then
  echo "  Domain:          https://${CLIENT_DOMAIN}"
fi
echo "  Site Name:       ${SITE_NAME}"
echo "  Email Sender:    ${FROM_NAME} <${FROM_EMAIL}>"
echo ""
echo "Next steps:"
echo "  1. Configure DNS for ${CLIENT_DOMAIN:-your domain} → Vercel"
echo "  2. Verify Resend domain is set up for ${FROM_EMAIL}"
echo "  3. Trigger initial deploy: vercel deploy --prod --project ${CLIENT_NAME} ${TEAM_FLAG}"
echo "  4. Create first admin user at https://${CLIENT_DOMAIN:-your-domain}/admin"
echo "========================================"
