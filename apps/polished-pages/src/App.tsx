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
import TransformBook from "./pages/TransformBook.tsx";
import ChildrenStudio from "./pages/ChildrenStudio.tsx";
import StorybookCreator from "./pages/StorybookCreator.tsx";
import ColoringBookCreator from "./pages/ColoringBookCreator.tsx";
import EducationalReaders from "./pages/EducationalReaders.tsx";
import ClassroomPacks from "./pages/ClassroomPacks.tsx";
import PrimaryBookFactory from "./pages/PrimaryBookFactory.tsx";
import WorkbookGenerator from "./pages/WorkbookGenerator.tsx";
import CurriculumBuilder from "./pages/CurriculumBuilder.tsx";
import TeacherResourceCenter from "./pages/TeacherResourceCenter.tsx";
import TranslatePublish from "./pages/TranslatePublish.tsx";
import IllustrationStudio from "./pages/IllustrationStudio.tsx";
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
          <Route path="/book-transform" element={<AuthGate><TransformBook /></AuthGate>} />
          <Route path="/children" element={<AuthGate><ChildrenStudio /></AuthGate>} />
          <Route path="/storybook" element={<AuthGate><StorybookCreator /></AuthGate>} />
          <Route path="/coloring" element={<AuthGate><ColoringBookCreator /></AuthGate>} />
          <Route path="/edu-readers" element={<AuthGate><EducationalReaders /></AuthGate>} />
          <Route path="/classroom" element={<AuthGate><ClassroomPacks /></AuthGate>} />
          <Route path="/primary-books" element={<AuthGate><PrimaryBookFactory /></AuthGate>} />
          <Route path="/workbooks" element={<AuthGate><WorkbookGenerator /></AuthGate>} />
          <Route path="/curriculum" element={<AuthGate><CurriculumBuilder /></AuthGate>} />
          <Route path="/teacher" element={<AuthGate><TeacherResourceCenter /></AuthGate>} />
          <Route path="/translate" element={<AuthGate><TranslatePublish /></AuthGate>} />
          <Route path="/illustrations" element={<AuthGate><IllustrationStudio /></AuthGate>} />
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
