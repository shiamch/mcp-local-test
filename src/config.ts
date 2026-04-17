function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getDatabaseConfig() {
  return {
    client: readEnv("DB_CLIENT", "mysql"),
    host: readEnv("DB_HOST", "127.0.0.1"),
    port: Number(readEnv("DB_PORT", "3306")),
    name: readEnv("DB_NAME", "your_database_name"),
    user: readEnv("DB_USER", "readonly_user"),
    password: readEnv("DB_PASSWORD", "replace_me"),
    customersTable: readEnv("DB_CUSTOMERS_TABLE", "customers"),
    ticketsTable: readEnv("DB_TICKETS_TABLE", "tickets")
  };
}
