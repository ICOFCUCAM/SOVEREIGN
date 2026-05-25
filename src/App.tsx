import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { resolveTenant } from "@/lib/tenant";
import DomainLanding from "@/components/DomainLanding";
import Index from "./pages/Index";
import DomainPage from "./pages/DomainPage";
import AdminPage from "./pages/AdminPage";
import MarketplacePage from "./pages/MarketplacePage";
import ValuationPage from "./pages/ValuationPage";
import StudioPage from "./pages/StudioPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Resolved once at boot: the platform host serves the marketplace + console,
// any other connected custom domain serves that domain's branded landing.
const tenant = resolveTenant();

const PlatformRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/marketplace" element={<MarketplacePage />} />
    <Route path="/valuation" element={<ValuationPage />} />
    <Route path="/studio" element={<StudioPage />} />
    <Route path="/studio/:domain" element={<StudioPage />} />
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

const App = () => (
  <ThemeProvider defaultTheme="dark">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {tenant.mode === "tenant" ? <TenantRoutes /> : <PlatformRoutes />}
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
