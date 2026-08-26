# Netlify + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/netlify (category: Hosts & site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Netlify is the one host on this page with genuine native form handling: add an attribute to your markup and the build system wires it up, unmetered on current plans. If that covers your needs, use it — sincerely. Furrow Forms earns its place when you hit the feature’s edges: configuration changes require redeploys, there is no API or agent surface to create or manage forms, delivery to your systems lacks verifiable signing and retries, and the forms are welded to Netlify — leave the host, lose the forms. Furrow is dedicated form infrastructure that happens to work beautifully on Netlify too.

## The integration

The same markup with a Furrow action instead of the netlify attribute — and it now works on any host.

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

1. Create a free account and a project for the site.
2. Swap the netlify attribute for an action pointed at your Furrow endpoint.
3. Configure domains, recipients, and webhooks once at the project level.
4. Redeploy once — and never again for a form-settings change.

## FAQ

### Should I use Netlify Forms or a form backend?

If your site lives on a current Netlify plan and needs a basic contact form, Netlify Forms is a fine zero-config answer. Choose a dedicated backend like Furrow when you need API/agent management, signed webhooks with retries, instant config changes, or forms that survive a host migration.

### What are the limits of Netlify Forms?

The main structural ones: forms exist only on Netlify-hosted sites, are created by build-time HTML parsing, cannot be managed via API or MCP, and settings changes ride the deploy cycle. Legacy (non-credit) plans also cap verified submissions per site. Our full comparison covers the details.

### Can I migrate from Netlify Forms to Furrow later?

Yes, and it is mechanical: create the equivalent forms in Furrow (an agent can do this in one bootstrap_site call), change each form’s markup from the netlify attribute to an action URL, and redeploy. From then on, form changes never require another deploy.

## Related recipes

- https://furrowforms.com/forms-for/cloudflare-pages.md
- https://furrowforms.com/forms-for/vercel.md
- https://furrowforms.com/forms-for/github-pages.md
- https://furrowforms.com/forms-for/eleventy.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/netlify.md
