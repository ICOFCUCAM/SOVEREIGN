import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import ConsoleShell from "./components/Shell";
import Landing from "./pages/Landing";
import Procurement from "./pages/Procurement";
import Trust from "./pages/Trust";
import Outcomes from "./pages/Outcomes";
import RecordGallery from "./pages/RecordGallery";
import Standard from "./pages/Standard";
import ReadinessJourney from "./pages/ReadinessJourney";
import Architecture from "./pages/Architecture";
import Platform from "./pages/Platform";
import Security from "./pages/Security";
import Compliance from "./pages/Compliance";
import Evidence from "./pages/Evidence";
import SignIn from "./pages/SignIn";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";
import Submit from "./pages/Submit";
import Review from "./pages/Review";
import Library from "./pages/Library";
import DocumentView from "./pages/DocumentView";
import Audit from "./pages/Audit";
import Sovereignty from "./pages/Sovereignty";
import Access from "./pages/Access";
import AdminHome from "./pages/AdminHome";
import GovernancePolicies from "./pages/GovernancePolicies";
import AuthorityDirectory from "./pages/AuthorityDirectory";
import GovernanceMonitor from "./pages/GovernanceMonitor";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import GovernanceIntelligence from "./pages/GovernanceIntelligence";
import DeploymentArchitecture from "./pages/DeploymentArchitecture";
import OperationalResilience from "./pages/OperationalResilience";
import IntegrationControlCenter from "./pages/IntegrationControlCenter";
import EvidencePackage from "./pages/EvidencePackage";
import TrustCenter from "./pages/TrustCenter";
import EvaluationWorkspace from "./pages/EvaluationWorkspace";
import Polished from "./pages/polished/Polished";
import { BillingProvider } from "./lib/upsell";

// TWO PRODUCTS on one platform. Operations (/console) is for the institutional
// publication officer — records and governance, no implementation detail.
// Administration (/admin) is for the systems/security administrator — identity,
// access, integrations, policy, data sovereignty. Each requires a session; the
// Administration product additionally requires dispatch:admin, so an operator
// is bounced back to Operations and never lands in an administrative surface.

const Operations: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <SignIn />;
  return (
    <BillingProvider>
      <ConsoleShell variant="operations">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="create" element={<Create />} />
          <Route path="review" element={<Review />} />
          <Route path="library" element={<Library />} />
          <Route path="archives" element={<Library fixedState="archived" title="Archives" blurb="Records that have completed their lifecycle — archived for preservation under your retention rules." />} />
          <Route path="documents/:id" element={<DocumentView />} />
          <Route path="audit" element={<Audit />} />
          <Route path="polished" element={<Polished />} />
          <Route path="*" element={<Navigate to="/console" replace />} />
        </Routes>
      </ConsoleShell>
    </BillingProvider>
  );
};

const Administration: React.FC = () => {
  const { session, has } = useAuth();
  if (!session) return <SignIn />;
  if (!has("dispatch:admin")) return <Navigate to="/console" replace />; // operators never see Administration
  return (
    <BillingProvider>
      <ConsoleShell variant="administration">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="authority" element={<AuthorityDirectory />} />
          <Route path="access" element={<Access />} />
          <Route path="governance" element={<GovernancePolicies />} />
          <Route path="monitor" element={<GovernanceMonitor />} />
          <Route path="compliance" element={<ComplianceDashboard />} />
          <Route path="intelligence" element={<GovernanceIntelligence />} />
          <Route path="trust" element={<TrustCenter />} />
          <Route path="deployment" element={<DeploymentArchitecture />} />
          <Route path="resilience" element={<OperationalResilience />} />
          <Route path="evidence" element={<EvidencePackage />} />
          <Route path="integrations" element={<IntegrationControlCenter />} />
          <Route path="intake" element={<Submit />} />
          <Route path="sovereignty" element={<Sovereignty />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </ConsoleShell>
    </BillingProvider>
  );
};

// Product 3 — the Executive Evaluation Workspace (procurement / board audience).
// Requires a session (the assessment derives from the tenant's live posture);
// its own focused chrome, not the operations or administration shell.
const Evaluation: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <SignIn />;
  return <EvaluationWorkspace />;
};

const App: React.FC = () => (
  <Routes>
    {/* public marketing landing — the front door */}
    <Route path="/" element={<Landing />} />
    {/* public procurement + architecture dossier (no auth) */}
    <Route path="/procurement" element={<Procurement />} />
    <Route path="/trust" element={<Trust />} />
    {/* category / institutional-transformation surface (public) */}
    <Route path="/outcomes" element={<Outcomes />} />
    <Route path="/records" element={<RecordGallery />} />
    <Route path="/standard" element={<Standard />} />
    <Route path="/journey" element={<ReadinessJourney />} />
    <Route path="/architecture" element={<Architecture />} />
    <Route path="/platform" element={<Platform />} />
    <Route path="/security" element={<Security />} />
    <Route path="/compliance" element={<Compliance />} />
    <Route path="/evidence" element={<Evidence />} />
    {/* public self-serve signup (free plan) */}
    <Route path="/signup" element={<Signup />} />
    {/* product 1 — institutional operations */}
    <Route path="/console/*" element={<Operations />} />
    {/* product 2 — platform administration */}
    <Route path="/admin/*" element={<Administration />} />
    {/* product 3 — executive evaluation (procurement / board) */}
    <Route path="/evaluate" element={<Evaluation />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
