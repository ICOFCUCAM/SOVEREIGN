import React from 'react';
import { useParams } from 'react-router-dom';
import DomainLanding from '@/components/DomainLanding';

/** Marketplace preview route: /d/:domain — renders the landing in "preview" chrome. */
const DomainPage: React.FC = () => {
  const { domain } = useParams<{ domain: string }>();
  const name = domain ? decodeURIComponent(domain) : '';
  return <DomainLanding domainName={name} variant="preview" />;
};

export default DomainPage;
