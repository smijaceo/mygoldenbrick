// Prepares the hosted database once: brings its tables up to date and, if it has no listings,
// loads the fictional sample data. Safe to run again; it never overwrites existing rows.
//
//   npx --yes tsx --env-file=<file holding the TURSO_ settings> scripts/setup-hosted-db.mts
//
// The sample agent gets a long random password that is not printed or saved, because the
// password in the README is public and this database is on the internet.
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createClient, type InStatement } from "@libsql/client/http";
import { migrateHosted } from "../src/lib/db-drivers";
import { MIGRATIONS, migrate } from "../src/lib/schema";
import { seedIfEmpty } from "../src/lib/seed";

// Parents before children, so every reference points at a row that already exists.
const TABLES = ["listings", "agents", "sites", "featured_listings", "testimonials", "leads", "lead_events", "tasks", "outbox", "page_views"];

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("TURSO_DATABASE_URL is not set.");
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

await migrateHosted(client, MIGRATIONS);

const count = async (table: string) => Number((await client.execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n);

if ((await count("listings")) > 0) {
  console.log("Sample data is already there. Nothing added.");
} else {
  process.env.DEMO_PASSWORD = randomBytes(32).toString("base64url");
  const sample = new DatabaseSync(":memory:");
  migrate(sample);
  seedIfEmpty(sample);
  delete process.env.DEMO_PASSWORD;

  const statements: InStatement[] = [];
  for (const table of TABLES) {
    for (const row of sample.prepare(`SELECT * FROM ${table}`).all()) {
      const columns = Object.keys(row);
      statements.push({
        sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
        args: Object.values(row) as (string | number | null)[],
      });
    }
  }
  // All or nothing, so a dropped connection can't leave half the sample data behind.
  await client.batch(statements, "write");
  console.log(`Loaded ${statements.length} sample rows.`);
}

for (const table of TABLES) console.log(`${table}: ${await count(table)}`);
client.close();
