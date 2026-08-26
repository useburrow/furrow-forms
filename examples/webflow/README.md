# Webflow + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/webflow (category: Hosts & site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Webflow forms work well inside Webflow’s world: designer-built, submissions in the dashboard, notifications on. The friction appears at the boundaries — form submissions are metered by your site plan, routing beyond email means third-party glue, and the moment you export code, form handling stays behind: exported forms simply don’t submit. Furrow Forms works on both sides of that boundary. Point a Webflow form’s action at a Furrow endpoint (a form setting, no custom code) or drop a form in an Embed element, and the same backend serves the hosted site, the exported site, and every other property you run.

## The integration

Set the form’s Action to your endpoint and Method to POST in the Designer — or paste this into an Embed.

**Form settings → Action (or an Embed element)**

```html
<form action="https://api.furrowforms.com/s/fp_k7m2" method="POST">
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
  <input type="hidden" name="_ft" value="" />
  <script>document.currentScript.previousElementSibling.value = Date.now();</script>
  <input name="name" type="text" required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <button>Send</button>
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

1. Create a free account and a project for the site.
2. In the Designer, set the form’s Action to your endpoint and Method to POST (or use an Embed element).
3. Add your webflow.io and custom domains to the allowlist; set recipients and webhooks once.
4. Publish — and if you ever export the code, the form keeps working.

## FAQ

### Can I use my own form backend with Webflow?

Yes — Webflow lets you set a custom Action URL on any form in the Designer’s form settings. Point it at a Furrow Forms endpoint with Method POST, and submissions flow to Furrow: spam filtered, stored, emailed, and webhooked.

### Why don’t forms work after exporting code from Webflow?

Because Webflow’s form handling runs on Webflow’s hosting — exported sites keep the markup but lose the backend. Forms pointed at Furrow are backend-independent, so the exported site submits exactly like the hosted one.

### Do Webflow’s form notifications and dashboard still apply?

No — with a custom action, submissions bypass Webflow entirely and land in Furrow, which takes over storage, notification email, and webhooks. That is the trade: you leave Webflow’s form dashboard and gain an API-manageable backend with signed delivery.

## Related recipes

- https://furrowforms.com/forms-for/framer.md
- https://furrowforms.com/forms-for/netlify.md
- https://furrowforms.com/forms-for/lovable.md
- https://furrowforms.com/forms-for/ghost.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/webflow.md
