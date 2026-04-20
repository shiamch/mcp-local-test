# fbs-local-mcp

A local MCP server for querying WordPress-backed Fluent Boards style data from MySQL.

## What it exposes

- Resources:
  - `boards://boards`
  - `boards://boards/{boardId}`
- Tools:
  - `get_server_config`
  - `test_database_connection`
  - `list_boards`
  - `list_tags`
  - `create_tag`
  - `list_campaigns`
  - `search_boards`
  - `get_board_tasks`
- Prompt:
  - `board-summary`

## Environment variables

Copy [.env.example](/Users/shiamchowdhury/Documents/projects/mcp-test/fbs-local-mcp/.env.example) to `.env` for local development, or add the same keys in the Codex MCP form.

The server now auto-loads `.env` and `.env.local` from the project root on startup. Precedence is: Codex MCP form environment variables first, then `.env.local`, then `.env`.

- `DB_CLIENT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_BOARDS_TABLE`
- `DB_TASKS_TABLE`
- `DB_CAMPAIGNS_TABLE`
- `DB_TAGS_TABLE`

## Build and run

```bash
pnpm build
pnpm start
```

Important: build the server before connecting it to an MCP client. The MCP runtime command should be `node dist/index.js`, not a build command, because MCP uses `stdout` for protocol messages.

## Add it to Codex app

Use `STDIO` with:

- Command: `node`
- Argument: `dist/index.js`
- Working directory: `/Users/shiamchowdhury/Documents/projects/mcp-test/fbs-local-mcp`

Add these environment variables in the Codex form:

- `DB_CLIENT=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_NAME=wordpress`
- `DB_USER=readonly_user`
- `DB_PASSWORD=replace_me`
- `DB_BOARDS_TABLE=wp_fbs_boards`
- `DB_TASKS_TABLE=wp_fbs_tasks`
- `DB_CAMPAIGNS_TABLE=wp_fc_campaigns`
- `DB_TAGS_TABLE=wp_fc_tags`
