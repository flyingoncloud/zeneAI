#!/bin/bash
#
# Routine code deploy for zeneAI. Run it on the server, from anywhere:
#
#   ./deploy.sh                    # both tiers, current branch
#   ./deploy.sh --frontend         # frontend only (most deploys)
#   ./deploy.sh --branch main      # deploy a specific branch
#   ./deploy.sh --no-pull          # build what is already checked out
#
# This script deploys code that is already configured. It does not install
# nginx, systemd units, or SSL — see setup-nginx.sh and deploy-production.sh
# for first-time setup of a host.
#
# Everything is derived at runtime rather than hardcoded, because the two hosts
# this has run on disagree on all of it: the repo lives at /app/zeneAI on the
# Amazon Linux box and ~/zeneAI on the Debian one, and the frontend has been
# supervised by both systemd and pm2. Paths come from the script's own location
# and the supervisor is detected, so the script does not need to know which host
# it is on.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step()  { echo -e "\n${YELLOW}$*${NC}"; }
ok()    { echo -e "${GREEN}✓ $*${NC}"; }
fail()  { echo -e "${RED}✗ $*${NC}" >&2; }
die()   { fail "$*"; exit 1; }

REPO_ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
FRONTEND_DIR="$REPO_ROOT/zeneme-next"
BACKEND_DIR="$REPO_ROOT/ai-chat-api"

# The interpreter to install into. This has to be the same one the supervisor
# runs the app with, and a bare `python` is not: under conda it resolves to
# whichever env happens to be active in the deploying shell. From `base` that
# meant pip building the whole pinned stack from source for a Python the service
# never runs, which looks like a hang and then fails. Check with
# `pm2 describe zeneai-backend | grep interpreter`.
BACKEND_PYTHON="${BACKEND_PYTHON:-python}"

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
# Hit a real page rather than /: a route that renders without a session proves
# the build is actually serving, not just that a process is listening.
FRONTEND_HEALTH_PATH="${FRONTEND_HEALTH_PATH:-/cognitive}"
BACKEND_HEALTH_PATH="${BACKEND_HEALTH_PATH:-/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-20}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-3}"

DO_FRONTEND=false
DO_BACKEND=false
DO_PULL=true
BRANCH=""

while [ $# -gt 0 ]; do
  case "$1" in
    --frontend) DO_FRONTEND=true ;;
    --backend)  DO_BACKEND=true ;;
    --no-pull)  DO_PULL=false ;;
    --branch)   BRANCH="${2:-}"; [ -n "$BRANCH" ] || die "--branch needs a value"; shift ;;
    -h|--help)  sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)          die "Unknown option: $1 (try --help)" ;;
  esac
  shift
done

# No tier flags means both.
if ! $DO_FRONTEND && ! $DO_BACKEND; then
  DO_FRONTEND=true
  DO_BACKEND=true
fi

[ "$(id -u)" -ne 0 ] || die "Do not run as root; the script uses sudo where it needs to."

echo "=========================================="
echo "zeneAI deploy"
echo "=========================================="
TIERS=""
if $DO_FRONTEND; then TIERS="frontend"; fi
if $DO_BACKEND;  then TIERS="${TIERS:+$TIERS + }backend"; fi

echo "Repo:     $REPO_ROOT"
echo "Tiers:    $TIERS"

# ---------------------------------------------------------------------------
# Supervisor detection
# ---------------------------------------------------------------------------

# Echoes "systemd <unit>" or "pm2 <name>" for a tier, or nothing if neither
# supervisor knows about it. Checked before anything is built, so a host that
# cannot be restarted fails before its running build is touched.
detect_supervisor() {
  local unit="$1" pm2_name="$2"
  if command -v systemctl >/dev/null 2>&1 &&
     systemctl list-unit-files "$unit.service" >/dev/null 2>&1 &&
     [ -n "$(systemctl list-unit-files --no-legend "$unit.service" 2>/dev/null)" ]; then
    echo "systemd $unit"
  elif command -v pm2 >/dev/null 2>&1 && pm2 describe "$pm2_name" >/dev/null 2>&1; then
    echo "pm2 $pm2_name"
  fi
}

restart_service() {
  local kind="$1" name="$2"
  case "$kind" in
    systemd) sudo systemctl restart "$name" ;;
    pm2)     pm2 restart "$name" ;;
  esac
}

service_logs_hint() {
  local kind="$1" name="$2"
  case "$kind" in
    systemd) echo "sudo journalctl -u $name -n 50 --no-pager" ;;
    pm2)     echo "pm2 logs $name --lines 50" ;;
  esac
}

FRONTEND_SUPERVISOR=""
BACKEND_SUPERVISOR=""
if $DO_FRONTEND; then
  FRONTEND_SUPERVISOR="$(detect_supervisor zeneme-frontend zeneai-frontend)"
  [ -n "$FRONTEND_SUPERVISOR" ] || die "No zeneme-frontend systemd unit and no zeneai-frontend pm2 process. Install one first (see systemd/ or setup-nginx.sh)."
  echo "Frontend: $FRONTEND_SUPERVISOR"
fi
if $DO_BACKEND; then
  BACKEND_SUPERVISOR="$(detect_supervisor zeneme-backend zeneai-backend)"
  [ -n "$BACKEND_SUPERVISOR" ] || die "No zeneme-backend systemd unit and no zeneai-backend pm2 process. Install one first (see systemd/ or setup-nginx.sh)."
  echo "Backend:  $BACKEND_SUPERVISOR"
