import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Shell from "./components/Shell";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Intelligence from "./pages/Intelligence";
import DataRoom from "./pages/DataRoom";
import Buyers from "./pages/Buyers";
import Investors from "./pages/Investors";
import Negotiator from "./pages/Negotiator";
import Documents from "./pages/Documents";
import Nda from "./pages/Nda";
import Pipeline from "./pages/Pipeline";
import Closing from "./pages/Closing";
import Marketplace from "./pages/Marketplace";
import Calibration from "./pages/Calibration";
import Simulator from "./pages/Simulator";
import Valuation from "./pages/Valuation";
import DiligenceAI from "./pages/DiligenceAI";
import Banker from "./pages/Banker";
import BuyerPortal from "./pages/BuyerPortal";
import Autopilot from "./pages/Autopilot";
import Readiness from "./pages/Readiness";
import Wealth from "./pages/Wealth";
import BuyerCopilot from "./pages/BuyerCopilot";
import DealRoom from "./pages/DealRoom";

const Console: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <SignIn />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="autopilot" element={<Autopilot />} />
        <Route path="readiness" element={<Readiness />} />
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
    </Shell>
  );
};

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/console/*" element={<Console />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
