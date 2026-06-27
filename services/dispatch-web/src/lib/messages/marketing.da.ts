import type { MarketingCopy } from "./marketing";

export const MARKETING_DA: MarketingCopy = {
  trust: {
    eyebrow: "Indfør med tillid",
    titleA: "Dine registreringer. Din jurisdiktion.",
    titleB: "Din exit, garanteret.",
    lead: "At binde sig til en offentliggørelsesplatform er en suverænitetsbeslutning. Sovereign Dispatch er bygget, så institutionen bevarer kontrollen — over data, over udrulningen og over evnen til at gå derfra med alt intakt.",
    ownership: {
      kicker: "Ejerskab", title: "Du ejer dine registreringer — vi er forvalteren.",
      sub: "Platformen opbevarer og styrer dine registreringer. Den ejer dem aldrig, genanvender dem aldrig og træner aldrig noget på dem.",
      cards: [
        { title: "Dine data er dine", body: "Hvert dokument, hver version, hvert artefakt og certifikat tilhører din institution — ikke platformen." },
        { title: "Tenant-isolering", body: "Row-level security med deny-by-default. Et manglende tenant-claim afviser; dine data blandes aldrig sammen." },
        { title: "Ingen sekundær brug", body: "Ingen dataudvinding, ingen profilering, ingen modeltræning, ingen datadelingsforretning. Aldrig." },
        { title: "Enhver adgang revideres", body: "Indsendelser, afgørelser, offentliggørelser og fremfindinger registreres i et append-only-spor med hash-stempel." },
      ],
    },
    continuity: {
      kicker: "Kontinuitet og exit", title: "Du kan rejse når som helst — med alt.",
      sub: "Det stærkeste tillidssignal, en platform kan tilbyde, er en ren exit. Der er ingen lock-in at konstruere sig ud af.",
      cards: [
        { title: "Ingen proprietære formater", body: "Strukturerede registreringer, standard PDF- / DOCX- / Markdown-artefakter og et standard PostgreSQL-lager. Intet er fanget." },
        { title: "Fuld eksport på forlangende", body: "Eksportér registreringer, versioner, artefakter og governance- + bevaringscertifikaterne, når du vælger det." },
        { title: "Flytbar udrulning", body: "Den samme platform kører administreret, i din cloud, on-premise eller air-gapped — flyt din portefølje uden at skifte platform." },
        { title: "Hvis udbyderen forsvandt", body: "Du beholder hver registrering, hvert artefakt og certifikat i åbne formater og kan selv drifte eller migrere platformen. Kontinuitet afhænger ikke af os." },
      ],
    },
    accountability: {
      kicker: "Ansvarlighed", title: "En klar ansvarslinje.",
      sub: "Indkøbs- og risikoteams har brug for at vide præcis, hvem der er ansvarlig for hvad. Der er ingen tvetydighed.",
      securesLabel: "Platformen sikrer",
      secures: ["Tenant-isolering og adgangskontrol", "Kryptering i hvile og under overførsel", "Append-only-revisionsintegritet", "Bevaringsintegritet (SHA-256-beviser)", "Governance-håndhævelse — motoren kan ikke omgås", "Tjenestens tilgængelighed og genopretning"],
      controlsLabel: "Din institution kontrollerer",
      controls: ["Hvem der har hver governance-myndighed", "Godkendelseskæder, kvora og politikker", "Klassificering og clearance af registreringer", "Opbevaringshorisonter", "Hvem der har legitimationsoplysninger og deres rækkevidde", "Udrulningsmodel og dataresidens"],
    },
    evidence: {
      kicker: "Bevis", title: "Bevisligt, ikke lovet.",
      sub: "Tillid til indførelsen bør hvile på det, der kan verificeres under evalueringen — ikke på markedsføringspåstande.",
      ctaProcurement: "Indkøbsdossier", ctaEvidence: "Bevis og evner",
    },
  },
  platform: {
    overview: {
      kicker: "Oversigt", title: "Information bliver den officielle registrering.",
      sub: "Dispatch er det institutionelle lag mellem et udkast og et offentliggjort dokument. Hvert artefakt — briefing, bestyrelsesmappe, tilsynsindberetning — indsendes som strukturerede data, styres gennem godkendelse, gengives til en tro PDF/DOCX og offentliggøres med et varigt, reviderbart oprindelsesspor.",
      cards: [
        { title: "Ikke en tekstbehandler", body: "Dokumenter er strukturerede data (DDM), valideret og stilladseret efter type — ikke friformsfiler. Formatet er kontrakten." },
        { title: "Styret, ikke blot genereret", body: "Indsend → Godkend → Gengiv → Offentliggør. Intet når registreringen uden at bestå sin godkendelsespolitik." },
        { title: "Suveræn ved konstruktion", body: "Tenant-isoleret, residens-bevidst, append-only-revision. Bygget til institutioner, der ikke må svigte." },
      ],
    },
    capabilities: {
      kicker: "Funktioner", title: "Én pipeline, hvert officielt dokument.",
      sub: "Skabeloner og validering per dokumenttype; deterministisk, klassificeringsbåndet gengivelse til output i trykkekvalitet.",
      cards: [
        { title: "Dokumenttyper", body: "Ledelsesbriefinger, bestyrelsesrapporter, politikpapirer, tilsynsindberetninger, operationelle pakker og officielle registreringer — hver med sit eget krævede stillads." },
        { title: "Gengivelse i flere formater", body: "Tro PDF (headless-motor), DOCX og Markdown fra én valideret kilde — bannere, sidetal, bilag, underskrifter." },
        { title: "Skemavalideret", body: "Hver indsendelse kontrolleres mod DDM-skemaet og dokumenttypepolitikken, før den kan gengives — ingen fejlbehæftede registreringer." },
        { title: "Skabeloner og stilladser", body: "Typebevidste sektionsroller og blokpolitikker håndhæver fuldstændighed, så outputtet er ensartet på tværs af institutionen." },
        { title: "Versioneret og uforanderlig", body: "Hver version bevares; offentliggjorte artefakter hash-stemples og ændres aldrig i det skjulte." },
        { title: "Asynkron i stor skala", body: "En kø-understøttet gengivelsesbane optager spidsbelastninger og store pakker uden at blokere indsendere." },
      ],
    },
    workflow: {
      kicker: "Arbejdsgang", title: "Indsend → Styr → Godkend → Gengiv → Offentliggør → Fremfind.",
      sub: "Hele livscyklussen for et officielt dokument, håndhævet af platformen.",
      steps: [
        { t: "Indsend", b: "Struktureret DDM-payload, valideret ved indgang." },
        { t: "Styr", b: "Klassificering + godkendelsespolitik afklaret." },
        { t: "Godkend", b: "N-eyes-godkendelse; servicebaner auto-godkender." },
        { t: "Gengiv", b: "Tro PDF/DOCX frembragt i køen." },
        { t: "Offentliggør", b: "Frigivet til registreringen; oprindelse forseglet." },
        { t: "Fremfind", b: "Signeret, adgangsstyret artefaktdownload." },
      ],
    },
    integrations: {
      kicker: "Integrationer", title: "Et API, andre bygger på.",
      sub: "Dispatch tildeler afgrænset API-adgang per forbruger og modtager dokumenter over en stabil REST-flade.",
      apiTitle: "API-tildeling",
      apiBody: "Hvert system får sin egen serviceklient — et client_id + secret med eksplicitte scopes (validate · render · read). Udsted, afgræns og tilbagekald per forbruger.",
      estateTitle: "Bygget til porteføljen",
      estateBody: "Forbrugere indsender deres data, og Dispatch returnerer den officielle registrering — med webhook-callbacks ved gengivelse og offentliggørelse.",
      estateItems: ["Veritas — operationelle og finansielle pakker", "ExitOS — bestyrelsesmemoranda og transaktionsdokumenter", "Din institution — over den samme REST-flade"],
    },
  },
  standard: {
    eyebrow: "Kategoridefinition",
    title: "Sovereign Dispatch-standarden",
    lead: "En institution indfører ikke et offentliggørelsesværktøj. Den indfører en standard for, hvordan officielle registreringer bliver til, bevises og bevares. Dette er de koncepter, den standard definerer.",
    sectionKicker: "Standarden",
    sectionTitle: "Seks institutionelle koncepter.",
    sectionSub: "Hvert er en byggesten i driftsstandarden for institutionelle registreringer — ikke en funktion, en definition.",
    defs: [
      { term: "Officiel registrering", one: "Et styret, versioneret, klassificeret institutionelt registreringsdokument.", def: "Ikke en fil. En officiel handling, skabt under en håndhævet governance-politik, ført gennem en uforanderlig livscyklus — Skabt → Styret → Godkendt → Offentliggjort → Bevaret — med en varig, bevislig identitet.", props: ["Stabilt registreringsnummer", "Klassificering og clearance", "Uforanderlige versioner", "En enkelt kanonisk form"] },
      { term: "Governance-politik", one: "Den eksekverbare regel for, hvordan en klasse af registreringer styres.", def: "En navngiven, versioneret politik bundet til en registreringstype: en ordnet kæde af myndigheder, kvorum per trin, offentliggørelsesmyndigheden, opbevaring og udløb. Politikken beskriver ikke arbejdsgangen — den styrer den.", props: ["Ordnet godkendelseskæde", "Kvorum per trin", "Offentliggørelsesmyndighed", "Versioneret og håndhævet"] },
      { term: "Offentliggørelsesmyndighed", one: "Den navngivne myndighed, der er bemyndiget til at frigive en registrering af record.", def: "Offentliggørelse er ikke en knap, hvem som helst må trykke på. Den er forbeholdt en bestemt governance-rolle, valideret i frigivelsesøjeblikket — og en godkender af en registrering må aldrig være dens udgiver.", props: ["Rollebundet", "Valideret ved offentliggørelse", "Funktionsadskillelse"] },
      { term: "Governance-certifikat", one: "Kryptografisk bevis for, at en offentliggørelse opfyldte sin politik.", def: "Forseglet ved offentliggørelse: politikken og dens version, den krævede kæde over for dem, der faktisk opfyldte den i rækkefølge, anvendte delegeringer, offentliggørelsesmyndigheden og et integritetsbevis — en COMPLIANT-kendelse, der kan verificeres uafhængigt.", props: ["Krævet vs. faktisk kæde", "Ordnet godkendelsessekvens", "Integritetsbevis", "Compliance-kendelse"] },
      { term: "Bevaringscertifikat", one: "Manipulationssynligt bevis for, at en registrering er varigt forseglet.", def: "Udstedt, når en registrering arkiveres: et bevaringstidsstempel og et SHA-256-integritetsbevis over den kanoniske registrering. Den arkiverede tilstand er endelig — ingen redigering, tilbagetrækning eller genoffentliggørelse er mulig.", props: ["SHA-256-integritetsbevis", "Bevaringstidsstempel", "Endelig og uforanderlig"] },
      { term: "Beviskæde", one: "Det ubrudte, append-only-spor fra skabelse til bevaring.", def: "Hver handling — indsendelse, hver afgørelse, opfyldelsen af politikken, offentliggørelse og bevaring — registreret i et uforanderligt spor med hash-stempel. Institutionen kan bevise ikke blot, hvad en registrering siger, men præcis hvordan den blev til.", props: ["Append-only", "Hash-stemplet", "Skabelse → bevaring", "Uafhængigt reviderbar"] },
    ],
    closeTitleA: "Når en kategori opstår,",
    closeTitleB: "betyder standarden mere end funktionerne.",
    closeBody: "Sovereign Dispatch er ikke en bedre måde at offentliggøre dokumenter på. Det er driftsstandarden for institutionelle registreringer — og en institution, der indfører standarden, indfører en måde at styre på, der overlever ethvert enkelt system.",
    ctaArtifacts: "Se artefakterne", ctaPath: "Find din vej",
  },
};
