import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Shell from "./components/Shell";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Submit from "./pages/Submit";
import Review from "./pages/Review";
import Library from "./pages/Library";
import DocumentView from "./pages/DocumentView";
import Audit from "./pages/Audit";

const App: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <SignIn />;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/review" element={<Review />} />
        <Route path="/library" element={<Library />} />
        <Route path="/documents/:id" element={<DocumentView />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
};

export default App;
