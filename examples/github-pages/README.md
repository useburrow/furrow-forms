# GitHub Pages + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/github-pages (category: Hosts & site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

GitHub Pages is the purest static host there is: files in a repo, served as-is, no server-side anything — which is exactly why “github pages contact form” has been a stack-overflow evergreen for a decade. The answer hasn’t changed shape: you need an external endpoint. Furrow Forms is that endpoint with the modern conveniences attached — spam stack on by default, notification email with template tokens, a thank-you redirect, and a free tier that fits a personal or project site. Paste the form into your HTML or Jekyll template, push, done.

## The integration

Works with plain HTML or the built-in Jekyll pipeline — no build changes.

**index.html (or _includes/contact-form.html)**

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
2. Paste the form into your HTML (or a Jekyll include) and commit.
3. Set your username.github.io or custom domain on the allowlist, plus your notify email and thank-you URL.
4. Push — Pages redeploys and the form is live.

## FAQ

### How do I add a contact form to a GitHub Pages site?

GitHub Pages cannot run server code, so point a plain HTML form at a Furrow Forms endpoint. Furrow receives the POST, filters spam, stores the submission, emails you, and redirects the visitor to your thank-you page — the site itself stays static files in a repo.

### Is it safe to put the form endpoint in a public repository?

Yes — the public key is meant to ship in client-side HTML. Abuse is handled by the spam stack and the per-project domain allowlist, which stops other sites from using your endpoint even though they can read it.

### Does this cost anything for a personal site?

Furrow’s free tier — 100 submissions a month with unlimited forms and the full API — comfortably covers a personal or project site, and spam never counts toward it.

## Related recipes

- https://furrowforms.com/forms-for/jekyll.md
- https://furrowforms.com/forms-for/pages-cms.md
- https://furrowforms.com/forms-for/cloudflare-pages.md
- https://furrowforms.com/forms-for/hugo.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/github-pages.md
