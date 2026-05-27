'use client';

import { useState } from 'react';
import { SocialConnections } from './SocialConnections';

export function ConnectView() {
  const [clientId, setClientId] = useState('');
  return (
    <div className="space-y-5">
      <input
        value={clientId}
        onChange={(e) => setClientId(e.target.value.trim())}
        placeholder="client id (uuid)"
        className="w-full max-w-md rounded border border-sov-edge bg-sov-bg px-3 py-2 text-sm outline-none focus:border-sov-cyan"
      />
      <SocialConnections clientId={clientId} />
    </div>
  );
}
