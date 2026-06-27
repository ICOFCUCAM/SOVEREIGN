// Ekte norske oversettelser av konseptsidene (lag 3). Én versjon per språk —
// ingen maskinoversettelse ved kjøretid. Bare slugene som finnes her, leveres under
// /no/learn/<slug>; alt annet forblir på engelsk inntil det er oversatt, slik at
// hreflang forblir sannferdig. Den felles strukturen (diagram, beslektede lenker)
// kommer fra det engelske grunnlaget i problems.ts; dette er de lokaliserte tekstfeltene.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_NO: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Offisiell publisering",
    kicker: "Konsept",
    headline: "Hva en offisiell publisering er — og hva som gjør den offisiell.",
    lead: "Hvem som helst kan publisere et dokument. En offisiell publisering er noe annet: den utstedes under en institusjons myndighet og kan bevises ekte så lenge det betyr noe.",
    definition: "En offisiell publisering er et dokument som utstedes under en institusjons myndighet — ikke en enkeltpersons — gjennom en styrt godkjenningsprosess, og som gjøres varig etterprøvbart, slik at enhver kan bekrefte at det er den ekte, gjeldende versjonen.",
    why: [
      "En PDF som sendes rundt på e-post i en organisasjon, ser identisk ut enten den er den godkjente sluttversjonen eller et tidlig utkast. Ingenting ved filen viser hvilken av dem det er.",
      "Når en publisering bestrides flere år senere — i retten, i en revisjon, av offentligheten — må institusjonen kunne bevise hvem som godkjente den, i hvilken rekkefølge, og at filen ikke har endret seg siden.",
      "De fleste institusjoner kan ikke bevise dette. Godkjenningen levde i e-poster og møter, og den publiserte filen er bare en kopi uten varig kobling tilbake til myndigheten som utstedte den.",
    ],
    how: [
      { t: "Utstedt av et embete, ikke en person", d: "Sovereign Dispatch binder hver publisering til et embetes myndighet, slik at den forblir gyldig selv når personen som signerte den, har gått videre." },
      { t: "Styrt før den publiseres", d: "En håndhevet godkjenningskjede gjennomføres før dokumentet frigis — den offisielle versjonen er den som har fullført styringen, og ingen annen kan utgi seg for å være offisiell." },
      { t: "Varig etterprøvbar", d: "Hver publisering bærer en permanent Record-ID og et integritetsbevis, slik at enhver kan bekrefte at den er ekte og uendret — uten konto." },
    ],
    faqs: [
      { q: "Hva er forskjellen på et dokument og en offisiell publisering?", a: "Et dokument er bare en fil. En offisiell publisering utstedes under en institusjons myndighet gjennom en styrt prosess og er varig etterprøvbar — du kan bevise hvem som utstedte den, og at den ikke har endret seg." },
      { q: "Hvordan beviser man at en publisering er offisiell?", a: "Ved å etterprøve dens permanente Record-ID og integritetsbevis mot den utstedende institusjonens register. Med Sovereign Dispatch kan enhver gjøre dette uten konto." },
      { q: "Gjør en signatur eller et brevhode en publisering offisiell?", a: "Nei. En signatur eller et brevhode kan kopieres. Myndighet bundet til et embete sammen med et etterprøvbart integritetsbevis er det som gjør en publisering beviselig offisiell." },
    ],
    metaTitle: "Hva er en offisiell publisering? Definisjon og bevis",
    metaDescription: "En offisiell publisering er et dokument utstedt under en institusjons myndighet gjennom en styrt prosess og varig etterprøvbart. Lær hva som gjør den offisiell.",
  },
  "evidence-chain": {
    term: "Beviskjede",
    kicker: "Integritet",
    headline: "En beviskjede som finnes før noen spør etter den.",
    lead: "En beviskjede er den ubrutte opptegnelsen over hvordan et dokument ble godkjent og utstedt — fanget mens det skjedde, slik at den kan stoles på når det trengs.",
    definition: "En beviskjede er en fullstendig, ordnet og manipulasjonssikker opptegnelse over hvert trinn i et dokuments godkjenning og publisering — hvem som handlet, når, og på hvilken versjon — fanget mens dokumentet blir til, fremfor rekonstruert i ettertid.",
    why: [
      "Når en publisering settes i tvil, avhenger bevisets verdi helt av når det ble skapt. Bevis som settes sammen etter at innsigelsen er reist, er svakt og kan bestrides.",
      "De fleste organisasjoner bygger sporet først når en revisor eller en domstol krever det — og samler e-poster, godkjenninger og versjoner under tidspress, med hull.",
      "En beviskjede som tegnes opp løpende, i riktig rekkefølge og forseglet mot endring, er forskjellen mellom å bevise myndighet og bare å påstå den.",
    ],
    how: [
      { t: "Fanget mens det skjer", d: "Hvert godkjenningstrinn registreres i det øyeblikket det inntreffer, i riktig rekkefølge — aldri rekonstruert senere." },
      { t: "Manipulasjonssikker", d: "Kjeden forsegles med integritetsbevis, slik at enhver senere endring kan oppdages; opptegnelsen etterprøves enten som intakt eller ikke i det hele tatt." },
      { t: "Klar ved forespørsel", d: "Fordi kjeden allerede finnes, er svaret på en revisjon eller rettslig innsigelse et oppslag, ikke en rekonstruksjon." },
    ],
    faqs: [
      { q: "Hva er en beviskjede?", a: "En fullstendig, ordnet og manipulasjonssikker opptegnelse over hvordan et dokument ble godkjent og utstedt — hvem som handlet, når, og på hvilken versjon — fanget mens det skjedde." },
      { q: "Hvorfor har tidspunktet for beviset noe å si?", a: "Bevis som skapes mens hendelsene utspiller seg, er langt sterkere enn bevis som settes sammen etter en innsigelse, og som er utsatt for hull og uenighet." },
      { q: "Hvordan holdes en beviskjede manipulasjonssikker?", a: "Ved å forsegle hvert trinn med kryptografiske integritetsbevis, slik at enhver senere endring kan oppdages ved etterprøving." },
    ],
    metaTitle: "Hva er en beviskjede? Definisjon og hvorfor tidspunktet teller",
    metaDescription: "En beviskjede er den fullstendige, ordnede og manipulasjonssikre opptegnelsen over et dokuments godkjenning og utstedelse, fanget i øyeblikket. Hvorfor tidspunktet teller.",
  },
  "document-authenticity": {
    term: "Dokumentekthet",
    kicker: "Integritet",
    headline: "Dokumentekthet du kan bevise, ikke bare påstå.",
    lead: "Dokumentekthet er egenskapen å være beviselig ekte — det virkelige dokumentet, utstedt av den det utgir seg for, uendret siden. De fleste dokumenter bare påstår det.",
    definition: "Dokumentekthet er den etterprøvbare egenskapen at et dokument er ekte: utstedt av den angitte myndigheten og uendret siden publiseringen, beviselig av enhver fremfor bare påstått gjennom utseende.",
    why: [
      "Brevhoder, signaturer og segl kan alle kopieres. Utseende er ikke bevis — en overbevisende forfalskning ser nøyaktig ut som det ekte.",
      "Når et dokuments ekthet betyr aller mest — et sertifikat, en lisens, en avgjørelse — har mottakeren ofte ingen uavhengig måte å bekrefte at det er ekte på.",
      "Ekthet som avhenger av å ringe utstederen for å sjekke, lar seg ikke skalere og bryter sammen nettopp når utstederen er vanskeligst å nå.",
    ],
    how: [
      { t: "Bundet til det utstedende embetet", d: "Hver publisering utstedes under en navngitt myndighet, slik at opphavet er en del av opptegnelsen og ikke en slutning fra et brevhode." },
      { t: "Integritetsbevis per dokument", d: "Et kryptografisk bevis knytter den nøyaktige filen til opptegnelsen; endrer man et eneste byte, bryter etterprøvingen." },
      { t: "Enhver kan etterprøve", d: "En permanent Record-ID lar enhver mottaker bekrefte ektheten selvstendig — uten konto og uten å ringe utstederen." },
    ],
    faqs: [
      { q: "Hva er dokumentekthet?", a: "Den etterprøvbare egenskapen at et dokument er ekte — utstedt av den angitte myndigheten og uendret siden publiseringen — beviselig av enhver, ikke bare påstått." },
      { q: "Hvorfor er ikke en signatur eller et segl nok?", a: "Signaturer og segl kan kopieres. Ekte autentisitet krever et etterprøvbart integritetsbevis knyttet til den utstedende myndigheten." },
      { q: "Hvordan kan jeg etterprøve at et dokument er ekte?", a: "Etterprøv dets permanente Record-ID og integritetsbevis mot utstederens register. Med Sovereign Dispatch kan enhver gjøre dette uten konto." },
    ],
    metaTitle: "Dokumentekthet — bevis at et dokument er ekte",
    metaDescription: "Dokumentekthet er den etterprøvbare egenskapen å være ekte og uendret. Hvorfor signaturer og segl ikke er nok, og hvordan man beviser den.",
  },
  "document-verification": {
    term: "Dokumentetterprøving",
    kicker: "Etterprøving",
    headline: "Dokumentetterprøving enhver kan gjøre, uten konto.",
    lead: "Dokumentetterprøving er å bekrefte at et dokument er ekte og uendret. Den beste etterprøvingen krever ingen særskilt tilgang — enhver kan gjøre den.",
    definition: "Dokumentetterprøving er prosessen med å bekrefte at et dokument er ekte og uendret — helst ved å sjekke en permanent identifikator og et integritetsbevis mot utstederens register, selvstendig og uten privilegert tilgang.",
    why: [
      "Etterprøving som krever at man ringer utstederen eller logger inn på en portal, svikter dem som trenger den mest — mottakere, offentligheten, andre institusjoner.",
      "Er etterprøvingen vanskelig, skjer den ikke, og forfalskninger sirkulerer uimotsagt.",
      "Tillit skalerer bare når enhver som sitter med et dokument, selv kan bekrefte det på sekunder, mot sannhetens kilde.",
    ],
    how: [
      { t: "Permanent Record-ID", d: "Hver publisering bærer en ID som leder til dens autoritative opptegnelse hos den utstedende institusjonen." },
      { t: "Integritetssjekk av den nøyaktige filen", d: "Etterprøvingen bekrefter at den konkrete filen er byte for byte lik den utstedte versjonen; enhver endring oppdages." },
      { t: "Åpen for alle", d: "Enhver kan etterprøve en opptegnelse uten konto, slik at tillit ikke avhenger av innsidetilgang." },
    ],
    faqs: [
      { q: "Hva er dokumentetterprøving?", a: "Å bekrefte at et dokument er ekte og uendret, helst ved å sjekke en permanent identifikator og et integritetsbevis mot utstederens register." },
      { q: "Trenger jeg en konto for å etterprøve et dokument?", a: "Med Sovereign Dispatch, nei. Etterprøvingen er åpen for alle, slik at tillit ikke avhenger av privilegert tilgang." },
      { q: "Hva er det etterprøvingen faktisk sjekker?", a: "At dokumentet svarer til en ekte utstedt opptegnelse, og at den nøyaktige filen er uendret siden publiseringen." },
    ],
    metaTitle: "Dokumentetterprøving — bekreft ekthet, uten konto",
    metaDescription: "Dokumentetterprøving bekrefter at et dokument er ekte og uendret, via en permanent Record-ID og et integritetsbevis — selvstendig, uten konto.",
  },
};
