# Hugo + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/hugo (category: Frameworks & SSGs).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Hugo builds thousand-page sites in the time other tools spend installing dependencies — and it ships exactly nothing that can process a form. That is by design: Hugo is a build tool, not a server. Furrow Forms is the standing server your Hugo site borrows: put an ordinary form in a partial, point the action at your endpoint, and submissions are stored, spam-filtered, and emailed while the visitor lands on your thank-you page. Your deploy remains rsync-able static files.

## The integration

Endpoint pulled from site params. Pure static output, classic POST + redirect.

**layouts/partials/contact-form.html**

```html
<form action="{{ .Site.Params.furrowEndpoint }}" method="POST">
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
  <input type="hidden" name="_ft" value="" />
  <script>document.currentScript.previousElementSibling.value = Date.now();</script>
  <input name="name" type="text" required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <button>Send</button>
</form>

{{/* hugo.toml:  [params]  furrowEndpoint = "https://api.furrowforms.com/s/fp_k7m2" */}}
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
2. Add the partial and set furrowEndpoint in your site config.
3. Configure domain, recipients, and thank-you URL once on the project.
4. hugo && deploy — done.

## FAQ

### How do I add a contact form to a Hugo site?

Add a plain HTML form in a partial with its action pointed at a Furrow Forms endpoint. Hugo keeps building pure static files; Furrow receives submissions, filters spam, emails you, and redirects visitors to your thank-you page.

### Is the endpoint safe to commit to a public repo?

Yes — the public key is not a secret and is designed to ship in client-side HTML. Abuse is controlled by the spam stack: honeypot, optional Turnstile, your domain allowlist, and per-IP rate limits.

### What do visitors see after submitting?

A classic HTML POST gets a 303 redirect to the thank-you URL you configure on the project. If you add a little JavaScript and submit via fetch, you get JSON back for an inline success message instead.

## Related recipes

- https://furrowforms.com/forms-for/jekyll.md
- https://furrowforms.com/forms-for/eleventy.md
- https://furrowforms.com/forms-for/github-pages.md
- https://furrowforms.com/forms-for/decap-cms.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/hugo.md
