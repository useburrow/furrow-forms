# SvelteKit + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/sveltekit (category: Frameworks & SSGs).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

SvelteKit’s form actions are elegant — and server-only. The moment you build with adapter-static (a marketing site, docs, a portfolio), there is no server to run them, and the usual answer becomes a third-party endpoint anyway. Furrow Forms is that endpoint done properly: POST from a plain form or a tiny submit handler, get JSON back, and let managed infrastructure handle spam, storage, notifications, and signed webhooks. On server-rendered deployments it still earns its keep — it is the mail delivery, spam stack, and retry logic you were about to write.

## The integration

Classic POST with no JS by default; the on:submit handler upgrades it when JS is available.

**src/lib/ContactForm.svelte**

```svelte
<script>
  const loadedAt = Date.now();
  let sent = false;

  async function submit(e) {
    e.preventDefault();
    const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
      method: 'POST',
      body: new FormData(e.target),
    });
    sent = (await res.json()).ok;
  }
</script>

{#if sent}
  <p>Thanks — we’ll be in touch.</p>
{:else}
  <form method="POST" action="https://api.furrowforms.com/s/fp_k7m2" on:submit={submit}>
    <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
    <input type="hidden" name="_ft" value={loadedAt} />
    <input name="email" type="email" required />
    <textarea name="message" required></textarea>
    <button>Send</button>
  </form>
{/if}
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
2. Add the component — no +page.server.ts, no adapter requirements.
3. Configure domain, recipients, and thank-you URL once on the project.
4. Prerender everything; the form still works.

## FAQ

### How do I add a contact form to a static SvelteKit site?

Point a plain form (or a fetch call) at a Furrow Forms endpoint. adapter-static output stays fully prerendered, and Furrow handles spam filtering, storage, notifications, and the thank-you redirect.

### Can I still use SvelteKit form actions with Furrow?

You don’t need to — the browser can POST directly to Furrow. If you prefer routing through your own action on a server-rendered deployment, your action can forward the submission server-side; but for most sites the direct POST is simpler and works everywhere.

### How does spam protection work without my own server?

It lives on Furrow’s side: honeypot field, optional Cloudflare Turnstile with project-level keys, a per-project domain allowlist, and per-IP rate limiting. Rejected submissions never reach your inbox or count toward quota.

## Related recipes

- https://furrowforms.com/forms-for/astro.md
- https://furrowforms.com/forms-for/nuxt.md
- https://furrowforms.com/forms-for/cloudflare-pages.md
- https://furrowforms.com/forms-for/github-pages.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/sveltekit.md
