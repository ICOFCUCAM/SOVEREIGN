// Full-width chapter mark between major page sections. Typographic only —
// no imagery, no motion. A hairline + centered uppercase mark in gold.
export function SectionSeparator({ label }: { label: string }) {
  return (
    <div className="relative bg-emrg-bg/40">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-12">
        <span className="h-px flex-1 bg-emrg-edge" />
        <span className="text-[11px] uppercase tracking-[0.32em] text-emrg-cream/75 whitespace-nowrap">
          {label}
        </span>
        <span className="h-px flex-1 bg-emrg-edge" />
      </div>
    </div>
  );
}
