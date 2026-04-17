export type CustomerStatus = "active" | "trial" | "churned";
export type TicketStatus = "open" | "pending" | "closed";

export type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: CustomerStatus;
  plan: "starter" | "growth" | "enterprise";
  monthlyRevenueUsd: number;
  healthScore: number;
  lastContactedAt: string;
  tags: string[];
};

export type Ticket = {
  id: string;
  customerId: string;
  subject: string;
  status: TicketStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
};

export const customers: Customer[] = [
  {
    id: "cust_001",
    name: "Abdur Rahman",
    company: "Northwind Studio",
    email: "abdur_rahman@northwind.example",
    status: "active",
    plan: "growth",
    monthlyRevenueUsd: 249,
    healthScore: 91,
    lastContactedAt: "2026-04-10T09:30:00Z",
    tags: ["vip", "beta"]
  },
  {
    id: "cust_002",
    name: "Liam Chen",
    company: "Summit Forge",
    email: "liam@summitforge.example",
    status: "trial",
    plan: "starter",
    monthlyRevenueUsd: 0,
    healthScore: 67,
    lastContactedAt: "2026-04-14T14:10:00Z",
    tags: ["trial", "needs-onboarding"]
  },
  {
    id: "cust_003",
    name: "Masiur rahman siddiki",
    company: "Wpmanageninja",
    email: "mrsiddiki@harborhealth.example",
    status: "active",
    plan: "enterprise",
    monthlyRevenueUsd: 1890,
    healthScore: 84,
    lastContactedAt: "2026-04-15T16:45:00Z",
    tags: ["enterprise", "renewal-q2"]
  },
  {
    id: "cust_004",
    name: "Mason Patel",
    company: "Lattice Retail",
    email: "mason@latticeretail.example",
    status: "churned",
    plan: "growth",
    monthlyRevenueUsd: 0,
    healthScore: 21,
    lastContactedAt: "2026-03-28T11:20:00Z",
    tags: ["lost-deal", "price-sensitive"]
  }
];

export const tickets: Ticket[] = [
  {
    id: "tkt_1001",
    customerId: "cust_001",
    subject: "Webhook retries are delayed",
    status: "open",
    priority: "high",
    createdAt: "2026-04-15T08:00:00Z",
    updatedAt: "2026-04-16T10:15:00Z"
  },
  {
    id: "tkt_1002",
    customerId: "cust_002",
    subject: "Need help importing contacts from CSV",
    status: "pending",
    priority: "medium",
    createdAt: "2026-04-13T12:30:00Z",
    updatedAt: "2026-04-14T09:00:00Z"
  },
  {
    id: "tkt_1003",
    customerId: "cust_003",
    subject: "SSO setup checklist",
    status: "open",
    priority: "medium",
    createdAt: "2026-04-12T07:50:00Z",
    updatedAt: "2026-04-16T18:40:00Z"
  },
  {
    id: "tkt_1004",
    customerId: "cust_004",
    subject: "Cancellation request follow-up",
    status: "closed",
    priority: "low",
    createdAt: "2026-03-27T15:00:00Z",
    updatedAt: "2026-03-29T10:05:00Z"
  }
];

export function findCustomerById(customerId: string): Customer | undefined {
  return customers.find((customer) => customer.id === customerId);
}

export function findTicketsForCustomer(customerId: string): Ticket[] {
  return tickets.filter((ticket) => ticket.customerId === customerId);
}
