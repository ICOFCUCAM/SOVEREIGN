import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { metaForPath } from "./lib/seo";
import { FilmGrain } from "./components/brand";
import { BillingProvider } from "./lib/upsell";

// Eager — the homepage is the front door (no loading flash), and the auth pages
// are the immediate fallback for every product guard.
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Signup from "./pages/Signup";

// Lazy — every other route is its own chunk. A marketing visitor never downloads
// the console/admin product; an operator never downloads the marketing pages.
const ConsoleShell = lazy(() => import("./components/Shell"));
const Procurement = lazy(() => import("./pages/Procurement"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Trust = lazy(() => import("./pages/Trust"));
const Outcomes = lazy(() => import("./pages/Outcomes"));
const RecordGallery = lazy(() => import("./pages/RecordGallery"));
const Standard = lazy(() => import("./pages/Standard"));
const ReadinessJourney = lazy(() => import("./pages/ReadinessJourney"));
const Architecture = lazy(() => import("./pages/Architecture"));
const Platform = lazy(() => import("./pages/Platform"));
const Security = lazy(() => import("./pages/Security"));
const Compliance = lazy(() => import("./pages/Compliance"));
const Evidence = lazy(() => import("./pages/Evidence"));
const Developers = lazy(() => import("./pages/Developers"));
const OfficialRecord = lazy(() => import("./pages/OfficialRecord"));
const Walkthrough = lazy(() => import("./pages/Walkthrough"));
const CostOfPublication = lazy(() => import("./pages/CostOfPublication"));
const Lifecycle = lazy(() => import("./pages/Lifecycle"));
const Roi = lazy(() => import("./pages/Roi"));
const ValuePage = lazy(() => import("./pages/ValuePage"));
const Industries = lazy(() => import("./pages/Industries"));
const IndustryPage = lazy(() => import("./pages/IndustryPage"));
const Problems = lazy(() => import("./pages/Problems"));
const ProblemPage = lazy(() => import("./pages/ProblemPage"));
const KnowledgeLibrary = lazy(() => import("./pages/KnowledgeLibrary"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const Docs = lazy(() => import("./pages/Docs"));
const Verify = lazy(() => import("./pages/Verify"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Create = lazy(() => import("./pages/Create"));
const Submit = lazy(() => import("./pages/Submit"));
const Review = lazy(() => import("./pages/Review"));
const Library = lazy(() => import("./pages/Library"));
const DocumentView = lazy(() => import("./pages/DocumentView"));
const Audit = lazy(() => import("./pages/Audit"));
const Sovereignty = lazy(() => import("./pages/Sovereignty"));
const Access = lazy(() => import("./pages/Access"));
const AdminHome = lazy(() => import("./pages/AdminHome"));
const InstitutionSetup = lazy(() => import("./pages/InstitutionSetup"));
const GovernancePolicies = lazy(() => import("./pages/GovernancePolicies"));
const AuthorityDirectory = lazy(() => import("./pages/AuthorityDirectory"));
const GovernanceMonitor = lazy(() => import("./pages/GovernanceMonitor"));
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const GovernanceIntelligence = lazy(() => import("./pages/GovernanceIntelligence"));
const DeploymentArchitecture = lazy(() => import("./pages/DeploymentArchitecture"));
const OperationalResilience = lazy(() => import("./pages/OperationalResilience"));
const IntegrationControlCenter = lazy(() => import("./pages/IntegrationControlCenter"));
const EvidencePackage = lazy(() => import("./pages/EvidencePackage"));
const TrustCenter = lazy(() => import("./pages/TrustCenter"));
const EvaluationWorkspace = lazy(() => import("./pages/EvaluationWorkspace"));
const PlatformOps = lazy(() => import("./pages/PlatformOps"));
const Polished = lazy(() => import("./pages/polished/Polished"));

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
const SITE_ORIGIN = "https://dispatch.sovereigndo.com";
function setMeta(key: string, content: string, property = false): void {
  const attr = property ? "property" : "name";
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function setLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
  el.setAttribute("href", href);
}
// Per-route head — title, description, canonical, OpenGraph and Twitter on EVERY
// route, derived from lib/seo. No page sets these by hand; the ecosystem stays
// crawlable and link-preview-correct automatically.
const RouteMeta: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    const { title, description } = metaForPath(pathname);
    const canonical = SITE_ORIGIN + (pathname === "/" ? "/" : pathname.replace(/\/+$/, ""));
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonical, true);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setLink("canonical", canonical);
  }, [pathname]);
  return null;
};

// The fallback shown while a route chunk loads. Deliberately minimal — the brand
// ground (#070707 + film grain) so a split never flashes white, with no spinner
// or skeleton that would imply the destination's layout before it arrives.
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-[#070707]" aria-busy="true" aria-live="polite">
    <FilmGrain />
    <span className="sr-only">Loading…</span>
  </div>
);

const App: React.FC = () => (
  <>
  <RouteMeta />
  <Suspense fallback={<PageLoader />}>
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
    {/* interactive governed-record walkthrough */}
    <Route path="/walkthrough" element={<Walkthrough />} />
    {/* institutional value & procurement experience */}
    <Route path="/cost-of-publication" element={<CostOfPublication />} />
    <Route path="/lifecycle" element={<Lifecycle />} />
    <Route path="/roi" element={<Roi />} />
    {/* financial-value detail pages (7), introduced on the homepage */}
    <Route path="/value/:slug" element={<ValuePage />} />
    {/* Layer 2 — industry landing pages (SEO ecosystem) */}
    <Route path="/industries" element={<Industries />} />
    <Route path="/industries/:slug" element={<IndustryPage />} />
    {/* Layer 3 — problem / concept pages (knowledge hub) */}
    <Route path="/learn" element={<Problems />} />
    <Route path="/learn/:slug" element={<ProblemPage />} />
    {/* Layer 4 — knowledge library (long-form articles) */}
    <Route path="/library" element={<KnowledgeLibrary />} />
    <Route path="/library/:slug" element={<ArticlePage />} />
    {/* Layer 5 — developer documentation */}
    <Route path="/docs" element={<Docs />} />
    <Route path="/docs/:slug" element={<Docs />} />
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
  </Suspense>
  </>
);

export default App;
