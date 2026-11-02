/**
 * The landing page's buyer-inquiry demo. Nothing here touches the database: the buyers are
 * fictional and nothing is saved or sent.
 */
export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

const BUYERS = ["Morgan Ellis", "Jamie Lopez", "Riley Chen", "Sam Whitfield", "Alex Rivera"];
const ASKS = ["Could we tour %s this weekend?", "Is %s still available?", "What are the taxes on %s?"];

/** The sample inquiry for the nth press of "Try a buyer inquiry". */
export function askLead(n: number, street: string) {
  return {
    name: BUYERS[n % BUYERS.length],
    message: ASKS[n % ASKS.length].replace("%s", street),
  };
}
