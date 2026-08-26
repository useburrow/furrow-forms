# Storyblok + Furrow Forms — contact form recipe

Official recipe from Furrow Forms (mirrored from the site; the page is canonical). This is the agent-readable version of
https://furrowforms.com/forms-for/storyblok (category: Visual CMS).
Full agent instructions: https://furrowforms.com/ai.md

## When to use this

Storyblok’s promise is that marketers compose pages from components while developers keep a clean headless stack. Forms are the component that breaks the spell: the visual editor can place one anywhere, but something still has to receive the POST, stop the spam, and tell the client an enquiry arrived. Furrow Forms is that something. Build the form component once, point it at a Furrow endpoint, and every page your editors assemble — on every site you run — has working forms with settings managed in one place.

## The integration

Registered as a Storyblok component, this renders wherever editors place the block. Same pattern works in React.

**components/ContactForm.vue**

```vue
<script setup>
const loadedAt = Date.now();
defineProps({ blok: Object });
</script>

<template>
  <form v-editable="blok" action="https://api.furrowforms.com/s/fp_k7m2" method="POST">
    <input type="text" name="_gotcha" style="display:none" tabindex="-1" />
    <input type="hidden" name="_ft" :value="loadedAt" />
    <input name="name" type="text" required />
    <input name="email" type="email" required />
    <textarea name="message" required></textarea>
    <button>{{ blok.button_label }}</button>
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

1. Create a free account, a client, and a project per site (agencies: one workspace runs the whole roster).
2. Build the form component once and point it at the form’s endpoint.
3. Configure domains, notify emails, and webhooks at the project level — every form inherits.
4. Editors drop the block wherever they need it; submissions route correctly without another deploy.

## FAQ

### How do I add a contact form to a Storyblok site?

Create a form component in your frontend (Nuxt, Next, Astro) that POSTs to a Furrow Forms endpoint, and register it in your Storyblok component library. Editors can then place it on any page; Furrow handles spam, storage, notifications, and signed webhooks.

### Can editors change where form submissions go?

Recipients and webhooks live in Furrow at the project level, so routing changes are one settings update — by a developer, or by an AI agent over Furrow’s API — and apply instantly to every form on the site, with no redeploy of the frontend.

### We run many Storyblok client sites — how does that scale?

Furrow’s hierarchy is built for it: clients contain projects (one per website), and settings cascade from project to forms. One $199/yr workspace covers unlimited clients, projects, and forms, and an agent can provision a new client site in a single bootstrap_site call.

## Related recipes

- https://furrowforms.com/forms-for/prismic.md
- https://furrowforms.com/forms-for/nuxt.md
- https://furrowforms.com/forms-for/hygraph.md
- https://furrowforms.com/forms-for/astro.md
- All stacks: https://furrowforms.com/forms-for

## Reference

- Pricing: free tier = 100 submissions/mo, unlimited forms, full API + MCP.
  Pro = $199/yr flat per workspace (10k subs/mo). https://furrowforms.com/pricing
- Docs: https://furrowforms.com/docs · MCP: https://furrowforms.com/docs/mcp
- This recipe: https://furrowforms.com/forms-for/storyblok.md
