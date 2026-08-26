# Payload + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/payload (category: Headless CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Payload is the code-first CMS: config lives in TypeScript, the admin panel is generated, and — in Payload 3 — the whole thing runs inside your Next.js app. Forms are where that elegance usually ends. The moment a contact form goes live you own spam filtering, email delivery, and a public write path into your own database. Furrow Forms takes that slice off your plate: one POST endpoint per form, spam handled, notifications sent, signed webhooks out — while Payload keeps doing what it is for.

## The integration

Payload 3 sites are Next.js apps — this is a plain client component. Generated snippets include the honeypot and Turnstile automatically.

**components/ContactForm.tsx**

```tsx
'use client';

export function ContactForm() {
  const loadedAt = Date.now();
  async function submit(formData: FormData) {
    const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: formData,
    });
    const { ok } = await res.json(); // { ok: true, id: "sub_…" }
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

1. Create a free account and a project for the site (or let your agent do it — Payload people tend to have one running anyway).
2. Create the form; copy the generated Next.js snippet into your app’s components.
3. Set allowed domains, notify emails, and an optional webhook once, on the project — every form inherits them.
4. Ship it. Spam is filtered before it counts; deliveries are signed and retried.

## FAQ

### How do I add a contact form to a Payload CMS site?

Add a plain form component to your Next.js frontend that POSTs to a Furrow Forms endpoint (https://api.furrowforms.com/s/<key>). Furrow stores the submission, filters spam, emails your team, and fires a signed webhook — no Payload collection, access rules, or email config required.

### Should form submissions live inside Payload?

Only if editors need to manage form layouts in the admin panel — that is what the official Form Builder plugin is for. For a contact form, keeping an unauthenticated write path out of your CMS database is the safer default: let a dedicated backend absorb the bot traffic and forward real submissions by webhook.

### Can an AI agent set this up while building my Payload site?

Yes — that is Furrow’s specialty. An agent scaffolding your Payload project can register a Furrow account via API, provision the site’s forms in one bootstrap_site call over MCP, drop the generated snippet into your components, and verify the webhook — without a dashboard.

## Related recipes

- https://furrowforms.com/forms-for/nextjs.md
- https://furrowforms.com/forms-for/sanity.md
- https://furrowforms.com/forms-for/strapi.md
- https://furrowforms.com/forms-for/v0.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/payload.md
