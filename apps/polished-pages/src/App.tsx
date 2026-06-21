import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGate from "./components/AuthGate.tsx";
import RequirePlan from "./components/app/RequirePlan.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import RouteFallback from "./components/RouteFallback.tsx";
import { I18nProvider } from "@/lib/i18n";

// Every page is code-split so the initial bundle stays small; each route loads
// its own chunk on demand behind a branded fallback.
const Index = lazy(() => import("./pages/Index.tsx"));
const CVGenerator = lazy(() => import("./pages/CVGenerator.tsx"));
const CoverLetterGenerator = lazy(() => import("./pages/CoverLetterGenerator.tsx"));
const JobTailor = lazy(() => import("./pages/JobTailor.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
const Insights = lazy(() => import("./pages/Insights.tsx"));
const LibraryPage = lazy(() => import("./pages/LibraryPage.tsx"));
const TransformBook = lazy(() => import("./pages/TransformBook.tsx"));
const ChildrenStudio = lazy(() => import("./pages/ChildrenStudio.tsx"));
const StorybookCreator = lazy(() => import("./pages/StorybookCreator.tsx"));
const ColoringBookCreator = lazy(() => import("./pages/ColoringBookCreator.tsx"));
const EducationalReaders = lazy(() => import("./pages/EducationalReaders.tsx"));
const ClassroomPacks = lazy(() => import("./pages/ClassroomPacks.tsx"));
const PrimaryBookFactory = lazy(() => import("./pages/PrimaryBookFactory.tsx"));
const WorkbookGenerator = lazy(() => import("./pages/WorkbookGenerator.tsx"));
const CurriculumBuilder = lazy(() => import("./pages/CurriculumBuilder.tsx"));
const TeacherResourceCenter = lazy(() => import("./pages/TeacherResourceCenter.tsx"));
const ExamAssessmentPack = lazy(() => import("./pages/ExamAssessmentPack.tsx"));
const AssessmentBank = lazy(() => import("./pages/AssessmentBank.tsx"));
const TranslatePublish = lazy(() => import("./pages/TranslatePublish.tsx"));
const EditionManager = lazy(() => import("./pages/EditionManager.tsx"));
const IllustrationStudio = lazy(() => import("./pages/IllustrationStudio.tsx"));
const PublishingPrep = lazy(() => import("./pages/PublishingPrep.tsx"));
const SharedDocument = lazy(() => import("./pages/SharedDocument.tsx"));
const CatalogPage = lazy(() => import("./pages/CatalogPage.tsx"));
const OrgStorefront = lazy(() => import("./pages/OrgStorefront.tsx"));
const Organizations = lazy(() => import("./pages/Organizations.tsx"));
const OrgWorkspace = lazy(() => import("./pages/OrgWorkspace.tsx"));
const OrgAnalyticsPage = lazy(() => import("./pages/OrgAnalyticsPage.tsx"));
const Institutions = lazy(() => import("./pages/Institutions.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Resources = lazy(() => import("./pages/Resources.tsx"));
const ForSchools = lazy(() => import("./pages/ForSchools.tsx"));
const Accessibility = lazy(() => import("./pages/Accessibility.tsx"));
const Security = lazy(() => import("./pages/Security.tsx"));
const SeriesPage = lazy(() => import("./pages/SeriesPage.tsx"));
const PublicSeriesPage = lazy(() => import("./pages/PublicSeries.tsx"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage.tsx"));
const PublicCollection = lazy(() => import("./pages/PublicCollection.tsx"));
const BookCreator = lazy(() => import("./pages/BookCreator.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Gallery = lazy(() => import("./pages/Gallery.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public marketing landing — the hero stays open to everyone. */}
          <Route path="/" element={<Index />} />
          {/* Public shared documents + catalog (no sign-in) */}
          <Route path="/shared/:token" element={<SharedDocument />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/for-schools" element={<ForSchools />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/security" element={<Security />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/author/:author" element={<CatalogPage />} />
          <Route path="/org/:slug" element={<OrgStorefront />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/collection/:token" element={<PublicCollection />} />
          <Route path="/series/public/:token" element={<PublicSeriesPage />} />
          {/* Generators require sign-in (metered per user); the gate prompts
              for sign-in only when someone actually goes to create. */}
          <Route path="/dashboard" element={<AuthGate><Dashboard /></AuthGate>} />
          <Route path="/account" element={<AuthGate><Account /></AuthGate>} />
          <Route path="/insights" element={<AuthGate><Insights /></AuthGate>} />
          <Route path="/library" element={<AuthGate><LibraryPage /></AuthGate>} />
          <Route path="/collections" element={<AuthGate><CollectionsPage /></AuthGate>} />
          <Route path="/organizations" element={<AuthGate><Organizations /></AuthGate>} />
          <Route path="/organizations/:slug" element={<AuthGate><OrgWorkspace /></AuthGate>} />
          <Route path="/organizations/:slug/analytics" element={<AuthGate><OrgAnalyticsPage /></AuthGate>} />
          <Route path="/cv" element={<AuthGate><CVGenerator /></AuthGate>} />
          <Route path="/cover-letter" element={<AuthGate><CoverLetterGenerator /></AuthGate>} />
          <Route path="/tailor" element={<AuthGate><JobTailor /></AuthGate>} />
          <Route path="/book" element={<AuthGate><BookCreator /></AuthGate>} />
          <Route path="/book-transform" element={<AuthGate><TransformBook /></AuthGate>} />
          <Route path="/children" element={<AuthGate><RequirePlan feature="children-studio"><ChildrenStudio /></RequirePlan></AuthGate>} />
          <Route path="/series" element={<AuthGate><RequirePlan feature="children-studio"><SeriesPage /></RequirePlan></AuthGate>} />
          <Route path="/storybook" element={<AuthGate><RequirePlan feature="children-studio"><StorybookCreator /></RequirePlan></AuthGate>} />
          <Route path="/coloring" element={<AuthGate><RequirePlan feature="children-studio"><ColoringBookCreator /></RequirePlan></AuthGate>} />
          <Route path="/edu-readers" element={<AuthGate><RequirePlan feature="educational-studio"><EducationalReaders /></RequirePlan></AuthGate>} />
          <Route path="/classroom" element={<AuthGate><RequirePlan feature="educational-studio"><ClassroomPacks /></RequirePlan></AuthGate>} />
          <Route path="/primary-books" element={<AuthGate><RequirePlan feature="educational-studio"><PrimaryBookFactory /></RequirePlan></AuthGate>} />
          <Route path="/workbooks" element={<AuthGate><RequirePlan feature="educational-studio"><WorkbookGenerator /></RequirePlan></AuthGate>} />
          <Route path="/curriculum" element={<AuthGate><RequirePlan feature="educational-studio"><CurriculumBuilder /></RequirePlan></AuthGate>} />
          <Route path="/teacher" element={<AuthGate><RequirePlan feature="educational-studio"><TeacherResourceCenter /></RequirePlan></AuthGate>} />
          <Route path="/assessment" element={<AuthGate><RequirePlan feature="educational-studio"><ExamAssessmentPack /></RequirePlan></AuthGate>} />
          <Route path="/assessment-bank" element={<AuthGate><RequirePlan feature="educational-studio"><AssessmentBank /></RequirePlan></AuthGate>} />
          <Route path="/translate" element={<AuthGate><RequirePlan feature="multilingual"><TranslatePublish /></RequirePlan></AuthGate>} />
          <Route path="/editions" element={<AuthGate><RequirePlan feature="multilingual"><EditionManager /></RequirePlan></AuthGate>} />
          <Route path="/illustrations" element={<AuthGate><IllustrationStudio /></AuthGate>} />
          <Route path="/publishing" element={<AuthGate><PublishingPrep /></AuthGate>} />
          {/* internal visual-QA gallery (not linked) */}
          <Route path="/__gallery" element={<Gallery />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
