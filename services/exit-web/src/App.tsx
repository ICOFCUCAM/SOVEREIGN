import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { canAccess, needsUpgrade, homeFor, featureLabel } from "./lib/access";
import Shell from "./components/Shell";
import { ExchangeMark } from "./components/ExchangeMark";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";

const Pricing      = lazy(() => import("./pages/Pricing"));
const Platform     = lazy(() => import("./pages/Platform"));
const Modules      = lazy(() => import("./pages/Modules"));
const Report       = lazy(() => import("./pages/Report"));
const ReportBuyers = lazy(() => import("./pages/ReportBuyers"));
const ReportReadiness = lazy(() => import("./pages/ReportReadiness"));
const ReportMarket = lazy(() => import("./pages/ReportMarket"));
const ReportBoard = lazy(() => import("./pages/ReportBoard"));
const ReportCIM = lazy(() => import("./pages/ReportCIM"));
const ReportBuyerBrief = lazy(() => import("./pages/ReportBuyerBrief"));
const ReportNda = lazy(() => import("./pages/ReportNda"));
const ReportManagement = lazy(() => import("./pages/ReportManagement"));
const Dashboard    = lazy(() => import("./pages/Dashboard"));
const Terminal     = lazy(() => import("./pages/Terminal"));
const Intelligence = lazy(() => import("./pages/Intelligence"));
const DataRoom     = lazy(() => import("./pages/DataRoom"));
const Buyers       = lazy(() => import("./pages/Buyers"));
const Investors    = lazy(() => import("./pages/Investors"));
const Negotiator   = lazy(() => import("./pages/Negotiator"));
const Documents    = lazy(() => import("./pages/Documents"));
const Nda          = lazy(() => import("./pages/Nda"));
const Pipeline     = lazy(() => import("./pages/Pipeline"));
const Closing      = lazy(() => import("./pages/Closing"));
const Marketplace  = lazy(() => import("./pages/Marketplace"));
const Calibration  = lazy(() => import("./pages/Calibration"));
const Simulator    = lazy(() => import("./pages/Simulator"));
const Valuation    = lazy(() => import("./pages/Valuation"));
const DiligenceAI  = lazy(() => import("./pages/DiligenceAI"));
const Banker       = lazy(() => import("./pages/Banker"));
const BuyerGraph   = lazy(() => import("./pages/BuyerGraph"));
const BuyerProfile = lazy(() => import("./pages/BuyerProfile"));
const MarketMap    = lazy(() => import("./pages/MarketMap"));
const KnowledgeGraph = lazy(() => import("./pages/KnowledgeGraph"));
const OutcomeIntelligence = lazy(() => import("./pages/OutcomeIntelligence"));
const Indexes      = lazy(() => import("./pages/Indexes"));
const Intake       = lazy(() => import("./pages/Intake"));
const AcquisitionRadar = lazy(() => import("./pages/AcquisitionRadar"));
const ProcessIntelligence = lazy(() => import("./pages/ProcessIntelligence"));
const OutreachPlan = lazy(() => import("./pages/OutreachPlan"));
const EngagementRegistry = lazy(() => import("./pages/EngagementRegistry"));
const DealActivity = lazy(() => import("./pages/DealActivity"));
const FounderInbox = lazy(() => import("./pages/FounderInbox"));
const BuyerPortal  = lazy(() => import("./pages/BuyerPortal"));
const Autopilot    = lazy(() => import("./pages/Autopilot"));
const Readiness    = lazy(() => import("./pages/Readiness"));
const Wealth       = lazy(() => import("./pages/Wealth"));
const BuyerCopilot = lazy(() => import("./pages/BuyerCopilot"));
const DealRoom     = lazy(() => import("./pages/DealRoom"));
const ExitTiming   = lazy(() => import("./pages/ExitTiming"));
const Commander    = lazy(() => import("./pages/Commander"));
const Network      = lazy(() => import("./pages/Network"));
const Upgrade      = lazy(() => import("./pages/Upgrade"));
const Admin        = lazy(() => import("./pages/Admin"));

const RouteFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-24">
    <ExchangeMark size={44} loading title="Loading ExitOS" />
    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">Routing the exchange…</span>
  </div>
);

// Each console route is gated by the access policy: a role that can't see it is
// redirected to its home; a free plan hitting a pro surface gets the paywall.
const Guard: React.FC<{ policy: string; children: React.ReactNode }> = ({ policy, children }) => {
  const { session } = useAuth();
  const role = session?.role ?? "founder";
  const plan = session?.plan ?? "free";
  if (!canAccess(policy, role)) return <Navigate to={homeFor(role)} replace />;
  if (needsUpgrade(policy, role, plan)) return <Upgrade feature={featureLabel(policy, role)} />;
  return <>{children}</>;
};

