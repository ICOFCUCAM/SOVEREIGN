import type { MarketingCopy } from "./marketing";

export const MARKETING_IT: MarketingCopy = {
  trust: {
    eyebrow: "Adotta con fiducia",
    titleA: "I tuoi atti. La tua giurisdizione.",
    titleB: "La tua uscita, garantita.",
    lead: "Impegnarsi su una piattaforma di pubblicazione è una decisione di sovranità. Sovereign Dispatch è costruita affinché l'istituzione mantenga il controllo: dei dati, del deployment e della capacità di andarsene portando con sé tutto, intatto.",
    ownership: {
      kicker: "Proprietà", title: "I tuoi atti sono tuoi: noi siamo il custode.",
      sub: "La piattaforma conserva e governa i tuoi atti. Non ne è mai proprietaria, non li riutilizza per altri scopi e non addestra nulla su di essi.",
      cards: [
        { title: "I tuoi dati sono tuoi", body: "Ogni documento, versione, artefatto e certificato appartiene alla tua istituzione, non alla piattaforma." },
        { title: "Isolamento dei tenant", body: "Sicurezza a livello di riga con negazione predefinita. Una rivendicazione di tenant mancante nega l'accesso; i tuoi dati non vengono mai mescolati." },
        { title: "Nessun uso secondario", body: "Nessun data mining, nessuna profilazione, nessun addestramento di modelli, nessun modello di business basato sulla condivisione dei dati. Mai." },
        { title: "Ogni accesso tracciato", body: "Invii, decisioni, pubblicazioni e recuperi sono registrati in un tracciato a sola aggiunta, marcato con hash." },
      ],
    },
    continuity: {
      kicker: "Continuità e uscita", title: "Puoi andartene in qualsiasi momento, portando con te tutto.",
      sub: "Il segnale di fiducia più forte che una piattaforma possa offrire è un'uscita pulita. Non esiste alcun lock-in da cui ingegnarti per uscire.",
      cards: [
        { title: "Nessun formato proprietario", body: "Atti strutturati, artefatti standard PDF / DOCX / Markdown e un archivio PostgreSQL standard. Nulla resta intrappolato." },
        { title: "Export completo su richiesta", body: "Esporta atti, versioni, artefatti e i certificati di governance e preservazione ogni volta che lo desideri." },
        { title: "Deployment rilocabile", body: "La stessa piattaforma gira gestita, nel tuo cloud, on-premise o in ambiente air-gapped: sposta il tuo patrimonio senza dover ricostruire la piattaforma." },
        { title: "Se il fornitore sparisse", body: "Conservi ogni atto, artefatto e certificato in formati aperti e puoi eseguire o migrare la piattaforma da solo. La continuità non dipende da noi." },
      ],
    },
    accountability: {
      kicker: "Responsabilità", title: "Una chiara linea di responsabilità.",
      sub: "I team di approvvigionamento e di rischio devono sapere con esattezza chi è responsabile di cosa. Non c'è alcuna ambiguità.",
      securesLabel: "La piattaforma garantisce",
      secures: ["Isolamento dei tenant e controllo degli accessi", "Crittografia a riposo e in transito", "Integrità del tracciato a sola aggiunta", "Integrità della preservazione (prove SHA-256)", "Applicazione della governance: il motore non può essere aggirato", "Disponibilità e ripristino del servizio"],
      controlsLabel: "La tua istituzione controlla",
      controls: ["Chi detiene ciascuna autorità di governance", "Catene di approvazione, quorum e politiche", "Classificazione e nulla osta degli atti", "Orizzonti di conservazione", "Chi detiene le credenziali e i relativi ambiti", "Modello di deployment e residenza dei dati"],
    },
    evidence: {
      kicker: "Evidenza", title: "Dimostrabile, non promesso.",
      sub: "La fiducia nell'adozione dovrebbe poggiare su ciò che può essere verificato durante la valutazione, non su affermazioni di marketing.",
      ctaProcurement: "Dossier di approvvigionamento", ctaEvidence: "Evidenza e capacità",
    },
  },
  platform: {
    overview: {
      kicker: "Panoramica", title: "L'informazione diventa l'atto ufficiale.",
      sub: "Dispatch è lo strato istituzionale tra una bozza e un documento pubblicato. Ogni artefatto (briefing, dossier per il consiglio, deposito normativo) viene inviato come dato strutturato, governato tramite approvazione, reso in un PDF/DOCX fedele e pubblicato con un tracciato di provenienza permanente e verificabile.",
      cards: [
        { title: "Non un elaboratore di testi", body: "I documenti sono dati strutturati (DDM), validati e impalcati per tipo, non file in forma libera. Il formato è il contratto." },
        { title: "Governato, non solo generato", body: "Invia → Approva → Rendi → Pubblica. Nulla raggiunge l'atto senza superare la propria politica di approvazione." },
        { title: "Sovrano per costruzione", body: "Tenant isolati, consapevolezza della residenza, audit a sola aggiunta. Costruito per istituzioni che non possono fallire." },
      ],
    },
    capabilities: {
      kicker: "Capacità", title: "Un'unica pipeline, ogni documento ufficiale.",
      sub: "Modelli e validazione per ciascun tipo di documento; rendering deterministico, fasciato per classificazione, a output di qualità di stampa.",
      cards: [
        { title: "Tipi di documento", body: "Briefing esecutivi, relazioni per il consiglio, documenti di policy, depositi normativi, pacchetti operativi e atti ufficiali: ciascuno con la propria impalcatura richiesta." },
        { title: "Rendering multi-formato", body: "PDF fedele (motore headless), DOCX e Markdown da un'unica fonte validata: banner, numeri di pagina, appendici, firme." },
        { title: "Validato dallo schema", body: "Ogni invio è verificato rispetto allo schema DDM e alla politica del tipo di documento prima di poter essere reso: nessun atto malformato." },
        { title: "Modelli e impalcature", body: "Ruoli di sezione e politiche di blocco consapevoli del tipo impongono la completezza, così l'output è coerente in tutta l'istituzione." },
        { title: "Versionato e immutabile", body: "Ogni versione è preservata; gli artefatti pubblicati sono marcati con hash e mai alterati di nascosto." },
        { title: "Asincrono su scala", body: "Una corsia di rendering supportata da coda assorbe picchi e pacchetti di grandi dimensioni senza bloccare chi invia." },
      ],
    },
    workflow: {
      kicker: "Flusso di lavoro", title: "Invia → Governa → Approva → Rendi → Pubblica → Recupera.",
      sub: "L'intero ciclo di vita di un documento ufficiale, imposto dalla piattaforma.",
      steps: [
        { t: "Invia", b: "Payload DDM strutturato, validato all'ingresso." },
        { t: "Governa", b: "Classificazione e politica di approvazione risolte." },
        { t: "Approva", b: "Firma N-eyes; le corsie di servizio approvano in automatico." },
        { t: "Rendi", b: "PDF/DOCX fedele prodotto nella coda." },
        { t: "Pubblica", b: "Rilasciato all'atto; provenienza sigillata." },
        { t: "Recupera", b: "Download dell'artefatto firmato e ad accesso controllato." },
      ],
    },
    integrations: {
      kicker: "Integrazioni", title: "Un'API su cui altri costruiscono.",
      sub: "Dispatch predispone accesso API con ambiti per ciascun consumatore e accetta documenti su una superficie REST stabile.",
      apiTitle: "Predisposizione dell'API",
      apiBody: "Ogni sistema ottiene il proprio service client: un client_id più segreto con ambiti espliciti (validate · render · read). Emetti, delimita e revoca per ciascun consumatore.",
      estateTitle: "Costruito per il patrimonio",
      estateBody: "I consumatori inviano i loro dati e Dispatch restituisce l'atto ufficiale, con callback webhook su rendering e pubblicazione.",
      estateItems: ["Veritas — pacchetti operativi e finanziari", "ExitOS — memorandum per il consiglio e documenti di transazione", "La tua istituzione — sulla stessa superficie REST"],
    },
  },
  standard: {
    eyebrow: "Definizione di categoria",
    title: "Lo Standard Sovereign Dispatch",
    lead: "Un'istituzione non adotta uno strumento di pubblicazione. Adotta uno standard su come gli atti ufficiali vengono a esistere, sono provati e sono preservati. Questi sono i concetti che quello standard definisce.",
    sectionKicker: "Lo Standard",
    sectionTitle: "Sei concetti istituzionali.",
    sectionSub: "Ciascuno è un mattone dello standard operativo per gli atti istituzionali: non una funzionalità, una definizione.",
    defs: [
      { term: "Atto ufficiale", one: "Un documento istituzionale di registro, governato, versionato e classificato.", def: "Non un file. Un atto ufficiale, creato sotto una politica di governance imposta, condotto attraverso un ciclo di vita immutabile — Creato → Governato → Approvato → Pubblicato → Preservato — con un'identità permanente e dimostrabile.", props: ["Numero di registro stabile", "Classificazione e nulla osta", "Versioni immutabili", "Un'unica forma canonica"] },
      { term: "Politica di governance", one: "La regola eseguibile su come una classe di atti è governata.", def: "Una politica nominata e versionata, vincolata a un tipo di atto: una catena ordinata di autorità, quorum per ciascuna fase, l'autorità di pubblicazione, conservazione e scadenza. La politica non descrive il flusso di lavoro: lo controlla.", props: ["Catena di approvazione ordinata", "Quorum per fase", "Autorità di pubblicazione", "Versionata e imposta"] },
      { term: "Autorità di pubblicazione", one: "L'autorità nominata abilitata a rilasciare un atto di registro.", def: "La pubblicazione non è un pulsante che chiunque possa premere. È riservata a uno specifico ruolo di governance, validata nel momento del rilascio, e chi approva un atto non può mai esserne il pubblicatore.", props: ["Vincolata al ruolo", "Validata alla pubblicazione", "Separazione dei compiti"] },
      { term: "Certificato di governance", one: "Prova crittografica che una pubblicazione ha soddisfatto la propria politica.", def: "Sigillato alla pubblicazione: la politica e la sua versione, la catena richiesta rispetto a chi l'ha effettivamente soddisfatta in ordine, le deleghe usate, l'autorità di pubblicazione e una prova di integrità: un verdetto COMPLIANT verificabile in modo indipendente.", props: ["Catena richiesta vs. effettiva", "Sequenza di approvazione ordinata", "Prova di integrità", "Verdetto di conformità"] },
      { term: "Certificato di preservazione", one: "Prova a prova di manomissione che un atto è sigillato in modo permanente.", def: "Emesso quando un atto viene archiviato: una marca temporale di preservazione e una prova di integrità SHA-256 sull'atto canonico. Lo stato archiviato è terminale: nessuna modifica, ritiro o ripubblicazione è possibile.", props: ["Prova di integrità SHA-256", "Marca temporale di preservazione", "Terminale e immutabile"] },
      { term: "Catena di evidenza", one: "Il tracciato ininterrotto, a sola aggiunta, dalla creazione alla preservazione.", def: "Ogni atto — invio, ciascuna decisione, il soddisfacimento della politica, pubblicazione e preservazione — registrato in un tracciato immutabile, marcato con hash. L'istituzione può provare non solo cosa dice un atto, ma esattamente come è venuto a esistere.", props: ["A sola aggiunta", "Marcato con hash", "Creazione → preservazione", "Verificabile in modo indipendente"] },
    ],
    closeTitleA: "Quando emerge una categoria,",
    closeTitleB: "lo standard conta più delle funzionalità.",
    closeBody: "Sovereign Dispatch non è un modo migliore di pubblicare documenti. È lo standard operativo per gli atti istituzionali, e un'istituzione che adotta lo standard adotta un modo di governare che sopravvive a qualsiasi singolo sistema.",
    ctaArtifacts: "Vedi gli artefatti", ctaPath: "Trova il tuo percorso",
  },
};
