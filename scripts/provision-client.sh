#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# GlossyCMS Client Provisioning Script
# =============================================================================
# Creates a new client instance on *.glossysites.live with its own Vercel
# project and a Neon database branch from the template site.
#
# All instances deploy from the shared theresaanna/GlossyCMS repo.
# Each instance gets a Neon branch (copy-on-write) of the template database
# and shares the primary instance's Vercel Blob storage.
#
# Usage:
#   ./scripts/provision-client.sh --client-name <name> --team <vercel-team> [--domain <domain>]
#
# Environment variables:
#   VERCEL_TOKEN              - Required. Vercel API token.
#   RESEND_API_KEY            - Required. Shared Resend API key (or read from .env).
#   BLOB_READ_WRITE_TOKEN     - Required. Shared Vercel Blob token (or read from .env).
#   NEON_API_KEY              - Required. Neon API key for database branching.
#   NEON_TEMPLATE_PROJECT_ID  - Required. Neon project ID of the template database.
#
# Prerequisites:
#   - vercel CLI (authenticated)
#   - openssl, pnpm, curl, python3, psql
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Source helper functions
source "${SCRIPT_DIR}/provision-helpers.sh"

# -----------------------------------------------------------------------------
# Argument parsing
# -----------------------------------------------------------------------------
CLIENT_NAME=""
VERCEL_TEAM=""
CUSTOM_DOMAIN=""
SOURCE_REPO="theresaanna/GlossyCMS"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --client-name)
      CLIENT_NAME="$2"
      shift 2
      ;;
    --team)
      VERCEL_TEAM="$2"
      shift 2
      ;;
    --domain)
      CUSTOM_DOMAIN="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 --client-name <name> --team <vercel-team> [--domain <domain>]"
      echo ""
      echo "Options:"
      echo "  --client-name  Client identifier (used for project name and subdomain)"
      echo "  --team         Vercel team slug"
      echo "  --domain       Custom domain (default: <client-name>.glossysites.live)"
      echo "  --help         Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  VERCEL_TOKEN              Required. Vercel API token."
      echo "  RESEND_API_KEY            Required. Shared Resend API key."
      echo "  BLOB_READ_WRITE_TOKEN     Required. Shared Vercel Blob token."
      echo "  NEON_API_KEY              Required. Neon API key for branching."
      echo "  NEON_TEMPLATE_PROJECT_ID  Required. Template database project ID."
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

if [[ -z "${VERCEL_TEAM}" ]]; then
  echo "Error: --team is required"
  exit 1
fi

# Default domain to subdomain pattern
CLIENT_DOMAIN="${CUSTOM_DOMAIN:-${CLIENT_NAME}.glossysites.live}"
TEAM_FLAG="--scope ${VERCEL_TEAM}"
PROJECT_NAME="glossy-${CLIENT_NAME}"

# -----------------------------------------------------------------------------
# Step 1: Validate prerequisites
# -----------------------------------------------------------------------------
echo "=== Step 1: Validating prerequisites ==="

check_prerequisites

echo "Checking Vercel authentication..."
if ! vercel whoami ${TEAM_FLAG} &>/dev/null; then
  echo "Error: Not authenticated with Vercel CLI. Run: vercel login"
  exit 1
fi

# Resolve shared RESEND_API_KEY
if [[ -z "${RESEND_API_KEY:-}" ]]; then
  if [[ -f "${PROJECT_ROOT}/.env" ]]; then
    RESEND_API_KEY=$(grep -E "^RESEND_API_KEY=" "${PROJECT_ROOT}/.env" | cut -d= -f2- || true)
  fi
fi

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  read -rp "Shared Resend API key: " RESEND_API_KEY
  if [[ -z "${RESEND_API_KEY}" ]]; then
    echo "Error: RESEND_API_KEY is required"
    exit 1
  fi
fi

# Resolve shared BLOB_READ_WRITE_TOKEN
if [[ -z "${BLOB_READ_WRITE_TOKEN:-}" ]]; then
  if [[ -f "${PROJECT_ROOT}/.env" ]]; then
    BLOB_READ_WRITE_TOKEN=$(grep -E "^BLOB_READ_WRITE_TOKEN=" "${PROJECT_ROOT}/.env" | cut -d= -f2- || true)
  fi
fi

if [[ -z "${BLOB_READ_WRITE_TOKEN:-}" ]]; then
  read -rp "Shared Vercel Blob token: " BLOB_READ_WRITE_TOKEN
  if [[ -z "${BLOB_READ_WRITE_TOKEN}" ]]; then
    echo "Error: BLOB_READ_WRITE_TOKEN is required"
    exit 1
  fi
fi

# Validate Neon env vars
if [[ -z "${NEON_API_KEY:-}" ]]; then
  if [[ -f "${PROJECT_ROOT}/.env" ]]; then
    NEON_API_KEY=$(grep -E "^NEON_API_KEY=" "${PROJECT_ROOT}/.env" | cut -d= -f2- || true)
  fi
fi

if [[ -z "${NEON_API_KEY:-}" ]]; then
  echo "Error: NEON_API_KEY environment variable is required."
  echo "Create one at: https://console.neon.tech/app/settings/api-keys"
  exit 1
fi

if [[ -z "${NEON_TEMPLATE_PROJECT_ID:-}" ]]; then
  if [[ -f "${PROJECT_ROOT}/.env" ]]; then
    NEON_TEMPLATE_PROJECT_ID=$(grep -E "^NEON_TEMPLATE_PROJECT_ID=" "${PROJECT_ROOT}/.env" | cut -d= -f2- || true)
  fi
fi

