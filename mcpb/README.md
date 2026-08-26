# Claude Desktop extension

`server/index.js` is a copy of `packages/mcp/bin/furrow-forms-mcp.js`; `package.json`
pins `mcp-remote` to the version in `packages/mcp/package-lock.json`.

```bash
cd mcpb
cp ../packages/mcp/bin/furrow-forms-mcp.js server/index.js
npm install --omit=dev
curl -fsSL -o icon.png https://api.furrowforms.com/brand/icon.png
npx -y @anthropic-ai/mcpb pack && mv mcpb.mcpb furrow-forms-$(jq -r .version manifest.json).mcpb
```

Test: drag the `.mcpb` onto Claude Desktop → Settings → Extensions. Submit via the
form linked from https://github.com/anthropics/mcpb. Bump `manifest.json` `version`
with the npm package on every release. Built bundles and node_modules are not committed.