const ROUTES: { path: string; policy: string; el: React.ReactNode }[] = [
  { path: "/",             policy: "/console",                el: <Terminal /> },
  { path: "command",       policy: "/console",                el: <Dashboard /> },
  { path: "intake",        policy: "/console/intake",         el: <Intake /> },
  { path: "acquisition-radar", policy: "/console/acquisition-radar", el: <AcquisitionRadar /> },
  { path: "commander",     policy: "/console/commander",      el: <Commander /> },
  { path: "network",       policy: "/console/network",        el: <Network /> },
  { path: "autopilot",     policy: "/console/autopilot",      el: <Autopilot /> },
  { path: "readiness",     policy: "/console/readiness",      el: <Readiness /> },
  { path: "exit-timing",   policy: "/console/exit-timing",    el: <ExitTiming /> },
  { path: "wealth",        policy: "/console/wealth",         el: <Wealth /> },
  { path: "buyer-copilot", policy: "/console/buyer-copilot",  el: <BuyerCopilot /> },
  { path: "deal-room",     policy: "/console/deal-room",      el: <DealRoom /> },
  { path: "intelligence",  policy: "/console/intelligence",   el: <Intelligence /> },
  { path: "data-room",     policy: "/console/data-room",      el: <DataRoom /> },
  { path: "buyers",        policy: "/console/buyers",         el: <Buyers /> },
  { path: "buyer-graph",   policy: "/console/buyer-graph",    el: <BuyerGraph /> },
  { path: "buyer/:id",     policy: "/console/buyer-graph",    el: <BuyerProfile /> },
  { path: "market-map",    policy: "/console/market-map",     el: <MarketMap /> },
  { path: "knowledge-graph", policy: "/console/knowledge-graph", el: <KnowledgeGraph /> },
  { path: "outcomes",      policy: "/console/outcomes",        el: <OutcomeIntelligence /> },
  { path: "indexes",       policy: "/console/indexes",         el: <Indexes /> },
  { path: "investors",     policy: "/console/investors",      el: <Investors /> },
  { path: "negotiator",    policy: "/console/negotiator",     el: <Negotiator /> },
  { path: "documents",     policy: "/console/documents",      el: <Documents /> },
  { path: "nda",           policy: "/console/nda",            el: <Nda /> },
  { path: "pipeline",      policy: "/console/pipeline",       el: <Pipeline /> },
  { path: "process-intel", policy: "/console/process-intel",  el: <ProcessIntelligence /> },
  { path: "activity",      policy: "/console/activity",       el: <DealActivity /> },
  { path: "inbox",         policy: "/console/inbox",          el: <FounderInbox /> },
  { path: "outreach-plan", policy: "/console/outreach-plan",  el: <OutreachPlan /> },
  { path: "engagement-registry", policy: "/console/engagement-registry", el: <EngagementRegistry /> },
  { path: "closing",       policy: "/console/closing",        el: <Closing /> },
  { path: "marketplace",   policy: "/console/marketplace",    el: <Marketplace /> },
  { path: "valuation",     policy: "/console/valuation",      el: <Valuation /> },
  { path: "diligence-ai",  policy: "/console/diligence-ai",   el: <DiligenceAI /> },
  { path: "banker",        policy: "/console/banker",         el: <Banker /> },
  { path: "buyer-portal",  policy: "/console/buyer-portal",   el: <BuyerPortal /> },
  { path: "calibration",   policy: "/console/calibration",    el: <Calibration /> },
  { path: "simulator",     policy: "/console/simulator",      el: <Simulator /> },
  { path: "admin",         policy: "/console/admin",          el: <Admin /> },
  { path: "upgrade",       policy: "/console/upgrade",        el: <Upgrade /> },
];

const Console: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <SignIn />;
  return (
    <Shell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={<Guard policy={r.policy}>{r.el}</Guard>} />
          ))}
          <Route path="*" element={<Navigate to="/console" replace />} />
        </Routes>
      </Suspense>
    </Shell>
  );
};

const App: React.FC = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/platform" element={<Platform />} />
      <Route path="/modules" element={<Modules />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/report/valuation" element={<Report />} />
      <Route path="/report/buyers" element={<ReportBuyers />} />
      <Route path="/report/readiness" element={<ReportReadiness />} />
      <Route path="/report/market" element={<ReportMarket />} />
      <Route path="/report/board" element={<ReportBoard />} />
      <Route path="/report/cim" element={<ReportCIM />} />
      <Route path="/report/buyer/:id" element={<ReportBuyerBrief />} />
      <Route path="/report/nda" element={<ReportNda />} />
      <Route path="/report/management" element={<ReportManagement />} />
      <Route path="/console/*" element={<Console />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;
