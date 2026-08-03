import type { Marketing7Copy } from "./marketing7";

export const MARKETING7_FR: Marketing7Copy = {
  "journey": {
    "eyebrow": "Parcours de préparation",
    "title": "Où votre institution commence-t-elle ?",
    "lead": "Nommez votre institution et recevez un point de départ sur mesure — déploiement, gouvernance et politique — en quelques secondes.",
    "profiles": [
      {
        "name": "Gouvernement / Ministère",
        "lede": "Des registres de niveau Conseil des ministres soumis à des obligations de localisation des données.",
        "deployment": "Hébergement souverain ou sur site, dans la juridiction",
        "governance": "Chaîne ministérielle à plusieurs étapes — Directeur → Secrétaire général → Secrétaire principal, avec une autorité de publication des communications",
        "policy": "Politiques distinctes par type de registre, avec conservation longue et contrôle par classification",
        "records": [
          "Mémorandum du Conseil des ministres",
          "Rapport ministériel",
          "Document d'orientation",
          "Réponse réglementaire"
        ]
      },
      {
        "name": "Université",
        "lede": "Décisions du Sénat et registres académiques d'une valeur permanente.",
        "deployment": "Cloud privé dans votre propre environnement",
        "governance": "Gouvernance du Sénat avec le Registraire comme autorité de publication",
        "policy": "Politiques de résolutions et de rapports avec préservation permanente",
        "records": [
          "Résolution du Sénat académique",
          "Rapport du Conseil",
          "Dossier de recherche",
          "Livre blanc"
        ]
      },
      {
        "name": "Hôpital",
        "lede": "Des directives cliniques qui doivent être gouvernées et auditables.",
        "deployment": "Cloud privé ou sur site, avec isolement clinique",
        "governance": "Gouvernance clinique avec approbation du Directeur médical",
        "policy": "Politiques de directives avec conservation complète des audits",
        "records": [
          "Directive clinique",
          "Rapport de situation",
          "Rapport de risques",
          "Rapport du Conseil"
        ]
      },
      {
        "name": "Régulateur",
        "lede": "Des avis qui constituent eux-mêmes des preuves juridiques.",
        "deployment": "Souverain ou géré, de qualité probatoire",
        "governance": "Chaîne de révision juridique avec autorité du Commissaire",
        "policy": "Politiques d'avis avec calendriers de conservation légaux",
        "records": [
          "Avis réglementaire",
          "Réponse réglementaire",
          "Document d'orientation",
          "Rapport d'audit"
        ]
      },
      {
        "name": "Entreprise",
        "lede": "Des registres du conseil et de la direction qui exigent une gouvernance démontrable.",
        "deployment": "Cloud géré ou privé",
        "governance": "Chaîne conseil / direction avec une autorité de publication définie",
        "policy": "Politiques de résolutions du conseil et de conformité avec conservation des audits",
        "records": [
          "Rapport du Conseil",
          "Mémorandum stratégique",
          "Rapport de due diligence",
          "Communication aux investisseurs"
        ]
      }
    ],
    "recommended": "Point de départ recommandé",
    "labels": {
      "deployment": "Déploiement",
      "governance": "Gouvernance",
      "policy": "Politique",
      "records": "Types de registres à gouverner en premier"
    },
    "ctaPackage": "Constituer le dossier d'évaluation",
    "ctaTrust": "Pourquoi l'adoption est sûre",
    "selectHint": "Sélectionnez un type d'institution ci-dessus pour voir son point de départ recommandé."
  },
  "gallery": {
    "eyebrow": "Les artefacts",
    "title": "Ce qu'une institution détient réellement.",
    "lead": "Après le passage d'un registre par Sovereign Dispatch, l'institution détient quatre éléments — non pas un fichier, mais une preuve. Voici les véritables types d'artefacts produits par la plateforme.",
    "kicker": "Galerie",
    "sectionTitle": "Quatre artefacts, un registre.",
    "sectionSub": "Un registre officiel et les trois preuves qui l'accompagnent.",
    "specimen": "Spécimen",
    "officialTitle": "Registre officiel",
    "docTitle": "Situation budgétaire du T3 — Note ministérielle",
    "docSub": "Rapport ministériel",
    "fRecordNo": "№ de registre",
    "fClassification": "Classification",
    "fLifecycle": "Cycle de vie",
    "fVersion": "Version",
    "vLifecycle": "Publié · Préservé",
    "govTitle": "Certificat de gouvernance",
    "govPolicy": "Politique des notes ministérielles",
    "compliant": "CONFORME",
    "chain": [
      "Directeur",
      "Secrétaire général",
      "Bureau des communications"
    ],
    "fApprovals": "Approbations",
    "vApprovals": "2 / 2 dans l'ordre",
    "fSod": "Sép. des fonctions",
    "vSod": "Appliquée",
    "fIntegrity": "Preuve d'intégrité",
    "presTitle": "Certificat de préservation",
    "presHead": "Artefact institutionnel scellé",
    "fRecordHash": "Empreinte du registre",
    "fPublished": "Publié",
    "fArchived": "Archivé",
    "presNote": "Définitif et immuable — aucune modification, aucun retrait, aucune republication.",
    "auditTitle": "Preuve d'audit",
    "auditHead": "Journal d'événements en ajout seul",
    "footnote": "Valeurs de spécimen issues d'un registre de référence. Les registres de votre institution portent les quatre mêmes artefacts — générés automatiquement, entièrement détenus par vous.",
    "closing": "Un registre n'est plus un fichier. C'est une preuve.",
    "cta": "Le standard Dispatch"
  },
  "walkthrough": {
    "eyebrow": "Voir un registre gouverné",
    "title": "Regardez un document devenir officiel.",
    "lead": "Suivez une publication à travers le cycle de vie gouverné — d'un simple brouillon à un Registre officiel certifié et vérifiable. Un exemple illustratif ; les bureaux, les certificats et la chaîne de preuve reflètent le moteur réel.",
    "steps": [
      {
        "kicker": "01 · Brouillon",
        "title": "Un document est rédigé."
      },
      {
        "kicker": "02 · Gouvernance",
        "title": "Sa chaîne d'approbation est déterminée."
      },
      {
        "kicker": "03 · Approbation",
        "title": "Les bureaux signent, dans l'ordre."
      },
      {
        "kicker": "04 · Publication",
        "title": "Il devient un Registre officiel."
      },
      {
        "kicker": "05 · Certification",
        "title": "Sa preuve est scellée."
      },
      {
        "kicker": "06 · Preuve",
        "title": "Chaque étape est enregistrée."
      },
      {
        "kicker": "07 · Vérification",
        "title": "Quiconque peut le confirmer — pour toujours."
      }
    ],
    "back": "Retour",
    "next": "Suivant",
    "replay": "Rejouer",
    "sampleTitle": "Politique nationale de vaccination infantile",
    "sampleInstitution": "Ministère de la Santé",
    "sampleDocType": "Note de politique exécutive",
    "draftLabel": "Brouillon",
    "draftSections": [
      "Résumé exécutif",
      "Jugements clés",
      "Analyse",
      "Recommandation"
    ],
    "draftNote": "Un brouillon ordinaire — à ce stade, ce n'est qu'un fichier. Il ne porte encore aucune autorité. C'est la gouvernance qui le rendra officiel.",
    "policyLabel": "Politique d'approbation déterminée",
    "policyBody": "Pour une note de politique exécutive dans cette institution, le moteur de gouvernance exige cette chaîne d'autorité — dans l'ordre. Rien n'est publié tant que chaque bureau n'a pas agi.",
    "chain": [
      {
        "office": "Analyste des politiques",
        "act": "Rédigé"
      },
      {
        "office": "Conseiller juridique",
        "act": "Révision juridique"
      },
      {
        "office": "Directeur de la santé publique",
        "act": "Approuvé"
      },
      {
        "office": "Secrétaire permanent",
        "act": "Autorisé"
      }
    ],
    "approvedLabel": "Chaîne d'autorité satisfaite",
    "approvedBody": "Chaque bureau agit dans l'ordre. Un soumissionnaire ne peut pas approuver son propre travail ; chaque signature est attribuable au bureau qui détient l'autorité.",
    "publishedLabel": "Publié — Registre officiel",
    "recordIdLabel": "Identifiant permanent du registre",
    "publishedBody": "Un identifiant permanent est attribué — jamais réutilisé. Dès lors, chaque copie du fichier porte cet identifiant et renvoie à l'unique registre faisant autorité.",
    "govCertTitle": "Certificat de gouvernance",
    "govCertBody": "La preuve que la chaîne d'approbation a été satisfaite — les bureaux, dans l'ordre, qui ont autorisé la publication.",
    "presCertTitle": "Certificat de préservation",
    "presCertBody": "La preuve que le registre a été scellé pour la permanence — avec son horizon de conservation ({year}) et une empreinte inviolable.",
    "evidenceLabel": "Chaîne de preuve en ajout seul",
    "evidence": [
      {
        "t": "Soumis",
        "d": "le brouillon entre en gouvernance"
      },
      {
        "t": "Gouverné",
        "d": "la politique d'approbation est déterminée pour ce type de document"
      },
      {
        "t": "Révisé",
        "d": "le Conseiller juridique consigne sa révision"
      },
      {
        "t": "Approuvé",
        "d": "le Directeur de la santé publique approuve"
      },
      {
        "t": "Autorisé",
        "d": "le Secrétaire permanent autorise la publication"
      },
      {
        "t": "Publié",
        "d": "le registre reçoit un identifiant permanent"
      },
      {
        "t": "Certifié",
        "d": "les certificats de gouvernance et de préservation sont scellés"
      },
      {
        "t": "Préservé",
        "d": "scellé pour l'horizon de conservation de l'institution"
      }
    ],
    "evidenceNote": "Chaque action est horodatée et ne peut pas être modifiée discrètement.",
    "verifiedTitle": "Vérifié — Registre officiel",
    "verifiedSub": "Quiconque détient une copie peut le confirmer, sans compte.",
    "fRecordId": "ID du Registre officiel",
    "fInstitution": "Institution",
    "fStatus": "Statut",
    "fIntegrityHash": "Empreinte d'intégrité",
    "ctaVerify": "Vérifier un registre réel"
  },
  "notFound": {
    "eyebrow": "404 · Page introuvable",
    "title": "Ce registre n'est pas ici.",
    "lead": "La page que vous avez suivie a été déplacée ou n'a jamais existé. Rien n'a été perdu — chaque Registre officiel publié conserve une adresse permanente. Voici où la plupart des visiteurs se rendent.",
    "dests": [
      {
        "label": "Connaissances",
        "sub": "Les concepts derrière la publication gouvernée"
      },
      {
        "label": "Bibliothèque",
        "sub": "Guides approfondis et références"
      },
      {
        "label": "Secteurs",
        "sub": "À qui s'adresse Sovereign Dispatch"
      },
      {
        "label": "Vérifier un registre",
        "sub": "Confirmer qu'un Registre officiel est authentique"
      }
    ],
    "home": "Retour à la page d'accueil"
  }
};