if [[ -z "${NEON_TEMPLATE_PROJECT_ID:-}" ]]; then
  echo "Error: NEON_TEMPLATE_PROJECT_ID environment variable is required."
  echo "Find it in your Neon dashboard for the template database project."
  exit 1
fi

echo "All prerequisites met."
echo ""

# -----------------------------------------------------------------------------
# Step 2: Collect client configuration
# -----------------------------------------------------------------------------
echo "=== Step 2: Collecting client configuration ==="
echo "Domain will be: ${CLIENT_DOMAIN}"
echo "Press Enter to use the default value shown in brackets."
echo ""

read -rp "Sender email [hello@${CLIENT_DOMAIN}]: " FROM_EMAIL
FROM_EMAIL="${FROM_EMAIL:-hello@${CLIENT_DOMAIN}}"
read -rp "Sender name [${CLIENT_NAME}]: " FROM_NAME
FROM_NAME="${FROM_NAME:-${CLIENT_NAME}}"
read -rp "Site name [${CLIENT_NAME}]: " SITE_NAME
SITE_NAME="${SITE_NAME:-${CLIENT_NAME}}"
read -rp "Site description [A website powered by GlossyCMS.]: " SITE_DESCRIPTION
SITE_DESCRIPTION="${SITE_DESCRIPTION:-A website powered by GlossyCMS.}"
read -rp "Twitter/X handle (include @) []: " TWITTER_HANDLE
TWITTER_HANDLE="${TWITTER_HANDLE:-}"

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
# Step 4: Create Vercel project
# -----------------------------------------------------------------------------
echo "=== Step 4: Creating Vercel project ==="

if vercel project ls ${TEAM_FLAG} 2>/dev/null | grep -q "^${PROJECT_NAME}$"; then
  echo "Vercel project '${PROJECT_NAME}' already exists, skipping creation."
else
  echo "Creating Vercel project '${PROJECT_NAME}'..."
  vercel project add "${PROJECT_NAME}" ${TEAM_FLAG}

  echo "Connecting to shared GitHub repository..."
  vercel git connect "https://github.com/${SOURCE_REPO}" ${TEAM_FLAG} --yes
fi

echo ""

# -----------------------------------------------------------------------------
# Step 5: Create database branch from template
# -----------------------------------------------------------------------------
echo "=== Step 5: Creating database branch from template ==="

echo "Branching Neon database from template..."
BRANCH_RESULT=$(create_neon_branch "glossy-${CLIENT_NAME}")
NEON_BRANCH_ID=$(echo "${BRANCH_RESULT}" | python3 -c "import sys,json; print(json.load(sys.stdin)['branchId'])")
POSTGRES_URL=$(echo "${BRANCH_RESULT}" | python3 -c "import sys,json; print(json.load(sys.stdin)['connectionUri'])")
echo "Neon branch ID: ${NEON_BRANCH_ID}"

echo "Cleaning sensitive data from branched database..."
clean_branched_database "${POSTGRES_URL}" "${SITE_NAME}" "${SITE_DESCRIPTION}"

echo "Database branch created and cleaned."
echo ""

# -----------------------------------------------------------------------------
# Step 6: Set environment variables
# -----------------------------------------------------------------------------
echo "=== Step 6: Setting environment variables ==="

set_vercel_env "POSTGRES_URL" "${POSTGRES_URL}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "BLOB_READ_WRITE_TOKEN" "${BLOB_READ_WRITE_TOKEN}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "PAYLOAD_SECRET" "${PAYLOAD_SECRET}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "CRON_SECRET" "${CRON_SECRET}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "PREVIEW_SECRET" "${PREVIEW_SECRET}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "RESEND_API_KEY" "${RESEND_API_KEY}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "FROM_EMAIL" "${FROM_EMAIL}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "FROM_NAME" "${FROM_NAME}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "SITE_NAME" "${SITE_NAME}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "SITE_DESCRIPTION" "${SITE_DESCRIPTION}" "${PROJECT_NAME}" "${TEAM_FLAG}"
set_vercel_env "NEXT_PUBLIC_SERVER_URL" "https://${CLIENT_DOMAIN}" "${PROJECT_NAME}" "${TEAM_FLAG}"

if [[ -n "${TWITTER_HANDLE}" ]]; then
  set_vercel_env "TWITTER_HANDLE" "${TWITTER_HANDLE}" "${PROJECT_NAME}" "${TEAM_FLAG}"
fi

echo "All environment variables set."
echo ""

# -----------------------------------------------------------------------------
# Step 7: Add custom domain
# -----------------------------------------------------------------------------
echo "=== Step 7: Adding domain ==="
vercel domains add "${CLIENT_DOMAIN}" --project "${PROJECT_NAME}" ${TEAM_FLAG} || true
echo ""

# -----------------------------------------------------------------------------
# Step 8: Summary
# -----------------------------------------------------------------------------
echo "========================================"
echo "Client provisioned successfully!"
echo "========================================"
echo ""
echo "  Vercel Project:   ${PROJECT_NAME}"
echo "  Domain:           https://${CLIENT_DOMAIN}"
echo "  Site Name:        ${SITE_NAME}"
echo "  Email Sender:     ${FROM_NAME} <${FROM_EMAIL}>"
echo "  Neon Branch ID:   ${NEON_BRANCH_ID}"
echo ""
echo "Next steps:"
echo "  1. Ensure wildcard DNS is configured: *.glossysites.live CNAME cname.vercel-dns.com"
echo "  2. Verify Resend domain is set up for ${FROM_EMAIL}"
echo "  3. Push to main to trigger deploy, or run:"
echo "     vercel deploy --prod --project ${PROJECT_NAME} ${TEAM_FLAG}"
echo "  4. Create first admin user at https://${CLIENT_DOMAIN}/admin"
echo "========================================"
