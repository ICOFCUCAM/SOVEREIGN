// Catalogo dei testi della homepage in italiano. Traduzione completa che rispecchia
// la struttura della sorgente inglese (HOME_EN). L'inglese resta la fonte autorevole;
// questa versione fornisce la traduzione integrale della stessa forma.

import type { HomeCopy } from "./home";

export const HOME_IT: HomeCopy = {
  hero: {
    eyebrow: "Infrastruttura per la Pubblicazione Istituzionale",
    titleLead: "L'avanguardia della ",
    titleAccent: "governance istituzionale.",
    verbs: ["Creare", "Revisionare", "Approvare", "Autorizzare", "Pubblicare", "Certificare", "Verificare", "Conservare"],
    lead: "Le istituzioni non investono milioni per creare documenti. Investono milioni nelle persone, nella governance, nelle approvazioni e nell'autorità che rendono quei documenti ufficiali. Sovereign Dispatch è l'infrastruttura che unifica, governa, certifica e conserva l'intero processo.",
    ctaLaunch: "Avvia Dispatch",
    ctaArchitecture: "Esplora l'architettura",
    evalNote: "Valutalo nel tuo ambiente — senza alcun contatto commerciale.",
  },
  stakes: {
    eyebrow: "La posta in gioco",
    title: "Governare le decisioni più importanti del mondo.",
    lead: "I documenti informano. Le istituzioni governano. Le pubblicazioni ufficiali lo dimostrano.",
    badges: [
      { lead: "Flussi di lavoro governati", sub: "Conformi alle policy, dall'inizio alla fine" },
      { lead: "Registrazioni permanenti", sub: "Un ID di registrazione, mai riutilizzato" },
      { lead: "Verifica indipendente", sub: "Confermabile da chiunque, senza account" },
    ],
  },
  cost: {
    eyebrow: "Il costo nascosto",
    titleA: "Le istituzioni non investono per creare documenti.",
    titleB: "Investono per renderli",
    titleAccent: "ufficiali.",
    body: "Scrivere il documento non costa quasi nulla. L'autorità istituzionale costa tutto — le persone, le approvazioni, la prova e la conservazione che ne fanno la parola dell'istituzione.",
    cta: "Scopri il costo della pubblicazione",
    docLabel: "Un documento",
    docSub: "Redatto in un pomeriggio",
    officialLabel: "Una pubblicazione ufficiale",
    items: ["Revisione legale", "Conformità", "Approvazione dei vertici", "Pubblicazione", "Certificazione", "Conservazione"],
    stats: [{ n: "6", label: "Dipartimenti" }, { n: "8", label: "Approvazioni" }, { n: "120+", label: "Ore di lavoro" }],
    recordLabel: "1 registrazione ufficiale",
    recordValue: "dove si concentra il costo",
    illustrative: "Dati illustrativi.",
    modelLink: "Modella i dati della tua istituzione →",
  },
  result: {
    eyebrow: "Il risultato",
    title: "Una copia informa. Una registrazione ufficiale governa.",
    body: "Un documento ordinario può essere copiato, modificato o messo in dubbio. Una Registrazione Ufficiale è la versione autorevole di una decisione adottata dall'istituzione — e può sempre dimostrarlo. L'autorità istituzionale è permanente.",
    features: [
      { t: "Identità permanente", d: "Un ID di registrazione, mai riutilizzato." },
      { t: "Provenienza dimostrabile", d: "Certificati sigillati al momento della pubblicazione." },
      { t: "Verifica indipendente", d: "Confermata autentica da chiunque." },
    ],
    ctaWhat: "Che cos'è una Registrazione Ufficiale?",
    ctaVerify: "Verifica una registrazione",
    caption: "Sigillata · Certificata · Verificabile in modo permanente",
  },
  governance: {
    eyebrow: "Perché la governance conta",
    title: "Le istituzioni non conquistano la fiducia pubblicando. La conquistano governando la pubblicazione.",
    cards: [
      { t: "L'autorità va guadagnata.", d: "L'informazione non è autorità. È la governance a trasformare un documento nella posizione ufficiale dell'istituzione — revisionata, approvata e fatta propria." },
      { t: "La prova va integrata fin dall'origine.", d: "I certificati e una catena di evidenze completa nascono insieme alla registrazione — mai aggiunti in un secondo momento, mai dati per scontati." },
      { t: "La provenienza deve sopravvivere alle persone.", d: "Chi ha deciso, su quale versione, in quale ordine — conservato e dimostrabile molto tempo dopo che chi ha deciso è andato via." },
    ],
  },
  outcomes: {
    eyebrow: "Valore per l'organizzazione",
    title: "Ciò che la tua istituzione guadagna.",
    items: [
      { lead: "Un'unica piattaforma governata — non sette sistemi scollegati.", sub: "Redazione, revisione, approvazione, pubblicazione, evidenze e archivio smettono di vivere in strumenti separati." },
      { lead: "Ogni audit ha già le sue evidenze.", sub: "La prova nasce insieme alla registrazione, non viene ricostruita quando qualcuno la richiede." },
      { lead: "Ogni approvazione è già attribuibile.", sub: "Chi ha deciso, su quale versione, in quale ordine — definito nel momento stesso in cui accade." },
      { lead: "La versione sbagliata non può mai uscire.", sub: "Un'unica registrazione autorevole; le copie superate e non approvate non possono passare per ufficiali." },
      { lead: "Una memoria istituzionale che non esce dalla porta.", sub: "Provenienza e autorità sopravvivono alle persone che le hanno create." },
      { lead: "Basta pagare due volte la stessa pubblicazione.", sub: "La duplicazione delle attività tra uffici si riduce a un unico flusso governato." },
      { lead: "Governa la pubblicazione per altri — come servizio.", sub: "Diventa l'autorità che emette e verifica le registrazioni per le istituzioni che servi." },
    ],
    modelLink: "Modella il caso operativo per la tua istituzione",
  },
  industries: {
    eyebrow: "Chi lo usa",
    title: "Affidabile ogni giorno, in ogni istituzione.",
    sub: "Dispatch governa le pubblicazioni che la tua istituzione produce davvero.",
    names: ["Pubblica amministrazione", "Giustizia", "Sanità", "Università", "Imprese", "Autorità di regolamentazione"],
    types: [
      ["Decreti", "Regolamenti", "Gazzette ufficiali"],
      ["Sentenze", "Regole procedurali", "Avvisi legali"],
      ["Direttive cliniche", "Bollettini di sicurezza", "Protocolli terapeutici"],
      ["Delibere del senato accademico", "Regolamenti dei titoli di studio", "Politiche accademiche"],
      ["Delibere del consiglio", "Politiche di conformità", "Governance aziendale"],
      ["Licenze", "Provvedimenti sanzionatori", "Avvisi pubblici"],
    ],
    forLabel: "Dispatch per",
    viewAll: "Vedi tutti i settori",
  },
  quote: { text: "La prova di un'istituzione non è ciò che dichiara — ma se, anni dopo, può dimostrare di averlo dichiarato." },
  security: {
    eyebrow: "Architettura sovrana",
    title: "Sovrana fin dalla progettazione. Verificabile per impostazione predefinita.",
    sub: "Costruita per le istituzioni le cui informazioni non possono trapelare, non possono andare perse e non possono essere ripudiate.",
    labels: ["Sigillatura crittografica", "Evidenze di audit immutabili", "Controlli di residenza dei dati", "Isolamento dei tenant", "Verifica indipendente", "Conservazione a lungo termine"],
  },
  proof: {
    eyebrow: "Prova e procurement",
    title: "Costruita per essere creduta — non accettata sulla fiducia.",
    statLabels: ["Fasi governate", "Certificati permanenti", "Pubblicazione autorevole", "Verifiche indipendenti"],
    columns: [
      { title: "Prova tecnica", items: ["Sigillatura SHA-256", "Architettura append-only", "Catena di audit immutabile", "Integrità a prova di manomissione"] },
      { title: "Prova di governance", items: ["Ogni azione attribuibile", "Ogni approvazione registrata", "Ogni versione conservata", "Separazione dei compiti applicata"] },
      { title: "Prova operativa", items: ["Un'unica pipeline governata", "Provenienza end-to-end", "Conservazione permanente", "Verifica illimitata"] },
    ],
    links: ["Architettura", "Sicurezza", "Conformità", "Evidenze", "API", "Trust Center", "Centro Procurement"],
  },
  evaluate: {
    title: "Dimostralo con i tuoi documenti.",
    body: "Nessun contatto commerciale. Nessuna barriera. Fai passare un documento reale attraverso la pipeline governata — oppure porta i materiali di procurement nel tuo processo.",
    ctaBegin: "Avvia la tua valutazione",
    ctaProcurement: "Centro Procurement",
    tagline: "Sovrana fin dalla progettazione · Verificabile per impostazione predefinita · Pronta per le istituzioni",
  },
};
