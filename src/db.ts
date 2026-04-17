import mysql from "mysql2/promise";

import { getDatabaseConfig } from "./config.js";

const config = getDatabaseConfig();

const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.name,
  waitForConnections: true,
  connectionLimit: 5,
  namedPlaceholders: false
});

type Row = Record<string, unknown>;

function escapeIdentifier(identifier: string): string {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

async function getTableColumns(tableName: string): Promise<string[]> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `,
    [config.name, tableName]
  );

  return rows.map((row) => String(row.COLUMN_NAME));
}

function pickExistingColumn(columns: string[], candidates: string[]): string | undefined {
  const normalized = new Map(columns.map((column) => [column.toLowerCase(), column]));

  for (const candidate of candidates) {
    const match = normalized.get(candidate.toLowerCase());
    if (match) {
      return match;
    }
  }

  return undefined;
}

function pickSearchableColumns(columns: string[]): string[] {
  const candidateNames = [
    "id",
    "title",
    "name",
    "slug",
    "description",
    "content",
    "status"
  ];

  return candidateNames
    .map((candidate) => pickExistingColumn(columns, [candidate]))
    .filter((column): column is string => Boolean(column));
}

function pickBoardIdColumn(columns: string[]): string | undefined {
  return pickExistingColumn(columns, [
    "id",
    "board_id",
    "boardid",
    "boardId",
    "fbs_board_id"
  ]);
}

export function getRowBoardId(row: Row): string | number | undefined {
  const candidates = ["id", "board_id", "boardId", "boardid", "fbs_board_id"];

  for (const candidate of candidates) {
    const value = row[candidate];

    if (value !== undefined && value !== null) {
      if (typeof value === "string" || typeof value === "number") {
        return value;
      }

      return String(value);
    }
  }

  return undefined;
}

export async function testDatabaseConnection() {
  const [rows] = await pool.query<mysql.RowDataPacket[]>("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}

export async function searchBoards(query: string, limit: number) {
  const columns = await getTableColumns(config.boardsTable);
  const searchableColumns = pickSearchableColumns(columns);

  if (searchableColumns.length === 0) {
    throw new Error(
      `No searchable columns found in ${config.boardsTable}. Expected one of: id, title, name, slug, description, content, status`
    );
  }

  const whereSql = searchableColumns
    .map((column) => `CAST(${escapeIdentifier(column)} AS CHAR) LIKE ?`)
    .join(" OR ");
  const params: Array<string | number> = searchableColumns.map(() => `%${query}%`);
  params.push(limit);

  const sql = `
    SELECT *
    FROM ${escapeIdentifier(config.boardsTable)}
    WHERE ${whereSql}
    ORDER BY 1 DESC
    LIMIT ?
  `;

  const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, params);
  return rows as Row[];
}

export async function getBoardTasks(boardId: string | number, limit: number) {
  const columns = await getTableColumns(config.tasksTable);
  const boardColumn = pickExistingColumn(columns, [
    "board_id",
    "boardid",
    "boardId",
    "fbs_board_id",
    "task_board_id"
  ]);

  if (!boardColumn) {
    throw new Error(
      `Could not find a board reference column in ${config.tasksTable}. Tried: board_id, boardid, boardId, fbs_board_id, task_board_id`
    );
  }

  const sql = `
    SELECT *
    FROM ${escapeIdentifier(config.tasksTable)}
    WHERE ${escapeIdentifier(boardColumn)} = ?
    ORDER BY 1 DESC
    LIMIT ?
  `;

  const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, [boardId, limit]);
  return {
    boardColumn,
    tasks: rows as Row[]
  };
}

export async function getBoardResource(boardId: string | number) {
  const columns = await getTableColumns(config.boardsTable);
  const boardIdColumn = pickBoardIdColumn(columns);

  if (!boardIdColumn) {
    throw new Error(
      `Could not find a board id column in ${config.boardsTable}. Tried: id, board_id, boardid, boardId, fbs_board_id`
    );
  }

  const sql = `
    SELECT *
    FROM ${escapeIdentifier(config.boardsTable)}
    WHERE ${escapeIdentifier(boardIdColumn)} = ?
    LIMIT 1
  `;

  const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, [boardId]);
  return (rows[0] as Row | undefined) ?? null;
}

export async function listBoards(limit: number) {
  const sql = `
    SELECT *
    FROM ${escapeIdentifier(config.boardsTable)}
    ORDER BY 1 DESC
    LIMIT ?
  `;

  const [rows] = await pool.query<mysql.RowDataPacket[]>(sql, [limit]);
  return rows as Row[];
}
