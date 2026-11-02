import type { DatabaseSync } from "node:sqlite";
import { hashPasswordSync } from "./password";
import { todayIso } from "./format";
import { DEFAULT_ACCENT } from "./themes";

// Fictional sample data so the app is usable before a real listing feed is connected.
// Every address, person and listing here is made up.

const EXTERIORS = [
  "1568605114967-8130f3a36994", "1570129477492-45c003edd2be", "1564013799919-ab600027ffc6",
  "1600596542815-ffad4c1539a9", "1600585154340-be6161a56a0c", "1512917774080-9991f1c4c750",
  "1580587771525-78b9dba3b914", "1605276374104-dee2a0ed3cd6", "1600047509807-ba8f99d2cdde",
  "1613490493576-7fde63acd811", "1613977257363-707ba9348227", "1558036117-15d82a90b9b1",
  "1523217582562-09d0def993a6", "1576941089067-2de3c901e126", "1598228723793-52759bba239c",
  "1572120360610-d971b9d7767c", "1583608205776-bfd35f0d9f83", "1599809275671-b5942cabc7a2",
  "1494526585095-c41746248156", "1416331108676-a22ccb276e35",
];
const INTERIORS = [
  "1600566753190-17f0baa2a6c3", "1600210492486-724fe5c67fb0", "1484154218962-a197022b5858",
  "1502672260266-1c1ef2d93688", "1600573472550-8090b5e0745e", "1556912173-3bb406ef7e77",
  "1560448204-e02f11c3d0e2",
];

export const photoUrl = (id: string) => `https://images.unsplash.com/photo-${id}`;

const AREAS = [
  { name: "Dundee", city: "Omaha", zip: "68132", lat: 41.262, lng: -95.99, ppsf: 210 },
  { name: "Benson", city: "Omaha", zip: "68104", lat: 41.284, lng: -96.01, ppsf: 165 },
  { name: "Aksarben", city: "Omaha", zip: "68106", lat: 41.24, lng: -96.015, ppsf: 190 },
  { name: "Midtown", city: "Omaha", zip: "68131", lat: 41.257, lng: -95.965, ppsf: 200 },
  { name: "Elkhorn", city: "Omaha", zip: "68022", lat: 41.286, lng: -96.235, ppsf: 185 },
  { name: "Millard", city: "Omaha", zip: "68137", lat: 41.205, lng: -96.13, ppsf: 160 },
  { name: "Regency", city: "Omaha", zip: "68114", lat: 41.265, lng: -96.075, ppsf: 240 },
  { name: "Papillion", city: "Papillion", zip: "68046", lat: 41.155, lng: -96.042, ppsf: 170 },
  { name: "Gretna", city: "Gretna", zip: "68028", lat: 41.14, lng: -96.24, ppsf: 175 },
  { name: "Bennington", city: "Bennington", zip: "68007", lat: 41.364, lng: -96.158, ppsf: 180 },
  { name: "Florence", city: "Omaha", zip: "68112", lat: 41.335, lng: -95.96, ppsf: 140 },
  { name: "Bellevue", city: "Bellevue", zip: "68005", lat: 41.137, lng: -95.915, ppsf: 150 },
];

const STREETS = [
  "Maple", "Hickory", "Cedar Ridge", "Prairie View", "Walnut", "Blondo", "Pacific",
  "Farnam", "Dodge", "Ashwood", "Linden", "Sycamore", "Fox Run", "Meadowlark",
  "Willow Creek", "Orchard", "Lakeview", "Stone Gate", "Harvest", "Briar Hill",
];
const SUFFIXES = ["Street", "Avenue", "Drive", "Lane", "Court", "Circle", "Road"];
const TYPES = ["Single Family", "Single Family", "Single Family", "Townhome", "Condo"];
const OFFICES = ["Prairie Home Realty", "Heartland Partners", "Riverbend Real Estate", "Keystone Group"];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const DEMO_EMAIL = "demo@imakepage.test";

