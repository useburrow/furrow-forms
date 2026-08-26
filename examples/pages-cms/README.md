# Pages CMS + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/pages-cms (category: Git-based CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Pages CMS is the no-infrastructure CMS: point it at a GitHub repo, describe your content in .pages.yml, and editors get a clean UI while everything remains files in git. Sites built this way — typically Astro, Eleventy, or Hugo on static hosting — inherit git’s one blind spot: nothing in the stack can accept a form submission. Furrow Forms is the same kind of answer Pages CMS is: a hosted service doing one job well, so your architecture stays a repo and a static host. Form markup in your templates, one endpoint behind it, spam and notifications handled.

## The integration

Shown for Astro; the same plain-HTML form works in Eleventy, Hugo, or anything else that renders your repo.

**src/components/ContactForm.astro**

```astro
---
const endpoint = 'https://api.furrowforms.com/s/fp_k7m2';
---
<form action={endpoint} method="POST">
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
  <input type="hidden" name="_ft" value="" />
  <script is:inline>document.currentScript.previousElementSibling.value = Date.now();</script>
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
2. Add the form snippet to your template and commit — Pages CMS keeps editing content as before.
3. Configure your domain, notify emails, and thank-you URL once on the project.
4. Done: content changes are commits, submissions are Furrow’s problem.

## FAQ

### How do I add a contact form to a Pages CMS site?

Add a plain HTML form to your site’s template with the action pointed at a Furrow Forms endpoint. The site stays a static build from your GitHub repo; Furrow receives submissions, filters spam, and emails your team.

### Do I need any serverless functions or backend code?

No. The form POSTs directly from the browser to api.furrowforms.com. That is the point: Pages CMS keeps content infrastructure at zero, and Furrow does the same for forms.

### Can editors see form submissions in Pages CMS?

Submissions live in Furrow, not the repo — by design, since most raw form traffic is spam. Your team gets notification emails, the dashboard, and (if you want) signed webhooks into any tool you already use.

## Related recipes

- https://furrowforms.com/forms-for/github-pages.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/decap-cms.md
- https://furrowforms.com/forms-for/eleventy.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/pages-cms.md
