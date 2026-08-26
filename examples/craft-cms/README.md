# Craft CMS + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/craft-cms (category: Platform CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Craft doesn’t ship native front-end forms; its ecosystem answers with mature commercial plugins — Freeform, Formie — that render through Twig and store submissions in your Craft install. For a conventional Craft site with complex form needs, they’re the right tool. Furrow Forms targets the other cases: headless Craft, where a Next or Astro frontend consumes GraphQL and Twig-rendered forms don’t exist; simple sites where a contact form doesn’t justify a plugin license and its updates; and agencies who want submissions handled the same way across Craft and non-Craft projects alike.

## The integration

Works the same in a headless frontend — the action URL is the whole integration.

**templates/contact.twig**

```twig
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
2. Add the form to your Twig template or headless frontend — no plugin install.
3. Set domain, recipients, and webhook once at the project level.
4. For headless builds: submit via fetch() and read the JSON response for inline success states.

## FAQ

### How do I add a contact form to a headless Craft site?

Your JS frontend can’t use Twig-rendered plugin forms, so point a plain form at a Furrow Forms endpoint. Furrow filters spam, stores the submission, emails your team, and can deliver a signed webhook to any endpoint — including one that writes back into Craft.

### Is Furrow a replacement for Freeform or Formie?

Only sometimes. Those plugins are excellent for editor-managed, complex forms on conventional Craft sites. Furrow replaces them when the frontend is headless, the form is simple, or you want form infrastructure that spans non-Craft sites too.

### Can submissions still reach my Craft install?

Yes — subscribe an endpoint (a small Craft controller or serverless function) to Furrow’s HMAC-signed webhook and create entries with Craft’s APIs. You get signature verification, automatic retries, and a delivery log on the way in.

## Related recipes

- https://furrowforms.com/forms-for/statamic.md
- https://furrowforms.com/forms-for/nextjs.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/ghost.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/craft-cms.md
