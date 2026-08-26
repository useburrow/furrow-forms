# Cursor + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/cursor (category: AI site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Cursor will happily build the whole site — pages, styles, the contact form markup — and then stop at the form’s action attribute, because every form backend expects a human to go sign up and paste an endpoint back. Furrow Forms removes that handoff. Its control plane is MCP and REST from the first call: the agent registers the account (you read one email code), provisions the site and forms in a single bootstrap_site call, writes the snippet into your codebase, and verifies the webhook. Setting up forms becomes one more prompt in the same chat that built the site.

## The integration

The only code change. Endpoint, honeypot, and timing field come from bootstrap_site; Turnstile is added if you gave it keys.

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

1. Paste the prompt into Cursor’s agent chat (Composer). No account needed first.
2. Read the 6-digit code Furrow emails you and hand it to the agent.
3. The agent provisions the site, edits your form markup, and fires a test webhook.
4. Add the Furrow MCP server to Cursor for ongoing changes — rotate keys, change notify emails, add forms — by asking.

## FAQ

### Does Cursor need an MCP server for this, or is the URL enough?

The URL is enough: /ai carries the full REST reference, so the agent can register, provision, and verify with plain HTTP calls. Adding the Furrow MCP server (streamable HTTP or stdio) gives it the same operations as typed tools, which is nicer for ongoing changes.

### Do I have to create the Furrow account myself?

No. The agent calls POST /api/register, Furrow emails you a 6-digit code, you paste it into the chat, and the agent receives a team-scoped token. That is the only human step.

### What does the agent actually change in my code?

It edits your form markup: sets the action to your Furrow submit URL, adds a hidden _gotcha honeypot and an _ft timing field, and (if you gave it keys) the Turnstile widget. Nothing else — there is no SDK to install and no server route to add.

## Related recipes

- https://furrowforms.com/forms-for/claude-code.md
- https://furrowforms.com/forms-for/v0.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/nextjs.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/cursor.md
