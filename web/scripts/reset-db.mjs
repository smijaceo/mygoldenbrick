// Deletes the local database. It is re-created with fresh sample data on next start.
import fs from "node:fs";

fs.rmSync(new URL("../data", import.meta.url), { recursive: true, force: true });
console.log("Database removed. Restart the app to re-create it with sample data.");
