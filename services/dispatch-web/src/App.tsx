import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Shell from "./components/Shell";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Submit from "./pages/Submit";
import Review from "./pages/Review";
import Library from "./pages/Library";
import DocumentView from "./pages/DocumentView";
import Audit from "./pages/Audit";
import Admin from "./pages/Admin";
import Callback from "./pages/Callback";

// The gated operator/governance console. Everything here requires a session;
// unauthenticated visitors get the sign-in gate. The OAuth callback is the one
// exception — it runs without a session to complete the redirect exchange.
const Console: React.FC = () => {
  const { session } = useAuth();
  if (window.location.pathname === "/console/callback") return (
    <Routes><Route path="callback" element={<Callback />} /></Routes>
  );
  if (!session) return <SignIn />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="submit" element={<Submit />} />
        <Route path="review" element={<Review />} />
        <Route path="library" element={<Library />} />
        <Route path="documents/:id" element={<DocumentView />} />
        <Route path="audit" element={<Audit />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/console" replace />} />
      </Routes>
    </Shell>
  );
};

const App: React.FC = () => (
  <Routes>
    {/* public marketing landing — the front door */}
    <Route path="/" element={<Landing />} />
    {/* gated console */}
    <Route path="/console/*" element={<Console />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
