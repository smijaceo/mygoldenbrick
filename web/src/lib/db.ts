import "server-only";
import { createClient } from "@libsql/client/http";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hostedDriver, localDriver, type Driver, type Param } from "./db-drivers";
import { seedIfEmpty } from "./seed";
import { MIGRATIONS, migrate } from "./schema";

const globalForDb = globalThis as unknown as { __db?: Driver };

/** A file, built from the sample data the first time it opens. */
function openLocal(): Driver {
  // Vercel's servers can only write to temp space, so a preview gets throwaway sample data.
  const dir = process.env.VERCEL ? path.join(os.tmpdir(), "app-data") : path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "app.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  migrate(db);
  seedIfEmpty(db);
  return localDriver(db);
}

function open(): Driver {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) return hostedDriver(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }), MIGRATIONS);
  // Falling back here would quietly lose every account each time a server restarted.
  if (process.env.VERCEL_ENV === "production") throw new Error("TURSO_DATABASE_URL is not set in production.");
  return openLocal();
}

function driver(): Driver {
  if (!globalForDb.__db) globalForDb.__db = open();
  return globalForDb.__db;
}

export async function all<T>(sql: string, ...params: Param[]): Promise<T[]> {
  return driver().all<T>(sql, params);
}

export async function get<T>(sql: string, ...params: Param[]): Promise<T | undefined> {
  return driver().get<T>(sql, params);
}

export async function run(sql: string, ...params: Param[]) {
  return driver().run(sql, params);
}

/** Everything awaited inside `fn` happens in the transaction. */
export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  return driver().transaction(fn);
}
