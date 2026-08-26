#!/usr/bin/env node
// Stdio ↔ streamable-HTTP bridge to the hosted Furrow Forms MCP server.
// The real server needs Postgres, so it isn't shipped in this package; this
// wraps mcp-remote so stdio-only clients (Claude Desktop, older Cursor,
// Zed, Codex CLI) get the same 26 tools with one npx command.
//
//   FURROW_TOKEN=frw_... npx @furrowforms/mcp
//
// Without FURROW_TOKEN, mcp-remote runs the OAuth flow (opens a browser).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const url = process.env.FURROW_MCP_URL ?? 'https://api.furrowforms.com/mcp';
const token = process.env.FURROW_TOKEN;

const args = [require.resolve('mcp-remote/dist/proxy.js'), url];
if (token) args.push('--header', `Authorization:Bearer ${token}`);

const child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });
child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
