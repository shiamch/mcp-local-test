# fbs-local-mcp

A small local MCP server built with the TypeScript SDK and seeded with dummy CRM-style data.

## What it exposes

- Resources:
  - `crm://customers`
  - `crm://tickets/open`
  - `crm://customers/{customerId}`
- Tools:
  - `list_customers`
  - `get_customer_summary`
  - `search_tickets`
- Prompt:
  - `customer-brief`

## Build and run

```bash
pnpm build
pnpm start
```

Important: build the server before connecting it to an MCP client. The MCP runtime command should be `node dist/index.js`, not a build command, because MCP uses `stdout` for protocol messages.

## Add it to Codex app

1. Build the project:

```bash
cd /Users/shiamchowdhury/Documents/projects/mcp-test/fbs-local-mcp
pnpm build
```

2. Add a local MCP server entry in your Codex app config using this command:

```json
{
  "mcpServers": {
    "fbs-local-mcp": {
      "command": "node",
      "args": [
        "/Users/shiamchowdhury/Documents/projects/mcp-test/fbs-local-mcp/dist/index.js"
      ]
    }
  }
}
```

3. Reload the Codex app or refresh MCP servers.

After that, Codex should see the server's tools, resources, and prompt.
