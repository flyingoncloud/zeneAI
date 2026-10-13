#!/bin/bash
#
# Sync the zene-sandtray module into the zeneme-next Next.js app.
#
#   ./sync-sandtray.sh                      # from ./zene-sandtray into ./zeneme-next
#   ./sync-sandtray.sh path/to/zene-sandtray
#   ./sync-sandtray.sh path/to/src zeneme-next
#
# Re-run this whenever a fresh zene-sandtray drop is unzipped. It copies the
# sandtray source and assets into the host app and re-applies the integration
# transforms (see TRANSFORMS below). It is idempotent: it overwrites the files
# it owns and leaves host-owned files alone.
#
# It does NOT edit package.json or globals.css — those were merged once by hand.
# Instead it VERIFIES them at the end and warns if the required dependencies or
# the scoped CSS block are missing, so an upstream change that needs them is not
# silently dropped.
#
# TRANSFORMS (why this is more than a plain copy):
#   1. sandtray's src/lib/api.ts collides with the host's own src/lib/api.ts,
#      so it lands as src/lib/sandtrayApi.ts and its importers are repointed.
#   2. sandtray's Dialog (has `showCloseButton`) differs from the host's, so it
#      lands as src/components/sandtray/dialog.tsx and HistoryDrawer is repointed.
#   3. the host root layout/providers/page/globals are kept; sandtray's providers
#      are scoped to /sandtray/* via a generated src/app/sandtray/layout.tsx.
#   4. public/audio is merged (sandtray's ambient/ + sand/ beside the host's bgm).

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
step() { echo -e "\n${YELLOW}$*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
warn() { echo -e "${YELLOW}! $*${NC}"; }
die()  { echo -e "${RED}✗ $*${NC}" >&2; exit 1; }

REPO_ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
SRC_ROOT="${1:-$REPO_ROOT/zene-sandtray}"
DST_ROOT="${2:-$REPO_ROOT/zeneme-next}"

S="$SRC_ROOT/src"
D="$DST_ROOT/src"
[ -d "$S" ]            || die "No src/ under source: $SRC_ROOT"
[ -d "$D/app" ]        || die "Target does not look like the Next app: $DST_ROOT"
[ -f "$D/lib/api.ts" ] || warn "Host src/lib/api.ts not found — the api rename may be unnecessary."

echo "Source: $SRC_ROOT"
echo "Target: $DST_ROOT"

# Host-owned files in shared folders that must never be overwritten by a sync.
HOST_LAYOUT_FILES=(AccountDropdown.tsx Sidebar.tsx SidebarFooter.tsx StarryBackground.tsx StarryLandscapeBackground.tsx TopBar.tsx)

# Replace a directory wholesale (sandtray owns it entirely).
sync_dir() {
  local rel="$1"
  [ -d "$S/$rel" ] || return 0
  rm -rf "${D:?}/$rel"
  mkdir -p "$(dirname "$D/$rel")"
  cp -R "$S/$rel" "$D/$rel"
  ok "src/$rel"
}

# ---------------------------------------------------------------------------
step "Syncing components..."
for dir in flow history icons report sandtray sprite; do sync_dir "components/$dir"; done

# layout/: merge sandtray's files, but never clobber a host-owned one.
mkdir -p "$D/components/layout"
for f in "$S"/components/layout/*; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  skip=false
  for h in "${HOST_LAYOUT_FILES[@]}"; do [ "$base" = "$h" ] && skip=true; done
  if $skip; then warn "kept host components/layout/$base"; else cp "$f" "$D/components/layout/$base"; fi
done
ok "components/layout (sandtray files)"

# ui/: keep the host's shadcn components. Only the differing Dialog is namespaced.
cp "$S/components/ui/dialog.tsx" "$D/components/sandtray/dialog.tsx"
ok "components/sandtray/dialog.tsx (namespaced sandtray Dialog)"

# ---------------------------------------------------------------------------
step "Syncing content / stores / types..."
for dir in content stores types; do sync_dir "$dir"; done

# ---------------------------------------------------------------------------
step "Syncing lib..."
for dir in ai audio db sandtray; do sync_dir "lib/$dir"; done
for f in base-path.ts lang.ts nav.ts session.ts utils.ts; do
  [ -f "$S/lib/$f" ] && cp "$S/lib/$f" "$D/lib/$f" && ok "lib/$f"
done
# api.ts -> sandtrayApi.ts (host already owns lib/api.ts)
cp "$S/lib/api.ts" "$D/lib/sandtrayApi.ts"
ok "lib/sandtrayApi.ts (renamed from sandtray lib/api.ts)"

# ---------------------------------------------------------------------------
step "Syncing routes..."
sync_dir "app/sandtray"
sync_dir "app/api/sandtray"
sync_dir "app/login"
# sandtray's root providers.tsx is reused, scoped under /sandtray.
cp "$S/app/providers.tsx" "$D/app/sandtray/providers.tsx"
ok "app/sandtray/providers.tsx"

# Generated section layout: carries sandtray's providers + font, scoped to
# /sandtray/* so the host root layout is untouched. Overwrites sandtray's own
# (plain) section layout, which only renders the .sandtray-root wrapper.
cat > "$D/app/sandtray/layout.tsx" <<'LAYOUT'
// 沙盘各页共用的外框。流程是线性的（引导 → 准备 → 冥想 → 沙盘 → 报告），
// 所以不放全局导航，各页自己的顶栏负责返回。
//
// 接入 ZeneWe 后，沙盘自带的语言、主题、提示等 Provider 收在这一层，
// 只作用于 /sandtray/* 路由，不影响站点根布局。
//
// 本文件由 sync-sandtray.sh 生成，手改会在下次同步时被覆盖。
import { Geist } from "next/font/google"
import { getLang } from "@/lib/lang"
import { LangProvider } from "@/components/layout/LangProvider"
import { Providers } from "./providers"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export default async function SandtrayLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <LangProvider lang={lang}>
      <Providers>
        <div className={`sandtray-root ${geist.variable} flex h-dvh w-full flex-col overflow-hidden bg-surface`}>
          {children}
        </div>
      </Providers>
    </LangProvider>
  )
}
LAYOUT
ok "app/sandtray/layout.tsx (generated, provider-scoped)"

# ---------------------------------------------------------------------------
step "Rewriting imports in synced files..."
# Scope the rewrites to the trees we just copied, so host files are never touched.
SYNCED_TREES=(
  "$D/components/flow" "$D/components/history" "$D/components/report"
  "$D/components/sandtray" "$D/components/sprite" "$D/components/icons"
  "$D/app/sandtray" "$D/app/api/sandtray" "$D/app/login"
)
# Collect the sandtray layout files we copied too.
while IFS= read -r f; do SYNCED_TREES+=("$f"); done < <(find "$D/components/layout" -maxdepth 1 -name '*.tsx' 2>/dev/null)

rewrite() {
  local from="$1" to="$2" n=0
  while IFS= read -r f; do
    if grep -q "$from" "$f"; then perl -i -pe "s{\Q$from\E}{$to}g" "$f"; n=$((n+1)); fi
  done < <(find "${SYNCED_TREES[@]}" -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null)
  echo "  $n file(s): $from -> $to"
}
rewrite 'from "@/lib/api"'            'from "@/lib/sandtrayApi"'
rewrite 'from "@/components/ui/dialog"' 'from "@/components/sandtray/dialog"'
ok "imports repointed"

# ---------------------------------------------------------------------------
step "Syncing public assets..."
P="$SRC_ROOT/public"
DP="$DST_ROOT/public"
for dir in figures draco design; do
  [ -d "$P/$dir" ] || continue
  rm -rf "${DP:?}/$dir"; cp -R "$P/$dir" "$DP/$dir"; ok "public/$dir"
done
# audio: merge sandtray's subfolders beside any host audio (e.g. bgm.mp4).
if [ -d "$P/audio" ]; then
  mkdir -p "$DP/audio"
  for sub in "$P"/audio/*; do
    [ -e "$sub" ] || continue
    name="$(basename "$sub")"
    rm -rf "$DP/audio/$name"; cp -R "$sub" "$DP/audio/$name"
  done
  ok "public/audio (merged)"
fi

# ---------------------------------------------------------------------------
step "Verifying one-time merges (package.json, globals.css)..."
PKG="$DST_ROOT/package.json"
MISSING=()
for dep in three @react-three/fiber @react-three/drei mongodb openai nodemailer radix-ui tw-animate-css; do
  grep -q "\"$dep\"" "$PKG" || MISSING+=("$dep")
done
if [ ${#MISSING[@]} -eq 0 ]; then ok "all sandtray dependencies present in package.json"
else warn "package.json is missing deps: ${MISSING[*]} — add them and run npm install."; fi

if grep -q "zene-sandtray — integrated styles" "$D/app/globals.css"; then
  ok "scoped sandtray CSS block present in globals.css"
else
  warn "globals.css has no sandtray block (marker 'zene-sandtray — integrated styles')."
  warn "If the sandtray palette/animations changed upstream, re-merge src/app/globals.css."
fi

echo ""
ok "Sync complete. Build with: (cd $DST_ROOT && npm install && npm run build)"
