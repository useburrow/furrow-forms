# Nuxt + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/nuxt (category: Frameworks & SSGs).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Nuxt gives you three ways to deploy — static, server, edge — and a contact form should survive all of them. Writing a server/api/contact.post.ts handler ties the form to the one deployment mode that has a server, and hands you spam filtering and mail delivery as ongoing chores. Furrow Forms keeps the form in the component where it belongs: POST the FormData to your endpoint, read back { ok, id }, show your success state. Static generate, SSR, or edge — the form neither knows nor cares.

## The integration

Plain fetch with an inline success state. A no-JS <form action=…> POST works too.

**components/ContactForm.vue**

```vue
<script setup>
const loadedAt = Date.now();
const sent = ref(false);

async function submit(e) {
  const res = await fetch('https://api.furrowforms.com/s/fp_k7m2', {
    method: 'POST',
    body: new FormData(e.target),
  });
  sent.value = (await res.json()).ok;
}
</script>

<template>
  <p v-if="sent">Thanks — we’ll be in touch.</p>
  <form v-else @submit.prevent="submit">
    <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
    <input type="hidden" name="_ft" :value="loadedAt" />
    <input name="email" type="email" required />
    <textarea name="message" required></textarea>
    <button>Send</button>
  </form>
</template>
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
2. Add the component; no server route, no Nitro config.
3. Set domain, recipients, and thank-you or webhook settings once on the project.
4. Deploy static, SSR, or edge — the form works the same in all three.

## FAQ

### How do I add a contact form to a Nuxt site?

POST the form’s FormData to a Furrow Forms endpoint from your component — no server/api route needed. Furrow filters spam, stores the submission, emails your team, and returns JSON you can use for an inline success state.

### Does this work with nuxt generate (full static)?

Yes — that is the ideal case. The static site has no server, and it doesn’t need one: the browser talks directly to Furrow, and CORS is honored for the domains you allow on the project.

### Can I keep submissions flowing into my own tools?

Configure a webhook on the project: every delivery is HMAC-signed with a timestamp header, retried with backoff up to 8 attempts, and visible in a delivery log — verify and route into whatever your team uses.

## Related recipes

- https://furrowforms.com/forms-for/storyblok.md
- https://furrowforms.com/forms-for/strapi.md
- https://furrowforms.com/forms-for/sveltekit.md
- https://furrowforms.com/forms-for/astro.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/nuxt.md
