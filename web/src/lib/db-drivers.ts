import { AsyncLocalStorage } from "node:async_hooks";
import type { DatabaseSync } from "node:sqlite";
import type { Client, ResultSet, Transaction } from "@libsql/client/http";

export type Param = string | number | bigint | null;
export type RunResult = { changes: number; lastInsertRowid: number };

/** The same four calls whichever database is underneath. */
export type Driver = {
  all<T>(sql: string, params: Param[]): Promise<T[]>;
  get<T>(sql: string, params: Param[]): Promise<T | undefined>;
  run(sql: string, params: Param[]): Promise<RunResult>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
};

/**
 * A SQLite file: on your own machine, or throwaway sample data on a Vercel preview.
 * There is one connection, so requests take turns while a transaction is open; otherwise
 * another request's statements would land inside it and roll back with it.
 */
export function localDriver(db: DatabaseSync): Driver {
  const inTransaction = new AsyncLocalStorage<true>();
  let queue: Promise<unknown> = Promise.resolve();

  const inTurn = <T>(fn: () => T | Promise<T>): Promise<T> => {
    if (inTransaction.getStore()) return (async () => fn())();
    const result = queue.then(fn);
    queue = result.catch(() => {});
    return result;
  };

  return {
    // node:sqlite returns null-prototype rows; copy them into plain objects so they can be
    // passed to Client Components.
    all: <T>(sql: string, params: Param[]) =>
      inTurn(() => db.prepare(sql).all(...params).map((row) => ({ ...row }) as T)),
    get: <T>(sql: string, params: Param[]) =>
      inTurn(() => {
        const row = db.prepare(sql).get(...params);
        return row ? ({ ...row } as T) : undefined;
      }),
    run: (sql, params) =>
      inTurn(() => {
        const res = db.prepare(sql).run(...params);
        return { changes: Number(res.changes), lastInsertRowid: Number(res.lastInsertRowid) };
      }),
    transaction: <T>(fn: () => Promise<T>) =>
      inTurn(async () => {
        if (inTransaction.getStore()) return fn();
        db.exec("BEGIN");
        try {
          const result = await inTransaction.run(true, fn);
          db.exec("COMMIT");
          return result;
        } catch (err) {
          db.exec("ROLLBACK");
          throw err;
        }
      }),
  };
}

type HostedClient = Pick<Client, "execute" | "transaction">;

/**
 * Brings a hosted database up to date, one migration at a time. Each runs in a write
 * transaction that re-reads the version, so servers starting together can't apply one twice.
 */
export async function migrateHosted(client: HostedClient, migrations: string[]) {
  await client.execute("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)");
  const current = async (c: Pick<Transaction, "execute"> | HostedClient) => {
    const rows = toRows<{ version: number }>(await c.execute("SELECT version FROM schema_version LIMIT 1"));
    return rows[0]?.version ?? 0;
  };
  if ((await current(client)) >= migrations.length) return;

  for (let v = await current(client); v < migrations.length; v++) {
    const tx = await client.transaction("write");
    try {
      if ((await current(tx)) === v) {
        await tx.executeMultiple(migrations[v]);
        await tx.execute("DELETE FROM schema_version");
        await tx.execute({ sql: "INSERT INTO schema_version (version) VALUES (?)", args: [v + 1] });
      }
      await tx.commit();
    } catch (err) {
      if (!tx.closed) await tx.rollback().catch(() => {});
      throw err;
    } finally {
      tx.close();
    }
  }
}

function toRows<T>(result: ResultSet): T[] {
  return result.rows.map((row) => Object.fromEntries(result.columns.map((name, i) => [name, row[i]])) as T);
}

/** A database shared by every server, so accounts and sessions last. Used in production. */
export function hostedDriver(client: HostedClient, migrations: string[]): Driver {
  const active = new AsyncLocalStorage<Transaction>();

  let ready: Promise<void> | undefined;
  const prepared = () => {
    ready ??= migrateHosted(client, migrations).catch((err) => {
      ready = undefined; // Try again on the next request rather than failing until a restart.
      throw err;
    });
    return ready;
  };

  const execute = async (sql: string, params: Param[]) => {
    await prepared();
    return (active.getStore() ?? client).execute({ sql, args: params });
  };

  return {
    all: async <T>(sql: string, params: Param[]) => toRows<T>(await execute(sql, params)),
    get: async <T>(sql: string, params: Param[]) => toRows<T>(await execute(sql, params))[0],
    run: async (sql, params) => {
      const res = await execute(sql, params);
      return { changes: res.rowsAffected, lastInsertRowid: Number(res.lastInsertRowid ?? 0) };
    },
    transaction: async <T>(fn: () => Promise<T>) => {
      if (active.getStore()) return fn();
      await prepared();
      const tx = await client.transaction("write");
      try {
        const result = await active.run(tx, fn);
        await tx.commit();
        return result;
      } catch (err) {
        if (!tx.closed) await tx.rollback().catch(() => {});
        throw err;
      } finally {
        tx.close();
      }
    },
  };
}
