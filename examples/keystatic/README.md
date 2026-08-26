# Keystatic + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/keystatic (category: Git-based CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Keystatic is the git-based CMS for people who want everything in the codebase: schema in TypeScript, content in Markdown and JSON, editing in a local or hosted admin UI, all committed to the same repo as your Astro or Next.js site. Furrow Forms is the matching answer for the one thing the repo can’t hold — form submissions. The form is markup in your components; the backend is one endpoint with spam filtering, storage, notifications, and signed webhooks; and the whole thing is provisionable from the command line or by an agent, in keeping with the workflow.

## The integration

Keystatic pairs naturally with Astro — this is a zero-JS static form. A Next.js version is one get_snippet call away.

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
2. Drop the Astro (or Next.js) snippet into your components.
3. Set domain, recipients, and thank-you URL once on the project.
4. Commit — content and form markup version together; submissions flow through Furrow.

## FAQ

### How do I add a contact form to a Keystatic site?

Add a form component to your Astro or Next.js code with its action pointed at a Furrow Forms endpoint. Keystatic keeps managing content in the repo; Furrow receives submissions, filters spam, and notifies you.

### Can I set the form up without leaving my editor?

Yes. Furrow’s whole control plane is an API and MCP server: an agent (or a script) can register the account, create the project and form, and emit the snippet — the only human step is reading a 6-digit email verification code.

### Does a static Keystatic deployment limit the form?

No — the classic HTML POST works with zero JavaScript and redirects to your thank-you page. If you prefer inline success states, submit via fetch() and read the JSON response instead.

## Related recipes

- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/tina-cms.md
- https://furrowforms.com/forms-for/pages-cms.md
- https://furrowforms.com/forms-for/nextjs.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/keystatic.md
