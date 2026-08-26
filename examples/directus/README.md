# Directus + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/directus (category: Headless CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Directus turns your SQL database into an API — so the tempting contact-form recipe is obvious: make a submissions collection, grant the public role create access, done. Except now anonymous internet traffic writes directly into the database that runs your project, and the spam cleanup happens in the same Data Studio your team works in. Furrow Forms keeps that write path external: the form POSTs to Furrow, spam dies there, and verified submissions can flow back into Directus through a signed webhook — authenticated, on your terms.

## The integration

Whatever frontend sits on your Directus API — Nuxt, Astro, plain HTML — the form is the same.

**contact.html**

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

1. Create a free account and a project — no schema changes, no public permissions.
2. Paste the snippet into your frontend.
3. Set domains, notify emails, and (optionally) a webhook pointing at a Directus Flow or your own endpoint.
4. Verify the webhook signature server-side and write clean submissions into Directus with an authenticated token, if you want them there.

## FAQ

### How do I add a contact form to a Directus project?

Point the form at a Furrow Forms endpoint instead of granting public create access on a collection. Furrow handles spam, storage, and notifications; if you want submissions inside Directus, consume the signed webhook and insert them with an authenticated call.

### What’s risky about a public-create collection in Directus?

It routes unauthenticated internet traffic straight into your SQL database: spam rows beside real data, storage growth, and cleanup inside the Data Studio your team uses daily. It is fine for a prototype; for production, a dedicated form backend keeps that surface off your database.

### Can Furrow trigger my Directus Flows?

Yes — point the project webhook at a Flow’s webhook trigger (or any endpoint you run). Payloads are HMAC-SHA256 signed with a timestamp header, retried with backoff up to 8 attempts, and logged, so your automation acts only on verified submissions.

## Related recipes

- https://furrowforms.com/forms-for/strapi.md
- https://furrowforms.com/forms-for/payload.md
- https://furrowforms.com/forms-for/nuxt.md
- https://furrowforms.com/forms-for/astro.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/directus.md
