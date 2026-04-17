import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import { getDatabaseConfig } from "./config.js";
import {
  customers,
  findCustomerById,
  findTicketsForCustomer,
  tickets
} from "./data.js";

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
          customersTable: databaseConfig.customersTable,
          ticketsTable: databaseConfig.ticketsTable
        })
      }
    ]
  })
);

server.registerResource(
  "customers-overview",
  "crm://customers",
  {
    title: "Customers Overview",
    description: "Dummy customer records for local MCP testing",
    mimeType: "application/json"
  },
  async () => ({
    contents: [
      {
        uri: "crm://customers",
        mimeType: "application/json",
        text: toJson(customers)
      }
    ]
  })
);

server.registerResource(
  "open-tickets",
  "crm://tickets/open",
  {
    title: "Open Tickets",
    description: "Dummy open and pending tickets for local MCP testing",
    mimeType: "application/json"
  },
  async () => ({
    contents: [
      {
        uri: "crm://tickets/open",
        mimeType: "application/json",
        text: toJson(tickets.filter((ticket) => ticket.status !== "closed"))
      }
    ]
  })
);

server.registerResource(
  "customer-detail",
  new ResourceTemplate("crm://customers/{customerId}", {
    list: async () => ({
      resources: customers.map((customer) => ({
        name: `${customer.company} (${customer.id})`,
        uri: `crm://customers/${customer.id}`,
        mimeType: "application/json",
        description: `${customer.status} customer on the ${customer.plan} plan`
      }))
    })
  }),
  {
    title: "Customer Detail",
    description: "Read a single dummy customer record by id",
    mimeType: "application/json"
  },
  async (_uri, variables) => {
    const customerId = String(variables.customerId);
    const customer = findCustomerById(customerId);

    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    return {
      contents: [
        {
          uri: `crm://customers/${customerId}`,
          mimeType: "application/json",
          text: toJson({
            ...customer,
            tickets: findTicketsForCustomer(customerId)
          })
        }
      ]
    };
  }
);

server.registerTool(
  "list_customers",
  {
    title: "List Customers",
    description: "Return dummy customer data, optionally filtered by status",
    inputSchema: {
      status: z.enum(["active", "trial", "churned"]).optional()
    },
    outputSchema: {
      customers: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          company: z.string(),
          status: z.enum(["active", "trial", "churned"]),
          plan: z.enum(["starter", "growth", "enterprise"]),
          monthlyRevenueUsd: z.number(),
          healthScore: z.number()
        })
      ),
      total: z.number()
    }
  },
  async ({ status }) => {
    const filteredCustomers = status
      ? customers.filter((customer) => customer.status === status)
      : customers;

    const structuredContent = {
      customers: filteredCustomers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        company: customer.company,
        status: customer.status,
        plan: customer.plan,
        monthlyRevenueUsd: customer.monthlyRevenueUsd,
        healthScore: customer.healthScore
      })),
      total: filteredCustomers.length
    };

    return {
      content: [
        {
          type: "text",
          text: toJson(structuredContent)
        }
      ],
      structuredContent
    };
  }
);

server.registerTool(
  "get_customer_summary",
  {
    title: "Get Customer Summary",
    description: "Return one dummy customer plus their related tickets",
    inputSchema: {
      customerId: z.string().describe("Customer id, for example cust_001")
    }
  },
  async ({ customerId }) => {
    const customer = findCustomerById(customerId);

    if (!customer) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Customer not found: ${customerId}`
          }
        ]
      };
    }

    const relatedTickets = findTicketsForCustomer(customerId);

    return {
      content: [
        {
          type: "text",
          text: toJson({
            customer,
            tickets: relatedTickets
          })
        }
      ]
    };
  }
);

server.registerTool(
  "search_tickets",
  {
    title: "Search Tickets",
    description: "Search dummy support tickets by subject text",
    inputSchema: {
      query: z.string().describe("Free-text search term"),
      status: z.enum(["open", "pending", "closed"]).optional()
    }
  },
  async ({ query, status }) => {
    const normalizedQuery = query.trim().toLowerCase();

    const matches = tickets.filter((ticket) => {
      const matchesQuery = ticket.subject.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status ? ticket.status === status : true;
      return matchesQuery && matchesStatus;
    });

    return {
      content: [
        {
          type: "text",
          text: toJson(matches)
        }
      ]
    };
  }
);

server.registerPrompt(
  "customer-brief",
  {
    title: "Customer Brief",
    description: "Create a reusable prompt for analyzing a dummy customer account",
    argsSchema: {
      customerId: z.string()
    }
  },
  async ({ customerId }) => {
    const customer = findCustomerById(customerId);

    return {
      description: `Analysis prompt for ${customerId}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: customer
              ? `Review customer ${customer.name} at ${customer.company}. Focus on account health, ticket risk, and next-best actions.`
              : `Review customer ${customerId}. If the customer cannot be found, explain that clearly.`
          }
        }
      ]
    };
  }
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
