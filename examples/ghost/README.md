# Ghost + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/ghost (category: Platform CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Ghost is superb at what it chose to be: publishing, memberships, newsletters. What it deliberately doesn’t include is a general-purpose contact form — the "work with me" form, the sponsorship enquiry, the support request. And on Ghost(Pro) you can’t deploy server code to catch one yourself. Furrow Forms is the clean fit: a plain HTML form in your theme or a code-injection block, posting to a managed endpoint that filters spam, stores the submission, and emails you. No plugin system required — which is good, because Ghost doesn’t have one.

## The integration

Paste into a custom page template in your theme, or into a page via an HTML card. A classic POST redirects to the thank-you page you configure.

**contact.hbs (or Settings → Code injection)**

```handlebars
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

1. Create a free account and a project for your publication.
2. Add the form to a page using an HTML card, or to a custom template in your theme.
3. Set your domain, notify email, and thank-you URL once on the project.
4. Publish. Members keep flowing through Portal; messages flow through Furrow.

## FAQ

### How do I add a contact form to a Ghost site?

Add a plain HTML form — via an HTML card on a page, code injection, or a theme template — with its action pointed at a Furrow Forms endpoint. No server code is needed, so it works on Ghost(Pro) and self-hosted installs alike.

### Doesn’t Ghost already have forms?

Ghost’s built-in forms are for member signup and newsletter subscription through Portal. There is no native general-purpose contact form, and no plugin system to add one — which is why a form backend is the standard answer.

### Will this work with my Ghost theme?

Yes — the form is plain markup and inherits your theme’s styling like any other HTML. Style it with your theme’s classes; the honeypot field stays hidden, and Furrow handles what happens after the POST.

## Related recipes

- https://furrowforms.com/forms-for/statamic.md
- https://furrowforms.com/forms-for/craft-cms.md
- https://furrowforms.com/forms-for/webflow.md
- https://furrowforms.com/forms-for/github-pages.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/ghost.md
