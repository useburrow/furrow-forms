# Strapi + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/strapi (category: Headless CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

The standard Strapi contact-form tutorial goes: create a "submission" content-type, grant the public role create permission, configure the email plugin, and hope the spam stays manageable. That recipe turns your CMS — the thing running your content — into an unauthenticated write target. Furrow Forms replaces the whole chain with one POST endpoint: submissions stored elsewhere, spam filtered before it counts, notifications delivered, and a signed webhook if you do want the data back in your own pipeline.

## The integration

Strapi frontends vary — Next, Nuxt, Astro, plain HTML. A classic POST works everywhere; fetch() gets JSON back.

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

1. Create a free account and a project — no changes to your Strapi instance.
2. Paste the snippet into whichever frontend your Strapi feeds.
3. Set domains, notify emails, and an optional webhook once on the project.
4. Want submissions in Strapi anyway? Receive the signed webhook server-side and create the entry with an authenticated call — no public permission needed.

## FAQ

### How do I add a contact form to a Strapi site?

Point the form in your frontend at a Furrow Forms endpoint instead of opening a public create permission on Strapi. Furrow stores the submission, filters spam, and emails your team; your Strapi API stays read-only to anonymous visitors.

### What’s wrong with a public create permission on a Strapi content-type?

It exposes your production CMS to unauthenticated writes: spam entries in the admin panel, database growth you didn’t plan, and your content infrastructure absorbing bot traffic. It works — the tutorials exist for a reason — but a dedicated form backend keeps that risk off the system your site depends on.

### Can I still get submissions into Strapi?

Yes, the safe way around: subscribe your server to Furrow’s signed webhook and create entries with an authenticated API token. You get HMAC signatures to verify, automatic retries with backoff if your endpoint is down, and a delivery log — instead of a public write hole.

## Related recipes

- https://furrowforms.com/forms-for/directus.md
- https://furrowforms.com/forms-for/payload.md
- https://furrowforms.com/forms-for/nuxt.md
- https://furrowforms.com/forms-for/nextjs.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/strapi.md
