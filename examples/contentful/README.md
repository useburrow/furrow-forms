# Contentful + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/contentful (category: Headless CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Contentful is deliberate about its boundary: it is a content platform, and form submissions sit outside it. So every Contentful build ends with the same chore — someone writes a serverless function to catch the contact form, bolts on a captcha, wires up an email service, and promises to monitor it. Multiply by every site your team runs. Furrow Forms is that function as a product: one endpoint per form, spam stack on by default, notifications and signed webhooks included, settings inherited across each site.

## The integration

Contentful frontends are commonly Next.js or Astro; the same endpoint works from any of them.

**components/ContactForm.tsx**

```tsx
'use client';

export function ContactForm() {
  const loadedAt = Date.now();
  async function submit(formData: FormData) {
    await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: formData,
    });
  }

  return (
    <form action={submit}>
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} />
      <input type="hidden" name="_ft" value={loadedAt} />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button>Send</button>
    </form>
  );
}
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

1. Create a free account and a project per site.
2. Paste the generated snippet into your frontend; delete the custom form Lambda from the backlog.
3. Configure domains, recipients, and webhooks once at the project level.
4. Route submissions onward — CRM, Slack via your own receiver, data warehouse — through signed, retried webhooks.

## FAQ

### Does Contentful handle form submissions?

No — Contentful is a content platform and deliberately leaves form handling to your stack. The common answers are a custom serverless function or a dedicated form backend. Furrow Forms is the latter: endpoint, spam filtering, storage, notifications, and signed webhooks as a service.

### How do teams usually handle contact forms on Contentful sites?

Most write a serverless function per site: validate, filter spam, send email, store somewhere. It is a recurring per-project cost and an unowned service in production. A form backend replaces it with one POST endpoint and project-level settings your whole roster of sites inherits.

### Can submissions flow into our existing systems?

Yes — every Furrow delivery is an HMAC-signed webhook with automatic retries (up to 8 attempts over ~24 hours) and a delivery log. Point it at your integration layer and treat submissions like any other verified event stream.

## Related recipes

- https://furrowforms.com/forms-for/sanity.md
- https://furrowforms.com/forms-for/hygraph.md
- https://furrowforms.com/forms-for/nextjs.md
- https://furrowforms.com/forms-for/storyblok.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/contentful.md
