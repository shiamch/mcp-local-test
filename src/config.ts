import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const fileContents = readFileSync(filePath, "utf8");
  const lines = fileContents.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadEnvFiles() {
  const cwd = process.cwd();

  loadEnvFile(join(cwd, ".env.local"));
  loadEnvFile(join(cwd, ".env"));
}

loadEnvFiles();

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
    name: readEnv("DB_NAME", "wordpress"),
    user: readEnv("DB_USER", "readonly_user"),
    password: readEnv("DB_PASSWORD", "replace_me"),
    boardsTable: readEnv("DB_BOARDS_TABLE", "wp_fbs_boards"),
    tasksTable: readEnv("DB_TASKS_TABLE", "wp_fbs_tasks")
  };
}
