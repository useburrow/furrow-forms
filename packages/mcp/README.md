# @furrowforms/mcp

[Furrow Forms](https://furrowforms.com) is a form backend an agent can run
end to end — register the account, provision a site's forms in one call,
generate the frontend snippet, filter spam, and verify HMAC-signed webhooks —
over MCP and REST, with no dashboard in the loop.

This package is the stdio entry point for clients that can't speak
streamable HTTP directly. It bridges to the hosted server at
`https://api.furrowforms.com/mcp` and exposes all 26 tools, including
`bootstrap_site`.

## Quick start

```bash
FURROW_TOKEN=frw_... npx -y @furrowforms/mcp
```

No token yet? Leave `FURROW_TOKEN` unset and the bridge runs the OAuth flow
in your browser — or let your agent mint one via the API:
`GET https://api.furrowforms.com/api/register` explains the flow (you read
one 6-digit email code).

## Client config

**Claude Code**

```bash
claude mcp add furrow-forms -e FURROW_TOKEN=frw_... -- npx -y @furrowforms/mcp
# or, hosted (no bridge):
claude mcp add --transport http furrow-forms https://api.furrowforms.com/mcp --header "Authorization: Bearer frw_..."
```

**Cursor / Windsurf / Claude Desktop** (`mcp.json` / `claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "furrow-forms": {
      "command": "npx",
      "args": ["-y", "@furrowforms/mcp"],
      "env": { "FURROW_TOKEN": "frw_..." }
    }
  }
}
```

Clients that support remote servers can skip the bridge and use
`{ "url": "https://api.furrowforms.com/mcp", "headers": { "Authorization": "Bearer frw_..." } }`.

## What the agent can do

- `bootstrap_site` — client + project (domains, Turnstile, notify emails, webhook) + every form, idempotent
- `get_snippet` — HTML / Astro / Next.js form code with honeypot and timing field wired
- `test_webhook` — signed test delivery, verify 200 OK
- list/create/update/archive clients, projects, forms; read submissions; rotate keys

Full agent instructions: https://furrowforms.com/ai · Docs: https://furrowforms.com/docs/mcp

## Env

| Var | Purpose |
|---|---|
| `FURROW_TOKEN` | `frw_…` bearer token. Optional if you want OAuth instead. |
| `FURROW_MCP_URL` | Override the server URL (self-hosted / local dev). |

MIT
