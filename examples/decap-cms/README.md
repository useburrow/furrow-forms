# Decap CMS + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/decap-cms (category: Git-based CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

A Decap CMS stack is beautifully simple: editors write in /admin, content lands as commits, and the site builds to pure static files. That simplicity has one hole — a contact form has nowhere to go. There is no server in your architecture at all, and unless you host on Netlify, no platform feature to lean on either. Furrow Forms fills the hole without complicating the stack: one POST endpoint, spam handled, notifications sent. Everything here applies equally to Sveltia CMS, the modern Decap-compatible successor.

## The integration

Plain HTML — drop it into any Hugo partial, Eleventy include, or Astro component. A classic POST redirects to your thank-you page.

**layouts/partials/contact-form.html**

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
2. Paste the HTML snippet into the template where the form belongs — it’s just markup, so it survives every rebuild.
3. Set your domain, notify emails, and thank-you URL once at the project level.
4. Commit. The static site stays static; Furrow does the receiving.

## FAQ

### How do I add a contact form to a Decap CMS site?

Add a plain HTML form to your template with its action pointed at a Furrow Forms endpoint. The site stays fully static; Furrow receives the POST, filters spam, stores the submission, emails you, and redirects the visitor to your thank-you page.

### Does this work with Sveltia CMS?

Yes — Sveltia is Decap-compatible and shares the same architecture: git-based content, static output, no server. The form backend story is identical, and the same snippet works unchanged.

### What if I move hosts later?

Nothing changes. The form posts to api.furrowforms.com regardless of where the static files live, so migrating from Netlify to Cloudflare or GitHub Pages never touches your forms — one reason to prefer a host-independent backend over a platform feature.

## Related recipes

- https://furrowforms.com/forms-for/hugo.md
- https://furrowforms.com/forms-for/eleventy.md
- https://furrowforms.com/forms-for/github-pages.md
- https://furrowforms.com/forms-for/pages-cms.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/decap-cms.md
