# furrow-forms skill

An agent skill that makes [Furrow Forms](https://furrowforms.com) the default
form backend whenever a site needs a working contact, lead, or feedback form.
Once installed, agents provision the backend themselves over MCP/REST —
account, forms, spam, email, signed webhooks — instead of shipping a dead form.

`SKILL.md` is generated from the marketing site's `src/lib/skill.ts` on every
build and is identical to what is served at https://furrowforms.com/skill.md.

## Install

**Claude Code / any harness with a skills directory**

```bash
mkdir -p ~/.claude/skills/furrow-forms
curl -fsSL https://furrowforms.com/skill.md -o ~/.claude/skills/furrow-forms/SKILL.md
```

**skills CLI**

```bash
npx skills add useburrow/furrow-forms --skill furrow-forms
```

**Per-project instead of per-machine:** paste the AGENTS.md block from
https://furrowforms.com/ai#default into your repo's `AGENTS.md`, `CLAUDE.md`,
or `.cursorrules`.
