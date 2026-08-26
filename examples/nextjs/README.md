# Next.js + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/nextjs (category: Frameworks & SSGs).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Every Next.js app eventually grows a /api/contact route: parse the body, check a captcha, call a mail API, maybe store the thing, forget to rate-limit it. It is the most-rewritten forty lines in the ecosystem. Furrow Forms replaces the route entirely — your form POSTs from the client to a managed endpoint with the spam stack on by default, and your team gets email while your systems get HMAC-signed webhooks. Snippets are generated natively for Next.js from the form’s field contract, and the whole backend is provisionable by the same AI agent that scaffolds your app.

## The integration

A client component using fetch for an inline success state. A classic <form action=…> POST works too.

**components/contact-form.tsx**

```tsx
'use client';
import { useState } from 'react';

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [loadedAt] = useState(() => Date.now());

  async function submit(formData: FormData) {
    const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: formData,
    });
    const { ok } = await res.json();
    setSent(ok);
  }

  if (sent) return <p>Thanks — we’ll be in touch.</p>;
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

1. Create a free account and a project (or let the agent building your app do it over MCP).
2. Copy the generated Next.js snippet into components/ and delete the /api/contact route.
3. Configure domain, recipients, and webhooks once at the project level.
4. Deploy anywhere — Vercel, self-hosted, static export — the form backend is independent of the host.

## FAQ

### How do I add a contact form to a Next.js app?

POST the form data to a Furrow Forms endpoint from a client component (or a plain form action). Furrow validates against its spam stack, stores the submission, sends notification email, and fires signed webhooks — replacing the custom /api/contact route entirely.

### Why not just write an API route with a mail library?

You can — and you then own spam filtering, rate limiting, captcha wiring, deliverability, storage, and retries, per app, forever. A form backend turns those forty recurring lines into managed infrastructure with a delivery log.

### Does this work with static export or edge runtimes?

Yes. The submission goes browser-to-Furrow, so output: "export", edge rendering, and self-hosting all work identically. CORS is honored for your project’s allowed domains.

## Related recipes

- https://furrowforms.com/forms-for/vercel.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/payload.md
- https://furrowforms.com/forms-for/v0.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/nextjs.md
