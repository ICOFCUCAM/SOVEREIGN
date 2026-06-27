// Real French translations for concept pages (Layer 3). One version per language —
// not machine translation at request time. Only slugs present here are exposed at
// /fr/learn/<slug>; everything else stays English-only until translated, so
// hreflang stays truthful. The shared structure (diagram, related links) comes
// from the English base in problems.ts; these are the localized text fields.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_FR: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Publication officielle",
    kicker: "Concept",
    headline: "Ce qu'est une publication officielle — et ce qui la rend officielle.",
    lead: "N'importe qui peut publier un document. Une publication officielle est différente : elle est émise sous l'autorité d'une institution et peut être prouvée authentique aussi longtemps que nécessaire.",
    definition: "Une publication officielle est un document émis sous l'autorité d'une institution — et non d'un individu — au terme d'un processus d'approbation gouverné, et rendu vérifiable en permanence afin que quiconque puisse confirmer qu'il s'agit de la version authentique et en vigueur.",
    why: [
      "Un PDF qui circule par courriel semble identique qu'il s'agisse de la version finale approuvée ou d'un premier brouillon. Rien dans le fichier ne le prouve.",
      "Lorsqu'une publication est contestée des années plus tard — devant un tribunal, lors d'un audit, par le public — l'institution doit pouvoir prouver qui l'a approuvée, dans quel ordre, et que le fichier n'a pas changé depuis.",
      "La plupart des institutions ne peuvent pas le prouver : l'approbation vivait dans les courriels et les réunions, et le fichier publié n'est qu'une copie sans lien durable avec l'autorité qui l'a émis.",
    ],
    how: [
      { t: "Émise par un office, pas une personne", d: "Sovereign Dispatch lie chaque publication à l'autorité d'un office : elle reste valable lorsque la personne qui l'a signée a quitté ses fonctions." },
      { t: "Gouvernée avant publication", d: "Une chaîne d'approbation imposée s'exécute avant la diffusion : la version officielle est celle qui a satisfait la gouvernance, et aucune autre ne peut se faire passer pour officielle." },
      { t: "Vérifiable en permanence", d: "Chaque publication porte un identifiant permanent et une preuve d'intégrité ; quiconque peut confirmer qu'elle est authentique et inaltérée — sans compte." },
    ],
    faqs: [
      { q: "Quelle est la différence entre un document et une publication officielle ?", a: "Un document n'est qu'un fichier. Une publication officielle est émise sous l'autorité d'une institution au terme d'un processus gouverné et reste vérifiable en permanence : on peut prouver qui l'a émise et qu'elle n'a pas changé." },
      { q: "Comment prouver qu'une publication est officielle ?", a: "En vérifiant son identifiant permanent et sa preuve d'intégrité par rapport au registre de l'institution émettrice. Sovereign Dispatch permet à quiconque de le faire sans compte." },
      { q: "Une signature ou un en-tête rendent-ils une publication officielle ?", a: "Non. Une signature ou un en-tête peuvent être copiés. C'est l'autorité liée à un office, alliée à une preuve d'intégrité vérifiable, qui rend une publication officiellement prouvable." },
    ],
    metaTitle: "Qu'est-ce qu'une publication officielle ? Définition et preuve",
    metaDescription: "Une publication officielle est un document émis sous l'autorité d'une institution, gouverné avant diffusion et vérifiable en permanence. Comprenez ce qui la rend officielle.",
  },
  "evidence-chain": {
    term: "Chaîne de preuves",
    kicker: "Intégrité",
    headline: "Une chaîne de preuves qui existe avant qu'on la demande.",
    lead: "Une chaîne de preuves est l'enregistrement ininterrompu de la manière dont un document a été approuvé et émis — capturé à mesure, afin qu'on puisse s'y fier le moment venu.",
    definition: "Une chaîne de preuves est un enregistrement complet, ordonné et inviolable de chaque étape de l'approbation et de la publication d'un document — qui a agi, quand, et sur quelle version — capturé au moment où le document est créé plutôt que reconstitué après coup.",
    why: [
      "Quand une publication est contestée, la valeur de la preuve dépend entièrement du moment de sa création. Une preuve assemblée après la contestation est faible et discutable.",
      "La plupart des organisations ne constituent la trace qu'au moment où un auditeur ou un tribunal l'exige — en rassemblant courriels, validations et versions sous pression, avec des lacunes.",
      "Une chaîne de preuves enregistrée en continu, dans l'ordre, et scellée contre toute modification fait la différence entre prouver l'autorité et simplement l'affirmer.",
    ],
    how: [
      { t: "Capturée à mesure", d: "Chaque étape d'approbation est enregistrée au moment où elle survient, dans l'ordre — jamais reconstituée plus tard." },
      { t: "Inviolable", d: "La chaîne est scellée par des preuves d'intégrité : toute modification ultérieure est détectable ; l'enregistrement se vérifie intact ou ne se vérifie pas." },
      { t: "Prête sur demande", d: "Parce que la chaîne existe déjà, répondre à un audit ou à une contestation relève de la consultation, non de la reconstitution." },
    ],
    faqs: [
      { q: "Qu'est-ce qu'une chaîne de preuves ?", a: "Un enregistrement complet, ordonné et inviolable de la manière dont un document a été approuvé et émis — qui a agi, quand, et sur quelle version — capturé à mesure." },
      { q: "Pourquoi le moment de la preuve importe-t-il ?", a: "Une preuve créée au fil des événements est bien plus solide qu'une preuve assemblée après une contestation, sujette aux lacunes et aux litiges." },
      { q: "Comment une chaîne de preuves reste-t-elle inviolable ?", a: "En scellant chaque étape par des preuves d'intégrité cryptographiques, de sorte que toute altération ultérieure soit détectable à la vérification." },
    ],
    metaTitle: "Qu'est-ce qu'une chaîne de preuves ? Définition",
    metaDescription: "Une chaîne de preuves est l'enregistrement complet, ordonné et inviolable de l'approbation et de l'émission d'un document, capturé à mesure. Pourquoi le moment compte.",
  },
  "document-authenticity": {
    term: "Authenticité documentaire",
    kicker: "Intégrité",
    headline: "Une authenticité documentaire que l'on prouve, pas que l'on affirme.",
    lead: "L'authenticité documentaire est la propriété d'être vérifiablement authentique — le véritable document, émis par qui il prétend, inchangé depuis. La plupart des documents ne font que l'affirmer.",
    definition: "L'authenticité documentaire est la propriété vérifiable selon laquelle un document est authentique : émis par l'autorité revendiquée et inaltéré depuis sa publication, prouvable par quiconque plutôt que simplement affirmé par l'apparence.",
    why: [
      "En-têtes, signatures et sceaux peuvent tous être copiés. L'apparence n'est pas une preuve — une contrefaçon convaincante ressemble exactement à l'original.",
      "Quand l'authenticité d'un document compte le plus — un certificat, une licence, une décision — le destinataire n'a souvent aucun moyen indépendant de confirmer qu'il est authentique.",
      "Une authenticité qui dépend d'un appel à l'émetteur ne passe pas à l'échelle et s'effondre précisément quand l'émetteur est le plus difficile à joindre.",
    ],
    how: [
      { t: "Liée à l'office émetteur", d: "Chaque publication est émise sous une autorité nommée : son origine fait partie de l'enregistrement, et non d'une déduction tirée d'un en-tête." },
      { t: "Preuve d'intégrité par document", d: "Une preuve cryptographique lie le fichier exact à son enregistrement ; modifier un seul octet rompt la vérification." },
      { t: "Vérifiable par quiconque", d: "Un identifiant permanent permet à tout destinataire de confirmer l'authenticité de façon indépendante — sans compte ni appel à l'émetteur." },
    ],
    faqs: [
      { q: "Qu'est-ce que l'authenticité documentaire ?", a: "La propriété vérifiable selon laquelle un document est authentique — émis par l'autorité revendiquée et inaltéré depuis sa publication — prouvable par quiconque, et non simplement affirmée." },
      { q: "Pourquoi une signature ou un sceau ne suffisent-ils pas ?", a: "Signatures et sceaux peuvent être copiés. La véritable authenticité requiert une preuve d'intégrité vérifiable liée à l'autorité émettrice." },
      { q: "Comment vérifier qu'un document est authentique ?", a: "En vérifiant son identifiant permanent et sa preuve d'intégrité par rapport au registre de l'émetteur. Sovereign Dispatch permet à quiconque de le faire sans compte." },
    ],
    metaTitle: "Authenticité documentaire — Prouver qu'un document est authentique",
    metaDescription: "L'authenticité documentaire est la propriété vérifiable d'être authentique et inaltéré. Pourquoi signatures et sceaux ne suffisent pas, et comment la prouver.",
  },
  "document-verification": {
    term: "Vérification de document",
    kicker: "Vérification",
    headline: "Une vérification de document accessible à tous, sans compte.",
    lead: "La vérification de document consiste à confirmer qu'un document est authentique et inaltéré. La meilleure vérification ne requiert aucun accès particulier — quiconque peut l'effectuer.",
    definition: "La vérification de document est le processus consistant à confirmer qu'un document est authentique et inaltéré — idéalement en contrôlant un identifiant permanent et une preuve d'intégrité par rapport au registre de l'émetteur, de façon indépendante et sans accès privilégié.",
    why: [
      "Une vérification qui exige d'appeler l'émetteur ou de se connecter à un portail échoue auprès de ceux qui en ont le plus besoin — destinataires, public, autres institutions.",
      "Si la vérification est difficile, elle n'a pas lieu, et les contrefaçons circulent sans être contestées.",
      "La confiance ne passe à l'échelle que si quiconque détient un document peut le confirmer lui-même, en quelques secondes, par rapport à la source de vérité.",
    ],
    how: [
      { t: "Identifiant permanent", d: "Chaque publication porte un identifiant qui renvoie à son enregistrement faisant autorité au sein de l'institution émettrice." },
      { t: "Contrôle d'intégrité du fichier exact", d: "La vérification confirme que le fichier précis est, octet pour octet, la version émise ; toute modification est détectée." },
      { t: "Ouverte à tous", d: "Quiconque peut vérifier un enregistrement sans compte : la confiance ne dépend pas d'un accès privilégié." },
    ],
    faqs: [
      { q: "Qu'est-ce que la vérification de document ?", a: "Confirmer qu'un document est authentique et inaltéré, idéalement en contrôlant un identifiant permanent et une preuve d'intégrité par rapport au registre de l'émetteur." },
      { q: "Faut-il un compte pour vérifier un document ?", a: "Avec Sovereign Dispatch, non. La vérification est ouverte à tous, afin que la confiance ne dépende pas d'un accès privilégié." },
      { q: "Que contrôle réellement la vérification ?", a: "Que le document correspond à un enregistrement authentique émis, et que le fichier exact est inaltéré depuis sa publication." },
    ],
    metaTitle: "Vérification de document — Confirmer l'authenticité, sans compte",
    metaDescription: "La vérification de document confirme qu'un document est authentique et inaltéré via un identifiant permanent et une preuve d'intégrité — de façon indépendante, sans compte.",
  },
};
