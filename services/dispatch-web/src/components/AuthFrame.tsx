import React from "react";
import { CeremonyGround, EngravedSeal, Ornament, Hairline, PANEL } from "./premium";

// The frame for signing in, creating an institution and accepting an invitation: the ceremony ground,
// the engraved Sovereign Dispatch seal, a serif title and one premium card. Ceremony belongs here because
// these are the first moments anyone has with Dispatch.
export const AuthFrame: React.FC<{ title: React.ReactNode; lede?: React.ReactNode; eyebrow?: string; children: React.ReactNode; below?: React.ReactNode; width?: "md" | "lg" }> = ({ title, lede, eyebrow = "Sovereign Dispatch", children, below, width = "md" }) => (
  <CeremonyGround>
    <div className={`relative mx-auto flex min-h-screen w-full flex-col items-center px-4 pb-12 pt-10 sm:pt-14 ${width === "lg" ? "max-w-lg" : "max-w-md"}`}>
      <a href="/" aria-label="Sovereign Dispatch home" className="su-rise relative"><EngravedSeal initials="SD" size={92} /></a>
      <div className="su-rise relative mt-4 font-mono text-[10.5px] uppercase tracking-[0.28em] text-sd-gold" style={{ animationDelay: "60ms" }}>{eyebrow}</div>
      <Ornament className="su-rise relative mt-3" />
      <h1 className="su-rise relative mt-3.5 text-center font-serif text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[34px]" style={{ animationDelay: "120ms" }}>{title}</h1>
      {lede && <p className="su-rise relative mt-2.5 text-center text-[14px] leading-relaxed text-sd-text2" style={{ animationDelay: "160ms" }}>{lede}</p>}
      <div className="su-rise relative mt-7 w-full" style={{ animationDelay: "200ms" }}>{children}</div>
      {below && <div className="relative mt-5 w-full text-center">{below}</div>}
    </div>
  </CeremonyGround>
);

/** The card a sign-in form sits in. */
export const AuthCard: React.FC<{ children: React.ReactNode; className?: string; tone?: "gold" | "ok" | "faint" }> = ({ children, className = "", tone = "gold" }) => (
  <div className={`relative overflow-hidden rounded-[20px] border border-sd-line p-6 sm:p-7 ${PANEL} ${className}`}>
    <Hairline tone={tone} />
    {children}
  </div>
);

export const AUTH_LABEL = "mb-1.5 block text-[12.5px] font-medium text-sd-text2";
