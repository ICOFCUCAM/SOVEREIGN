import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { resolveTenant, isRegistrarHost } from "@/lib/tenant";
import DomainLanding from "@/components/DomainLanding";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";

// Route-level code splitting — the homepage stays eager; everything else loads on demand.
const DomainPage = lazy(() => import("./pages/DomainPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
const ValuationPage = lazy(() => import("./pages/ValuationPage"));
const StudioPage = lazy(() => import("./pages/StudioPage"));
const EcosystemHub = lazy(() => import("./pages/EcosystemHub"));
const SystemPage = lazy(() => import("./pages/SystemPage"));
const DeployPage = lazy(() => import("./pages/DeployPage"));
const ChannelPage = lazy(() => import("./pages/ChannelPage"));
const DnsPage = lazy(() => import("./pages/DnsPage"));
const RegistrantsPage = lazy(() => import("./pages/RegistrantsPage"));
const DeploymentsConsolePage = lazy(() => import("./pages/DeploymentsConsolePage"));
const DomainsPage = lazy(() => import("./pages/DomainsPage"));
const RegistrarLanding = lazy(() => import("./pages/RegistrarLanding"));
const RegistrarCommandCenter = lazy(() => import("./pages/RegistrarCommandCenter"));
const DeveloperPortal = lazy(() => import("./pages/DeveloperPortal"));
const EmergencyAILanding = lazy(() => import("./pages/EmergencyAILanding"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const tenant = resolveTenant();

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      let tries = 0;
      const id = setInterval(() => {
        const el = document.getElementById(hash.slice(1));
        if (el) { el.scrollIntoView({ behavior: 'smooth' }); clearInterval(id); }
        else if (++tries > 12) clearInterval(id);
      }, 120);
      return () => clearInterval(id);
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
};

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#05071A]">
    <div className="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
  </div>
);

const PlatformRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/marketplace" element={<MarketplacePage />} />
    <Route path="/ecosystem" element={<EcosystemHub />} />
    <Route path="/systems/:slug" element={<SystemPage />} />
    <Route path="/valuation" element={<ValuationPage />} />
    <Route path="/studio" element={<StudioPage />} />
    <Route path="/studio/:domain" element={<StudioPage />} />
    <Route path="/deploy" element={<DeployPage />} />
    <Route path="/channel" element={<ChannelPage />} />
    <Route path="/dns" element={<DnsPage />} />
    <Route path="/registrants" element={<RegistrantsPage />} />
    <Route path="/deployments" element={<DeploymentsConsolePage />} />
    <Route path="/domains" element={<DomainsPage />} />
    <Route path="/sovereign-domains" element={<RegistrarLanding />} />
    <Route path="/search" element={<DomainsPage />} />
    <Route path="/command-center" element={<RegistrarCommandCenter />} />
    <Route path="/developer" element={<DeveloperPortal />} />
    <Route path="/emergency-ai" element={<EmergencyAILanding />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/d/:domain" element={<DomainPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const TenantRoutes = () => (
  <Routes>
    <Route path="*" element={<DomainLanding domainName={tenant.hostname} variant="tenant" />} />
  </Routes>
);

// domains.sovereign.so — the dedicated registrar infrastructure layer, rooted
// at the domain platform but sharing the operate/deploy surfaces.
const RegistrarRoutes = () => (
  <Routes>
    <Route path="/" element={<RegistrarLanding />} />
    <Route path="/search" element={<DomainsPage />} />
    <Route path="/domains" element={<DomainsPage />} />
    <Route path="/dns" element={<DnsPage />} />
    <Route path="/registrants" element={<RegistrantsPage />} />
    <Route path="/deployments" element={<DeploymentsConsolePage />} />
    <Route path="/command-center" element={<RegistrarCommandCenter />} />
    <Route path="/developer" element={<DeveloperPortal />} />
    <Route path="/emergency-ai" element={<EmergencyAILanding />} />
    <Route path="/deploy" element={<DeployPage />} />
    <Route path="/d/:domain" element={<DomainPage />} />
    <Route path="*" element={<RegistrarLanding />} />
  </Routes>
);

const isRegistrar = isRegistrarHost(tenant.hostname);

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                {isRegistrar ? <RegistrarRoutes /> : tenant.mode === "tenant" ? <TenantRoutes /> : <PlatformRoutes />}
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
