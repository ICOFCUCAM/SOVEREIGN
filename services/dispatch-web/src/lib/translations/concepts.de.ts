// Echte deutsche Übersetzungen der Konzeptseiten (Layer 3). Eine Fassung je Sprache —
// keine maschinelle Übersetzung zur Laufzeit. Nur die hier vorhandenen Slugs werden unter
// /de/learn/<slug> ausgeliefert; alles Übrige bleibt bis zur Übersetzung englischsprachig,
// damit hreflang wahrheitsgemäß bleibt. Die gemeinsame Struktur (Diagramm, verwandte Links)
// stammt aus der englischen Basis in problems.ts; dies sind die lokalisierten Textfelder.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_DE: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Amtliche Veröffentlichung",
    kicker: "Konzept",
    headline: "Was eine amtliche Veröffentlichung ist — und was sie amtlich macht.",
    lead: "Veröffentlichen kann jeder ein Dokument. Eine amtliche Veröffentlichung ist anders: Sie ergeht unter der Autorität einer Institution und lässt sich als echt nachweisen, solange es darauf ankommt.",
    definition: "Eine amtliche Veröffentlichung ist ein Dokument, das unter der Autorität einer Institution — nicht einer Einzelperson — in einem geregelten Genehmigungsverfahren ergeht und dauerhaft überprüfbar gemacht wird, sodass jede Person bestätigen kann, dass es sich um die echte, geltende Fassung handelt.",
    why: [
      "Ein per E-Mail verschicktes PDF sieht gleich aus, ob es die genehmigte Endfassung oder ein früher Entwurf ist. Nichts an der Datei belegt, welche von beiden es ist.",
      "Wird eine Veröffentlichung Jahre später angefochten — vor Gericht, in einer Prüfung, durch die Öffentlichkeit —, muss die Institution nachweisen können, wer sie genehmigt hat, in welcher Reihenfolge und dass sich die Datei seither nicht verändert hat.",
      "Die meisten Institutionen können dies nicht nachweisen: Die Genehmigung lebte in E-Mails und Sitzungen, und die veröffentlichte Datei ist nur eine Kopie ohne dauerhafte Verbindung zur Autorität, die sie ausgestellt hat.",
    ],
    how: [
      { t: "Von einem Amt ausgestellt, nicht von einer Person", d: "Sovereign Dispatch bindet jede Veröffentlichung an die Autorität eines Amtes: Sie bleibt gültig, auch wenn die Person, die sie unterzeichnet hat, ausgeschieden ist." },
      { t: "Geregelt vor der Veröffentlichung", d: "Vor der Freigabe läuft eine verbindliche Genehmigungskette: Die amtliche Fassung ist diejenige, die die Governance durchlaufen hat, und keine andere kann sich als amtlich ausgeben." },
      { t: "Dauerhaft überprüfbar", d: "Jede Veröffentlichung trägt eine dauerhafte Record-ID und einen Integritätsnachweis; jede Person kann bestätigen, dass sie echt und unverändert ist — ohne Konto." },
    ],
    faqs: [
      { q: "Worin besteht der Unterschied zwischen einem Dokument und einer amtlichen Veröffentlichung?", a: "Ein Dokument ist nur eine Datei. Eine amtliche Veröffentlichung ergeht unter der Autorität einer Institution in einem geregelten Verfahren und ist dauerhaft überprüfbar: Es lässt sich nachweisen, wer sie ausgestellt hat und dass sie sich nicht verändert hat." },
      { q: "Wie weist man nach, dass eine Veröffentlichung amtlich ist?", a: "Indem man ihre dauerhafte Record-ID und ihren Integritätsnachweis mit dem Register der ausstellenden Institution abgleicht. Sovereign Dispatch ermöglicht dies jeder Person ohne Konto." },
      { q: "Machen eine Unterschrift oder ein Briefkopf eine Veröffentlichung amtlich?", a: "Nein. Eine Unterschrift oder ein Briefkopf lassen sich kopieren. Erst die an ein Amt gebundene Autorität zusammen mit einem überprüfbaren Integritätsnachweis macht eine Veröffentlichung nachweisbar amtlich." },
    ],
    metaTitle: "Was ist eine amtliche Veröffentlichung? Definition & Nachweis",
    metaDescription: "Eine amtliche Veröffentlichung ist ein Dokument, das unter der Autorität einer Institution geregelt ergeht und dauerhaft überprüfbar ist. Erfahren Sie, was sie amtlich macht.",
  },
  "evidence-chain": {
    term: "Beweiskette",
    kicker: "Integrität",
    headline: "Eine Beweiskette, die existiert, bevor jemand danach fragt.",
    lead: "Eine Beweiskette ist der lückenlose Nachweis, wie ein Dokument genehmigt und ausgestellt wurde — erfasst, während es geschieht, damit man sich im entscheidenden Moment darauf verlassen kann.",
    definition: "Eine Beweiskette ist ein vollständiger, geordneter und manipulationssicherer Nachweis jedes Schritts der Genehmigung und Veröffentlichung eines Dokuments — wer wann gehandelt hat und an welcher Fassung —, erfasst bei der Entstehung des Dokuments statt nachträglich rekonstruiert.",
    why: [
      "Wird eine Veröffentlichung angezweifelt, hängt der Wert des Beweises ganz davon ab, wann er entstanden ist. Nach der Anfechtung zusammengetragene Beweise sind schwach und anfechtbar.",
      "Die meisten Organisationen erstellen den Nachweis erst, wenn ein Prüfer oder ein Gericht ihn verlangt — und sammeln E-Mails, Freigaben und Fassungen unter Zeitdruck zusammen, mit Lücken.",
      "Eine fortlaufend, in der richtigen Reihenfolge und gegen Veränderung versiegelt aufgezeichnete Beweiskette ist der Unterschied zwischen dem Nachweis von Autorität und ihrer bloßen Behauptung.",
    ],
    how: [
      { t: "Erfasst, während es geschieht", d: "Jeder Genehmigungsschritt wird in dem Moment aufgezeichnet, in dem er erfolgt, in der richtigen Reihenfolge — niemals später rekonstruiert." },
      { t: "Manipulationssicher", d: "Die Kette wird mit Integritätsnachweisen versiegelt: Jede spätere Änderung ist erkennbar; der Nachweis prüft sich entweder als unversehrt oder gar nicht." },
      { t: "Auf Abruf bereit", d: "Weil die Kette bereits besteht, ist die Antwort auf eine Prüfung oder Anfechtung ein Abruf, keine Rekonstruktion." },
    ],
    faqs: [
      { q: "Was ist eine Beweiskette?", a: "Ein vollständiger, geordneter und manipulationssicherer Nachweis, wie ein Dokument genehmigt und ausgestellt wurde — wer wann gehandelt hat und an welcher Fassung —, erfasst, während es geschah." },
      { q: "Warum kommt es auf den Zeitpunkt des Beweises an?", a: "Ein Beweis, der im Verlauf der Ereignisse entsteht, ist weit belastbarer als ein nach einer Anfechtung zusammengetragener, der anfällig für Lücken und Streit ist." },
      { q: "Wie bleibt eine Beweiskette manipulationssicher?", a: "Indem jeder Schritt mit kryptografischen Integritätsnachweisen versiegelt wird, sodass jede spätere Veränderung bei der Überprüfung erkennbar ist." },
    ],
    metaTitle: "Was ist eine Beweiskette? Definition & Bedeutung des Zeitpunkts",
    metaDescription: "Eine Beweiskette ist der vollständige, geordnete und manipulationssichere Nachweis der Genehmigung und Ausstellung eines Dokuments, erfasst im Moment. Warum der Zeitpunkt zählt.",
  },
  "document-authenticity": {
    term: "Dokumentenechtheit",
    kicker: "Integrität",
    headline: "Eine Dokumentenechtheit, die man nachweist, nicht bloß behauptet.",
    lead: "Dokumentenechtheit ist die Eigenschaft, nachweisbar echt zu sein — das wahre Dokument, ausgestellt von dem, der es vorgibt, seither unverändert. Die meisten Dokumente behaupten sie nur.",
    definition: "Dokumentenechtheit ist die überprüfbare Eigenschaft, dass ein Dokument echt ist: ausgestellt von der angegebenen Autorität und seit der Veröffentlichung unverändert, von jeder Person nachweisbar statt bloß durch den Anschein behauptet.",
    why: [
      "Briefköpfe, Unterschriften und Siegel lassen sich allesamt kopieren. Der Anschein ist kein Beweis — eine überzeugende Fälschung sieht genauso aus wie das Original.",
      "Wenn die Echtheit eines Dokuments am meisten zählt — eine Urkunde, eine Lizenz, eine Entscheidung —, hat der Empfänger oft keine unabhängige Möglichkeit, zu bestätigen, dass es echt ist.",
      "Eine Echtheit, die vom Anruf beim Aussteller abhängt, lässt sich nicht skalieren und versagt genau dann, wenn der Aussteller am schwersten zu erreichen ist.",
    ],
    how: [
      { t: "An das ausstellende Amt gebunden", d: "Jede Veröffentlichung ergeht unter einer benannten Autorität: Ihr Ursprung ist Teil des Nachweises und keine Vermutung aus einem Briefkopf." },
      { t: "Integritätsnachweis je Dokument", d: "Ein kryptografischer Nachweis verbindet die exakte Datei mit ihrem Eintrag; die Veränderung eines einzigen Bytes bricht die Überprüfung." },
      { t: "Von jeder Person überprüfbar", d: "Eine dauerhafte Record-ID erlaubt jedem Empfänger, die Echtheit unabhängig zu bestätigen — ohne Konto und ohne Anruf beim Aussteller." },
    ],
    faqs: [
      { q: "Was ist Dokumentenechtheit?", a: "Die überprüfbare Eigenschaft, dass ein Dokument echt ist — ausgestellt von der angegebenen Autorität und seit der Veröffentlichung unverändert —, von jeder Person nachweisbar und nicht bloß behauptet." },
      { q: "Warum genügen eine Unterschrift oder ein Siegel nicht?", a: "Unterschriften und Siegel lassen sich kopieren. Echte Authentizität erfordert einen überprüfbaren Integritätsnachweis, der an die ausstellende Autorität gebunden ist." },
      { q: "Wie überprüfe ich, ob ein Dokument echt ist?", a: "Indem Sie seine dauerhafte Record-ID und seinen Integritätsnachweis mit dem Register des Ausstellers abgleichen. Sovereign Dispatch ermöglicht dies jeder Person ohne Konto." },
    ],
    metaTitle: "Dokumentenechtheit — nachweisen, dass ein Dokument echt ist",
    metaDescription: "Dokumentenechtheit ist die überprüfbare Eigenschaft, echt und unverändert zu sein. Warum Unterschriften und Siegel nicht genügen und wie man sie nachweist.",
  },
  "document-verification": {
    term: "Dokumentenprüfung",
    kicker: "Überprüfung",
    headline: "Eine Dokumentenprüfung, die jeder durchführen kann — ohne Konto.",
    lead: "Dokumentenprüfung bedeutet, zu bestätigen, dass ein Dokument echt und unverändert ist. Die beste Prüfung erfordert keinen besonderen Zugang — jede Person kann sie durchführen.",
    definition: "Dokumentenprüfung ist der Vorgang, zu bestätigen, dass ein Dokument echt und unverändert ist — idealerweise durch den Abgleich einer dauerhaften Kennung und eines Integritätsnachweises mit dem Register des Ausstellers, unabhängig und ohne privilegierten Zugang.",
    why: [
      "Eine Prüfung, die einen Anruf beim Aussteller oder die Anmeldung an einem Portal verlangt, versagt bei denen, die sie am dringendsten brauchen — Empfänger, Öffentlichkeit, andere Institutionen.",
      "Ist die Prüfung schwierig, findet sie nicht statt, und Fälschungen zirkulieren unangefochten.",
      "Vertrauen skaliert nur, wenn jede Person, die ein Dokument besitzt, es selbst in Sekunden gegen die Quelle der Wahrheit bestätigen kann.",
    ],
    how: [
      { t: "Dauerhafte Record-ID", d: "Jede Veröffentlichung trägt eine Kennung, die auf ihren maßgeblichen Eintrag bei der ausstellenden Institution verweist." },
      { t: "Integritätsprüfung der exakten Datei", d: "Die Prüfung bestätigt, dass die konkrete Datei Byte für Byte der ausgestellten Fassung entspricht; jede Veränderung wird erkannt." },
      { t: "Offen für alle", d: "Jede Person kann einen Eintrag ohne Konto prüfen: Vertrauen hängt nicht von privilegiertem Zugang ab." },
    ],
    faqs: [
      { q: "Was ist Dokumentenprüfung?", a: "Zu bestätigen, dass ein Dokument echt und unverändert ist, idealerweise durch den Abgleich einer dauerhaften Kennung und eines Integritätsnachweises mit dem Register des Ausstellers." },
      { q: "Brauche ich ein Konto, um ein Dokument zu prüfen?", a: "Mit Sovereign Dispatch nicht. Die Prüfung ist für alle offen, damit Vertrauen nicht von privilegiertem Zugang abhängt." },
      { q: "Was prüft die Überprüfung tatsächlich?", a: "Dass das Dokument einem echten ausgestellten Eintrag entspricht und dass die exakte Datei seit der Veröffentlichung unverändert ist." },
    ],
    metaTitle: "Dokumentenprüfung — Echtheit bestätigen, ohne Konto",
    metaDescription: "Die Dokumentenprüfung bestätigt, dass ein Dokument echt und unverändert ist, über eine dauerhafte Record-ID und einen Integritätsnachweis — unabhängig, ohne Konto.",
  },
};
