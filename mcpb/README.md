# Claude Desktop extension

```bash
cd mcpb && mkdir -p server && cp ../packages/mcp/bin/furrow-forms-mcp.js server/index.js
npm init -y && npm i mcp-remote
curl -o icon.png https://api.furrowforms.com/brand/icon.png
npx @anthropic-ai/mcpb pack   # → furrow-forms.mcpb
```
