import React from 'react';
import AppLayout from '@/components/AppLayout';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const Index: React.FC = () => {
  useDocumentTitle();
  return <AppLayout />;
};

export default Index;
