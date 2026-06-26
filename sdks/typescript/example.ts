// Example: submit a record, then verify an inbound webhook.
import { DispatchClient, verifyWebhook, DispatchApiError } from "./dispatch";

const dispatch = new DispatchClient({
  baseUrl: process.env.DISPATCH_API ?? "https://api.dispatch.sovereigndo.com",
  clientId: process.env.DISPATCH_CLIENT_ID!,
  secret: process.env.DISPATCH_SECRET!,
});

const record = {
  schemaVersion: "1.0",
  source: { system: "ministry-erp" },
  document: {
    ddmVersion: "1.0",
    docType: "executive_briefing",
    metadata: { title: "Regional Stability Brief", date: "2026-06-26", status: "final" },
    classification: { scheme: "none", level: "UNCLASSIFIED" },
    sections: [
      { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF.", style: "lead" }] },
      { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "One." }] }] },
      { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
      { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Proceed." }] },
    ],
  },
  outputs: ["pdf"],
  delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 },
};

async function main() {
  try {
    const { documentId, lifecycle } = await dispatch.createRecord(record, crypto.randomUUID());
    console.log(`submitted ${documentId} → ${lifecycle}`);
    console.log(await dispatch.getRecord(documentId));
  } catch (e) {
    if (e instanceof DispatchApiError) console.error(`Dispatch refused: ${e.code} — ${e.message}`);
    else throw e;
  }
}

// In your webhook receiver (Express-style):
//   app.post("/hooks/dispatch", express.raw({ type: "application/json" }), (req, res) => {
//     if (!verifyWebhook(req.body, req.header("x-dispatch-signature"), SECRET)) return res.sendStatus(401);
//     const { event, data } = JSON.parse(req.body.toString());
//     // ... react to event (idempotent on req.header("x-dispatch-delivery"))
//     res.sendStatus(200);
//   });
void verifyWebhook;

main();
