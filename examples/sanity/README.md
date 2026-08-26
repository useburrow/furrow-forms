# Sanity + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/sanity (category: Headless CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Sanity is deliberately a content platform, not an everything platform: structured documents, GROQ, real-time collaboration. Form submissions are explicitly not its job — and the workarounds people reach for (a write token mutating submissions into the dataset, or a hand-rolled serverless function) each create new problems. Furrow Forms is the boring, dedicated answer: your Next.js or Astro frontend POSTs to one endpoint; storage, spam, notifications, and signed webhooks are handled; your Content Lake stays content.

## The integration

Works identically from Next.js, Remix, or any React frontend on your Sanity site.

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
      <input name="name" type="text" required />
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
2. Create the form and paste the generated snippet into your frontend — the Studio is untouched.
3. Configure domains, notify emails, and an optional webhook once at the project level.
4. Need submissions in your own systems? Wire the signed webhook to your endpoint — retried with backoff if you’re down.

## FAQ

### How do I handle form submissions with Sanity?

Don’t write them into your dataset. Point the form in your frontend at a dedicated form backend: POST to a Furrow Forms endpoint and let it store the submission, filter spam, notify your team, and deliver a signed webhook. Sanity stays the system of record for content, not inbound mail.

### Can I store submissions in the Sanity Content Lake?

Technically yes, via a mutation with a write token — but that token cannot safely live in a browser, spam lands next to your editors’ documents, and submissions count toward dataset usage. A form backend avoids all three; if you still want submissions in Sanity, consume Furrow’s webhook server-side and write them in on your terms.

### Does this work with Sanity + Astro or Sanity + Next.js?

Yes — the form is plain markup in whatever renders your frontend. Furrow generates snippets for HTML, Astro, and Next.js from the form’s field contract, honeypot and Turnstile included.

## Related recipes

- https://furrowforms.com/forms-for/nextjs.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/payload.md
- https://furrowforms.com/forms-for/contentful.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/sanity.md
