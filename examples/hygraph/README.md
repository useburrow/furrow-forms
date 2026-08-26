# Hygraph + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/hygraph (category: Visual CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Hygraph (formerly GraphCMS) gives you a federated GraphQL layer over your content — and a temptation: it speaks mutations, so why not mutate form submissions into a model? Because that means a write-capable token in the client or a custom proxy in front of it, spam entries inside your content environment, and bot traffic against the API your pages query. Furrow Forms is the separation of concerns: forms POST to Furrow, your content API stays read-only to the public, and verified submissions arrive by signed webhook wherever you want them.

## The integration

Your Hygraph frontend — Next.js, Astro, Nuxt — renders the form; the endpoint does the rest.

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

1. Create a free account and a project for the site — your Hygraph schema is untouched.
2. Paste the snippet into your frontend.
3. Configure domains, recipients, and a webhook once at the project level.
4. If submissions belong in your systems, consume the signed webhook server-side — verified, retried, logged.

## FAQ

### How do I handle contact forms with Hygraph?

Keep them out of your content API: point the form at a Furrow Forms endpoint. Furrow filters spam, stores the submission, notifies your team, and can deliver a signed webhook to your backend — while your Hygraph project stays read-only to visitors.

### Why not store submissions as Hygraph content entries?

Doing it from the browser requires exposing a write-capable token; doing it safely requires building and running a proxy — the very form handler you were avoiding. Either way, spam lands inside your content environment and consumes API operations. A dedicated form backend sidesteps all of it.

### Does this work with whatever frontend we use?

Yes — the form is plain markup with a POST action, so Next.js, Astro, Nuxt, SvelteKit, or static HTML all behave the same. Classic POSTs get a 303 redirect to your thank-you page; fetch() calls get JSON.

## Related recipes

- https://furrowforms.com/forms-for/contentful.md
- https://furrowforms.com/forms-for/sanity.md
- https://furrowforms.com/forms-for/storyblok.md
- https://furrowforms.com/forms-for/nextjs.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/hygraph.md
