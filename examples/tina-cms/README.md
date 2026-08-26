# TinaCMS + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/tina-cms (category: Git-based CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

TinaCMS gives you visual, in-context editing on top of Markdown in your own repo — content stays in git, and the site typically ships static or statically-generated from Next.js or Astro. Contact form submissions are the one kind of data that model can’t hold: they arrive continuously, from strangers, and mostly from bots. Furrow Forms handles that stream the way git handles your content — reliably and out of your way: one endpoint per form, spam filtered before it counts, notifications and signed webhooks delivered.

## The integration

Tina sites are commonly Next.js or Astro; this React version works in both ecosystems.

**components/ContactForm.tsx**

```tsx
export function ContactForm() {
  const loadedAt = Date.now();
  return (
    <form action="https://api.furrowforms.com/s/fp_k7m2" method="POST">
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
2. Add the form component to your layout or page — Tina’s editing experience is unaffected.
3. Configure domain, recipients, and thank-you redirect once at the project level.
4. Optionally wire the signed webhook into your own pipeline; deliveries retry with backoff.

## FAQ

### How do I add a contact form to a TinaCMS site?

Add a form component to your Next.js or Astro frontend that POSTs to a Furrow Forms endpoint. Content editing stays in Tina and git; submissions are stored, filtered, and delivered by Furrow.

### Can form submissions be committed to my repo like content?

You wouldn’t want them to be — most raw form traffic is spam, and a commit per submission would bury your history. Furrow stores submissions with configurable retention and can deliver verified ones to any endpoint you run via signed, retried webhooks.

### Does the form work in Tina’s visual preview?

The form renders like any component in your site, so it appears in previews normally. Submissions only count when they pass the spam stack from an allowed domain, so preview environments can be excluded via the project’s domain allowlist.

## Related recipes

- https://furrowforms.com/forms-for/keystatic.md
- https://furrowforms.com/forms-for/nextjs.md
- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/decap-cms.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/tina-cms.md
