import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import CVGenerator from "./pages/CVGenerator.tsx";
import CoverLetterGenerator from "./pages/CoverLetterGenerator.tsx";
import JobTailor from "./pages/JobTailor.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Account from "./pages/Account.tsx";
import LibraryPage from "./pages/LibraryPage.tsx";
import BookCreator from "./pages/BookCreator.tsx";
import NotFound from "./pages/NotFound.tsx";
import Gallery from "./pages/Gallery.tsx";
import AuthGate from "./components/AuthGate.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public marketing landing — the hero stays open to everyone. */}
          <Route path="/" element={<Index />} />
          {/* Generators require sign-in (metered per user); the gate prompts
              for sign-in only when someone actually goes to create. */}
          <Route path="/dashboard" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/account" element={<AuthGate><Account /></AuthGate>} />
          <Route path="/library" element={<AuthGate><LibraryPage /></AuthGate>} />
          <Route path="/cv" element={<AuthGate><CVGenerator /></AuthGate>} />
          <Route path="/cover-letter" element={<AuthGate><CoverLetterGenerator /></AuthGate>} />
          <Route path="/tailor" element={<AuthGate><JobTailor /></AuthGate>} />
          <Route path="/book" element={<AuthGate><BookCreator /></AuthGate>} />
          {/* internal visual-QA gallery (not linked) */}
          <Route path="/__gallery" element={<Gallery />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
