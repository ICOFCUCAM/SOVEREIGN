import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Shell from "./components/Shell";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";

// Public entry (Landing) and the auth gate (SignIn) load eagerly; everything
// behind the console is lazy so the initial bundle stays small and the engines
// only load once a founder is inside.
const Pricing      = lazy(() => import("./pages/Pricing"));
const Dashboard    = lazy(() => import("./pages/Dashboard"));
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
const BuyerPortal  = lazy(() => import("./pages/BuyerPortal"));
const Autopilot    = lazy(() => import("./pages/Autopilot"));
const Readiness    = lazy(() => import("./pages/Readiness"));
const Wealth       = lazy(() => import("./pages/Wealth"));
const BuyerCopilot = lazy(() => import("./pages/BuyerCopilot"));
const DealRoom     = lazy(() => import("./pages/DealRoom"));
const ExitTiming   = lazy(() => import("./pages/ExitTiming"));
const Commander    = lazy(() => import("./pages/Commander"));
const Network      = lazy(() => import("./pages/Network"));

const RouteFallback: React.FC = () => (
  <div className="flex items-center gap-3 py-20 text-sm text-white/45">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-deal-400" />
    Loading…
  </div>
);

const Console: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <SignIn />;
  return (
    <Shell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="commander" element={<Commander />} />
          <Route path="network" element={<Network />} />
          <Route path="autopilot" element={<Autopilot />} />
          <Route path="readiness" element={<Readiness />} />
          <Route path="exit-timing" element={<ExitTiming />} />
          <Route path="wealth" element={<Wealth />} />
          <Route path="buyer-copilot" element={<BuyerCopilot />} />
          <Route path="deal-room" element={<DealRoom />} />
          <Route path="intelligence" element={<Intelligence />} />
          <Route path="data-room" element={<DataRoom />} />
          <Route path="buyers" element={<Buyers />} />
          <Route path="investors" element={<Investors />} />
          <Route path="negotiator" element={<Negotiator />} />
          <Route path="documents" element={<Documents />} />
          <Route path="nda" element={<Nda />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="closing" element={<Closing />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="valuation" element={<Valuation />} />
          <Route path="diligence-ai" element={<DiligenceAI />} />
          <Route path="banker" element={<Banker />} />
          <Route path="buyer-portal" element={<BuyerPortal />} />
          <Route path="calibration" element={<Calibration />} />
          <Route path="simulator" element={<Simulator />} />
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
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/console/*" element={<Console />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;
