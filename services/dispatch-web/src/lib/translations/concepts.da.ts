// Ægte danske oversættelser af konceptsiderne (lag 3). Én version per sprog —
// ingen maskinoversættelse i drift. Kun de slugs, der findes her, udleveres under
// /da/learn/<slug>; alt andet forbliver på engelsk, indtil det er oversat, så
// hreflang forbliver sandfærdig. Den fælles struktur (diagram, relaterede links)
// stammer fra den engelske kilde i problems.ts; dette er de lokaliserede tekstfelter.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_DA: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Officiel offentliggørelse",
    kicker: "Koncept",
    headline: "Hvad en officiel offentliggørelse er — og hvad der gør den officiel.",
    lead: "Enhver kan offentliggøre et dokument. En officiel offentliggørelse er noget andet: Den udgår under en institutions myndighed og kan bevises ægte, så længe det har betydning.",
    definition: "En officiel offentliggørelse er et dokument, der udgår under en institutions myndighed — ikke en enkeltpersons — gennem en styret godkendelsesproces og gøres varigt kontrollerbar, så enhver kan bekræfte, at det er den ægte, gældende version.",
    why: [
      "En PDF, der sendes på e-mail, ser ens ud, uanset om det er den godkendte endelige version eller et tidligt udkast. Intet ved filen viser, hvilken af de to det er.",
      "Hvis en offentliggørelse anfægtes år senere — for en domstol, i en revision, af offentligheden — skal institutionen kunne bevise, hvem der godkendte den, i hvilken rækkefølge, og at filen ikke har ændret sig siden.",
      "De fleste institutioner kan ikke bevise dette: Godkendelsen levede i e-mails og møder, og den offentliggjorte fil er blot en kopi uden varig forbindelse til den myndighed, der udstedte den.",
    ],
    how: [
      { t: "Udstedt af et embede, ikke en person", d: "Sovereign Dispatch binder hver offentliggørelse til et embedes myndighed: Den forbliver gyldig, også når den person, der underskrev den, er fratrådt." },
      { t: "Styret før offentliggørelse", d: "Inden frigivelse løber en bindende godkendelseskæde: Den officielle version er den, der har gennemløbet governance, og ingen anden kan udgive sig for at være officiel." },
      { t: "Varigt kontrollerbar", d: "Hver offentliggørelse bærer et varigt Record-ID og et integritetsbevis; enhver kan bekræfte, at den er ægte og uændret — uden konto." },
    ],
    faqs: [
      { q: "Hvad er forskellen på et dokument og en officiel offentliggørelse?", a: "Et dokument er blot en fil. En officiel offentliggørelse udgår under en institutions myndighed gennem en styret proces og er varigt kontrollerbar: Det kan bevises, hvem der udstedte den, og at den ikke har ændret sig." },
      { q: "Hvordan beviser man, at en offentliggørelse er officiel?", a: "Ved at sammenholde dens varige Record-ID og dens integritetsbevis med den udstedende institutions register. Sovereign Dispatch gør dette muligt for enhver uden konto." },
      { q: "Gør en underskrift eller et brevhoved en offentliggørelse officiel?", a: "Nej. En underskrift eller et brevhoved kan kopieres. Det er først den myndighed, der er bundet til et embede, sammen med et kontrollerbart integritetsbevis, der gør en offentliggørelse beviseligt officiel." },
    ],
    metaTitle: "Hvad er en officiel offentliggørelse? Definition og bevis",
    metaDescription: "En officiel offentliggørelse er et dokument, der udgår styret under en institutions myndighed og er varigt kontrollerbar. Få at vide, hvad der gør den officiel.",
  },
  "evidence-chain": {
    term: "Beviskæde",
    kicker: "Integritet",
    headline: "En beviskæde, der findes, før nogen spørger efter den.",
    lead: "En beviskæde er det ubrudte bevis for, hvordan et dokument blev godkendt og udstedt — registreret, mens det sker, så man kan stole på det i det afgørende øjeblik.",
    definition: "En beviskæde er et fuldstændigt, ordnet og manipulationssikkert bevis for hvert trin i et dokuments godkendelse og offentliggørelse — hvem der handlede hvornår og på hvilken version — registreret, da dokumentet blev til, i stedet for rekonstrueret bagefter.",
    why: [
      "Når en offentliggørelse anfægtes, afhænger bevisets værdi helt af, hvornår det opstod. Bevis, der samles efter anfægtelsen, er svagt og kan anfægtes.",
      "De fleste organisationer skaber først beviset, når en revisor eller en domstol kræver det — og samler e-mails, godkendelser og versioner under tidspres, med huller.",
      "En beviskæde, der løbende registreres i den rette rækkefølge og forsegles mod ændring, er forskellen på at bevise myndighed og blot at hævde den.",
    ],
    how: [
      { t: "Registreret, mens det sker", d: "Hvert godkendelsestrin registreres i det øjeblik, det finder sted, i den rette rækkefølge — aldrig rekonstrueret senere." },
      { t: "Manipulationssikker", d: "Kæden forsegles med integritetsbeviser: Enhver senere ændring er synlig; beviset kontrolleres enten som uskadt eller slet ikke." },
      { t: "Klar på forlangende", d: "Fordi kæden allerede findes, er svaret på en revision eller en anfægtelse et opslag, ikke en rekonstruktion." },
    ],
    faqs: [
      { q: "Hvad er en beviskæde?", a: "Et fuldstændigt, ordnet og manipulationssikkert bevis for, hvordan et dokument blev godkendt og udstedt — hvem der handlede hvornår og på hvilken version — registreret, mens det skete." },
      { q: "Hvorfor har tidspunktet for beviset betydning?", a: "Et bevis, der opstår, mens begivenhederne udfolder sig, er langt mere holdbart end et, der samles efter en anfægtelse og er sårbart over for huller og strid." },
      { q: "Hvordan forbliver en beviskæde manipulationssikker?", a: "Ved at hvert trin forsegles med kryptografiske integritetsbeviser, så enhver senere ændring bliver synlig ved kontrollen." },
    ],
    metaTitle: "Hvad er en beviskæde? Definition og tidspunktets betydning",
    metaDescription: "En beviskæde er det fuldstændige, ordnede og manipulationssikre bevis for et dokuments godkendelse og udstedelse, registreret i øjeblikket. Derfor tæller tidspunktet.",
  },
  "document-authenticity": {
    term: "Dokumentægthed",
    kicker: "Integritet",
    headline: "En dokumentægthed, man beviser, ikke blot hævder.",
    lead: "Dokumentægthed er egenskaben at være beviseligt ægte — det sande dokument, udstedt af den, der hævdes, uændret siden. De fleste dokumenter hævder den blot.",
    definition: "Dokumentægthed er den kontrollerbare egenskab, at et dokument er ægte: udstedt af den angivne myndighed og uændret siden offentliggørelsen, beviseligt af enhver i stedet for blot hævdet ved sit udseende.",
    why: [
      "Brevhoveder, underskrifter og segl kan alle kopieres. Udseendet er ikke et bevis — en overbevisende forfalskning ser præcis ud som originalen.",
      "Når et dokuments ægthed betyder mest — et bevis, en licens, en afgørelse — har modtageren ofte ingen uafhængig måde at bekræfte, at det er ægte.",
      "En ægthed, der afhænger af et opkald til udstederen, kan ikke skaleres og svigter netop, når udstederen er sværest at få fat i.",
    ],
    how: [
      { t: "Bundet til det udstedende embede", d: "Hver offentliggørelse udgår under en navngiven myndighed: Dens oprindelse er en del af beviset og ikke en formodning ud fra et brevhoved." },
      { t: "Integritetsbevis per dokument", d: "Et kryptografisk bevis forbinder den nøjagtige fil med dens registrering; ændres blot én byte, brydes kontrollen." },
      { t: "Kontrollerbar af enhver", d: "Et varigt Record-ID lader enhver modtager bekræfte ægtheden uafhængigt — uden konto og uden at ringe til udstederen." },
    ],
    faqs: [
      { q: "Hvad er dokumentægthed?", a: "Den kontrollerbare egenskab, at et dokument er ægte — udstedt af den angivne myndighed og uændret siden offentliggørelsen — beviseligt af enhver og ikke blot hævdet." },
      { q: "Hvorfor er en underskrift eller et segl ikke nok?", a: "Underskrifter og segl kan kopieres. Ægte autenticitet kræver et kontrollerbart integritetsbevis, der er bundet til den udstedende myndighed." },
      { q: "Hvordan kontrollerer jeg, om et dokument er ægte?", a: "Ved at sammenholde dets varige Record-ID og dets integritetsbevis med udstederens register. Sovereign Dispatch gør dette muligt for enhver uden konto." },
    ],
    metaTitle: "Dokumentægthed — bevis, at et dokument er ægte",
    metaDescription: "Dokumentægthed er den kontrollerbare egenskab at være ægte og uændret. Hvorfor underskrifter og segl ikke er nok, og hvordan man beviser den.",
  },
  "document-verification": {
    term: "Dokumentkontrol",
    kicker: "Verifikation",
    headline: "En dokumentkontrol, enhver kan udføre — uden konto.",
    lead: "Dokumentkontrol betyder at bekræfte, at et dokument er ægte og uændret. Den bedste kontrol kræver ingen særlig adgang — enhver kan udføre den.",
    definition: "Dokumentkontrol er handlingen at bekræfte, at et dokument er ægte og uændret — ideelt ved at sammenholde en varig identifikator og et integritetsbevis med udstederens register, uafhængigt og uden privilegeret adgang.",
    why: [
      "En kontrol, der kræver et opkald til udstederen eller login på en portal, svigter dem, der har mest brug for den — modtagere, offentligheden, andre institutioner.",
      "Er kontrollen besværlig, finder den ikke sted, og forfalskninger cirkulerer uimodsagt.",
      "Tillid skalerer kun, når enhver, der har et dokument, selv kan bekræfte det på sekunder mod kilden til sandheden.",
    ],
    how: [
      { t: "Varigt Record-ID", d: "Hver offentliggørelse bærer en identifikator, der peger på dens autoritative registrering hos den udstedende institution." },
      { t: "Integritetskontrol af den nøjagtige fil", d: "Kontrollen bekræfter, at den konkrete fil svarer byte for byte til den udstedte version; enhver ændring opdages." },
      { t: "Åben for alle", d: "Enhver kan kontrollere en registrering uden konto: Tillid afhænger ikke af privilegeret adgang." },
    ],
    faqs: [
      { q: "Hvad er dokumentkontrol?", a: "At bekræfte, at et dokument er ægte og uændret, ideelt ved at sammenholde en varig identifikator og et integritetsbevis med udstederens register." },
      { q: "Har jeg brug for en konto for at kontrollere et dokument?", a: "Ikke med Sovereign Dispatch. Kontrollen er åben for alle, så tillid ikke afhænger af privilegeret adgang." },
      { q: "Hvad kontrollerer verifikationen egentlig?", a: "At dokumentet svarer til en ægte udstedt registrering, og at den nøjagtige fil er uændret siden offentliggørelsen." },
    ],
    metaTitle: "Dokumentkontrol — bekræft ægthed, uden konto",
    metaDescription: "Dokumentkontrol bekræfter, at et dokument er ægte og uændret, via et varigt Record-ID og et integritetsbevis — uafhængigt, uden konto.",
  },
};
