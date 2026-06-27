import type { MarketingCopy } from "./marketing";

export const MARKETING_FR: MarketingCopy = {
  trust: {
    eyebrow: "Adoptez en toute confiance",
    titleA: "Vos archives. Votre juridiction.",
    titleB: "Votre sortie, garantie.",
    lead: "S'engager sur une plateforme de publication est une décision de souveraineté. Sovereign Dispatch est conçu pour que l'institution garde la maîtrise — des données, du déploiement et de la capacité à partir avec l'intégralité de son patrimoine intact.",
    ownership: {
      kicker: "Propriété", title: "Vos archives vous appartiennent — nous en sommes le dépositaire.",
      sub: "La plateforme stocke et gouverne vos archives. Elle n'en est jamais propriétaire, ne les réutilise jamais à d'autres fins et n'entraîne rien dessus.",
      cards: [
        { title: "Vos données sont les vôtres", body: "Chaque document, version, artefact et certificat appartient à votre institution — et non à la plateforme." },
        { title: "Isolation des locataires", body: "Sécurité au niveau des lignes avec refus par défaut. L'absence d'attestation de locataire entraîne un refus ; vos données ne sont jamais mêlées à d'autres." },
        { title: "Aucun usage secondaire", body: "Aucune extraction, aucun profilage, aucun entraînement de modèle, aucun modèle économique fondé sur le partage de données. Jamais." },
        { title: "Chaque accès audité", body: "Soumissions, décisions, publications et récupérations sont consignées dans une piste à ajout seul, horodatée par empreinte." },
      ],
    },
    continuity: {
      kicker: "Continuité et sortie", title: "Vous pouvez partir à tout moment — avec l'intégralité de vos données.",
      sub: "Le signal de confiance le plus fort qu'une plateforme puisse offrir est une sortie nette. Il n'y a aucun verrouillage dont il faudrait s'extraire.",
      cards: [
        { title: "Aucun format propriétaire", body: "Archives structurées, artefacts standard PDF / DOCX / Markdown et un magasin PostgreSQL standard. Rien n'est captif." },
        { title: "Export complet à la demande", body: "Exportez les archives, les versions, les artefacts ainsi que les certificats de gouvernance et de préservation quand vous le souhaitez." },
        { title: "Déploiement relocalisable", body: "La même plateforme fonctionne en mode géré, dans votre cloud, sur site ou en environnement isolé — déplacez votre patrimoine sans changer de plateforme." },
        { title: "Si le fournisseur disparaissait", body: "Vous conservez chaque archive, artefact et certificat dans des formats ouverts et pouvez exploiter ou migrer la plateforme vous-même. La continuité ne dépend pas de nous." },
      ],
    },
    accountability: {
      kicker: "Responsabilité", title: "Une chaîne de responsabilité limpide.",
      sub: "Les équipes achats et risques doivent savoir précisément qui est responsable de quoi. Il n'y a aucune ambiguïté.",
      securesLabel: "La plateforme garantit",
      secures: ["L'isolation des locataires et le contrôle d'accès", "Le chiffrement au repos et en transit", "L'intégrité de l'audit à ajout seul", "L'intégrité de la préservation (preuves SHA-256)", "L'application de la gouvernance — le moteur ne peut être contourné", "La disponibilité et la reprise du service"],
      controlsLabel: "Votre institution maîtrise",
      controls: ["Qui détient chaque autorité de gouvernance", "Les chaînes d'approbation, les quorums et les politiques", "La classification et l'habilitation des archives", "Les horizons de conservation", "Qui détient les identifiants et leurs portées", "Le modèle de déploiement et la résidence des données"],
    },
    evidence: {
      kicker: "Preuve", title: "Démontrable, pas seulement promis.",
      sub: "La confiance dans l'adoption doit reposer sur ce qui peut être vérifié pendant l'évaluation — et non sur des promesses marketing.",
      ctaProcurement: "Dossier d'achat", ctaEvidence: "Preuves et capacités",
    },
  },
  platform: {
    overview: {
      kicker: "Vue d'ensemble", title: "L'information devient l'archive officielle.",
      sub: "Dispatch est la couche institutionnelle entre un brouillon et un document publié. Chaque artefact — note de synthèse, dossier du conseil, dépôt réglementaire — est soumis sous forme de données structurées, gouverné via approbation, rendu en un PDF/DOCX fidèle, puis publié avec une piste de provenance permanente et auditable.",
      cards: [
        { title: "Pas un traitement de texte", body: "Les documents sont des données structurées (DDM), validées et structurées par type — et non des fichiers libres. Le format est le contrat." },
        { title: "Gouverné, pas seulement généré", body: "Soumettre → Approuver → Rendre → Publier. Rien n'atteint l'archive sans satisfaire sa politique d'approbation." },
        { title: "Souverain par conception", body: "Locataire isolé, conscient de la résidence, audit à ajout seul. Conçu pour les institutions qui ne peuvent pas faillir." },
      ],
    },
    capabilities: {
      kicker: "Capacités", title: "Un seul pipeline, tous les documents officiels.",
      sub: "Modèles et validation par type de document ; rendu déterministe et segmenté par classification vers une sortie de qualité impression.",
      cards: [
        { title: "Types de documents", body: "Notes de synthèse pour la direction, rapports du conseil, documents de politique, dépôts réglementaires, dossiers opérationnels et archives officielles — chacun avec sa propre structure requise." },
        { title: "Rendu multi-format", body: "PDF fidèle (moteur sans interface), DOCX et Markdown à partir d'une source unique validée — bandeaux, numéros de page, annexes, signatures." },
        { title: "Validé par schéma", body: "Chaque soumission est vérifiée par rapport au schéma DDM et à la politique du type de document avant de pouvoir être rendue — aucune archive malformée." },
        { title: "Modèles et structures", body: "Des rôles de section conscients du type et des politiques de blocs imposent l'exhaustivité afin que la sortie soit cohérente dans toute l'institution." },
        { title: "Versionné et immuable", body: "Chaque version est préservée ; les artefacts publiés sont horodatés par empreinte et ne sont jamais altérés en silence." },
        { title: "Asynchrone à grande échelle", body: "Une file de rendu absorbe les pics et les dossiers volumineux sans bloquer les soumetteurs." },
      ],
    },
    workflow: {
      kicker: "Flux de travail", title: "Soumettre → Gouverner → Approuver → Rendre → Publier → Récupérer.",
      sub: "Le cycle de vie complet d'un document officiel, imposé par la plateforme.",
      steps: [
        { t: "Soumettre", b: "Charge utile DDM structurée, validée à l'entrée." },
        { t: "Gouverner", b: "Classification et politique d'approbation résolues." },
        { t: "Approuver", b: "Validation N-eyes ; les voies de service approuvent automatiquement." },
        { t: "Rendre", b: "PDF/DOCX fidèle produit dans la file." },
        { t: "Publier", b: "Versé à l'archive ; provenance scellée." },
        { t: "Récupérer", b: "Téléchargement d'artefact signé et soumis au contrôle d'accès." },
      ],
    },
    integrations: {
      kicker: "Intégrations", title: "Une API sur laquelle d'autres bâtissent.",
      sub: "Dispatch fournit un accès API à portée définie par consommateur et accepte les documents via une surface REST stable.",
      apiTitle: "Provisionnement de l'API",
      apiBody: "Chaque système obtient son propre client de service — un client_id et un secret avec des portées explicites (valider · rendre · lire). Émettez, cadrez et révoquez par consommateur.",
      estateTitle: "Conçu pour le patrimoine",
      estateBody: "Les consommateurs soumettent leurs données et Dispatch renvoie l'archive officielle — avec des rappels par webhook au rendu et à la publication.",
      estateItems: ["Veritas — dossiers opérationnels et financiers", "ExitOS — mémorandums du conseil et documents de transaction", "Votre institution — via la même surface REST"],
    },
  },
  standard: {
    eyebrow: "Définition de catégorie",
    title: "Le Standard Sovereign Dispatch",
    lead: "Une institution n'adopte pas un outil de publication. Elle adopte un standard qui définit comment les archives officielles naissent, sont prouvées et sont préservées. Voici les concepts que ce standard définit.",
    sectionKicker: "Le Standard",
    sectionTitle: "Six concepts institutionnels.",
    sectionSub: "Chacun est une brique du standard opérationnel des archives institutionnelles — non pas une fonctionnalité, mais une définition.",
    defs: [
      { term: "Archive officielle", one: "Un document institutionnel d'archive, gouverné, versionné et classifié.", def: "Pas un fichier. Un acte officiel, créé sous une politique de gouvernance imposée, mené à travers un cycle de vie immuable — Créée → Gouvernée → Approuvée → Publiée → Préservée — avec une identité permanente et démontrable.", props: ["Numéro d'archive stable", "Classification et habilitation", "Versions immuables", "Une forme canonique unique"] },
      { term: "Politique de gouvernance", one: "La règle exécutable qui régit une classe d'archives.", def: "Une politique nommée et versionnée, liée à un type d'archive : une chaîne ordonnée d'autorités, un quorum par étape, l'autorité de publication, la conservation et l'expiration. La politique ne décrit pas le flux de travail — elle le contrôle.", props: ["Chaîne d'approbation ordonnée", "Quorum par étape", "Autorité de publication", "Versionnée et imposée"] },
      { term: "Autorité de publication", one: "L'autorité nommée habilitée à publier une archive d'archive.", def: "La publication n'est pas un bouton que chacun peut presser. Elle est réservée à un rôle de gouvernance spécifique, validée au moment de la publication — et l'approbateur d'une archive ne peut jamais en être le publieur.", props: ["Liée à un rôle", "Validée à la publication", "Séparation des tâches"] },
      { term: "Certificat de gouvernance", one: "Preuve cryptographique qu'une publication a satisfait sa politique.", def: "Scellé à la publication : la politique et sa version, la chaîne requise face à ceux qui l'ont effectivement satisfaite dans l'ordre, les délégations utilisées, l'autorité de publication et une preuve d'intégrité — un verdict COMPLIANT vérifiable de manière indépendante.", props: ["Chaîne requise vs réelle", "Séquence d'approbation ordonnée", "Preuve d'intégrité", "Verdict de conformité"] },
      { term: "Certificat de préservation", one: "Preuve infalsifiable qu'une archive est scellée de façon permanente.", def: "Émis lorsqu'une archive est archivée : un horodatage de préservation et une preuve d'intégrité SHA-256 sur l'archive canonique. L'état archivé est terminal — aucune modification, aucun retrait ni republication n'est possible.", props: ["Preuve d'intégrité SHA-256", "Horodatage de préservation", "Terminal et immuable"] },
      { term: "Chaîne de preuve", one: "La piste ininterrompue, à ajout seul, de la création à la préservation.", def: "Chaque acte — soumission, chaque décision, la satisfaction de la politique, la publication et la préservation — consigné dans une piste immuable et horodatée par empreinte. L'institution peut prouver non seulement ce que dit une archive, mais exactement comment elle a vu le jour.", props: ["Ajout seul", "Horodatée par empreinte", "Création → préservation", "Auditable de manière indépendante"] },
    ],
    closeTitleA: "Quand une catégorie émerge,",
    closeTitleB: "le standard importe plus que les fonctionnalités.",
    closeBody: "Sovereign Dispatch n'est pas une meilleure façon de publier des documents. C'est le standard opérationnel des archives institutionnelles — et une institution qui adopte le standard adopte une manière de gouverner qui survit à tout système particulier.",
    ctaArtifacts: "Voir les artefacts", ctaPath: "Trouvez votre voie",
  },
};
