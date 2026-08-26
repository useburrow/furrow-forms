# Claude Code + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/claude-code (category: AI site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Claude Code builds the site from the terminal — and then, like every agent, hits the form: there is a POST with nowhere to go, and every form service wants a human to sign up and paste a key back. Furrow Forms was built for this moment. The agent fetches one URL, registers the account via the API (you read a 6-digit code), provisions the client, site, and forms in a single bootstrap_site call, writes the snippet, and verifies the webhook. With the Furrow MCP server installed, every later change — new forms, Turnstile keys, notify emails, key rotation — is a prompt, not a dashboard visit.

## The integration

The only code change. For ongoing edits, install the MCP server: claude mcp add furrow-forms --transport http https://api.furrowforms.com/mcp

**What the agent writes · src/pages/contact.astro**

```astro
<form action="https://api.furrowforms.com/s/fp_k7m2" method="POST">
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
  <input type="hidden" name="_ft" value="" />
  <script>document.currentScript.previousElementSibling.value = Date.now();</script>
  <input name="name" type="text" required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>
```

Replace `fp_k7m2` with the form's real public key. Public keys are safe in
client-side HTML — protection comes from the spam stack, not secrecy.

## Endpoint facts

- Submit: `POST https://api.furrowforms.com/s/<public_key>` (JSON,
  urlencoded, or multipart).
- Classic HTML POST → 303 redirect to the configured thank-you page.
  `fetch()` → `{ "ok": true, "id": "<submission_id>" }`.
- Spam stack: honeypot field `_gotcha` (keep hidden and empty), timing
  field `_ft` (hidden input the page sets to `Date.now()` on load;
  omitting it from JSON/agent clients is fine), optional Cloudflare
  Turnstile (project-level keys), per-project domain allowlist, per-IP
  per-form rate limiting (default 10 req / 60 s), and server-side filtering.
- Caught spam gets a normal 200 and is quarantined — never emailed, never
  delivered by webhook, never counted toward quota.
- File uploads: opt-in per project (off by default), inherited by every
  form. Multipart with a normal file input only — JSON cannot carry files;
  multi-file fields use the `[]` suffix (`name="resume[]"`). Default
  types: PDF, JPEG, PNG, WebP. Files land in a private per-project inbox
  linked from emails and webhooks — never raw file URLs.
- CORS honors the project's allowed domains; add the site's domain before
  testing from a browser.
- Webhooks (optional): HMAC-SHA256 signed, retried with backoff up to 8
  attempts over ~24 h, logged, testable via `test_webhook`.

## Agent setup (recommended)

1. No `frw_` token? Cold-start: `GET https://api.furrowforms.com/api/register`
   for the flow, `POST /api/register`, have the user read the 6-digit email
   code, `POST /api/register/verify`. The token is shown exactly once.
2. Connect MCP at `https://api.furrowforms.com/mcp`
   (`Authorization: Bearer frw_...`) or use REST.
3. `bootstrap_site` — one idempotent call creates the client, the project
   (domains, Turnstile keys, notify emails, webhook), and all forms.
4. `get_snippet` — generated frontend code from the field contract.
5. `test_webhook` — verify the signed delivery before going live.

## Manual setup

1. Paste the prompt into Claude Code. No account needed first.
2. Read the 6-digit code Furrow emails you and paste it into the session.
3. The agent provisions the site, edits your form markup, and fires a test webhook.
4. Install the Furrow MCP server so future changes are one prompt away.

## FAQ

### How do I add the Furrow MCP server to Claude Code?

Run `claude mcp add furrow-forms --transport http https://api.furrowforms.com/mcp` and authenticate with your frw_ token. The server exposes the full control plane — clients, projects, forms, snippets, submissions, and webhooks — as typed tools, including bootstrap_site.

### Can Claude Code set this up with zero clicks from me?

One step is yours: reading the 6-digit registration code from your email and pasting it into the session. Everything else — account, site, forms, snippet, webhook verification — the agent does over the API.

### Is this only for static sites?

It is for any site where the form lives in your codebase: plain HTML, Astro, Next.js, SvelteKit, and so on. Furrow is the backend behind the form; there is no hosted form page and no visual builder.

## Related recipes

- https://furrowforms.com/forms-for/cursor.md
- https://furrowforms.com/forms-for/v0.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/vercel.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/claude-code.md
