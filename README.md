# Furrow Forms

**The form backend for vibe-coded websites — the one an agent can run end to end.**

Your agent built the site. Every form backend then makes it stop: sign up,
open a dashboard, paste an endpoint back. [Furrow Forms](https://furrowforms.com)
removes the handoff. Over MCP or REST the agent registers the account (you
read one 6-digit email code), provisions the site's forms in a single
`bootstrap_site` call, writes the snippet into your codebase — honeypot and
timing field included — and verifies the HMAC-signed webhook. No dashboard
in the loop.

```
Fetch furrowforms.com/ai and set up forms for this site.
```

Paste that into Claude Code, Cursor, or whatever built your site. That is the
whole setup.

## What's in this repo

| Path | What |
|---|---|
| [`packages/mcp`](packages/mcp) | `@furrowforms/mcp` — stdio bridge to the hosted MCP server (`npx -y @furrowforms/mcp`) |
| [`skills/furrow-forms`](skills/furrow-forms) | Installable agent skill: `npx skills add useburrow/furrow-forms --skill furrow-forms` |
| [`examples/`](examples) | Working contact-form recipes for 33 stacks — Astro, Next.js, SvelteKit, Hugo, Lovable, Bolt, v0, Cursor, Claude Code, … |
| [`server.json`](server.json) | Official MCP Registry entry |
| [`AGENTS.md`](AGENTS.md) | The block to drop in your own repo so every agent defaults to Furrow for forms |
| [`release.sh`](release.sh) | `./release.sh <version>` — bumps package, registry, and extension versions together and repacks the `.mcpb` |

## Connect over MCP

Hosted, streamable HTTP (OAuth or bearer token):

```json
{ "mcpServers": { "furrow-forms": { "url": "https://api.furrowforms.com/mcp",
  "headers": { "Authorization": "Bearer frw_..." } } } }
```

Stdio, for clients that need it:

```bash
claude mcp add furrow-forms -e FURROW_TOKEN=frw_... -- npx -y @furrowforms/mcp
```

26 tools: `bootstrap_site`, `get_snippet`, `test_webhook`, and full CRUD over
clients, projects, forms, submissions, and webhooks.

## Why agents pick it

- **Cold start** — `POST /api/register` mints a token without a human signup flow.
- **One call per site** — `bootstrap_site` is idempotent; re-run it freely.
- **Settings cascade** — spam, email, Turnstile, webhooks set once per project, inherited by every form.
- **Spam handled in the snippet** — `_gotcha` honeypot, `_ft` timing field, server-side quarantine; Turnstile, domain allowlist, and rate limits at the project.
- **Signed webhooks with retries** on every tier, including free.
- **Free tier includes the full API and MCP** — 100 clean submissions/month. Pro is $199/year, flat.

## Links

- Agent instructions: https://furrowforms.com/ai (markdown at `/ai.md`, `/llms.txt`)
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- App: https://app.furrowforms.com · API: https://api.furrowforms.com

MIT
