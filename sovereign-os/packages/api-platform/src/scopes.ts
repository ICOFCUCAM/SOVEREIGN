// Permission scopes granted to an API key / token.
export type Scope =
  | '*'
  | 'publish'
  | 'media:render'
  | 'intelligence:run'
  | 'analytics:read'
  | 'social:connect'
  | 'webhooks:manage'
  | 'keys:manage';

export const ALL_SCOPES: Scope[] = [
  'publish', 'media:render', 'intelligence:run', 'analytics:read',
  'social:connect', 'webhooks:manage', 'keys:manage',
];

export function hasScope(granted: string[], required: Scope): boolean {
  return granted.includes('*') || granted.includes(required);
}
