import { ConnectView } from '../../components/ConnectView';

export default function ConnectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-sov-cyan">Connect Accounts</h1>
        <p className="mt-1 text-xs text-sov-mute">
          Link social platforms to a client via OAuth. Tokens are encrypted in the vault and
          used by the distribution worker to publish on the client&apos;s behalf.
        </p>
      </div>
      <ConnectView />
    </div>
  );
}
