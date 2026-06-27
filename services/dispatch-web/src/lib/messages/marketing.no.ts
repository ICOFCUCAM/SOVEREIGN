import type { MarketingCopy } from "./marketing";

export const MARKETING_NO: MarketingCopy = {
  trust: {
    eyebrow: "Ta i bruk med trygghet",
    titleA: "Dine arkiver. Din jurisdiksjon.",
    titleB: "Din exit, garantert.",
    lead: "Å forplikte seg til en publiseringsplattform er en suverenitetsbeslutning. Sovereign Dispatch er bygd slik at institusjonen beholder kontrollen — over dataene, driften og muligheten til å gå sin vei med alt intakt.",
    ownership: {
      kicker: "Eierskap", title: "Du eier arkivene dine — vi er forvalteren.",
      sub: "Plattformen lagrer og styrer arkivene dine. Den eier dem aldri, gjenbruker dem aldri til andre formål, og trener aldri noe på dem.",
      cards: [
        { title: "Dataene dine er dine", body: "Hvert dokument, hver versjon, hvert artefakt og sertifikat tilhører institusjonen din — ikke plattformen." },
        { title: "Tenant-isolasjon", body: "Radnivåsikkerhet med nekt-som-standard. Et manglende tenant-krav nektes; dataene dine blandes aldri sammen." },
        { title: "Ingen sekundærbruk", body: "Ingen datautvinning, ingen profilering, ingen modelltrening, ingen forretningsmodell basert på datadeling. Aldri." },
        { title: "All tilgang revidert", body: "Innleveringer, beslutninger, publiseringer og uthentinger registreres i et tilføy-bare, hash-stemplet spor." },
      ],
    },
    continuity: {
      kicker: "Kontinuitet og exit", title: "Du kan gå når som helst — med alt.",
      sub: "Det sterkeste tillitssignalet en plattform kan gi, er en ren exit. Det finnes ingen innlåsing å konstruere seg ut av.",
      cards: [
        { title: "Ingen proprietære formater", body: "Strukturerte arkiver, standard PDF / DOCX / Markdown-artefakter, og et standard PostgreSQL-lager. Ingenting er fanget." },
        { title: "Full eksport på forespørsel", body: "Eksporter arkiver, versjoner, artefakter og styrings- + bevaringssertifikatene når du selv ønsker." },
        { title: "Flyttbar drift", body: "Den samme plattformen kjører forvaltet, i din sky, on-premise eller luftgapet — flytt hele porteføljen din uten å bytte plattform." },
        { title: "Om leverandøren forsvant", body: "Du beholder hvert arkiv, artefakt og sertifikat i åpne formater og kan kjøre eller migrere plattformen selv. Kontinuitet avhenger ikke av oss." },
      ],
    },
    accountability: {
      kicker: "Ansvarlighet", title: "En tydelig ansvarslinje.",
      sub: "Innkjøps- og risikoteam må vite nøyaktig hvem som er ansvarlig for hva. Det finnes ingen tvetydighet.",
      securesLabel: "Plattformen sikrer",
      secures: ["Tenant-isolasjon og tilgangskontroll", "Kryptering i ro og under overføring", "Integritet for tilføy-bart revisjonsspor", "Bevaringsintegritet (SHA-256-bevis)", "Håndheving av styring — motoren kan ikke omgås", "Tilgjengelighet og gjenoppretting av tjenesten"],
      controlsLabel: "Institusjonen din styrer",
      controls: ["Hvem som innehar hver styringsmyndighet", "Godkjenningskjeder, beslutningsdyktighet og retningslinjer", "Klassifisering og klarering av arkiver", "Oppbevaringshorisonter", "Hvem som innehar legitimasjon og deres omfang", "Driftsmodell og dataresidens"],
    },
    evidence: {
      kicker: "Bevis", title: "Bevisbart, ikke bare lovet.",
      sub: "Tillit ved innføring bør hvile på det som kan verifiseres under evaluering — ikke på markedsføringspåstander.",
      ctaProcurement: "Innkjøpsdossier", ctaEvidence: "Bevis og kapabiliteter",
    },
  },
  platform: {
    overview: {
      kicker: "Oversikt", title: "Informasjon blir det offisielle arkivet.",
      sub: "Dispatch er det institusjonelle laget mellom et utkast og et publisert dokument. Hvert artefakt — orientering, styrepakke, regulatorisk innsending — leveres inn som strukturerte data, styres gjennom godkjenning, gjengis til en tro PDF/DOCX, og publiseres med et permanent, reviderbart proveniens-spor.",
      cards: [
        { title: "Ikke en tekstbehandler", body: "Dokumenter er strukturerte data (DDM), validert og stilladsbygd etter type — ikke fritekstfiler. Formatet er kontrakten." },
        { title: "Styrt, ikke bare generert", body: "Innlever → Godkjenn → Gjengi → Publiser. Ingenting når arkivet uten å klarere godkjenningsretningslinjen." },
        { title: "Suveren ved konstruksjon", body: "Tenant-isolert, residensbevisst, tilføy-bart revisjonsspor. Bygd for institusjoner som ikke kan svikte." },
      ],
    },
    capabilities: {
      kicker: "Kapabiliteter", title: "Én pipeline, hvert offisielle dokument.",
      sub: "Maler og validering per dokumenttype; deterministisk, klassifiseringsbåndlagt gjengiving til trykkeklar utdata.",
      cards: [
        { title: "Dokumenttyper", body: "Lederorienteringer, styrerapporter, policydokumenter, regulatoriske innsendinger, operasjonelle pakker og offisielle arkiver — hver med sitt eget påkrevde stillas." },
        { title: "Flerformatsgjengiving", body: "Tro PDF (headless-motor), DOCX og Markdown fra én validert kilde — bannere, sidetall, vedlegg, signaturer." },
        { title: "Skjemavalidert", body: "Hver innlevering kontrolleres mot DDM-skjemaet og dokumenttype-retningslinjen før den kan gjengis — ingen feilformede arkiver." },
        { title: "Maler og stillaser", body: "Typebevisste seksjonsroller og blokkretningslinjer håndhever fullstendighet slik at utdataene er konsistente på tvers av institusjonen." },
        { title: "Versjonert og uforanderlig", body: "Hver versjon bevares; publiserte artefakter er hash-stemplet og endres aldri i det stille." },
        { title: "Asynkront i skala", body: "En kø-støttet gjengivingsbane absorberer topper og store pakker uten å blokkere innleverere." },
      ],
    },
    workflow: {
      kicker: "Arbeidsflyt", title: "Innlever → Styr → Godkjenn → Gjengi → Publiser → Hent.",
      sub: "Hele livssyklusen til et offisielt dokument, håndhevet av plattformen.",
      steps: [
        { t: "Innlever", b: "Strukturert DDM-nyttelast, validert ved inngang." },
        { t: "Styr", b: "Klassifisering + godkjenningsretningslinje avklart." },
        { t: "Godkjenn", b: "N-eyes-godkjenning; tjenestebaner godkjenner automatisk." },
        { t: "Gjengi", b: "Tro PDF/DOCX produsert i køen." },
        { t: "Publiser", b: "Frigitt til arkivet; proveniens forseglet." },
        { t: "Hent", b: "Signert, tilgangskontrollert artefakt-nedlasting." },
      ],
    },
    integrations: {
      kicker: "Integrasjoner", title: "Et API andre bygger på.",
      sub: "Dispatch klargjør omfangsbegrenset API-tilgang per konsument og tar imot dokumenter over en stabil REST-flate.",
      apiTitle: "API-klargjøring",
      apiBody: "Hvert system får sin egen tjenesteklient — en client_id + hemmelighet med eksplisitte omfang (valider · gjengi · les). Utsted, omfangsbegrens og tilbakekall per konsument.",
      estateTitle: "Bygd for porteføljen",
      estateBody: "Konsumenter leverer inn dataene sine og Dispatch returnerer det offisielle arkivet — med webhook-tilbakekall ved gjengiving og publisering.",
      estateItems: ["Veritas — operasjonelle og finansielle pakker", "ExitOS — styrenotater og transaksjonsdokumenter", "Din institusjon — over den samme REST-flaten"],
    },
  },
  standard: {
    eyebrow: "Kategoridefinisjon",
    title: "Sovereign Dispatch-standarden",
    lead: "En institusjon tar ikke i bruk et publiseringsverktøy. Den tar i bruk en standard for hvordan offisielle arkiver blir til, bevises og bevares. Dette er konseptene den standarden definerer.",
    sectionKicker: "Standarden",
    sectionTitle: "Seks institusjonelle konsepter.",
    sectionSub: "Hvert er en byggekloss i driftsstandarden for institusjonelle arkiver — ikke en funksjon, en definisjon.",
    defs: [
      { term: "Offisielt arkiv", one: "Et styrt, versjonert, klassifisert institusjonelt dokument av arkivmessig art.", def: "Ikke en fil. En offisiell handling, skapt under en håndhevet styringsretningslinje, ført gjennom en uforanderlig livssyklus — Skapt → Styrt → Godkjent → Publisert → Bevart — med en permanent, bevisbar identitet.", props: ["Stabilt arkivnummer", "Klassifisering og klarering", "Uforanderlige versjoner", "En enkelt kanonisk form"] },
      { term: "Styringsretningslinje", one: "Den kjørbare regelen for hvordan en arkivklasse styres.", def: "En navngitt, versjonert retningslinje bundet til en arkivtype: en ordnet kjede av myndigheter, beslutningsdyktighet per trinn, publiseringsmyndigheten, oppbevaring og utløp. Retningslinjen beskriver ikke arbeidsflyten — den styrer den.", props: ["Ordnet godkjenningskjede", "Beslutningsdyktighet per trinn", "Publiseringsmyndighet", "Versjonert og håndhevet"] },
      { term: "Publiseringsmyndighet", one: "Den navngitte myndigheten som er bemyndiget til å frigi et arkiv av arkivmessig art.", def: "Publisering er ikke en knapp hvem som helst kan trykke på. Den er forbeholdt en bestemt styringsrolle, validert i frigivingsøyeblikket — og en godkjenner av et arkiv kan aldri være dets utgiver.", props: ["Rollebundet", "Validert ved publisering", "Ansvarsdeling"] },
      { term: "Styringssertifikat", one: "Kryptografisk bevis på at en publisering oppfylte sin retningslinje.", def: "Forseglet ved publisering: retningslinjen og dens versjon, den påkrevde kjeden mot hvem som faktisk oppfylte den i rekkefølge, delegeringer brukt, publiseringsmyndigheten, og et integritetsbevis — en COMPLIANT-kjennelse som kan verifiseres uavhengig.", props: ["Påkrevd vs. faktisk kjede", "Ordnet godkjenningssekvens", "Integritetsbevis", "Samsvarskjennelse"] },
      { term: "Bevaringssertifikat", one: "Manipulasjonsavslørende bevis på at et arkiv er permanent forseglet.", def: "Utstedt når et arkiv arkiveres: et bevaringstidsstempel og et SHA-256-integritetsbevis over det kanoniske arkivet. Den arkiverte tilstanden er endelig — ingen redigering, tilbaketrekking eller republisering er mulig.", props: ["SHA-256-integritetsbevis", "Bevaringstidsstempel", "Endelig og uforanderlig"] },
      { term: "Beviskjede", one: "Det ubrutte, tilføy-bare sporet fra skapelse til bevaring.", def: "Hver handling — innlevering, hver beslutning, retningslinjens oppfyllelse, publisering og bevaring — registrert i et uforanderlig, hash-stemplet spor. Institusjonen kan bevise ikke bare hva et arkiv sier, men nøyaktig hvordan det ble til.", props: ["Tilføy-bart", "Hash-stemplet", "Skapelse → bevaring", "Uavhengig reviderbart"] },
    ],
    closeTitleA: "Når en kategori oppstår,",
    closeTitleB: "betyr standarden mer enn funksjonene.",
    closeBody: "Sovereign Dispatch er ikke en bedre måte å publisere dokumenter på. Det er driftsstandarden for institusjonelle arkiver — og en institusjon som tar i bruk standarden, tar i bruk en måte å styre på som overlever ethvert enkeltsystem.",
    ctaArtifacts: "Se artefaktene", ctaPath: "Finn din vei",
  },
};
