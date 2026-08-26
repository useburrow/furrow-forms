# Vercel + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/vercel (category: Hosts & site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Vercel gives you world-class deploys — and no form handling: there is no “Vercel Forms,” so every template’s contact form either ships dead or drags in an API route, a mail provider, and a spam story of its own. Furrow Forms is the missing piece, shaped like Vercel itself: a managed endpoint you point markup at. It works identically for Next.js, Astro, SvelteKit, or plain static output; config changes apply without a redeploy; and the whole backend is operable by the same agents that build and deploy on Vercel.

## The integration

Shown for Next.js; the same endpoint works from any framework Vercel serves — or from plain HTML.

**components/contact-form.tsx**

```tsx
'use client';

export function ContactForm() {
  const loadedAt = Date.now();
  async function submit(formData: FormData) {
    const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: formData,
    });
    const { ok } = await res.json();
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

1. Create a free account and a project for the site.
2. Point your form at the endpoint — delete the /api/contact route if you had one.
3. Allow your production (and preview) domains and set recipients once on the project.
4. Ship. Settings changes apply instantly, with no redeploy.

## FAQ

### Does Vercel have built-in form handling?

No — Vercel deploys and serves your site but offers no forms product. You either write an API route and own spam, email, and storage yourself, or point the form at a form backend like Furrow, which provides all three as a managed endpoint.

### How do I add a contact form to a static site on Vercel?

A plain HTML form with its action set to a Furrow endpoint works from any static output — the browser POSTs directly to Furrow and gets redirected to your thank-you page. No serverless function required.

### Do forms work on preview deployments?

Yes — add the preview domain pattern you use to the project’s domain allowlist alongside production. The allowlist is also what stops strangers from pointing their sites at your endpoint.

## Related recipes

- https://furrowforms.com/forms-for/nextjs.md
- https://furrowforms.com/forms-for/v0.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/netlify.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/vercel.md
