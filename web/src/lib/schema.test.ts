import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS, migrate } from "./schema";

function v2Database() {
  const db = new DatabaseSync(":memory:");
  for (const step of MIGRATIONS.slice(0, 2)) db.exec(step);
  db.exec("PRAGMA user_version = 2");
  db.exec("INSERT INTO agents (email, password_hash, name, slug) VALUES ('a@b.test', 'x', 'A', 'a')");
  db.exec("INSERT INTO sites (agent_id, accent_color) VALUES (1, '#c08a3e')");
  return db;
}

describe("migration 3: site themes", () => {
  it("upgrades a v1 site, on its default colour, to the light theme without losing the row", () => {
    const db = v2Database();
    migrate(db);
    const site = db.prepare("SELECT theme, accent_color FROM sites WHERE agent_id = 1").get() as { theme: string; accent_color: string };
    expect(site.theme).toBe("light");
    expect(site.accent_color).toBe("#111827");
    expect((db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version).toBe(MIGRATIONS.length);
  });

  it("seeds a fresh database with the light theme and ink accent", async () => {
    const { seedIfEmpty } = await import("./seed");
    const db = new DatabaseSync(":memory:");
    migrate(db);
    seedIfEmpty(db);
    const site = db.prepare("SELECT theme, accent_color FROM sites LIMIT 1").get() as { theme: string; accent_color: string };
    expect(site).toEqual({ theme: "light", accent_color: "#111827" });
  });

  it("is safe to run twice", () => {
    const db = v2Database();
    migrate(db);
    expect(() => migrate(db)).not.toThrow();
  });
});

describe("migration 4: the light brand", () => {
  function v3Database(theme: string, accent: string) {
    const db = new DatabaseSync(":memory:");
    for (const step of MIGRATIONS.slice(0, 3)) db.exec(step);
    db.exec("PRAGMA user_version = 3");
    db.exec("INSERT INTO agents (email, password_hash, name, slug) VALUES ('a@b.test', 'x', 'A', 'a')");
    db.prepare("INSERT INTO sites (agent_id, theme, accent_color) VALUES (1, ?, ?)").run(theme, accent);
    migrate(db);
    return db.prepare("SELECT theme, accent_color FROM sites").get() as { theme: string; accent_color: string };
  }

  it("moves sites still on the old default bronze to light with the ink accent", () => {
    expect(v3Database("dark", "#a08672")).toEqual({ theme: "light", accent_color: "#111827" });
    expect(v3Database("daylight", "#8b6d58")).toEqual({ theme: "light", accent_color: "#111827" });
  });

  it("moves retired daylight sites to light and keeps a colour the agent picked", () => {
    expect(v3Database("daylight", "#6b86a6")).toEqual({ theme: "light", accent_color: "#6b86a6" });
  });

  it("leaves an agent who chose dark with their own colour alone", () => {
    expect(v3Database("dark", "#1f3d2b")).toEqual({ theme: "dark", accent_color: "#1f3d2b" });
  });
});
