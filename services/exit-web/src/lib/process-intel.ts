import { mandateEventsFrom, aggregateBuyerResponse, processFunnel } from "@exit/engines";
import { LISTING_PRIVATE, LISTING_MATCHES, SAMPLE_NDAS, SAMPLE_OFFERS } from "./engines";

// PROCESS INTELLIGENCE — the live buyer-response telemetry for the founder's
// own mandate, derived from the platform's real NDA + offer artifacts (each
// timestamped). This is the seed of the buyer-response moat: as real
// processes run, "who responds fast / signs / issues LOIs / closes / walks"
// accrues for the whole network. Today it reflects the live demo process.

const EVENTS = mandateEventsFrom({
  listingId: LISTING_PRIVATE.listingId,
  matchedBuyers: LISTING_MATCHES.matches.map((m) => ({ name: m.buyerName })),
  ndas: SAMPLE_NDAS,
  offers: SAMPLE_OFFERS,
});

export const BUYER_RESPONSES = aggregateBuyerResponse(EVENTS)
  .slice()
  .sort((a, b) => Number(b.closed) - Number(a.closed) || Number(b.loiIssued) - Number(a.loiIssued) || Number(b.ndaSigned) - Number(a.ndaSigned));

export const PROCESS_FUNNEL = processFunnel(BUYER_RESPONSES);
