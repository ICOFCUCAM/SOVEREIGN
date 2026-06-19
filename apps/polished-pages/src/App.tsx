import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import CVGenerator from "./pages/CVGenerator.tsx";
import CoverLetterGenerator from "./pages/CoverLetterGenerator.tsx";
import BookCreator from "./pages/BookCreator.tsx";
import NotFound from "./pages/NotFound.tsx";
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
          <Route path="/cv" element={<AuthGate><CVGenerator /></AuthGate>} />
          <Route path="/cover-letter" element={<AuthGate><CoverLetterGenerator /></AuthGate>} />
          <Route path="/book" element={<AuthGate><BookCreator /></AuthGate>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
