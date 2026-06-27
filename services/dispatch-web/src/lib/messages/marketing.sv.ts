// Svensk översättning av de mindre marknadssidorna (Trust, Platform, Standard).
import type { MarketingCopy } from "./marketing";

export const MARKETING_SV: MarketingCopy = {
  trust: {
    eyebrow: "Inför med tillförsikt",
    titleA: "Dina poster. Din jurisdiktion.",
    titleB: "Din utgång, garanterad.",
    lead: "Att förbinda sig till en publiceringsplattform är ett suveränitetsbeslut. Sovereign Dispatch är byggt så att institutionen behåller kontrollen — över data, driftsättningen och förmågan att gå därifrån med allt intakt.",
    ownership: {
      kicker: "Ägande", title: "Du äger dina poster — vi är förvaltaren.",
      sub: "Plattformen lagrar och styr dina poster. Den äger dem aldrig, återanvänder dem aldrig och tränar aldrig något på dem.",
      cards: [
        { title: "Dina data är dina", body: "Varje dokument, version, artefakt och certifikat tillhör din institution — inte plattformen." },
        { title: "Tenantisolering", body: "Radnivåsäkerhet med neka-som-standard. Ett saknat tenant-anspråk nekar; dina data blandas aldrig samman." },
        { title: "Ingen sekundär användning", body: "Ingen utvinning, ingen profilering, ingen modellträning, ingen affärsmodell för datadelning. Någonsin." },
        { title: "Varje åtkomst granskad", body: "Inlämningar, beslut, publiceringar och hämtningar registreras i ett append-only-spår med hash-stämpling." },
      ],
    },
    continuity: {
      kicker: "Kontinuitet och utgång", title: "Du kan lämna när som helst — med allt.",
      sub: "Den starkaste förtroendesignalen en plattform kan erbjuda är en ren utgång. Det finns ingen inlåsning att tekniskt ta sig ur.",
      cards: [
        { title: "Inga proprietära format", body: "Strukturerade poster, standardartefakter i PDF / DOCX / Markdown och ett standardlager i PostgreSQL. Inget är fångat." },
        { title: "Fullständig export på begäran", body: "Exportera poster, versioner, artefakter och styrnings- och bevarandecertifikaten när du själv väljer." },
        { title: "Flyttbar driftsättning", body: "Samma plattform körs hanterad, i ditt moln, lokalt eller luftgapad — flytta hela ditt bestånd utan att byta plattform." },
        { title: "Om leverantören försvann", body: "Du behåller varje post, artefakt och certifikat i öppna format och kan köra eller migrera plattformen själv. Kontinuiteten beror inte på oss." },
      ],
    },
    accountability: {
      kicker: "Ansvarsskyldighet", title: "En tydlig ansvarslinje.",
      sub: "Upphandlings- och riskteam behöver veta exakt vem som är ansvarig för vad. Det finns ingen tvetydighet.",
      securesLabel: "Plattformen säkrar",
      secures: ["Tenantisolering och åtkomstkontroll", "Kryptering i vila och under överföring", "Append-only-granskningsintegritet", "Bevarandeintegritet (SHA-256-bevis)", "Framtvingad styrning — motorn kan inte kringgås", "Tjänstens tillgänglighet och återställning"],
      controlsLabel: "Din institution kontrollerar",
      controls: ["Vem som innehar varje styrningsbefogenhet", "Godkännandekedjor, kvorum och policyer", "Klassificering och behörighet för poster", "Bevarandehorisonter", "Vem som innehar autentiseringsuppgifter och deras omfattning", "Driftsättningsmodell och datahemvist"],
    },
    evidence: {
      kicker: "Bevis", title: "Bevisbart, inte lovat.",
      sub: "Tillförsikten vid införande bör vila på det som kan verifieras under utvärderingen — inte på marknadsföringspåståenden.",
      ctaProcurement: "Upphandlingsdossier", ctaEvidence: "Bevis och förmågor",
    },
  },
  platform: {
    overview: {
      kicker: "Översikt", title: "Information blir den officiella posten.",
      sub: "Dispatch är det institutionella lagret mellan ett utkast och ett publicerat dokument. Varje artefakt — föredragning, styrelsematerial, regulatorisk inlaga — lämnas in som strukturerad data, styrs genom godkännande, renderas till en troget återgiven PDF/DOCX och publiceras med ett permanent, granskningsbart ursprungsspår.",
      cards: [
        { title: "Ingen ordbehandlare", body: "Dokument är strukturerad data (DDM), validerad och ställd i ställning efter typ — inte friformsfiler. Formatet är kontraktet." },
        { title: "Styrt, inte bara genererat", body: "Lämna in → Godkänn → Rendera → Publicera. Inget når posten utan att klara sin godkännandepolicy." },
        { title: "Suverän genom konstruktion", body: "Tenantisolerad, hemvistmedveten, append-only-granskning. Byggd för institutioner som inte får fallera." },
      ],
    },
    capabilities: {
      kicker: "Förmågor", title: "En pipeline, varje officiellt dokument.",
      sub: "Mallar och validering per dokumenttyp; deterministisk, klassificeringsbandad rendering till tryckfärdig utdata.",
      cards: [
        { title: "Dokumenttyper", body: "Verkställande föredragningar, styrelserapporter, policydokument, regulatoriska inlagor, operativa paket och officiella poster — var och en med sin egen obligatoriska ställning." },
        { title: "Flerformatsrendering", body: "Troget återgiven PDF (huvudlös motor), DOCX och Markdown från en enda validerad källa — banderoller, sidnummer, bilagor, signaturer." },
        { title: "Schemavaliderad", body: "Varje inlämning kontrolleras mot DDM-schemat och dokumenttypspolicyn innan den kan renderas — inga felformade poster." },
        { title: "Mallar och ställningar", body: "Typmedvetna sektionsroller och blockpolicyer framtvingar fullständighet så att utdatan är konsekvent i hela institutionen." },
        { title: "Versionshanterad och oföränderlig", body: "Varje version bevaras; publicerade artefakter är hash-stämplade och ändras aldrig i tysthet." },
        { title: "Asynkron i skala", body: "En könsbaserad renderingsbana absorberar toppar och stora paket utan att blockera dem som lämnar in." },
      ],
    },
    workflow: {
      kicker: "Arbetsflöde", title: "Lämna in → Styr → Godkänn → Rendera → Publicera → Hämta.",
      sub: "Hela livscykeln för ett officiellt dokument, framtvingad av plattformen.",
      steps: [
        { t: "Lämna in", b: "Strukturerad DDM-nyttolast, validerad vid inträde." },
        { t: "Styr", b: "Klassificering + godkännandepolicy fastställd." },
        { t: "Godkänn", b: "N-eyes-utkvittering; tjänstebanor godkänner automatiskt." },
        { t: "Rendera", b: "Troget återgiven PDF/DOCX produceras i kön." },
        { t: "Publicera", b: "Frisläppt till posten; ursprung förseglat." },
        { t: "Hämta", b: "Signerad, åtkomststyrd artefaktnedladdning." },
      ],
    },
    integrations: {
      kicker: "Integrationer", title: "Ett API som andra bygger på.",
      sub: "Dispatch tillhandahåller avgränsad API-åtkomst per konsument och tar emot dokument över en stabil REST-yta.",
      apiTitle: "API-tillhandahållande",
      apiBody: "Varje system får sin egen tjänsteklient — ett client_id + en hemlighet med uttryckliga omfattningar (validate · render · read). Utfärda, avgränsa och återkalla per konsument.",
      estateTitle: "Byggd för beståndet",
      estateBody: "Konsumenter lämnar in sina data och Dispatch returnerar den officiella posten — med webhook-återanrop vid rendering och publicering.",
      estateItems: ["Veritas — operativa och finansiella paket", "ExitOS — styrelsememoranda och transaktionsdokument", "Din institution — över samma REST-yta"],
    },
  },
  standard: {
    eyebrow: "Kategoridefinition",
    title: "Sovereign Dispatch-standarden",
    lead: "En institution inför inte ett publiceringsverktyg. Den inför en standard för hur officiella poster kommer till, bevisas och bevaras. Detta är de koncept standarden definierar.",
    sectionKicker: "Standarden",
    sectionTitle: "Sex institutionella koncept.",
    sectionSub: "Var och en är en byggsten i driftsstandarden för institutionella poster — inte en funktion, en definition.",
    defs: [
      { term: "Officiell post", one: "Ett styrt, versionshanterat, klassificerat institutionellt dokument av rang.", def: "Inte en fil. En officiell handling, skapad under en framtvingad styrningspolicy, buren genom en oföränderlig livscykel — Skapad → Styrd → Godkänd → Publicerad → Bevarad — med en permanent, bevisbar identitet.", props: ["Stabilt postnummer", "Klassificering och behörighet", "Oföränderliga versioner", "En enda kanonisk form"] },
      { term: "Styrningspolicy", one: "Den exekverbara regeln för hur en klass av poster styrs.", def: "En namngiven, versionshanterad policy bunden till en posttyp: en ordnad kedja av auktoriteter, kvorum per steg, publiceringsauktoriteten, bevarande och utgång. Policyn beskriver inte arbetsflödet — den styr det.", props: ["Ordnad godkännandekedja", "Kvorum per steg", "Publiceringsauktoritet", "Versionshanterad och framtvingad"] },
      { term: "Publiceringsauktoritet", one: "Den namngivna auktoritet som bemyndigats att frisläppa en post av rang.", def: "Publicering är ingen knapp som vem som helst får trycka på. Den är förbehållen en specifik styrningsroll, validerad i frisläppandets ögonblick — och den som godkänner en post får aldrig vara dess publicerare.", props: ["Rollbunden", "Validerad vid publicering", "Åtskillnad av befogenheter"] },
      { term: "Styrningscertifikat", one: "Kryptografiskt bevis för att en publicering uppfyllde sin policy.", def: "Förseglat vid publicering: policyn och dess version, den krävda kedjan mot vem som faktiskt uppfyllde den i ordning, använda delegeringar, publiceringsauktoriteten och ett integritetsbevis — ett COMPLIANT-utlåtande som kan verifieras oberoende.", props: ["Krävd mot faktisk kedja", "Ordnad godkännandesekvens", "Integritetsbevis", "Efterlevnadsutlåtande"] },
      { term: "Bevarandecertifikat", one: "Manipuleringssynligt bevis för att en post är permanent förseglad.", def: "Utfärdas när en post arkiveras: en bevarandetidsstämpel och ett SHA-256-integritetsbevis över den kanoniska posten. Det arkiverade tillståndet är slutligt — ingen redigering, indragning eller ompublicering är möjlig.", props: ["SHA-256-integritetsbevis", "Bevarandetidsstämpel", "Slutligt och oföränderligt"] },
      { term: "Beviskedja", one: "Det obrutna, append-only-spåret från skapande till bevarande.", def: "Varje handling — inlämning, varje beslut, policyns uppfyllelse, publicering och bevarande — registrerad i ett oföränderligt, hash-stämplat spår. Institutionen kan bevisa inte bara vad en post säger, utan exakt hur den kom till.", props: ["Append-only", "Hash-stämplad", "Skapande → bevarande", "Oberoende granskningsbar"] },
    ],
    closeTitleA: "När en kategori uppstår,",
    closeTitleB: "betyder standarden mer än funktionerna.",
    closeBody: "Sovereign Dispatch är inte ett bättre sätt att publicera dokument. Det är driftsstandarden för institutionella poster — och en institution som inför standarden inför ett sätt att styra som överlever vilket enskilt system som helst.",
    ctaArtifacts: "Se artefakterna", ctaPath: "Hitta din väg",
  },
};
