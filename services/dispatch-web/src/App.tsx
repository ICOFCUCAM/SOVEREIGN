import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Shell from "./components/Shell";
import Landing from "./pages/Landing";
import Procurement from "./pages/Procurement";
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
import Integrations from "./pages/Integrations";
import Polished from "./pages/polished/Polished";
import { BillingProvider } from "./lib/upsell";

// The gated operator/governance console. Everything here requires a session;
// unauthenticated visitors get the sign-in gate.
const Console: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <SignIn />;
  return (
    <BillingProvider>
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="create" element={<Create />} />
        <Route path="submit" element={<Submit />} />
        <Route path="review" element={<Review />} />
        <Route path="library" element={<Library />} />
        <Route path="documents/:id" element={<DocumentView />} />
        <Route path="audit" element={<Audit />} />
        <Route path="sovereignty" element={<Sovereignty />} />
        <Route path="access" element={<Access />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="polished" element={<Polished />} />
        <Route path="*" element={<Navigate to="/console" replace />} />
      </Routes>
    </Shell>
    </BillingProvider>
  );
};

const App: React.FC = () => (
  <Routes>
    {/* public marketing landing — the front door */}
    <Route path="/" element={<Landing />} />
    {/* public procurement + architecture dossier (no auth) */}
    <Route path="/procurement" element={<Procurement />} />
    <Route path="/architecture" element={<Architecture />} />
    <Route path="/platform" element={<Platform />} />
    <Route path="/security" element={<Security />} />
    <Route path="/compliance" element={<Compliance />} />
    <Route path="/evidence" element={<Evidence />} />
    {/* public self-serve signup (free plan) */}
    <Route path="/signup" element={<Signup />} />
    {/* gated console */}
    <Route path="/console/*" element={<Console />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
