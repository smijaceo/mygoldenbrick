import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { Client } from "@libsql/client/http";
import { hostedDriver, localDriver, migrateHosted, type Driver } from "./db-drivers";

/** Behaves like the hosted client, on a real in-memory database. */
function fakeClient() {
  const db = new DatabaseSync(":memory:");
  const execute = async (stmt: string | { sql: string; args?: unknown[] }) => {
    const { sql, args = [] } = typeof stmt === "string" ? { sql: stmt } : stmt;
    const query = db.prepare(sql);
    if (query.columns().length === 0) {
      const res = query.run(...(args as never[]));
      return { columns: [], rows: [], rowsAffected: Number(res.changes), lastInsertRowid: BigInt(res.lastInsertRowid) };
    }
    const found = query.all(...(args as never[])) as Record<string, unknown>[];
    const columns = query.columns().map((c) => c.name);
    return { columns, rows: found.map((row) => columns.map((c) => row[c])), rowsAffected: 0, lastInsertRowid: undefined };
  };
  const client = {
    execute,
    transaction: async () => {
      db.exec("BEGIN");
      const tx = {
        closed: false,
        execute,
        executeMultiple: async (sql: string) => db.exec(sql),
        commit: async () => { db.exec("COMMIT"); tx.closed = true; },
        rollback: async () => { db.exec("ROLLBACK"); tx.closed = true; },
        close: () => {},
      };
      return tx;
    },
  };
  return { client: client as unknown as Client, db };
}

const SCHEMA = "CREATE TABLE people (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE)";

function local(): Driver {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  return localDriver(db);
}

const hosted = (): Driver => hostedDriver(fakeClient().client, [SCHEMA]);

describe.each([["local", local], ["hosted", hosted]] as const)("%s driver", (_, make) => {
  it("returns plain objects and the new row's id", async () => {
    const d = make();
    const { lastInsertRowid, changes } = await d.run("INSERT INTO people (name) VALUES (?)", ["Ana"]);
    expect({ lastInsertRowid, changes }).toEqual({ lastInsertRowid: 1, changes: 1 });
    const row = await d.get<{ id: number; name: string }>("SELECT id, name FROM people WHERE id = ?", [1]);
    expect(row).toEqual({ id: 1, name: "Ana" });
    expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
    expect(await d.all("SELECT name FROM people", [])).toEqual([{ name: "Ana" }]);
    expect(await d.get("SELECT 1 FROM people WHERE id = ?", [99])).toBeUndefined();
  });

  it("commits a transaction, and undoes all of it on failure", async () => {
    const d = make();
    const id = await d.transaction(async () => {
      const res = await d.run("INSERT INTO people (name) VALUES (?)", ["Ana"]);
      return res.lastInsertRowid;
    });
    expect(id).toBe(1);
    await expect(d.transaction(async () => {
      await d.run("INSERT INTO people (name) VALUES (?)", ["Ben"]);
      await d.run("INSERT INTO people (name) VALUES (?)", ["Ana"]);
    })).rejects.toThrow(/UNIQUE/);
    expect(await d.all("SELECT name FROM people", [])).toEqual([{ name: "Ana" }]);
  });

  it("lets a transaction contain helpers that open their own", async () => {
    const d = make();
    await d.transaction(() => d.transaction(() => d.run("INSERT INTO people (name) VALUES (?)", ["Ana"])));
    expect(await d.all("SELECT name FROM people", [])).toEqual([{ name: "Ana" }]);
  });
});

describe("local driver", () => {
  it("keeps another request's writes out of a transaction that rolls back", async () => {
    const d = local();
    let release = () => {};
    const paused = new Promise<void>((resolve) => { release = resolve; });
    const failing = d.transaction(async () => {
      await d.run("INSERT INTO people (name) VALUES (?)", ["Inside"]);
      await paused;
      throw new Error("nope");
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const other = d.run("INSERT INTO people (name) VALUES (?)", ["Outside"]);
    release();
    await expect(failing).rejects.toThrow("nope");
    await other;
    expect(await d.all("SELECT name FROM people", [])).toEqual([{ name: "Outside" }]);
  });

  it("carries on after a statement fails", async () => {
    const d = local();
    await expect(d.run("INSERT INTO nowhere VALUES (1)", [])).rejects.toThrow();
    await d.run("INSERT INTO people (name) VALUES (?)", ["Ana"]);
    expect(await d.all("SELECT name FROM people", [])).toEqual([{ name: "Ana" }]);
  });
});

describe("hosted migrations", () => {
  const version = (db: DatabaseSync) => (db.prepare("SELECT version FROM schema_version").get() as { version: number }).version;

  it("applies each once and picks up only new ones later", async () => {
    const { client, db } = fakeClient();
    await migrateHosted(client, [SCHEMA]);
    db.exec("INSERT INTO people (name) VALUES ('Ana')");
    await migrateHosted(client, [SCHEMA]);
    expect(version(db)).toBe(1);
    await migrateHosted(client, [SCHEMA, "ALTER TABLE people ADD COLUMN age INTEGER; UPDATE people SET age = 40;"]);
    expect(version(db)).toBe(2);
    expect(db.prepare("SELECT name, age FROM people").all().map((r) => ({ ...r }))).toEqual([{ name: "Ana", age: 40 }]);
  });

  it("leaves the version alone when a migration fails, so it can run again", async () => {
    const { client, db } = fakeClient();
    await expect(migrateHosted(client, [SCHEMA, "CREATE TABLE half (id INTEGER); THIS IS NOT SQL;"])).rejects.toThrow();
    expect(version(db)).toBe(1);
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'half'").get()).toBeUndefined();
  });

  it("makes the driver migrate before its first statement, and retry if that failed", async () => {
    const { client } = fakeClient();
    const steps = ["THIS IS NOT SQL"];
    const d = hostedDriver(client, steps);
    await expect(d.all("SELECT 1", [])).rejects.toThrow();
    steps[0] = SCHEMA;
    await d.run("INSERT INTO people (name) VALUES (?)", ["Ana"]);
    expect(await d.all("SELECT name FROM people", [])).toEqual([{ name: "Ana" }]);
  });
});
