import type { DatabaseSync } from "node:sqlite";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sites (
  agent_id INTEGER PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  brokerage TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT 'REALTOR®',
  phone TEXT NOT NULL DEFAULT '',
  public_email TEXT NOT NULL DEFAULT '',
  office_address TEXT NOT NULL DEFAULT '',
  service_area TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT 'Find your next home',
  subheadline TEXT NOT NULL DEFAULT '',
  hero_image TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#1f3d2b',
  accent_color TEXT NOT NULL DEFAULT '#c08a3e',
  font_style TEXT NOT NULL DEFAULT 'modern',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY,
  mls_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  price INTEGER NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  neighborhood TEXT NOT NULL DEFAULT '',
  beds INTEGER NOT NULL,
  baths REAL NOT NULL,
  sqft INTEGER NOT NULL,
  lot_acres REAL NOT NULL DEFAULT 0,
  year_built INTEGER NOT NULL,
  property_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photos TEXT NOT NULL DEFAULT '[]',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  listing_office TEXT NOT NULL DEFAULT '',
  listed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS featured_listings (
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (agent_id, listing_id)
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  quote TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  tour_date TEXT,
  stage TEXT NOT NULL DEFAULT 'new',
  unread INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS leads_agent ON leads(agent_id, created_at);

CREATE TABLE IF NOT EXISTS lead_events (
  id INTEGER PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS lead_events_lead ON lead_events(lead_id, created_at);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  done_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  path TEXT NOT NULL,
  listing_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS page_views_agent ON page_views(agent_id, created_at);
`;

/**
 * Ordered schema changes. Each runs once, in a transaction, and bumps
 * PRAGMA user_version. Never edit a shipped entry; append a new one.
 */
export const MIGRATIONS: string[] = [
  // 1: initial schema
  SCHEMA,
  // 2: counters for rate limiting (logins, sign-ups, lead forms, page views)
  `CREATE TABLE IF NOT EXISTS rate_limits (
     key TEXT PRIMARY KEY,
     count INTEGER NOT NULL,
     window_start INTEGER NOT NULL
   );`,
  // 3: agent-site themes; the v1 default accent becomes the brand bronze
  `ALTER TABLE sites ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark';
   UPDATE sites SET accent_color = '#a08672' WHERE accent_color = '#c08a3e';`,
  // 4: the light brand. Sites still on the old default bronze become light with the ink
  // accent; retired daylight sites become light and keep a colour the agent picked.
  `UPDATE sites SET theme = 'light', accent_color = '#111827' WHERE accent_color IN ('#a08672', '#8b6d58');
   UPDATE sites SET theme = 'light' WHERE theme = 'daylight';`,
];

export function migrate(db: DatabaseSync) {
  const { user_version: current } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[v]);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
}
