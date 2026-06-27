import type { MarketingCopy } from "./marketing";

export const MARKETING_NL: MarketingCopy = {
  trust: {
    eyebrow: "Met vertrouwen in gebruik nemen",
    titleA: "Uw archieven. Uw jurisdictie.",
    titleB: "Uw exit, gegarandeerd.",
    lead: "Kiezen voor een publicatieplatform is een soevereiniteitsbeslissing. Sovereign Dispatch is zo gebouwd dat de instelling de controle behoudt — over de gegevens, de implementatie en de mogelijkheid om met alles intact te vertrekken.",
    ownership: {
      kicker: "Eigendom", title: "U bezit uw archieven — wij zijn de beheerder.",
      sub: "Het platform bewaart en bestuurt uw archieven. Het bezit ze nooit, gebruikt ze nooit voor andere doeleinden en traint er nooit iets op.",
      cards: [
        { title: "Uw gegevens zijn van u", body: "Elk document, elke versie, elk artefact en elk certificaat behoort toe aan uw instelling — niet aan het platform." },
        { title: "Tenant-isolatie", body: "Row-level security met deny-by-default. Een ontbrekende tenant-claim weigert toegang; uw gegevens worden nooit vermengd." },
        { title: "Geen secundair gebruik", body: "Geen datamining, geen profilering, geen modeltraining, geen verdienmodel op basis van gegevensdeling. Nooit." },
        { title: "Elke toegang geregistreerd", body: "Indieningen, beslissingen, publicaties en raadplegingen worden vastgelegd in een append-only, hash-gestempeld spoor." },
      ],
    },
    continuity: {
      kicker: "Continuïteit & Exit", title: "U kunt op elk moment vertrekken — met alles.",
      sub: "Het sterkste vertrouwenssignaal dat een platform kan bieden is een schone exit. Er is geen lock-in waar u zich uit moet zien te ontworstelen.",
      cards: [
        { title: "Geen propriëtaire formaten", body: "Gestructureerde archieven, standaard PDF- / DOCX- / Markdown-artefacten en een standaard PostgreSQL-opslag. Niets zit vast." },
        { title: "Volledige export op aanvraag", body: "Exporteer archieven, versies, artefacten en de governance- en preservatiecertificaten wanneer u dat verkiest." },
        { title: "Verplaatsbare implementatie", body: "Hetzelfde platform draait beheerd, in uw cloud, on-premise of air-gapped — verplaats uw bestand zonder opnieuw te platformen." },
        { title: "Als de leverancier zou verdwijnen", body: "U behoudt elk archief, elk artefact en elk certificaat in open formaten en kunt het platform zelf draaien of migreren. Continuïteit hangt niet van ons af." },
      ],
    },
    accountability: {
      kicker: "Verantwoording", title: "Een heldere verantwoordelijkheidslijn.",
      sub: "Inkoop- en risicoteams moeten precies weten wie waarvoor verantwoordelijk is. Er is geen onduidelijkheid.",
      securesLabel: "Het platform waarborgt",
      secures: ["Tenant-isolatie en toegangscontrole", "Versleuteling in rust en tijdens transport", "Append-only audit-integriteit", "Preservatie-integriteit (SHA-256-bewijzen)", "Handhaving van governance — de engine kan niet worden omzeild", "Beschikbaarheid en herstel van de dienst"],
      controlsLabel: "Uw instelling beheert",
      controls: ["Wie elke governance-bevoegdheid bekleedt", "Goedkeuringsketens, quora en beleidsregels", "Classificatie en machtiging van archieven", "Bewaartermijnen", "Wie de inloggegevens bezit en hun bereik", "Implementatiemodel en gegevenslocatie"],
    },
    evidence: {
      kicker: "Bewijs", title: "Bewijsbaar, niet beloofd.",
      sub: "Vertrouwen in de ingebruikname moet rusten op wat tijdens de evaluatie verifieerbaar is — niet op marketingbeloften.",
      ctaProcurement: "Inkoopdossier", ctaEvidence: "Bewijs & mogelijkheden",
    },
  },
  platform: {
    overview: {
      kicker: "Overzicht", title: "Informatie wordt het officiële archiefstuk.",
      sub: "Dispatch is de institutionele laag tussen een concept en een gepubliceerd document. Elk artefact — briefing, bestuursdossier, regelgevingsdocument — wordt ingediend als gestructureerde data, bestuurd via goedkeuring, gerenderd naar een getrouwe PDF/DOCX en gepubliceerd met een permanent, controleerbaar herkomstspoor.",
      cards: [
        { title: "Geen tekstverwerker", body: "Documenten zijn gestructureerde data (DDM), gevalideerd en per type voorzien van een raamwerk — geen vrije bestanden. Het formaat is het contract." },
        { title: "Bestuurd, niet alleen gegenereerd", body: "Indienen → Goedkeuren → Renderen → Publiceren. Niets bereikt het archief zonder het goedkeuringsbeleid te doorlopen." },
        { title: "Soeverein van constructie", body: "Tenant-geïsoleerd, locatiebewust, append-only audit. Gebouwd voor instellingen die niet mogen falen." },
      ],
    },
    capabilities: {
      kicker: "Mogelijkheden", title: "Eén pijplijn, elk officieel document.",
      sub: "Templates en validatie per documenttype; deterministische, op classificatie afgestemde rendering naar druk-kwaliteit output.",
      cards: [
        { title: "Documenttypes", body: "Bestuurlijke briefings, bestuursrapporten, beleidsstukken, regelgevingsdocumenten, operationele pakketten en officiële archiefstukken — elk met zijn eigen vereiste raamwerk." },
        { title: "Multi-formaat rendering", body: "Getrouwe PDF (headless engine), DOCX en Markdown uit één gevalideerde bron — banners, paginanummers, bijlagen, handtekeningen." },
        { title: "Schema-gevalideerd", body: "Elke indiening wordt getoetst aan het DDM-schema en het documenttypebeleid voordat ze kan renderen — geen misvormde archiefstukken." },
        { title: "Templates & raamwerken", body: "Typebewuste sectierollen en blokbeleidsregels handhaven volledigheid zodat de output consistent is over de hele instelling." },
        { title: "Versiebeheerd & onveranderlijk", body: "Elke versie blijft bewaard; gepubliceerde artefacten zijn hash-gestempeld en worden nooit stilzwijgend gewijzigd." },
        { title: "Asynchroon op schaal", body: "Een wachtrij-gestuurde renderbaan vangt pieken en grote pakketten op zonder indieners te blokkeren." },
      ],
    },
    workflow: {
      kicker: "Workflow", title: "Indienen → Besturen → Goedkeuren → Renderen → Publiceren → Ophalen.",
      sub: "De volledige levenscyclus van een officieel document, gehandhaafd door het platform.",
      steps: [
        { t: "Indienen", b: "Gestructureerde DDM-payload, gevalideerd bij binnenkomst." },
        { t: "Besturen", b: "Classificatie + goedkeuringsbeleid bepaald." },
        { t: "Goedkeuren", b: "N-eyes-fiattering; servicebanen keuren automatisch goed." },
        { t: "Renderen", b: "Getrouwe PDF/DOCX geproduceerd in de wachtrij." },
        { t: "Publiceren", b: "Vrijgegeven aan het archief; herkomst verzegeld." },
        { t: "Ophalen", b: "Ondertekende, toegangsgecontroleerde artefact-download." },
      ],
    },
    integrations: {
      kicker: "Integraties", title: "Een API waarop anderen voortbouwen.",
      sub: "Dispatch voorziet per afnemer in API-toegang met afgebakend bereik en accepteert documenten via een stabiel REST-oppervlak.",
      apiTitle: "API-provisionering",
      apiBody: "Elk systeem krijgt zijn eigen serviceclient — een client_id + secret met expliciete scopes (valideren · renderen · lezen). Uitgeven, afbakenen en intrekken per afnemer.",
      estateTitle: "Gebouwd voor het bestand",
      estateBody: "Afnemers dienen hun data in en Dispatch retourneert het officiële archiefstuk — met webhook-callbacks bij rendering en publicatie.",
      estateItems: ["Veritas — operationele & financiële pakketten", "ExitOS — bestuursmemoranda & transactiedocumenten", "Uw instelling — via hetzelfde REST-oppervlak"],
    },
  },
  standard: {
    eyebrow: "Categoriedefinitie",
    title: "De Sovereign Dispatch Standaard",
    lead: "Een instelling neemt geen publicatietool in gebruik. Ze neemt een standaard in gebruik voor hoe officiële archiefstukken tot stand komen, worden bewezen en worden bewaard. Dit zijn de concepten die die standaard definieert.",
    sectionKicker: "De Standaard",
    sectionTitle: "Zes institutionele concepten.",
    sectionSub: "Elk is een bouwsteen van de operationele standaard voor institutionele archieven — geen feature, een definitie.",
    defs: [
      { term: "Officieel Archiefstuk", one: "Een bestuurd, versiebeheerd, geclassificeerd institutioneel document van record.", def: "Geen bestand. Een officiële handeling, tot stand gekomen onder een gehandhaafd governancebeleid, doorlopen via een onveranderlijke levenscyclus — Aangemaakt → Bestuurd → Goedgekeurd → Gepubliceerd → Bewaard — met een permanente, bewijsbare identiteit.", props: ["Stabiel archiefnummer", "Classificatie & machtiging", "Onveranderlijke versies", "Eén canonieke vorm"] },
      { term: "Governancebeleid", one: "De uitvoerbare regel voor hoe een klasse archiefstukken wordt bestuurd.", def: "Een benoemd, versiebeheerd beleid gekoppeld aan een archieftype: een geordende keten van bevoegdheden, quorum per stap, de publicatiebevoegdheid, bewaring en verloop. Het beleid beschrijft de workflow niet — het bestuurt die.", props: ["Geordende goedkeuringsketen", "Quorum per stap", "Publicatiebevoegdheid", "Versiebeheerd & gehandhaafd"] },
      { term: "Publicatiebevoegdheid", one: "De benoemde bevoegdheid die gemachtigd is een archiefstuk van record vrij te geven.", def: "Publicatie is geen knop die iedereen mag indrukken. Ze is voorbehouden aan een specifieke governancerol, gevalideerd op het moment van vrijgave — en een goedkeurder van een archiefstuk mag nooit de publicist ervan zijn.", props: ["Rolgebonden", "Gevalideerd bij publicatie", "Functiescheiding"] },
      { term: "Governancecertificaat", one: "Cryptografisch bewijs dat een publicatie aan haar beleid voldeed.", def: "Verzegeld bij publicatie: het beleid en zijn versie, de vereiste keten versus wie er feitelijk in volgorde aan voldeed, gebruikte delegaties, de publicatiebevoegdheid en een integriteitsbewijs — een COMPLIANT verdict dat onafhankelijk te verifiëren is.", props: ["Vereiste vs. feitelijke keten", "Geordende goedkeuringsvolgorde", "Integriteitsbewijs", "Nalevingsverdict"] },
      { term: "Preservatiecertificaat", one: "Manipulatiebestendig bewijs dat een archiefstuk permanent verzegeld is.", def: "Uitgegeven wanneer een archiefstuk wordt gearchiveerd: een preservatietijdstempel en een SHA-256-integriteitsbewijs over het canonieke archiefstuk. De gearchiveerde staat is terminaal — geen bewerking, intrekking of herpublicatie is mogelijk.", props: ["SHA-256-integriteitsbewijs", "Preservatietijdstempel", "Terminaal & onveranderlijk"] },
      { term: "Bewijsketen", one: "Het ononderbroken, append-only spoor van aanmaak tot preservatie.", def: "Elke handeling — indiening, elke beslissing, het voldoen aan het beleid, publicatie en preservatie — vastgelegd in een onveranderlijk, hash-gestempeld spoor. De instelling kan niet alleen bewijzen wat een archiefstuk zegt, maar precies hoe het tot stand kwam.", props: ["Append-only", "Hash-gestempeld", "Aanmaak → preservatie", "Onafhankelijk controleerbaar"] },
    ],
    closeTitleA: "Wanneer een categorie ontstaat,",
    closeTitleB: "doet de standaard er meer toe dan de features.",
    closeBody: "Sovereign Dispatch is geen betere manier om documenten te publiceren. Het is de operationele standaard voor institutionele archieven — en een instelling die de standaard in gebruik neemt, neemt een manier van besturen in gebruik die elk afzonderlijk systeem overleeft.",
    ctaArtifacts: "Bekijk de artefacten", ctaPath: "Vind uw pad",
  },
};
