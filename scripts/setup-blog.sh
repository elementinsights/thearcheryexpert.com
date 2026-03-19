#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
#  Slate Blog Setup Script
#  Creates a new blog from the Slate template in one command.
# ──────────────────────────────────────────────────────────

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ──────────────────────────────────────────────────────────
#  Usage
# ──────────────────────────────────────────────────────────
usage() {
  cat <<USAGE
${BOLD}Slate Blog Setup${NC}

${CYAN}Usage:${NC}
  $(basename "$0") <site-name> <domain> <accent-color> [worker-name]

${CYAN}Arguments:${NC}
  ${BOLD}site-name${NC}      Blog name shown in header/branding  (e.g. "WaterNerd")
  ${BOLD}domain${NC}         Full domain with TLD                 (e.g. "waternerd.com")
  ${BOLD}accent-color${NC}   Hex color code with #                (e.g. "#0ea5e9")
  ${BOLD}worker-name${NC}    Cloudflare Worker name (optional)    (e.g. "waternerd-blog")
                  Auto-generated from domain if omitted.

${CYAN}Example:${NC}
  $(basename "$0") "WaterNerd" "waternerd.com" "#0ea5e9" "waternerd-blog"

USAGE
  exit 1
}

# ──────────────────────────────────────────────────────────
#  Helpers
# ──────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()    { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ──────────────────────────────────────────────────────────
#  Validate args
# ──────────────────────────────────────────────────────────
[[ $# -lt 3 ]] && usage

SITE_NAME="$1"
DOMAIN="$2"
ACCENT="$3"

# Derive short name (domain without TLD) for directory + worker name
SHORT_NAME="${DOMAIN%%.*}"
WORKER_NAME="${4:-${SHORT_NAME}-blog}"

SITE_URL="https://www.${DOMAIN}"
TARGET_DIR="$(pwd)/${SHORT_NAME}"

# Extract the last word of the site name for nameHighlight
NAME_HIGHLIGHT="${SITE_NAME##* }"

# ──────────────────────────────────────────────────────────
#  Validate inputs
# ──────────────────────────────────────────────────────────
# Domain must contain a dot
[[ "$DOMAIN" != *.* ]] && fail "Domain must include a TLD (e.g. waternerd.com)"

# Accent must start with #
[[ "$ACCENT" != \#* ]] && fail "Accent color must be a hex code starting with # (e.g. #0ea5e9)"

# Target directory must not already exist
[[ -d "$TARGET_DIR" ]] && fail "Directory already exists: ${TARGET_DIR}"

# Git must be available
command -v git  >/dev/null 2>&1 || fail "git is not installed"
command -v npm  >/dev/null 2>&1 || fail "npm is not installed"
command -v sed  >/dev/null 2>&1 || fail "sed is not installed"

# ──────────────────────────────────────────────────────────
#  Summary before starting
# ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Setting up new Slate blog${NC}"
echo -e "  Site name:      ${CYAN}${SITE_NAME}${NC}"
echo -e "  Name highlight: ${CYAN}${NAME_HIGHLIGHT}${NC}"
echo -e "  Domain:         ${CYAN}${DOMAIN}${NC}"
echo -e "  Site URL:       ${CYAN}${SITE_URL}${NC}"
echo -e "  Accent color:   ${CYAN}${ACCENT}${NC}"
echo -e "  Worker name:    ${CYAN}${WORKER_NAME}${NC}"
echo -e "  Directory:      ${CYAN}${TARGET_DIR}${NC}"
echo ""

# ──────────────────────────────────────────────────────────
#  1. Clone the template repo
# ──────────────────────────────────────────────────────────
info "Cloning Slate template..."
git clone "https://elementinsightsolutions@github.com/elementinsights/slate.git" "$TARGET_DIR" \
  || fail "Failed to clone Slate repo"
success "Cloned into ${TARGET_DIR}"

# ──────────────────────────────────────────────────────────
#  2. Update site.config.ts
# ──────────────────────────────────────────────────────────
CONFIG="${TARGET_DIR}/site.config.ts"
info "Updating site.config.ts..."

# Escape special chars in replacement strings for sed
# (forward slashes, ampersands)
escape_sed() {
  printf '%s' "$1" | sed 's/[&/\]/\\&/g'
}

ESCAPED_NAME="$(escape_sed "$SITE_NAME")"
ESCAPED_HIGHLIGHT="$(escape_sed "$NAME_HIGHLIGHT")"
ESCAPED_DOMAIN="$(escape_sed "$DOMAIN")"
ESCAPED_URL="$(escape_sed "$SITE_URL")"
ESCAPED_ACCENT="$(escape_sed "$ACCENT")"

# name: "YourBlog" -> name: "SiteName"
sed -i '' "s/name: \"YourBlog\"/name: \"${ESCAPED_NAME}\"/" "$CONFIG"

# nameHighlight: "Blog" -> nameHighlight: "LastWord"
sed -i '' "s/nameHighlight: \"Blog\"/nameHighlight: \"${ESCAPED_HIGHLIGHT}\"/" "$CONFIG"

# domain: "domain.com" -> domain: "actual.com"
sed -i '' "s/domain: \"domain.com\"/domain: \"${ESCAPED_DOMAIN}\"/" "$CONFIG"

# url: "https://www.domain.com" -> url: "https://www.actual.com"
sed -i '' "s|url: \"https://www.domain.com\"|url: \"${ESCAPED_URL}\"|" "$CONFIG"

# accent color: #3b82f6 -> provided color
sed -i '' "s/#3b82f6/${ESCAPED_ACCENT}/g" "$CONFIG"

# contactSubjectPrefix: "YourBlog" -> "SiteName"
sed -i '' "s/contactSubjectPrefix: \"YourBlog\"/contactSubjectPrefix: \"${ESCAPED_NAME}\"/" "$CONFIG"

# amazonDisclaimer: "YourBlog is a participant..." -> "SiteName is a participant..."
sed -i '' "s/YourBlog is a participant/${ESCAPED_NAME} is a participant/" "$CONFIG"

success "site.config.ts updated"

# ──────────────────────────────────────────────────────────
#  3. Update wrangler.jsonc
# ──────────────────────────────────────────────────────────
WRANGLER="${TARGET_DIR}/wrangler.jsonc"
info "Updating wrangler.jsonc..."

ESCAPED_WORKER="$(escape_sed "$WORKER_NAME")"
sed -i '' "s/\"slate-blog\"/\"${ESCAPED_WORKER}\"/" "$WRANGLER"

success "wrangler.jsonc updated"

# ──────────────────────────────────────────────────────────
#  4. Update astro.config.mjs
# ──────────────────────────────────────────────────────────
ASTRO_CONFIG="${TARGET_DIR}/astro.config.mjs"
info "Updating astro.config.mjs..."

sed -i '' "s|https://www.domain.com|${SITE_URL}|g" "$ASTRO_CONFIG"

success "astro.config.mjs updated"

# ──────────────────────────────────────────────────────────
#  5. Update public/robots.txt
# ──────────────────────────────────────────────────────────
ROBOTS="${TARGET_DIR}/public/robots.txt"
if [[ -f "$ROBOTS" ]]; then
  info "Updating robots.txt..."
  sed -i '' "s|https://www.domain.com|${SITE_URL}|g" "$ROBOTS"
  success "robots.txt updated"
else
  warn "robots.txt not found -- skipping"
fi

# ──────────────────────────────────────────────────────────
#  6. Remove .git and reinitialize
# ──────────────────────────────────────────────────────────
info "Reinitializing git..."
rm -rf "${TARGET_DIR}/.git"
git -C "$TARGET_DIR" init -b main --quiet
success "Fresh git repo initialized on branch 'main'"

# ──────────────────────────────────────────────────────────
#  7. Install dependencies
# ──────────────────────────────────────────────────────────
info "Installing npm dependencies (this may take a minute)..."
(cd "$TARGET_DIR" && npm install --loglevel=warn) \
  || fail "npm install failed"
success "Dependencies installed"

# ──────────────────────────────────────────────────────────
#  Done!
# ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}========================================${NC}"
echo -e "${GREEN}${BOLD}  Blog created successfully!${NC}"
echo -e "${GREEN}${BOLD}========================================${NC}"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo ""
echo -e "  1. ${CYAN}cd ${SHORT_NAME}${NC}"
echo -e "  2. Edit ${CYAN}site.config.ts${NC} to customize:"
echo -e "     - Categories, social links, footer content"
echo -e "     - Author info, tagline, featured-in logos"
echo -e "  3. Add your first posts to ${CYAN}src/content/posts/${NC}"
echo -e "  4. Run the dev server:"
echo -e "     ${CYAN}npm run dev${NC}"
echo -e "  5. Set up the GitHub repo:"
echo -e "     ${CYAN}git remote add origin https://elementinsightsolutions@github.com/elementinsights/${SHORT_NAME}.git${NC}"
echo -e "     ${CYAN}git add -A && git commit -m 'Initial setup'${NC}"
echo -e "     ${CYAN}git push -u origin main${NC}"
echo -e "  6. Deploy to Cloudflare:"
echo -e "     ${CYAN}npx wrangler deploy${NC}"
echo ""
