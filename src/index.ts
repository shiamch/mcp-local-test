import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import { getDatabaseConfig } from "./config.js";
import {
  createTag,
  getBoardResource,
  getBoardTasks,
  getRowBoardId,
  listBoards,
  listCampaigns,
  listTags,
  searchBoards,
  testDatabaseConnection
} from "./db.js";

const databaseConfig = getDatabaseConfig();

const server = new McpServer({
  name: "fbs-local-mcp",
  version: "1.0.0"
});

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

server.registerTool(
  "get_server_config",
  {
    title: "Get Server Config",
    description: "Return the active database-related environment configuration without secrets"
  },
  async () => ({
    content: [
      {
        type: "text",
        text: toJson({
          dbClient: databaseConfig.client,
          dbHost: databaseConfig.host,
          dbPort: databaseConfig.port,
          dbName: databaseConfig.name,
          dbUser: databaseConfig.user,
          boardsTable: databaseConfig.boardsTable,
          tasksTable: databaseConfig.tasksTable,
          campaignsTable: databaseConfig.campaignsTable,
          tagsTable: databaseConfig.tagsTable
        })
      }
    ]
  })
);

server.registerTool(
  "test_database_connection",
  {
    title: "Test Database Connection",
    description: "Check that the server can connect to the configured MySQL database"
  },
  async () => {
    const ok = await testDatabaseConnection();

    return {
      content: [
        {
          type: "text",
          text: ok ? "Database connection successful" : "Database connection failed"
        }
      ]
    };
  }
);

server.registerResource(
  "boards-overview",
  "boards://boards",
  {
    title: "Boards Overview",
    description: "Read boards from the configured boards table",
    mimeType: "application/json"
  },
  async () => ({
    contents: [
      {
        uri: "boards://boards",
        mimeType: "application/json",
        text: toJson(await listBoards(25))
      }
    ]
  })
);

server.registerResource(
  "board-detail",
  new ResourceTemplate("boards://boards/{boardId}", {
    list: async () => {
      const boards = await listBoards(25);

      return {
        resources: boards
          .map((board) => {
            const id = getRowBoardId(board);

            if (id === undefined || id === null) {
              return null;
            }

            return {
              name: String(board.title ?? board.name ?? `Board ${id}`),
              uri: `boards://boards/${id}`,
              mimeType: "application/json",
              description: `Board record from ${databaseConfig.boardsTable}`
            };
          })
          .filter((resource): resource is NonNullable<typeof resource> => Boolean(resource))
      };
    }
  }),
  {
    title: "Board Detail",
    description: "Read one board by id from the configured boards table",
    mimeType: "application/json"
  },
  async (_uri, variables) => {
    const boardId = String(variables.boardId);
    const board = await getBoardResource(boardId);

    if (!board) {
      throw new Error(`Board not found: ${boardId}`);
    }

    return {
      contents: [
        {
          uri: `boards://boards/${boardId}`,
          mimeType: "application/json",
          text: toJson(board)
        }
      ]
    };
  }
);

server.registerTool(
  "list_boards",
  {
    title: "List Boards",
    description: "Return boards from the configured boards table",
    inputSchema: {
      limit: z.number().int().min(1).max(200).optional().describe("Maximum rows to return")
    }
  },
  async ({ limit = 100 }) => {
    const boards = await listBoards(limit);

    return {
      content: [
        {
          type: "text",
          text: toJson({
            table: databaseConfig.boardsTable,
            count: boards.length,
            boards
          })
        }
      ]
    };
  }
);

server.registerTool(
  "list_tags",
  {
    title: "List Tags",
    description: "Return tags from the configured tags table",
    inputSchema: {
      limit: z.number().int().min(1).max(200).optional().describe("Maximum rows to return")
    }
  },
  async ({ limit = 100 }) => {
    const tags = await listTags(limit);

    return {
      content: [
        {
          type: "text",
          text: toJson({
            table: databaseConfig.tagsTable,
            count: tags.length,
            tags
          })
        }
      ]
    };
  }
);

server.registerTool(
  "create_tag",
  {
    title: "Create Tag",
    description: "Create a new tag in the configured tags table",
    inputSchema: {
      name: z.string().min(1).describe("Tag name"),
      slug: z.string().min(1).optional().describe("Optional tag slug"),
      type: z.string().min(1).optional().describe("Optional tag type")
    }
  },
  async ({ name, slug, type }) => {
    const result = await createTag({
      name,
      ...(slug ? { slug } : {}),
      ...(type ? { type } : {})
    });

    return {
      content: [
        {
          type: "text",
          text: toJson({
            table: databaseConfig.tagsTable,
            insertedId: result.insertedId,
            tag: result.tag
          })
        }
      ]
    };
  }
);

server.registerTool(
  "list_campaigns",
  {
    title: "List Campaigns",
    description: "Return campaigns filtered by status from the configured campaigns table",
    inputSchema: {
      statuses: z
        .array(z.enum(["published", "working", "archived"]))
        .optional()
        .describe("Campaign statuses to include"),
      limit: z.number().int().min(1).max(200).optional().describe("Maximum rows to return")
    }
  },
  async ({ statuses = ["published", "working", "archived"], limit = 100 }) => {
    const result = await listCampaigns(statuses, limit);

    return {
      content: [
        {
          type: "text",
          text: toJson({
            table: databaseConfig.campaignsTable,
            statusColumn: result.statusColumn,
            statuses,
            count: result.campaigns.length,
            campaigns: result.campaigns
          })
        }
      ]
    };
  }
);

server.registerTool(
  "search_boards",
  {
    title: "Search Boards",
    description: "Search records in the configured boards table",
    inputSchema: {
      query: z.string().describe("Free-text board search term"),
      limit: z.number().int().min(1).max(100).optional().describe("Maximum rows to return")
    }
  },
  async ({ query, limit = 20 }) => {
    const boards = await searchBoards(query, limit);

    return {
      content: [
        {
          type: "text",
          text: toJson({
            table: databaseConfig.boardsTable,
            count: boards.length,
            boards
          })
        }
      ]
    };
  }
);

server.registerTool(
  "get_board_tasks",
  {
    title: "Get Board Tasks",
    description: "Return tasks for a single board from the configured tasks table",
    inputSchema: {
      boardId: z.union([z.string(), z.number()]).describe("Board id from the boards table"),
      limit: z.number().int().min(1).max(200).optional().describe("Maximum tasks to return")
    }
  },
  async ({ boardId, limit = 100 }) => {
    const result = await getBoardTasks(boardId, limit);

    return {
      content: [
        {
          type: "text",
          text: toJson({
            table: databaseConfig.tasksTable,
            boardId,
            boardColumn: result.boardColumn,
            count: result.tasks.length,
            tasks: result.tasks
          })
        }
      ]
    };
  }
);

server.registerPrompt(
  "board-summary",
  {
    title: "Board Summary",
    description: "Create a reusable prompt for reviewing a board and its task backlog",
    argsSchema: {
      boardId: z.string()
    }
  },
  async ({ boardId }) => ({
    description: `Analysis prompt for board ${boardId}`,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Review board ${boardId}. Summarize the board's current status, important tasks, blockers, and recommended next actions.`
        }
      }
    ]
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("fbs-local-mcp server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