export function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS n FROM listings").get() as { n: number };
  if (row.n > 0) return;

  const rand = rng(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
  const daysAgo = (d: number, h = 0) =>
    new Date(Date.now() - d * 86400000 - h * 3600000).toISOString().slice(0, 19).replace("T", " ");

  db.exec("BEGIN");
  try {
    const insertListing = db.prepare(`INSERT INTO listings
      (mls_number, status, price, street, city, state, zip, neighborhood, beds, baths, sqft,
       lot_acres, year_built, property_type, description, photos, lat, lng, listing_office, listed_at)
      VALUES (?, ?, ?, ?, ?, 'NE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (let i = 0; i < 48; i++) {
      const area = AREAS[i % AREAS.length];
      const type = pick(TYPES);
      const beds = type === "Condo" ? 1 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 4);
      const baths = Math.max(1, beds - 1 + (rand() > 0.5 ? 0.5 : 0));
      const sqft = Math.round((type === "Condo" ? between(700, 1400) : between(1200, 4200)) / 10) * 10;
      const yearBuilt = Math.floor(between(1925, 2025));
      const price = Math.round((sqft * area.ppsf * between(0.85, 1.25)) / 1000) * 1000;
      const lot = type === "Single Family" ? Math.round(between(0.12, 1.4) * 100) / 100 : 0;
      const status = i % 11 === 5 ? "pending" : i % 13 === 7 ? "sold" : "active";
      const street = `${100 + Math.floor(rand() * 19800)} ${pick(STREETS)} ${pick(SUFFIXES)}`;
      const photos = [
        photoUrl(EXTERIORS[i % EXTERIORS.length]),
        ...[0, 1, 2].map((k) => photoUrl(INTERIORS[(i + k * 2) % INTERIORS.length])),
      ];
      const description =
        `Welcome to this ${beds}-bedroom ${type.toLowerCase()} in ${area.name}. ` +
        `Built in ${yearBuilt}, it offers ${sqft.toLocaleString("en-US")} square feet of living space` +
        (lot ? ` on a ${lot}-acre lot` : "") +
        `, with an open main floor, updated kitchen and plenty of natural light. ` +
        `Close to parks, schools and shopping.`;
      insertListing.run(
        `SMP${(240000 + i * 137).toString()}`, status, price, street, area.city, area.zip, area.name,
        beds, baths, sqft, lot, yearBuilt, type, description, JSON.stringify(photos),
        area.lat + between(-0.018, 0.018), area.lng + between(-0.022, 0.022),
        pick(OFFICES), daysAgo(Math.floor(between(1, 90))),
      );
    }

    // Demo agent account (local testing only; credentials documented in README).
    const password = process.env.DEMO_PASSWORD || "demo-agent-2026";
    const agent = db
      .prepare("INSERT INTO agents (email, password_hash, name, slug) VALUES (?, ?, ?, ?)")
      .run(DEMO_EMAIL, hashPasswordSync(password), "Jordan Avery", "jordan-avery");
    const agentId = Number(agent.lastInsertRowid);

    db.prepare(`INSERT INTO sites (agent_id, brokerage, title, phone, public_email, office_address,
      service_area, headline, subheadline, hero_image, photo_url, bio, seo_title, seo_description, accent_color, theme)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'light')`).run(
      agentId, "Avery Home Group", "REALTOR®, Nebraska", "(402) 555-0142", "jordan@example.com",
      "1200 Example Plaza, Omaha, NE 68118", "Omaha, Elkhorn, Papillion & Gretna",
      "Find the home that fits your life",
      "Local guidance for buyers and sellers across the Omaha metro.",
      photoUrl("1600596542815-ffad4c1539a9"), "",
      "I help families buy and sell homes across the Omaha metro. I grew up here, I know the neighborhoods block by block, and I'll give you straight answers at every step, from the first showing to the closing table.",
      "Jordan Avery, Omaha real estate", "Search Omaha homes for sale and get local advice from Jordan Avery.", DEFAULT_ACCENT.light,
    );

    const featured = db.prepare("INSERT INTO featured_listings (agent_id, listing_id) VALUES (?, ?)");
    for (const id of [1, 4, 7, 10, 15, 22]) featured.run(agentId, id);

    const testimonial = db.prepare("INSERT INTO testimonials (agent_id, author, quote) VALUES (?, ?, ?)");
    testimonial.run(agentId, "Sam & Priya K.", "Jordan found us a house in Dundee two weeks before it would have hit the open market. Calm, quick and always honest.");
    testimonial.run(agentId, "Marcus T.", "Sold our place in Millard above asking in five days. The pricing advice was spot on.");
    testimonial.run(agentId, "Elena R.", "First-time buyer here. Every question got a clear answer, even the silly ones.");

    const insertLead = db.prepare(`INSERT INTO leads (agent_id, name, email, phone, message, source,
      listing_id, tour_date, stage, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertEvent = db.prepare("INSERT INTO lead_events (lead_id, kind, body, created_at) VALUES (?, ?, ?, ?)");
    const demoLeads: Array<[string, string, string, string, string, number | null, string | null, string, number, number]> = [
      ["Taylor Brooks", "taylor.b@example.com", "(402) 555-0188", "Is the basement finished? We'd love to see it this weekend.", "tour", 4, todayIso(6), "new", 1, 0.2],
      ["Chris Nguyen", "chris.n@example.com", "", "Thinking about selling next spring. What's my home worth?", "contact", null, null, "new", 1, 1],
      ["Morgan Ellis", "morgan.e@example.com", "(402) 555-0107", "Does this one have a fenced yard?", "listing", 7, null, "contacted", 0, 3],
      ["Avery Johnson", "avery.j@example.com", "(531) 555-0190", "Relocating from Denver in January, need 4 beds near good schools.", "contact", null, null, "qualified", 0, 5],
      ["Jamie Lopez", "jamie.l@example.com", "(402) 555-0175", "Saw it Saturday, can we talk numbers?", "tour", 10, todayIso(-7), "showing", 0, 8],
      ["Riley Chen", "riley.c@example.com", "", "We submitted an offer through our lender. Next steps?", "listing", 15, null, "offer", 0, 12],
      ["Drew Patel", "drew.p@example.com", "(402) 555-0133", "Closing went great, thank you!", "contact", null, null, "closed", 0, 30],
    ];
    for (const [name, email, phone, message, source, listingId, tour, stage, unread, age] of demoLeads) {
      const created = daysAgo(Math.floor(age), Math.round((age % 1) * 24));
      const lead = insertLead.run(agentId, name, email, phone, message, source, listingId, tour, stage, unread, created, created);
      const leadId = Number(lead.lastInsertRowid);
      insertEvent.run(leadId, "created", message, created);
      if (stage !== "new") insertEvent.run(leadId, "stage", `Moved to ${stage}`, daysAgo(Math.max(0, Math.floor(age) - 1)));
    }

    const insertTask = db.prepare("INSERT INTO tasks (agent_id, lead_id, title, due_date) VALUES (?, ?, ?, ?)");
    insertTask.run(agentId, 1, "Confirm Saturday tour time", todayIso());
    insertTask.run(agentId, 2, "Prepare a home value estimate", todayIso(1));
    insertTask.run(agentId, 4, "Send school district info", todayIso(3));

    const insertView = db.prepare("INSERT INTO page_views (agent_id, visitor_id, path, listing_id, created_at) VALUES (?, ?, ?, ?, ?)");
    for (let v = 0; v < 160; v++) {
      const listingId = rand() > 0.45 ? 1 + Math.floor(rand() * 48) : null;
      insertView.run(agentId, `seed-${Math.floor(rand() * 45)}`,
        listingId ? `/homes/${listingId}` : pick(["/", "/search", "/about", "/contact"]),
        listingId, daysAgo(Math.floor(rand() * 14), Math.floor(rand() * 24)));
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
