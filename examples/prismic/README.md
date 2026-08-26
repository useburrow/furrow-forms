# Prismic + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/prismic (category: Visual CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Prismic’s slice model lets marketing ship pages without waiting on developers — until the page needs a form. Then someone has to answer where the submission goes, who gets notified, and what stops the bots, and the answer usually becomes a custom API route in the Next.js app. Furrow Forms removes that step: build a ContactForm slice that POSTs to a Furrow endpoint, and every page built in the Page Builder gets a working form with spam, storage, notifications, and signed webhooks handled.

## The integration

A minimal slice component — the generated snippet includes honeypot and Turnstile.

**slices/ContactForm/index.tsx**

```tsx
export default function ContactForm({ slice }) {
  const loadedAt = Date.now();
  return (
    <form action="https://api.furrowforms.com/s/fp_k7m2" method="POST">
      <input type="text" name="_gotcha" style={{ display: 'none' }} tabIndex={-1} />
      <input type="hidden" name="_ft" value={loadedAt} />
      <input name="name" type="text" required />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button>{slice.primary.button_label}</button>
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

1. Create a free account and a project for the site.
2. Build the form slice once, pointed at your form’s endpoint.
3. Set domains, recipients, and webhooks on the project — inherited by every form.
4. Marketers reuse the slice across pages; you change routing in one place when campaigns change.

## FAQ

### How do I add a contact form to a Prismic site?

Create a form slice in your frontend that POSTs to a Furrow Forms endpoint, then let editors place it through the Page Builder. Furrow stores submissions, filters spam, emails your team, and fires signed webhooks — no custom API route in your Next.js app.

### Where do submissions from a Prismic site go?

To Furrow: stored with configurable retention, emailed to the recipients configured on the project, and optionally delivered to your systems by HMAC-signed webhooks with automatic retries. Prismic remains purely the content layer.

### Can we run multiple forms across landing pages?

Yes — forms are unlimited on every Furrow tier, and all of them inherit the project’s security and routing settings. A campaign-specific form is one create call (or one agent prompt) away, and spam never counts toward your submission quota.

## Related recipes

- https://furrowforms.com/forms-for/storyblok.md
- https://furrowforms.com/forms-for/nextjs.md
- https://furrowforms.com/forms-for/contentful.md
- https://furrowforms.com/forms-for/v0.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/prismic.md
