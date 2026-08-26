# Framer + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/framer (category: Hosts & site builders).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Framer has grown real native form handling, and for a standard contact block on a Framer-hosted site it is the path of least resistance. The cases that outgrow it look familiar: you build custom code components and want the form logic in your own React; you need submissions in your own pipeline with verifiable delivery, not just a dashboard; or Framer is one property in a portfolio whose forms you want managed from a single control plane. Furrow Forms covers those: a code component POSTs to your endpoint, and storage, spam, notifications, and HMAC-signed webhooks are handled — same as every other site you run.

## The integration

A minimal code component; style with Framer’s props as you like.

**ContactForm.tsx (Framer code component)**

```tsx
export default function ContactForm() {
  const loadedAt = Date.now();
  async function submit(e) {
    e.preventDefault();
    const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: new FormData(e.target),
    });
    if ((await res.json()).ok) e.target.reset();
  }

  return (
    <form onSubmit={submit}>
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
2. Add the code component and place it on your page.
3. Allow your framer.website/framer.app and custom domains; set recipients and webhooks once.
4. Publish — submissions flow to Furrow and onward to your pipeline.

## FAQ

### Can I use a custom form backend with Framer?

Yes — build the form as a code component that POSTs its FormData to a Furrow Forms endpoint. Furrow filters spam, stores submissions, sends notifications, and delivers signed webhooks; the component stays ordinary React.

### Why use Furrow instead of Framer’s built-in forms?

Use native forms for a standard block on a single Framer site. Furrow is for custom code components, submissions you need in your own systems with verified (HMAC-signed, retried) delivery, and portfolios where form settings should be managed centrally over an API.

### Will the honeypot and Turnstile work inside Framer?

Yes — the honeypot is just a hidden field in your component, and Turnstile renders like any script-backed widget. Both verify on Furrow’s side with keys configured once at the project level.

## Related recipes

- https://furrowforms.com/forms-for/webflow.md
- https://furrowforms.com/forms-for/v0.md
- https://furrowforms.com/forms-for/lovable.md
- https://furrowforms.com/forms-for/vercel.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/framer.md
