// Äkta svenska översättningar av konceptsidorna (Layer 3). En version per språk —
// ingen maskinöversättning vid körning. Endast de slugs som finns här levereras under
// /sv/learn/<slug>; allt övrigt förblir på engelska tills det är översatt, så att
// hreflang förblir sanningsenligt. Den gemensamma strukturen (diagram, relaterade länkar)
// kommer från den engelska basen i problems.ts; detta är de lokaliserade textfälten.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_SV: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Officiell publicering",
    kicker: "Koncept",
    headline: "Vad en officiell publicering är — och vad som gör den officiell.",
    lead: "Vem som helst kan publicera ett dokument. En officiell publicering är något annat: den utfärdas under en institutions auktoritet och kan bevisas vara äkta så länge det har betydelse.",
    definition: "En officiell publicering är ett dokument som utfärdas under en institutions auktoritet — inte en enskild persons — genom ett reglerat godkännandeförfarande och som görs varaktigt verifierbart, så att vem som helst kan bekräfta att det är den äkta, gällande versionen.",
    why: [
      "En PDF som skickas via e-post ser likadan ut oavsett om det är den godkända slutversionen eller ett tidigt utkast. Inget i filen visar vilket av de två den är.",
      "Om en publicering ifrågasätts flera år senare — i domstol, vid en granskning, av allmänheten — måste institutionen kunna bevisa vem som godkände den, i vilken ordning och att filen inte har förändrats sedan dess.",
      "De flesta institutioner kan inte bevisa detta: godkännandet levde i e-post och möten, och den publicerade filen är bara en kopia utan varaktig koppling till den auktoritet som utfärdade den.",
    ],
    how: [
      { t: "Utfärdad av ett ämbete, inte en person", d: "Sovereign Dispatch binder varje publicering till ett ämbetes auktoritet: den förblir giltig även om den person som undertecknade den har slutat." },
      { t: "Reglerad före publicering", d: "Före frisläppandet löper en bindande godkännandekedja: den officiella versionen är den som har passerat styrningen, och ingen annan kan utge sig för att vara officiell." },
      { t: "Varaktigt verifierbar", d: "Varje publicering bär ett varaktigt post-ID och ett integritetsbevis; vem som helst kan bekräfta att den är äkta och oförändrad — utan konto." },
    ],
    faqs: [
      { q: "Vad är skillnaden mellan ett dokument och en officiell publicering?", a: "Ett dokument är bara en fil. En officiell publicering utfärdas under en institutions auktoritet genom ett reglerat förfarande och är varaktigt verifierbar: det går att bevisa vem som utfärdade den och att den inte har förändrats." },
      { q: "Hur bevisar man att en publicering är officiell?", a: "Genom att stämma av dess varaktiga post-ID och integritetsbevis mot den utfärdande institutionens register. Sovereign Dispatch gör detta möjligt för vem som helst utan konto." },
      { q: "Gör en underskrift eller ett brevhuvud en publicering officiell?", a: "Nej. En underskrift eller ett brevhuvud går att kopiera. Först auktoriteten som är bunden till ett ämbete, tillsammans med ett verifierbart integritetsbevis, gör en publicering bevisbart officiell." },
    ],
    metaTitle: "Vad är en officiell publicering? Definition och bevis",
    metaDescription: "En officiell publicering är ett dokument som utfärdas reglerat under en institutions auktoritet och är varaktigt verifierbart. Lär dig vad som gör den officiell.",
  },
  "evidence-chain": {
    term: "Beviskedja",
    kicker: "Integritet",
    headline: "En beviskedja som finns innan någon frågar efter den.",
    lead: "En beviskedja är det obrutna beviset för hur ett dokument godkändes och utfärdades — registrerat medan det sker, så att man kan förlita sig på det i det avgörande ögonblicket.",
    definition: "En beviskedja är ett fullständigt, ordnat och manipuleringssäkert bevis för varje steg i godkännandet och publiceringen av ett dokument — vem som agerade när och på vilken version — registrerat när dokumentet uppstår i stället för rekonstruerat i efterhand.",
    why: [
      "När en publicering ifrågasätts hänger bevisets värde helt på när det uppstod. Bevis som samlas in efter ifrågasättandet är svaga och möjliga att bestrida.",
      "De flesta organisationer tar fram beviset först när en revisor eller en domstol kräver det — och samlar ihop e-post, godkännanden och versioner under tidspress, med luckor.",
      "En beviskedja som registreras löpande, i rätt ordning och förseglad mot förändring är skillnaden mellan att bevisa auktoritet och att bara påstå den.",
    ],
    how: [
      { t: "Registrerad medan det sker", d: "Varje godkännandesteg registreras i samma ögonblick som det inträffar, i rätt ordning — aldrig rekonstruerat senare." },
      { t: "Manipuleringssäker", d: "Kedjan förseglas med integritetsbevis: varje senare ändring blir synlig; beviset verifieras antingen som intakt eller inte alls." },
      { t: "Redo att hämtas", d: "Eftersom kedjan redan finns är svaret på en granskning eller ett ifrågasättande en hämtning, inte en rekonstruktion." },
    ],
    faqs: [
      { q: "Vad är en beviskedja?", a: "Ett fullständigt, ordnat och manipuleringssäkert bevis för hur ett dokument godkändes och utfärdades — vem som agerade när och på vilken version — registrerat medan det skedde." },
      { q: "Varför har tidpunkten för beviset betydelse?", a: "Ett bevis som uppstår i händelsernas förlopp är långt mer hållbart än ett som samlas ihop efter ett ifrågasättande och är känsligt för luckor och tvist." },
      { q: "Hur förblir en beviskedja manipuleringssäker?", a: "Genom att varje steg förseglas med kryptografiska integritetsbevis, så att varje senare förändring blir synlig vid verifiering." },
    ],
    metaTitle: "Vad är en beviskedja? Definition och varför tidpunkten räknas",
    metaDescription: "En beviskedja är det fullständiga, ordnade och manipuleringssäkra beviset för godkännande och utfärdande av ett dokument, registrerat i ögonblicket. Varför tidpunkten räknas.",
  },
  "document-authenticity": {
    term: "Dokumentäkthet",
    kicker: "Integritet",
    headline: "En dokumentäkthet som man bevisar, inte bara påstår.",
    lead: "Dokumentäkthet är egenskapen att vara bevisbart äkta — det sanna dokumentet, utfärdat av den som påstås ha utfärdat det, oförändrat sedan dess. De flesta dokument bara påstår det.",
    definition: "Dokumentäkthet är den verifierbara egenskapen att ett dokument är äkta: utfärdat av den angivna auktoriteten och oförändrat sedan publiceringen, bevisbart av vem som helst i stället för bara påstått genom utseendet.",
    why: [
      "Brevhuvuden, underskrifter och sigill går alla att kopiera. Utseendet är inget bevis — en övertygande förfalskning ser likadan ut som originalet.",
      "När ett dokuments äkthet betyder som mest — en urkund, en licens, ett beslut — har mottagaren ofta inget oberoende sätt att bekräfta att det är äkta.",
      "En äkthet som beror på att man ringer utfärdaren går inte att skala och fallerar just när utfärdaren är som svårast att nå.",
    ],
    how: [
      { t: "Bunden till det utfärdande ämbetet", d: "Varje publicering utfärdas under en namngiven auktoritet: dess ursprung är en del av beviset och inte en gissning utifrån ett brevhuvud." },
      { t: "Integritetsbevis per dokument", d: "Ett kryptografiskt bevis kopplar den exakta filen till dess post; ändringen av en enda byte bryter verifieringen." },
      { t: "Verifierbar av vem som helst", d: "Ett varaktigt post-ID låter varje mottagare bekräfta äktheten oberoende — utan konto och utan att ringa utfärdaren." },
    ],
    faqs: [
      { q: "Vad är dokumentäkthet?", a: "Den verifierbara egenskapen att ett dokument är äkta — utfärdat av den angivna auktoriteten och oförändrat sedan publiceringen — bevisbart av vem som helst och inte bara påstått." },
      { q: "Varför räcker inte en underskrift eller ett sigill?", a: "Underskrifter och sigill går att kopiera. Äkta autenticitet kräver ett verifierbart integritetsbevis som är bundet till den utfärdande auktoriteten." },
      { q: "Hur verifierar jag att ett dokument är äkta?", a: "Genom att stämma av dess varaktiga post-ID och integritetsbevis mot utfärdarens register. Sovereign Dispatch gör detta möjligt för vem som helst utan konto." },
    ],
    metaTitle: "Dokumentäkthet — bevisa att ett dokument är äkta",
    metaDescription: "Dokumentäkthet är den verifierbara egenskapen att vara äkta och oförändrad. Varför underskrifter och sigill inte räcker och hur man bevisar den.",
  },
  "document-verification": {
    term: "Dokumentverifiering",
    kicker: "Verifiering",
    headline: "En dokumentverifiering som vem som helst kan göra — utan konto.",
    lead: "Dokumentverifiering innebär att bekräfta att ett dokument är äkta och oförändrat. Den bästa verifieringen kräver ingen särskild åtkomst — vem som helst kan göra den.",
    definition: "Dokumentverifiering är handlingen att bekräfta att ett dokument är äkta och oförändrat — helst genom att stämma av en varaktig identifierare och ett integritetsbevis mot utfärdarens register, oberoende och utan privilegierad åtkomst.",
    why: [
      "En verifiering som kräver ett samtal till utfärdaren eller inloggning på en portal fallerar för dem som behöver den mest — mottagare, allmänhet, andra institutioner.",
      "Om verifieringen är svår sker den inte, och förfalskningar cirkulerar obestridda.",
      "Förtroende skalar bara om varje person som har ett dokument själv kan bekräfta det mot sanningens källa på några sekunder.",
    ],
    how: [
      { t: "Varaktigt post-ID", d: "Varje publicering bär en identifierare som pekar på dess auktoritativa post hos den utfärdande institutionen." },
      { t: "Integritetskontroll av den exakta filen", d: "Verifieringen bekräftar att den konkreta filen motsvarar den utfärdade versionen byte för byte; varje förändring upptäcks." },
      { t: "Öppen för alla", d: "Vem som helst kan kontrollera en post utan konto: förtroende beror inte på privilegierad åtkomst." },
    ],
    faqs: [
      { q: "Vad är dokumentverifiering?", a: "Att bekräfta att ett dokument är äkta och oförändrat, helst genom att stämma av en varaktig identifierare och ett integritetsbevis mot utfärdarens register." },
      { q: "Behöver jag ett konto för att verifiera ett dokument?", a: "Med Sovereign Dispatch behövs det inte. Verifieringen är öppen för alla, så att förtroende inte beror på privilegierad åtkomst." },
      { q: "Vad kontrollerar verifieringen egentligen?", a: "Att dokumentet motsvarar en äkta utfärdad post och att den exakta filen är oförändrad sedan publiceringen." },
    ],
    metaTitle: "Dokumentverifiering — bekräfta äkthet, utan konto",
    metaDescription: "Dokumentverifiering bekräftar att ett dokument är äkta och oförändrat, via ett varaktigt post-ID och ett integritetsbevis — oberoende, utan konto.",
  },
};
