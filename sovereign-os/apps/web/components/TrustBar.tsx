function IconGovernments() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 21h18M5 21V10m4 11V10m6 11V10m4 11V10M2 10h20L12 3 2 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBrands() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" strokeLinecap="round" />
    </svg>
  );
}
function IconMedia() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
    </svg>
  );
}
function IconFinancial() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SECTORS = [
  { Icon: IconGovernments, t: 'GOVERNMENTS',          s: 'NATIONAL SYSTEMS' },
  { Icon: IconBrands,      t: 'GLOBAL BRANDS',        s: 'ENTERPRISE SCALE' },
  { Icon: IconMedia,       t: 'MEDIA NETWORKS',       s: 'BROADCAST & DIGITAL' },
  { Icon: IconFinancial,   t: 'FINANCIAL INSTITUTIONS', s: 'SECURE INFRASTRUCTURE' },
];

export function TrustBar() {
  return (
    <section className="border-y border-emrg-edge/60">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 py-7 md:flex-row md:items-center md:gap-12">
        <div className="text-[10px] tracking-[0.32em] text-emrg-mute md:max-w-[180px]">
          TRUSTED BY INSTITUTIONS WORLDWIDE
        </div>
        <div className="grid w-full grid-cols-2 gap-x-6 gap-y-5 md:flex md:flex-1 md:items-center md:justify-end md:gap-12">
          {SECTORS.map(({ Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3 text-emrg-ink">
              <span className="text-emrg-dim"><Icon /></span>
              <span className="leading-tight">
                <span className="block text-[12px] tracking-[0.22em] text-emrg-ink">{t}</span>
                <span className="block text-[10px] tracking-[0.22em] text-emrg-mute">{s}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
