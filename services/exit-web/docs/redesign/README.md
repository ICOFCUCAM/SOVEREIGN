# ExitOS console redesign — page inventory and sequence

Order = the route registry `ROUTES` in `src/App.tsx` (the directive: "use the real route registry and page inventory to determine the actual sequence"). Label, roles and plan gate come from `NAV` in `src/lib/access.ts`. One page at a time; each waits for the owner's approval.

| Page | Route | Label (NAV) | Component | Roles | Plan gate | Status |
|---|---|---|---|---|---|---|
| 01 | `/console` | Intelligence Terminal | `Terminal` | founder | none | ☑ approved |
| 02 | `/console/command` (guarded by `/console`) | Liquidity Command | `Dashboard` | founder | none | ◐ in progress |
| 03 | `/console/intake` | Value My Company | `Intake` | founder | none | ☐ |
| 04 | `/console/acquisition-radar` | Acquisition Radar | `AcquisitionRadar` | founder, buyer | none | ☐ |
| 05 | `/console/commander` | Chief Investment Banker | `Commander` | founder | Pro | ☐ |
| 06 | `/console/network` | Network Intelligence | `Network` | founder | Pro | ☐ |
| 07 | `/console/autopilot` | Autonomous Exit | `Autopilot` | founder | Preparation or Pro | ☐ |
| 08 | `/console/readiness` | Readiness | `Readiness` | founder | none | ☐ |
| 09 | `/console/exit-timing` | Exit Timing | `ExitTiming` | founder | Pro | ☐ |
| 10 | `/console/wealth` | Liquidity & Transition | `Wealth` | founder | Pro | ☐ |
| 11 | `/console/buyer-copilot` | Buyer Intelligence | `BuyerCopilot` | founder | Preparation or Pro | ☐ |
| 12 | `/console/deal-room` | Live Deal Room / Deal Room | `DealRoom` | founder, buyer | Pro | ☐ |
| 13 | `/console/intelligence` | Acquisition Radar | `Intelligence` | founder, buyer | none | ☐ |
| 14 | `/console/data-room` | Data Room | `DataRoom` | founder | Preparation or Pro | ☐ |
| 15 | `/console/buyers` | Buyer Profiles | `Buyers` | founder | none | ☐ |
| 16 | `/console/buyer-graph` | Buyer Graph | `BuyerGraph` | founder | Preparation or Pro | ☐ |
| 17 | `/console/buyer/:id` (guarded by `/console/buyer-graph`) | Buyer Graph | `BuyerProfile` | founder | Preparation or Pro | ☐ |
| 18 | `/console/market-map` | Market Map | `MarketMap` | founder | Preparation or Pro | ☐ |
| 19 | `/console/knowledge-graph` | Knowledge Graph | `KnowledgeGraph` | founder | Preparation or Pro | ☐ |
| 20 | `/console/outcomes` | Outcome Intelligence | `OutcomeIntelligence` | founder | Preparation or Pro | ☐ |
| 21 | `/console/indexes` | Acquisition Indexes | `Indexes` | founder | Preparation or Pro | ☐ |
| 22 | `/console/investors` | Cap Table | `Investors` | founder | none | ☐ |
| 23 | `/console/negotiator` | Bid Room | `Negotiator` | founder | Pro | ☐ |
| 24 | `/console/documents` | Documents | `Documents` | founder | Preparation or Pro | ☐ |
| 25 | `/console/nda` | NDA Vault / Access Requests | `Nda` | founder, buyer | Pro | ☐ |
| 26 | `/console/pipeline` | Active Processes | `Pipeline` | founder | none | ☐ |
| 27 | `/console/process-intel` | Process Intelligence | `ProcessIntelligence` | founder | Pro | ☐ |
| 28 | `/console/activity` | Deal Activity | `DealActivity` | founder, buyer | none | ☐ |
| 29 | `/console/inbox` | Inbox | `FounderInbox` | founder | none | ☐ |
| 30 | `/console/outreach-plan` | Outreach Plan | `OutreachPlan` | founder | Preparation or Pro | ☐ |
| 31 | `/console/engagement-registry` | Engagement Registry | `EngagementRegistry` | founder | Preparation or Pro | ☐ |
| 32 | `/console/closing` | Closing Center / Signatures / Escrow | `Closing` | founder | Pro | ☐ |
| 33 | `/console/marketplace` | Anonymous Listings / Browse Opportunities | `Marketplace` | founder, buyer | none | ☐ |
| 34 | `/console/valuation` | Enterprise Value | `Valuation` | founder | none | ☐ |
| 35 | `/console/diligence-ai` | Diligence | `DiligenceAI` | founder | Preparation or Pro | ☐ |
| 36 | `/console/banker` | Outreach | `Banker` | founder | Pro | ☐ |
| 37 | `/console/buyer-portal` | Buyer Home | `BuyerPortal` | buyer | none | ☐ |
| 38 | `/console/calibration` | Calibration | `Calibration` | admin | none | ☐ |
| 39 | `/console/simulator` | Scenario Simulator | `Simulator` | founder | Pro | ☐ |
| 40 | `/console/admin` | Admin Console | `Admin` | admin | none | ☐ |
| 41 | `/console/upgrade` | — | `Upgrade` | any signed-in role | none | ☐ |

Notes: `/console/buyer/:id` (Buyer profile) is guarded by the Buyer Graph policy. Public routes (`/`, `/platform`, `/pricing`, `/report/*`) are outside the console and are not in this sequence.