fi

# Waits for a tier to answer on localhost. Returns non-zero if it never does.
wait_healthy() {
  local url="$1" label="$2" i
  for ((i = 1; i <= HEALTH_RETRIES; i++)); do
    if curl -fsS -o /dev/null --max-time 5 "$url"; then
      ok "$label healthy ($url)"
      return 0
    fi
    sleep "$HEALTH_INTERVAL"
  done
  fail "$label did not become healthy at $url after $((HEALTH_RETRIES * HEALTH_INTERVAL))s"
  return 1
}

# ---------------------------------------------------------------------------
# Code
# ---------------------------------------------------------------------------

cd "$REPO_ROOT"

if $DO_PULL; then
  step "Updating code..."
  [ -z "$(git status --porcelain --untracked-files=no)" ] ||
    die "Working tree has uncommitted changes. Commit, stash, or use --no-pull."

  TARGET_BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
  [ "$TARGET_BRANCH" != "HEAD" ] || die "Detached HEAD; pass --branch <name>."

  git fetch origin "$TARGET_BRANCH"
  git checkout "$TARGET_BRANCH"
  # --ff-only: a deploy should replay what is on the remote, never invent a
  # merge commit on the server that exists nowhere else.
  git merge --ff-only "origin/$TARGET_BRANCH"
  ok "On $TARGET_BRANCH at $(git rev-parse --short HEAD)"
else
  ok "Skipping pull; deploying $(git rev-parse --abbrev-ref HEAD) at $(git rev-parse --short HEAD)"
fi

DEPLOYED_REF="$(git rev-parse --short HEAD)"

# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------

if $DO_BACKEND; then
  step "Deploying backend..."
  cd "$BACKEND_DIR"
  [ -f .env ] || die ".env not found in $BACKEND_DIR (copy from .env.production.example)"

  if [ -f requirements.txt ]; then
    command -v "$BACKEND_PYTHON" >/dev/null ||
      die "BACKEND_PYTHON ($BACKEND_PYTHON) not found."
    # Named, because installing into the wrong interpreter is otherwise silent:
    # pip succeeds, the service restarts on its own untouched env, and the
    # deploy reports success having shipped nothing.
    ok "Using $(command -v "$BACKEND_PYTHON") ($("$BACKEND_PYTHON" -V 2>&1))"
    "$BACKEND_PYTHON" -m pip install -r requirements.txt --quiet
    ok "Python dependencies installed"
  fi

  read -r kind name <<<"$BACKEND_SUPERVISOR"
  restart_service "$kind" "$name"
  ok "Backend restarted"

  if ! wait_healthy "http://127.0.0.1:$BACKEND_PORT$BACKEND_HEALTH_PATH" "Backend"; then
    fail "Check logs: $(service_logs_hint "$kind" "$name")"
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------

if $DO_FRONTEND; then
  step "Deploying frontend..."
  cd "$FRONTEND_DIR"
  [ -f .env.local ] || die ".env.local not found in $FRONTEND_DIR (copy from .env.local.example)"

  if [ -f package-lock.json ]; then
    npm ci --silent
  else
    npm install --silent
  fi
  ok "Node dependencies installed"

  # next build replaces .next in place, so a build that fails halfway leaves the
  # running server serving a directory that no longer matches the chunks its
  # pages ask for. Keeping the previous build gives something to put back.
  PREVIOUS_BUILD=""
  if [ -d .next ]; then
    PREVIOUS_BUILD="$FRONTEND_DIR/.next.previous"
    rm -rf "$PREVIOUS_BUILD"
    cp -a .next "$PREVIOUS_BUILD"
  fi

  restore_previous_build() {
    [ -n "$PREVIOUS_BUILD" ] && [ -d "$PREVIOUS_BUILD" ] || return 0
    fail "Restoring previous build"
    rm -rf "$FRONTEND_DIR/.next"
    mv "$PREVIOUS_BUILD" "$FRONTEND_DIR/.next"
    read -r kind name <<<"$FRONTEND_SUPERVISOR"
    restart_service "$kind" "$name" || true
  }

  echo "Building Next.js (this takes a minute)..."
  if ! npm run build; then
    restore_previous_build
    die "Frontend build failed; previous build restored."
  fi
  ok "Frontend built"

  read -r kind name <<<"$FRONTEND_SUPERVISOR"
  restart_service "$kind" "$name"
  ok "Frontend restarted"

  if ! wait_healthy "http://127.0.0.1:$FRONTEND_PORT$FRONTEND_HEALTH_PATH" "Frontend"; then
    fail "Check logs: $(service_logs_hint "$kind" "$name")"
    restore_previous_build
    die "Frontend unhealthy after restart; previous build restored."
  fi

  [ -z "$PREVIOUS_BUILD" ] || rm -rf "$PREVIOUS_BUILD"
fi

# ---------------------------------------------------------------------------

step "Deployed $DEPLOYED_REF"
if $DO_FRONTEND; then echo "  Frontend: http://127.0.0.1:$FRONTEND_PORT$FRONTEND_HEALTH_PATH"; fi
if $DO_BACKEND;  then echo "  Backend:  http://127.0.0.1:$BACKEND_PORT$BACKEND_HEALTH_PATH"; fi
echo ""
ok "Done"
