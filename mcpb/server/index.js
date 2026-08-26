#!/usr/bin/env node
// Stdio ↔ streamable-HTTP bridge to the hosted Furrow Forms MCP server.
// The real server needs Postgres, so it isn't shipped in this package; this
// runs mcp-remote's proxy in-process so stdio-only clients (Claude Desktop,
// older Cursor, Zed, Codex CLI) get the same 26 tools with one npx command.
//
//   FURROW_TOKEN=frw_... npx @furrowforms/mcp
//
// Without FURROW_TOKEN, mcp-remote runs the OAuth flow (opens a browser).
//
// In-process (no child spawn) on purpose: Claude Desktop runs extensions on
// its bundled Electron binary, where spawning process.execPath boots
// Electron, not Node, and the server dies silently.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const url = process.env.FURROW_MCP_URL ?? 'https://api.furrowforms.com/mcp';
const token = process.env.FURROW_TOKEN?.trim();

const args = [url];
if (token) args.push('--header', `Authorization:Bearer ${token}`);

process.argv = [process.argv[0], 'mcp-remote', ...args];
await import(require.resolve('mcp-remote/dist/proxy.js'));
