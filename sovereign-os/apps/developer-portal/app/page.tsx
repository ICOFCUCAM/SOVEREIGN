import { KeyManager } from '../components/KeyManager';

export default function PortalHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-sov-cyan">Developer Platform</h1>
        <p className="mt-1 text-xs text-sov-mute">
          Issue API keys and integrate the Sovereign media, distribution and intelligence API.
          Keys are SHA-256 hashed at rest and shown only once.
        </p>
      </div>
      <KeyManager />
    </div>
  );
}
