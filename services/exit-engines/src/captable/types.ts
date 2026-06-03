// Cap-table CRM — types.
//
// The model tracks ownership at instrument granularity (share classes,
// options, warrants, RSAs) and the stakeholder graph (founders, board,
// investors, signatories) so the negotiation engine can compute an
// accurate net-to-founder waterfall and the closing engine can roster
// signatories from one source of truth.

export type ShareClassKind =
  | 'common'
  | 'preferred'
  | 'options'           // ISO + NSO option pool
  | 'warrants'
  | 'sars'              // stock appreciation rights
  | 'rsa';

export interface ShareClass {
  readonly id: string;
  readonly name: string;
  readonly kind: ShareClassKind;
  readonly seriesLabel?: string;        // 'Seed', 'Series A', 'Series B' …
  readonly authorized: number;
  readonly outstanding: number;
  readonly originalIssuePriceUsd?: number;
  readonly liquidationPreferenceMultiple?: number;  // 1× / 2× / etc.
  readonly participating?: boolean;                  // participating preferred
  readonly capMultiple?: number;                     // cap on participation
  readonly conversionRatio?: number;                 // shares per pref share
  readonly votingRights?: 'standard' | 'super' | 'none';
}

export type StakeholderRole =
  | 'founder'
  | 'executive'
  | 'board_director'
  | 'board_observer'
  | 'lead_investor'
  | 'investor'
  | 'advisor'
  | 'employee'
  | 'other';

export interface Holding {
  readonly shareClassId: string;
  readonly shares: number;
  readonly exercisePriceUsd?: number;          // for options/warrants
  readonly grantDate?: string;
  readonly vesting?: VestingSchedule;
}

export interface VestingSchedule {
  readonly totalMonths: number;                // typical 48
  readonly cliffMonths: number;                // typical 12
  readonly startDate: string;
  readonly acceleration?: {
    readonly single?: boolean;                  // single-trigger on change of control
    readonly double?: boolean;                  // double-trigger
    readonly percentOnCoC?: number;             // 0..1
  };
}

export interface Stakeholder {
  readonly id: string;
  readonly name: string;
  readonly role: StakeholderRole;
  readonly email?: string;
  readonly holdings: readonly Holding[];
  readonly signatoryRequired: boolean;          // must sign the SPA
  readonly seatOnBoard?: boolean;
  readonly priorRoundsParticipated?: readonly string[];
  readonly notes?: string;
}

export interface CapTable {
  readonly companyId: string;
  readonly asOfDate: string;
  readonly shareClasses: readonly ShareClass[];
  readonly stakeholders: readonly Stakeholder[];
  readonly esopAuthorizedTotal?: number;
  readonly esopUnissuedRemaining?: number;
  readonly preferenceStackUsd?: number;         // sum of all liquidation preferences
  readonly priorRoundsValuationUsd?: number;
  readonly fullyDilutedShares: number;          // canonical denominator
}
