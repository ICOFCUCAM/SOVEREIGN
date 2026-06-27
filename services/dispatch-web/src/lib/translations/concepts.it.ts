// Traduzioni italiane autentiche delle pagine concettuali (Layer 3). Una versione per lingua —
// nessuna traduzione automatica a runtime. Solo gli slug qui presenti vengono pubblicati sotto
// /it/learn/<slug>; tutto il resto resta in inglese fino alla traduzione, affinché hreflang
// rimanga veritiero. La struttura comune (diagramma, link correlati) deriva dalla base inglese
// in problems.ts; questi sono i campi testuali localizzati.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_IT: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Pubblicazione ufficiale",
    kicker: "Concetto",
    headline: "Che cos'è una pubblicazione ufficiale — e che cosa la rende ufficiale.",
    lead: "Chiunque può pubblicare un documento. Una pubblicazione ufficiale è diversa: è emessa sotto l'autorità di un'istituzione e se ne può dimostrare l'autenticità per tutto il tempo in cui conta.",
    definition: "Una pubblicazione ufficiale è un documento emesso sotto l'autorità di un'istituzione — non di una persona — attraverso un processo di approvazione governato, e reso verificabile in modo permanente, così che chiunque possa confermare che si tratta della versione autentica e vigente.",
    why: [
      "Un PDF inviato per e-mail all'interno di un'organizzazione appare identico, sia che si tratti della versione finale approvata sia di una bozza iniziale. Nulla nel file dimostra quale delle due sia.",
      "Quando una pubblicazione viene contestata anni dopo — in tribunale, in sede di audit, da parte del pubblico — l'istituzione deve poter dimostrare chi l'ha approvata, in quale ordine e che il file non è stato modificato da allora.",
      "La maggior parte delle istituzioni non è in grado di dimostrarlo: l'approvazione viveva nelle e-mail e nelle riunioni, e il file pubblicato è solo una copia priva di un legame duraturo con l'autorità che l'ha emesso.",
    ],
    how: [
      { t: "Emessa da un ufficio, non da una persona", d: "Sovereign Dispatch vincola ogni pubblicazione all'autorità di un ufficio: resta valida anche quando la persona che l'ha firmata non è più in carica." },
      { t: "Governata prima della pubblicazione", d: "Prima del rilascio del documento si applica una catena di approvazione vincolante: la versione ufficiale è quella che ha completato la governance, e nessun'altra può spacciarsi per ufficiale." },
      { t: "Verificabile in modo permanente", d: "Ogni pubblicazione reca un Record ID permanente e una prova di integrità, così chiunque può confermare che è autentica e inalterata — senza alcun account." },
    ],
    faqs: [
      { q: "Qual è la differenza tra un documento e una pubblicazione ufficiale?", a: "Un documento è solo un file. Una pubblicazione ufficiale è emessa sotto l'autorità di un'istituzione attraverso un processo governato ed è verificabile in modo permanente: si può dimostrare chi l'ha emessa e che non è stata modificata." },
      { q: "Come si dimostra che una pubblicazione è ufficiale?", a: "Verificandone il Record ID permanente e la prova di integrità rispetto al registro dell'istituzione emittente. Sovereign Dispatch consente a chiunque di farlo senza un account." },
      { q: "Una firma o una carta intestata rendono ufficiale una pubblicazione?", a: "No. Una firma o una carta intestata possono essere copiate. È l'autorità vincolata a un ufficio, unita a una prova di integrità verificabile, a rendere una pubblicazione dimostrabilmente ufficiale." },
    ],
    metaTitle: "Cos'è una pubblicazione ufficiale? Definizione e prova",
    metaDescription: "Una pubblicazione ufficiale è un documento emesso sotto l'autorità di un'istituzione tramite un processo governato e reso verificabile in modo permanente. Scopri cosa la rende ufficiale.",
  },
  "evidence-chain": {
    term: "Catena delle prove",
    kicker: "Integrità",
    headline: "Una catena delle prove che esiste prima che qualcuno la richieda.",
    lead: "Una catena delle prove è il registro ininterrotto di come un documento è stato approvato ed emesso — acquisito mentre accade, così da potervi fare affidamento nel momento decisivo.",
    definition: "Una catena delle prove è un registro completo, ordinato e a prova di manomissione di ogni fase dell'approvazione e della pubblicazione di un documento — chi ha agito, quando e su quale versione — acquisito mentre il documento viene prodotto, anziché ricostruito a posteriori.",
    why: [
      "Quando una pubblicazione viene messa in dubbio, il valore della prova dipende interamente da quando è stata creata. Le prove raccolte dopo la contestazione sono deboli e impugnabili.",
      "La maggior parte delle organizzazioni costruisce il registro solo quando un revisore o un giudice lo esige — raccogliendo e-mail, approvazioni e versioni sotto pressione temporale, con lacune.",
      "Una catena delle prove registrata in modo continuo, in ordine e sigillata contro le modifiche è la differenza tra dimostrare l'autorità e limitarsi ad affermarla.",
    ],
    how: [
      { t: "Acquisita mentre accade", d: "Ogni fase di approvazione viene registrata nel momento in cui avviene, in ordine — mai ricostruita in seguito." },
      { t: "A prova di manomissione", d: "La catena è sigillata con prove di integrità: qualsiasi modifica successiva è rilevabile; il registro o si verifica come integro o non si verifica affatto." },
      { t: "Pronta su richiesta", d: "Poiché la catena esiste già, rispondere a un audit o a una contestazione legale è un recupero, non una ricostruzione." },
    ],
    faqs: [
      { q: "Che cos'è una catena delle prove?", a: "Un registro completo, ordinato e a prova di manomissione di come un documento è stato approvato ed emesso — chi ha agito, quando e su quale versione — acquisito mentre accadeva." },
      { q: "Perché il momento in cui si crea la prova è importante?", a: "Una prova creata mentre gli eventi accadono è molto più solida di una raccolta dopo una contestazione, che è soggetta a lacune e a controversie." },
      { q: "Come si mantiene a prova di manomissione una catena delle prove?", a: "Sigillando ogni fase con prove di integrità crittografiche, così che qualsiasi alterazione successiva sia rilevabile in fase di verifica." },
    ],
    metaTitle: "Cos'è una catena delle prove? Definizione e tempistica",
    metaDescription: "Una catena delle prove è il registro completo, ordinato e a prova di manomissione dell'approvazione e dell'emissione di un documento, acquisito nel momento. Perché la tempistica conta.",
  },
  "document-authenticity": {
    term: "Autenticità del documento",
    kicker: "Integrità",
    headline: "Un'autenticità del documento che si dimostra, non si afferma soltanto.",
    lead: "L'autenticità del documento è la proprietà di essere dimostrabilmente genuino — il documento reale, emesso da chi dichiara, immutato da allora. La maggior parte dei documenti si limita ad affermarla.",
    definition: "L'autenticità del documento è la proprietà verificabile che un documento sia genuino: emesso dall'autorità dichiarata e inalterato dalla pubblicazione, dimostrabile da chiunque anziché meramente affermato dall'apparenza.",
    why: [
      "Carte intestate, firme e sigilli possono tutti essere copiati. L'apparenza non è una prova: una contraffazione convincente appare esattamente come l'originale.",
      "Quando l'autenticità di un documento conta di più — un certificato, una licenza, una decisione — il destinatario spesso non ha alcun modo indipendente di confermare che sia genuino.",
      "Un'autenticità che dipende dal chiamare l'emittente per verificare non è scalabile e viene meno proprio quando l'emittente è più difficile da raggiungere.",
    ],
    how: [
      { t: "Vincolata all'ufficio emittente", d: "Ogni pubblicazione è emessa sotto un'autorità denominata: la sua origine fa parte del registro e non è un'inferenza tratta da una carta intestata." },
      { t: "Prova di integrità per documento", d: "Una prova crittografica lega il file esatto al suo record; l'alterazione di un solo byte invalida la verifica." },
      { t: "Verificabile da chiunque", d: "Un Record ID permanente consente a ogni destinatario di confermare l'autenticità in modo indipendente — senza account e senza chiamare l'emittente." },
    ],
    faqs: [
      { q: "Che cos'è l'autenticità del documento?", a: "La proprietà verificabile che un documento sia genuino — emesso dall'autorità dichiarata e inalterato dalla pubblicazione — dimostrabile da chiunque, non solo affermata." },
      { q: "Perché una firma o un sigillo non bastano?", a: "Firme e sigilli possono essere copiati. L'autenticità reale richiede una prova di integrità verificabile, vincolata all'autorità emittente." },
      { q: "Come posso verificare che un documento sia autentico?", a: "Verificandone il Record ID permanente e la prova di integrità rispetto al registro dell'emittente. Sovereign Dispatch consente a chiunque di farlo senza un account." },
    ],
    metaTitle: "Autenticità del documento — dimostrare che è genuino",
    metaDescription: "L'autenticità del documento è la proprietà verificabile di essere genuino e inalterato. Perché firme e sigilli non bastano e come dimostrarla.",
  },
  "document-verification": {
    term: "Verifica del documento",
    kicker: "Verifica",
    headline: "Una verifica del documento che chiunque può eseguire, senza account.",
    lead: "La verifica del documento consiste nel confermare che un documento sia genuino e inalterato. La migliore verifica non richiede alcun accesso speciale — chiunque può eseguirla.",
    definition: "La verifica del documento è il processo di conferma che un documento sia genuino e inalterato — idealmente confrontando un identificativo permanente e una prova di integrità con il registro dell'emittente, in modo indipendente e senza accesso privilegiato.",
    why: [
      "Una verifica che richiede di chiamare l'emittente o di accedere a un portale viene meno per chi ne ha più bisogno — destinatari, pubblico, altre istituzioni.",
      "Se la verifica è difficile, non avviene, e le contraffazioni circolano senza essere contestate.",
      "La fiducia diventa scalabile solo quando chiunque possieda un documento può confermarlo da sé, in pochi secondi, rispetto alla fonte di verità.",
    ],
    how: [
      { t: "Record ID permanente", d: "Ogni pubblicazione reca un identificativo che rimanda al suo record autoritativo presso l'istituzione emittente." },
      { t: "Controllo di integrità del file esatto", d: "La verifica conferma che il file specifico corrisponda byte per byte alla versione emessa; qualsiasi modifica viene rilevata." },
      { t: "Aperta a tutti", d: "Chiunque può verificare un record senza account: la fiducia non dipende dall'accesso privilegiato." },
    ],
    faqs: [
      { q: "Che cos'è la verifica del documento?", a: "Confermare che un documento sia genuino e inalterato, idealmente confrontando un identificativo permanente e una prova di integrità con il registro dell'emittente." },
      { q: "Mi serve un account per verificare un documento?", a: "Con Sovereign Dispatch, no. La verifica è aperta a tutti, così la fiducia non dipende dall'accesso privilegiato." },
      { q: "Che cosa controlla davvero la verifica?", a: "Che il documento corrisponda a un record realmente emesso e che il file esatto sia inalterato dalla pubblicazione." },
    ],
    metaTitle: "Verifica del documento — confermare l'autenticità, senza account",
    metaDescription: "La verifica del documento conferma che un documento sia genuino e inalterato, tramite un Record ID permanente e una prova di integrità — in modo indipendente, senza account.",
  },
};
