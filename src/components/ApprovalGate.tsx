import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PendingApprovalView from '@/components/PendingApprovalView';

// Top-level gate. Authenticated users whose status is not 'approved'
// (pending, rejected, suspended) see only the PendingApprovalView,
// regardless of the route they hit. Unauthenticated users pass through
// freely so public surfaces (landing, marketplace, registrar, etc.)
// remain reachable for prospects.
//
// Loading state passes through too — keeps the page from flashing the
// gate while the role row is still being fetched on first paint.

const ApprovalGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading, isApproved } = useAuth();

  if (loading) return <>{children}</>;
  if (!user) return <>{children}</>;
  // user signed in but no role row at all → treat as pending (the trigger
  // creates one but there's a brief window during refresh; also covers
  // any legacy signup that slipped through without a row).
  if (!role) return <PendingApprovalView />;
  if (!isApproved) return <PendingApprovalView />;
  return <>{children}</>;
};

export default ApprovalGate;
