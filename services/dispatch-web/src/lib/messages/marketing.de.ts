import type { MarketingCopy } from "./marketing";

export const MARKETING_DE: MarketingCopy = {
  trust: {
    eyebrow: "Mit Vertrauen einführen",
    titleA: "Ihre Aufzeichnungen. Ihre Jurisdiktion.",
    titleB: "Ihr Ausstieg, garantiert.",
    lead: "Die Festlegung auf eine Publikationsplattform ist eine Souveränitätsentscheidung. Sovereign Dispatch ist so gebaut, dass die Institution die Kontrolle behält — über die Daten, die Bereitstellung und die Fähigkeit, mit allem unversehrt davonzugehen.",
    ownership: {
      kicker: "Eigentum", title: "Ihre Aufzeichnungen gehören Ihnen — wir sind der Verwahrer.",
      sub: "Die Plattform speichert und verwaltet Ihre Aufzeichnungen. Sie besitzt sie nie, verwendet sie nie zweckentfremdet und trainiert nichts an ihnen.",
      cards: [
        { title: "Ihre Daten gehören Ihnen", body: "Jedes Dokument, jede Version, jedes Artefakt und jedes Zertifikat gehört Ihrer Institution — nicht der Plattform." },
        { title: "Mandantentrennung", body: "Zeilenbasierte Sicherheit mit Verweigerung als Standard. Ein fehlender Mandanten-Anspruch wird verweigert; Ihre Daten werden nie vermischt." },
        { title: "Keine Zweitnutzung", body: "Kein Mining, kein Profiling, kein Modelltraining, kein Geschäftsmodell auf Basis von Datenweitergabe. Niemals." },
        { title: "Jeder Zugriff geprüft", body: "Einreichungen, Entscheidungen, Veröffentlichungen und Abrufe werden in einem rein anfügenden, hash-gestempelten Protokoll erfasst." },
      ],
    },
    continuity: {
      kicker: "Kontinuität & Ausstieg", title: "Sie können jederzeit gehen — mit allem.",
      sub: "Das stärkste Vertrauenssignal, das eine Plattform bieten kann, ist ein sauberer Ausstieg. Es gibt keine Bindung, aus der Sie sich technisch befreien müssten.",
      cards: [
        { title: "Keine proprietären Formate", body: "Strukturierte Aufzeichnungen, standardisierte PDF- / DOCX- / Markdown-Artefakte und ein standardmäßiger PostgreSQL-Speicher. Nichts ist eingeschlossen." },
        { title: "Vollständiger Export auf Abruf", body: "Exportieren Sie Aufzeichnungen, Versionen, Artefakte sowie die Governance- und Aufbewahrungszertifikate, wann immer Sie möchten." },
        { title: "Verlagerbare Bereitstellung", body: "Dieselbe Plattform läuft verwaltet, in Ihrer Cloud, vor Ort oder air-gapped — verlagern Sie Ihren Bestand ohne erneute Plattformmigration." },
        { title: "Falls der Anbieter verschwände", body: "Sie behalten jede Aufzeichnung, jedes Artefakt und jedes Zertifikat in offenen Formaten und können die Plattform selbst betreiben oder migrieren. Kontinuität hängt nicht von uns ab." },
      ],
    },
    accountability: {
      kicker: "Verantwortlichkeit", title: "Eine klare Verantwortungslinie.",
      sub: "Beschaffungs- und Risikoteams müssen genau wissen, wer wofür verantwortlich ist. Es gibt keine Mehrdeutigkeit.",
      securesLabel: "Die Plattform sichert",
      secures: ["Mandantentrennung und Zugriffskontrolle", "Verschlüsselung im Ruhezustand und bei der Übertragung", "Integrität des rein anfügenden Audits", "Aufbewahrungsintegrität (SHA-256-Nachweise)", "Durchsetzung der Governance — die Engine kann nicht umgangen werden", "Verfügbarkeit und Wiederherstellung des Dienstes"],
      controlsLabel: "Ihre Institution steuert",
      controls: ["Wer welche Governance-Autorität innehat", "Genehmigungsketten, Quoren und Richtlinien", "Klassifizierung und Freigabe von Aufzeichnungen", "Aufbewahrungshorizonte", "Wer Anmeldedaten besitzt und deren Geltungsbereiche", "Bereitstellungsmodell und Datenresidenz"],
    },
    evidence: {
      kicker: "Nachweis", title: "Beweisbar, nicht versprochen.",
      sub: "Das Vertrauen in die Einführung sollte auf dem beruhen, was während der Evaluierung überprüfbar ist — nicht auf Marketingaussagen.",
      ctaProcurement: "Beschaffungsdossier", ctaEvidence: "Nachweise & Fähigkeiten",
    },
  },
  platform: {
    overview: {
      kicker: "Überblick", title: "Information wird zur offiziellen Aufzeichnung.",
      sub: "Dispatch ist die institutionelle Ebene zwischen einem Entwurf und einem veröffentlichten Dokument. Jedes Artefakt — Briefing, Vorstandsunterlage, regulatorische Einreichung — wird als strukturierte Daten eingereicht, per Genehmigung verwaltet, als originalgetreues PDF/DOCX gerendert und mit einem dauerhaften, prüfbaren Provenienzprotokoll veröffentlicht.",
      cards: [
        { title: "Kein Textverarbeitungsprogramm", body: "Dokumente sind strukturierte Daten (DDM), nach Typ validiert und gerüstet — keine freien Dateien. Das Format ist der Vertrag." },
        { title: "Verwaltet, nicht nur erzeugt", body: "Einreichen → Genehmigen → Rendern → Veröffentlichen. Nichts erreicht die Aufzeichnung, ohne seine Genehmigungsrichtlinie zu durchlaufen." },
        { title: "Souverän durch Konstruktion", body: "Mandantengetrennt, residenzbewusst, rein anfügendes Audit. Gebaut für Institutionen, die nicht scheitern dürfen." },
      ],
    },
    capabilities: {
      kicker: "Fähigkeiten", title: "Eine Pipeline, jedes offizielle Dokument.",
      sub: "Vorlagen und Validierung pro Dokumenttyp; deterministisches, klassifizierungsgestaffeltes Rendern zu druckreifer Ausgabe.",
      cards: [
        { title: "Dokumenttypen", body: "Führungsbriefings, Vorstandsberichte, Grundsatzpapiere, regulatorische Einreichungen, operative Pakete und offizielle Aufzeichnungen — jeweils mit eigenem erforderlichem Gerüst." },
        { title: "Mehrformat-Rendering", body: "Originalgetreues PDF (Headless-Engine), DOCX und Markdown aus einer einzigen validierten Quelle — Banner, Seitenzahlen, Anhänge, Signaturen." },
        { title: "Schema-validiert", body: "Jede Einreichung wird gegen das DDM-Schema und die Dokumenttyp-Richtlinie geprüft, bevor sie gerendert werden kann — keine fehlerhaften Aufzeichnungen." },
        { title: "Vorlagen & Gerüste", body: "Typbewusste Abschnittsrollen und Blockrichtlinien erzwingen Vollständigkeit, sodass die Ausgabe institutionsweit konsistent ist." },
        { title: "Versioniert & unveränderlich", body: "Jede Version wird bewahrt; veröffentlichte Artefakte sind hash-gestempelt und werden nie stillschweigend verändert." },
        { title: "Asynchron im großen Maßstab", body: "Eine warteschlangengestützte Render-Spur fängt Lastspitzen und große Pakete ab, ohne Einreicher zu blockieren." },
      ],
    },
    workflow: {
      kicker: "Arbeitsablauf", title: "Einreichen → Verwalten → Genehmigen → Rendern → Veröffentlichen → Abrufen.",
      sub: "Der vollständige Lebenszyklus eines offiziellen Dokuments, durchgesetzt von der Plattform.",
      steps: [
        { t: "Einreichen", b: "Strukturierte DDM-Nutzlast, beim Eingang validiert." },
        { t: "Verwalten", b: "Klassifizierung + Genehmigungsrichtlinie aufgelöst." },
        { t: "Genehmigen", b: "N-eyes-Freigabe; Dienst-Spuren genehmigen automatisch." },
        { t: "Rendern", b: "Originalgetreues PDF/DOCX in der Warteschlange erzeugt." },
        { t: "Veröffentlichen", b: "Für die Aufzeichnung freigegeben; Provenienz versiegelt." },
        { t: "Abrufen", b: "Signierter, zugriffskontrollierter Artefakt-Download." },
      ],
    },
    integrations: {
      kicker: "Integrationen", title: "Eine API, auf der andere aufbauen.",
      sub: "Dispatch stellt pro Verbraucher abgegrenzten API-Zugriff bereit und nimmt Dokumente über eine stabile REST-Oberfläche entgegen.",
      apiTitle: "API-Bereitstellung",
      apiBody: "Jedes System erhält seinen eigenen Service-Client — eine client_id + Geheimnis mit expliziten Geltungsbereichen (validieren · rendern · lesen). Pro Verbraucher ausstellen, abgrenzen und widerrufen.",
      estateTitle: "Für den Bestand gebaut",
      estateBody: "Verbraucher reichen ihre Daten ein und Dispatch liefert die offizielle Aufzeichnung zurück — mit Webhook-Rückrufen bei Rendern und Veröffentlichen.",
      estateItems: ["Veritas — operative & finanzielle Pakete", "ExitOS — Vorstandsmemoranden & Transaktionsdokumente", "Ihre Institution — über dieselbe REST-Oberfläche"],
    },
  },
  standard: {
    eyebrow: "Kategoriedefinition",
    title: "Der Sovereign Dispatch Standard",
    lead: "Eine Institution führt kein Publikationswerkzeug ein. Sie führt einen Standard dafür ein, wie offizielle Aufzeichnungen entstehen, bewiesen und bewahrt werden. Dies sind die Konzepte, die dieser Standard definiert.",
    sectionKicker: "Der Standard",
    sectionTitle: "Sechs institutionelle Konzepte.",
    sectionSub: "Jedes ist ein Baustein des Betriebsstandards für institutionelle Aufzeichnungen — kein Feature, eine Definition.",
    defs: [
      { term: "Offizielle Aufzeichnung", one: "Ein verwaltetes, versioniertes, klassifiziertes institutionelles Dokument von Rang.", def: "Keine Datei. Ein offizieller Akt, erstellt unter einer durchgesetzten Governance-Richtlinie, geführt durch einen unveränderlichen Lebenszyklus — Erstellt → Verwaltet → Genehmigt → Veröffentlicht → Bewahrt — mit einer dauerhaften, beweisbaren Identität.", props: ["Stabile Aufzeichnungsnummer", "Klassifizierung & Freigabe", "Unveränderliche Versionen", "Eine einzige kanonische Form"] },
      { term: "Governance-Richtlinie", one: "Die ausführbare Regel dafür, wie eine Klasse von Aufzeichnungen verwaltet wird.", def: "Eine benannte, versionierte Richtlinie, gebunden an einen Aufzeichnungstyp: eine geordnete Kette von Autoritäten, ein Quorum pro Schritt, die Veröffentlichungsautorität, Aufbewahrung und Ablauf. Die Richtlinie beschreibt den Arbeitsablauf nicht — sie steuert ihn.", props: ["Geordnete Genehmigungskette", "Quorum pro Schritt", "Veröffentlichungsautorität", "Versioniert & durchgesetzt"] },
      { term: "Veröffentlichungsautorität", one: "Die benannte Autorität, befugt zur Freigabe einer Aufzeichnung von Rang.", def: "Veröffentlichung ist keine Schaltfläche, die jeder drücken darf. Sie ist einer bestimmten Governance-Rolle vorbehalten, im Moment der Freigabe validiert — und ein Genehmiger einer Aufzeichnung darf niemals ihr Veröffentlicher sein.", props: ["Rollengebunden", "Bei Veröffentlichung validiert", "Funktionstrennung"] },
      { term: "Governance-Zertifikat", one: "Kryptografischer Nachweis, dass eine Veröffentlichung ihre Richtlinie erfüllte.", def: "Bei Veröffentlichung versiegelt: die Richtlinie und ihre Version, die erforderliche Kette gegenüber denjenigen, die sie tatsächlich der Reihe nach erfüllten, genutzte Delegationen, die Veröffentlichungsautorität und ein Integritätsnachweis — ein COMPLIANT-Urteil, das unabhängig verifiziert werden kann.", props: ["Erforderliche vs. tatsächliche Kette", "Geordnete Genehmigungsfolge", "Integritätsnachweis", "Compliance-Urteil"] },
      { term: "Aufbewahrungszertifikat", one: "Manipulationssicherer Nachweis, dass eine Aufzeichnung dauerhaft versiegelt ist.", def: "Ausgestellt, wenn eine Aufzeichnung archiviert wird: ein Aufbewahrungszeitstempel und ein SHA-256-Integritätsnachweis über die kanonische Aufzeichnung. Der archivierte Zustand ist endgültig — keine Bearbeitung, Rücknahme oder erneute Veröffentlichung ist möglich.", props: ["SHA-256-Integritätsnachweis", "Aufbewahrungszeitstempel", "Endgültig & unveränderlich"] },
      { term: "Beweiskette", one: "Das ununterbrochene, rein anfügende Protokoll von der Erstellung bis zur Bewahrung.", def: "Jeder Akt — Einreichung, jede Entscheidung, die Erfüllung der Richtlinie, Veröffentlichung und Bewahrung — erfasst in einem unveränderlichen, hash-gestempelten Protokoll. Die Institution kann nicht nur beweisen, was eine Aufzeichnung sagt, sondern genau, wie sie zustande kam.", props: ["Rein anfügend", "Hash-gestempelt", "Erstellung → Bewahrung", "Unabhängig prüfbar"] },
    ],
    closeTitleA: "Wenn eine Kategorie entsteht,",
    closeTitleB: "zählt der Standard mehr als die Features.",
    closeBody: "Sovereign Dispatch ist kein besserer Weg, Dokumente zu veröffentlichen. Es ist der Betriebsstandard für institutionelle Aufzeichnungen — und eine Institution, die den Standard übernimmt, übernimmt eine Art zu regieren, die jedes einzelne System überdauert.",
    ctaArtifacts: "Die Artefakte ansehen", ctaPath: "Ihren Weg finden",
  },
};
