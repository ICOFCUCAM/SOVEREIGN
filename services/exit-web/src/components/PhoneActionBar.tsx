import React, { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";

// The phone action bar (HOMEPAGE.md CC3): once the hero has scrolled away, the
// one action the header does not already carry stays a tap away at the foot of
// the screen: value your company (jumps to chapter 04). It steps aside again
// when the closing chapter comes into view.
// Phones only; hidden on short landscape screens; clears the home indicator.

const PhoneActionBar: React.FC = () => {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const read = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      const hero = document.getElementById("ch-01"), end = document.getElementById("ch-09");
      if (!hero || !end) return;
      setShow(hero.getBoundingClientRect().bottom < 0 && end.getBoundingClientRect().top > innerHeight);
    }); };
    read(); addEventListener("scroll", read, { passive: true }); addEventListener("resize", read);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", read); removeEventListener("resize", read); };
  }, []);
  return (
    <nav aria-label={t("bar.label")}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ex-1/95 px-4 pt-3 backdrop-blur transition-[transform,visibility] duration-300 motion-reduce:transition-none sm:hidden [@media(max-height:500px)]:hidden ${show ? "visible translate-y-0" : "invisible translate-y-full"}`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
      <a href="#ch-04" className="flex items-center justify-between bg-white px-4 py-3.5 text-[14px] font-semibold text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
        <span>{t("bar.value")}</span><span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#6A5539]">{t("bar.time")} <span aria-hidden>→</span></span>
      </a>
    </nav>
  );
};

export default PhoneActionBar;
