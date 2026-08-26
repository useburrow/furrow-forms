# Bolt + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/bolt (category: AI site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Bolt.new builds real projects — an in-browser environment where a prompt becomes a running app you can deploy. Its contact forms have the same gap as every generated frontend: no backend on the other side of submit. Furrow Forms closes the gap without changing the workflow. One instruction makes the form POST to your endpoint; better yet, the agent working in Bolt can read furrowforms.com/ai and provision the backend itself — account, forms, snippet, webhook verification — while it builds the site around it.

## The integration

Bolt applies it to the generated code; the endpoint does the rest.

**Prompt to paste into Bolt**

```text
Make the contact form functional:
- POST the FormData to https://api.furrowforms.com/s/fp_k7m2
- add a hidden text input named "_gotcha" (honeypot, keep empty)
- add a hidden input named "_ft" set to Date.now() on page load (timing check)
- treat response JSON { ok: true } as success
- no backend code needed — the endpoint handles spam, storage, and email
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

1. Create a free Furrow account and form — or let the agent in Bolt cold-start one from the prompt above.
2. Apply the integration prompt so the form POSTs to your endpoint.
3. Add the deployed domain to the allowlist and set notify emails on the project.
4. Deploy from Bolt; the form is live, spam-filtered, and verifiable.

## FAQ

### How do I hook up the contact form on a Bolt-built site?

Prompt Bolt to POST the form’s FormData to a Furrow Forms endpoint with a hidden _gotcha honeypot field. Furrow handles spam, storage, and notifications — the generated project needs no backend code.

### Can the agent inside Bolt set up Furrow for me?

Yes. Furrow is built to be operated by agents: registration over API (you read one 6-digit email code), one-call site provisioning via bootstrap_site, snippet generation, and webhook testing. Point the agent at furrowforms.com/ai and it has the full instructions.

### What happens to spam on a brand-new site?

It is filtered before it costs you anything: honeypot-caught and rejected posts are never stored and never count toward your quota. Add Turnstile keys and a domain allowlist at the project level for the full stack.

## Related recipes

- https://furrowforms.com/forms-for/v0.md
- https://furrowforms.com/forms-for/lovable.md
- https://furrowforms.com/forms-for/netlify.md
- https://furrowforms.com/forms-for/cloudflare-pages.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/bolt.md
