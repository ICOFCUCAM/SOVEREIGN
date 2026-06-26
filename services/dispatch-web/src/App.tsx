import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { metaForPath } from "./lib/seo";
import ConsoleShell from "./components/Shell";
import Landing from "./pages/Landing";
import Procurement from "./pages/Procurement";
import Pricing from "./pages/Pricing";
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
import Developers from "./pages/Developers";
import OfficialRecord from "./pages/OfficialRecord";
import ValuePage from "./pages/ValuePage";
import Verify from "./pages/Verify";
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
import InstitutionSetup from "./pages/InstitutionSetup";
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
import PlatformOps from "./pages/PlatformOps";
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
          <Route path="setup" element={<InstitutionSetup />} />
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

// Product 4 — Platform Operations (the platform OPERATOR, not a tenant). A wholly
// separate product on its own surface and chrome — never an /admin screen. Gated
// SOLELY on the privileged dispatch:platform scope; a normal tenant credential
// (even a tenant_admin) lacks it and lands in PlatformOps' own locked state.
// Content-blind by construction: it can only read cross-tenant aggregates.
const PlatformOperations: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <SignIn />;
  return <PlatformOps />;
};

// Per-route document title + meta description, driven by lib/seo. Sets real tab /
// bookmark titles and helps JS-rendering crawlers index each surface distinctly.
function setMeta(key: string, content: string, property = false): void {
  const attr = property ? "property" : "name";
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
const RouteMeta: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    const { title, description } = metaForPath(pathname);
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
  }, [pathname]);
  return null;
};

const App: React.FC = () => (
  <>
  <RouteMeta />
  <Routes>
    {/* public marketing landing — the front door */}
    <Route path="/" element={<Landing />} />
    {/* public procurement + architecture dossier (no auth) */}
    <Route path="/procurement" element={<Procurement />} />
    <Route path="/pricing" element={<Pricing />} />
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
    {/* public developer platform — API docs, SDKs, webhooks, endpoint reference */}
    <Route path="/developers" element={<Developers />} />
    {/* the institutional distinction + public verification portal */}
    <Route path="/official-record" element={<OfficialRecord />} />
    {/* financial-value detail pages (7), introduced on the homepage */}
    <Route path="/value/:slug" element={<ValuePage />} />
    <Route path="/verify" element={<Verify />} />
    <Route path="/verify/:recordId" element={<Verify />} />
    {/* public self-serve signup (free plan) */}
    <Route path="/signup" element={<Signup />} />
    {/* product 1 — institutional operations */}
    <Route path="/console/*" element={<Operations />} />
    {/* product 2 — platform administration */}
    <Route path="/admin/*" element={<Administration />} />
    {/* product 3 — executive evaluation (procurement / board) */}
    <Route path="/evaluate" element={<Evaluation />} />
    {/* product 4 — platform operations (platform operator; dispatch:platform) */}
    <Route path="/operator" element={<PlatformOperations />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  </>
);

export default App;
