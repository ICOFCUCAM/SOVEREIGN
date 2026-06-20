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
import PublishingPrep from "./pages/PublishingPrep.tsx";
import SharedDocument from "./pages/SharedDocument.tsx";
import CatalogPage from "./pages/CatalogPage.tsx";
import Pricing from "./pages/Pricing.tsx";
import RequirePlan from "./components/app/RequirePlan.tsx";
import CollectionsPage from "./pages/CollectionsPage.tsx";
import PublicCollection from "./pages/PublicCollection.tsx";
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
          {/* Public shared documents + catalog (no sign-in) */}
          <Route path="/shared/:token" element={<SharedDocument />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/author/:author" element={<CatalogPage />} />
          <Route path="/collection/:token" element={<PublicCollection />} />
          {/* Generators require sign-in (metered per user); the gate prompts
              for sign-in only when someone actually goes to create. */}
          <Route path="/dashboard" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/account" element={<AuthGate><Account /></AuthGate>} />
          <Route path="/library" element={<AuthGate><LibraryPage /></AuthGate>} />
          <Route path="/collections" element={<AuthGate><CollectionsPage /></AuthGate>} />
          <Route path="/cv" element={<AuthGate><CVGenerator /></AuthGate>} />
          <Route path="/cover-letter" element={<AuthGate><CoverLetterGenerator /></AuthGate>} />
          <Route path="/tailor" element={<AuthGate><JobTailor /></AuthGate>} />
          <Route path="/book" element={<AuthGate><BookCreator /></AuthGate>} />
          <Route path="/book-transform" element={<AuthGate><TransformBook /></AuthGate>} />
          <Route path="/children" element={<AuthGate><RequirePlan feature="children-studio"><ChildrenStudio /></RequirePlan></AuthGate>} />
          <Route path="/storybook" element={<AuthGate><RequirePlan feature="children-studio"><StorybookCreator /></RequirePlan></AuthGate>} />
          <Route path="/coloring" element={<AuthGate><RequirePlan feature="children-studio"><ColoringBookCreator /></RequirePlan></AuthGate>} />
          <Route path="/edu-readers" element={<AuthGate><RequirePlan feature="educational-studio"><EducationalReaders /></RequirePlan></AuthGate>} />
          <Route path="/classroom" element={<AuthGate><RequirePlan feature="educational-studio"><ClassroomPacks /></RequirePlan></AuthGate>} />
          <Route path="/primary-books" element={<AuthGate><RequirePlan feature="educational-studio"><PrimaryBookFactory /></RequirePlan></AuthGate>} />
          <Route path="/workbooks" element={<AuthGate><RequirePlan feature="educational-studio"><WorkbookGenerator /></RequirePlan></AuthGate>} />
          <Route path="/curriculum" element={<AuthGate><RequirePlan feature="educational-studio"><CurriculumBuilder /></RequirePlan></AuthGate>} />
          <Route path="/teacher" element={<AuthGate><RequirePlan feature="educational-studio"><TeacherResourceCenter /></RequirePlan></AuthGate>} />
          <Route path="/translate" element={<AuthGate><RequirePlan feature="multilingual"><TranslatePublish /></RequirePlan></AuthGate>} />
          <Route path="/illustrations" element={<AuthGate><IllustrationStudio /></AuthGate>} />
          <Route path="/publishing" element={<AuthGate><PublishingPrep /></AuthGate>} />
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
