# Cloudflare Pages + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/cloudflare-pages (category: Hosts & site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Cloudflare Pages serves static sites brilliantly and offers no form handling of its own. The documented DIY route — write a Pages Function, validate a Turnstile token, call an email API, add your own storage and rate limiting — is a genuinely educational afternoon that then becomes production code you own. Furrow Forms is that stack as a service, and it speaks Cloudflare’s language: Turnstile is Furrow’s first-class captcha, configured once with your project’s keys and inherited by every form. Your Pages deployment stays purely static; the form just works.

## The integration

Pure static markup — no Pages Function, no _worker.js. Turnstile widget optional via your project keys.

**contact.html**

```html
<form action="https://api.furrowforms.com/s/fp_k7m2" method="POST">
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
  <input type="hidden" name="_ft" value="" />
  <script>document.currentScript.previousElementSibling.value = Date.now();</script>
  <input name="name" type="text" required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <div class="cf-turnstile" data-sitekey="0x4AAA…"></div>
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

1. Create a free account and a project; add your Turnstile keys to it if you use the widget.
2. Paste the snippet — your Pages project needs no Functions directory.
3. Set your pages.dev and custom domains on the allowlist, plus notify emails.
4. Deploy. Static files on Cloudflare, form handling on Furrow.

## FAQ

### How do I add a contact form to a Cloudflare Pages site?

Point a plain HTML form at a Furrow Forms endpoint — no Pages Function required. Furrow filters spam (including native Cloudflare Turnstile verification with your project’s keys), stores the submission, emails you, and redirects the visitor.

### Can’t I just write a Pages Function for this?

You can — Cloudflare even documents the pattern. But the Function needs spam logic, an email provider, storage, and rate limiting, and then it needs maintaining. A form backend collapses all of it into an endpoint with delivery guarantees.

### Does Furrow work with Cloudflare Turnstile?

Yes — Turnstile is Furrow’s built-in captcha. Set the site and secret keys once at the project level; every form under the project verifies tokens automatically, and generated snippets include the widget markup.

## Related recipes

- https://furrowforms.com/forms-for/github-pages.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/sveltekit.md
- https://furrowforms.com/forms-for/netlify.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/cloudflare-pages.md
