export const CONTRACT_NAME = 'tier00.knowledge-provider' as const;
export const CONTRACT_VERSION = '0.1.0' as const;

export interface ContractMeta {
  readonly contract: typeof CONTRACT_NAME;
  readonly version: typeof CONTRACT_VERSION;
  readonly implementation: string;
  readonly implementationVersion: string;
}
