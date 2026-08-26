# Lovable + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/lovable (category: AI site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Lovable turns a description into a deployed site — which makes it exactly the audience Furrow Forms was built for: people who ship by prompting, not by wiring infrastructure. When your Lovable site needs a contact or lead form, the heavyweight route is provisioning a database and an email pipeline; the lightweight route is one POST endpoint that already knows how to filter spam, store submissions, notify you, and webhook your tools. Tell Lovable to point the form at Furrow — or let a coding agent provision the backend end to end, account included.

## The integration

Lovable edits the generated code for you — this is the whole integration.

**Prompt to paste into Lovable**

```text
Connect the contact form to my form backend:
- submit the form as a POST (FormData) to https://api.furrowforms.com/s/fp_k7m2
- include a hidden text input named "_gotcha", left empty (honeypot)
- include a hidden input named "_ft" set to Date.now() on page load (timing check)
- show the success state when the response JSON has ok: true
- do not add a database or server route for this
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

1. Create a free Furrow account and form (or have an agent cold-start it from the prompt above).
2. Paste the integration prompt into Lovable so the form POSTs to your endpoint.
3. Add your published domain to the project’s allowlist and set notify emails.
4. Submissions now land in your inbox and dashboard — and anywhere you point the signed webhook.

## FAQ

### How do I make the contact form on my Lovable site actually send?

Tell Lovable to POST the form to a Furrow Forms endpoint (one prompt — copy it from this page). Furrow stores the submission, filters spam, and emails you; no database or server route in your Lovable project.

### When would I use a database instead?

When submissions are application data your app reads back — user profiles, orders, saved state. For contact, lead, and feedback forms, a form backend is simpler, safer, and comes with delivery guarantees: signed webhooks, retries, and a log.

### Can I move the data into my CRM or other tools?

Point the project webhook at your integration endpoint: payloads are HMAC-signed with timestamps, retried with backoff up to 8 attempts, and logged. Email notifications with template tokens run in parallel on every tier.

## Related recipes

- https://furrowforms.com/forms-for/v0.md
- https://furrowforms.com/forms-for/bolt.md
- https://furrowforms.com/forms-for/webflow.md
- https://furrowforms.com/forms-for/framer.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/lovable.md
