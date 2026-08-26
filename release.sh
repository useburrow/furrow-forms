#!/bin/bash
# Bump every version field together, refresh the .mcpb bundle, and print the
# two publish commands (both need your credentials, so they aren't run here).
#
#   ./release.sh 1.0.2
#
# Touches: packages/mcp/package.json (+ lockfile), server.json (server and
# npm package entries), mcpb/manifest.json. Rebuilds mcpb/furrow-forms-<v>.mcpb.
set -euo pipefail
cd "$(dirname "$0")"

V="${1:-}"
[[ "$V" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "usage: ./release.sh <semver>  e.g. 1.0.2" >&2; exit 1; }
CUR=$(node -p "require('./packages/mcp/package.json').version")
[[ "$V" != "$CUR" ]] || { echo "already at $CUR" >&2; exit 1; }
[[ -z "$(git status --porcelain -- packages server.json mcpb/manifest.json mcpb/server)" ]] \
  || { echo "commit or stash changes to release files first" >&2; exit 1; }

echo "» $CUR → $V" >&2

# package.json + lockfile (root entry only; dependencies untouched)
(cd packages/mcp && npm version "$V" --no-git-tag-version --allow-same-version >/dev/null)

# server.json: the server's own version and the npm package's version
node -e '
  const fs = require("fs"); const v = process.argv[1];
  const s = JSON.parse(fs.readFileSync("server.json", "utf8"));
  s.version = v; for (const p of s.packages ?? []) p.version = v;
  fs.writeFileSync("server.json", JSON.stringify(s, null, 2) + "\n");
' "$V"

# mcpb manifest + bundle (server/index.js mirrors the npm bin)
node -e '
  const fs = require("fs"); const v = process.argv[1];
  const m = JSON.parse(fs.readFileSync("mcpb/manifest.json", "utf8"));
  m.version = v; fs.writeFileSync("mcpb/manifest.json", JSON.stringify(m, null, 2) + "\n");
' "$V"
cp packages/mcp/bin/furrow-forms-mcp.js mcpb/server/index.js
( cd mcpb
  [[ -d node_modules/mcp-remote ]] || npm install --omit=dev --silent
  [[ -f icon.png ]] || curl -fsSL -o icon.png https://api.furrowforms.com/brand/icon.png
  rm -f ./*.mcpb
  npx -y @anthropic-ai/mcpb pack >/dev/null
  mv mcpb.mcpb "furrow-forms-$V.mcpb" )

git add packages/mcp/package.json packages/mcp/package-lock.json server.json mcpb/manifest.json mcpb/server/index.js
git commit -qm "Release $V"
git tag "v$V"

cat >&2 <<MSG

✓ Bumped to $V, committed, tagged v$V. Bundle: mcpb/furrow-forms-$V.mcpb

Now run:
  git push && git push --tags
  (cd packages/mcp && npm publish --access public)     # 2FA prompt
  mcp-publisher publish                                # re-login if expired:
     mcp-publisher login dns --domain furrowforms.com --private-key \$(cat ~/.config/mcp-publisher/furrowforms.hex)
  Then re-submit mcpb/furrow-forms-$V.mcpb to the Claude Desktop directory.
MSG
