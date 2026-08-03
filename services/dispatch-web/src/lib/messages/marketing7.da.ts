import type { Marketing7Copy } from "./marketing7";

export const MARKETING7_DA: Marketing7Copy = {
  "journey": {
    "eyebrow": "Parathedsrejsen",
    "title": "Hvor begynder jeres institution?",
    "lead": "Angiv jeres institution og modtag på sekunder et skræddersyet udgangspunkt — udrulning, governance og politik.",
    "profiles": [
      {
        "name": "Regering / Ministerium",
        "lede": "Registre på kabinetsniveau under datalokaliserings-krav.",
        "deployment": "Suveræn hosting eller on-premises, inden for jurisdiktionen",
        "governance": "Ministeriel kæde i flere trin — Direktør → Generalsekretær → Chefsekretær, med kommunikationens offentliggørelsesbeføjelse",
        "policy": "Særskilte politikker pr. registertype med lang opbevaring og klassifikationskontrol",
        "records": [
          "Kabinetsmemorandum",
          "Ministerrapport",
          "Politikpapir",
          "Regulatorisk Svar"
        ]
      },
      {
        "name": "Universitet",
        "lede": "Senatsbeslutninger og akademiske registre af varig værdi.",
        "deployment": "Privat sky i jeres eget miljø",
        "governance": "Senatsgovernance med Registratorens offentliggørelsesbeføjelse",
        "policy": "Beslutnings- og rapportpolitikker med permanent bevaring",
        "records": [
          "Akademisk Senatsbeslutning",
          "Bestyrelsesrapport",
          "Forskningsdossier",
          "White Paper"
        ]
      },
      {
        "name": "Hospital",
        "lede": "Kliniske direktiver, der skal styres og kunne revideres.",
        "deployment": "Privat sky eller on-premises, klinisk isoleret",
        "governance": "Klinisk governance med den Lægelige Direktørs godkendelse",
        "policy": "Direktivpolitikker med fuld revisionsopbevaring",
        "records": [
          "Klinisk Direktiv",
          "Situationsrapport",
          "Risikorapport",
          "Bestyrelsesrapport"
        ]
      },
      {
        "name": "Tilsynsmyndighed",
        "lede": "Meddelelser, der i sig selv er juridisk bevis.",
        "deployment": "Suveræn eller forvaltet, beviskvalitet",
        "governance": "Juridisk gennemgangskæde med Kommissærens beføjelse",
        "policy": "Meddelelsespolitikker med lovbestemte opbevaringsfrister",
        "records": [
          "Regulatorisk Meddelelse",
          "Regulatorisk Svar",
          "Politikpapir",
          "Revisionsrapport"
        ]
      },
      {
        "name": "Virksomhed",
        "lede": "Bestyrelses- og ledelsesregistre, der kræver bevislig governance.",
        "deployment": "Forvaltet eller privat sky",
        "governance": "Bestyrelses-/ledelseskæde med defineret offentliggørelsesbeføjelse",
        "policy": "Bestyrelsesbeslutnings- og compliancepolitikker med revisionsopbevaring",
        "records": [
          "Bestyrelsesrapport",
          "Strategisk Memorandum",
          "Due Diligence-rapport",
          "Investoropdatering"
        ]
      }
    ],
    "recommended": "Anbefalet udgangspunkt",
    "labels": {
      "deployment": "Udrulning",
      "governance": "Governance",
      "policy": "Politik",
      "records": "Registertyper, der først skal styres"
    },
    "ctaPackage": "Byg evalueringspakken",
    "ctaTrust": "Hvorfor det er trygt at indføre",
    "selectHint": "Vælg en institutionstype ovenfor for at se dens anbefalede udgangspunkt."
  },
  "gallery": {
    "eyebrow": "Artefakterne",
    "title": "Hvad en institution faktisk besidder.",
    "lead": "Når et register har passeret Sovereign Dispatch, besidder institutionen fire ting — ikke en fil, men bevis. Dette er de virkelige artefakttyper, platformen producerer.",
    "kicker": "Galleri",
    "sectionTitle": "Fire artefakter, ét register.",
    "sectionSub": "Et officielt register og de tre beviser, der følger med det.",
    "specimen": "Prøveeksemplar",
    "officialTitle": "Officielt register",
    "docTitle": "Finanspolitisk stilling K3 — Ministeriel Briefing",
    "docSub": "Ministerrapport",
    "fRecordNo": "Register nr.",
    "fClassification": "Klassifikation",
    "fLifecycle": "Livscyklus",
    "fVersion": "Version",
    "vLifecycle": "Offentliggjort · Bevaret",
    "govTitle": "Governancecertifikat",
    "govPolicy": "Politik for Ministerielle Briefinger",
    "compliant": "OVERHOLDT",
    "chain": [
      "Direktør",
      "Generalsekretær",
      "Kommunikationskontoret"
    ],
    "fApprovals": "Godkendelser",
    "vApprovals": "2 / 2 i rækkefølge",
    "fSod": "Funktionsadskillelse",
    "vSod": "Håndhævet",
    "fIntegrity": "Integritetsbevis",
    "presTitle": "Bevaringscertifikat",
    "presHead": "Forseglet institutionelt artefakt",
    "fRecordHash": "Register-hash",
    "fPublished": "Offentliggjort",
    "fArchived": "Arkiveret",
    "presNote": "Endelig og uforanderlig — ingen redigering, tilbagetrækning eller genudgivelse.",
    "auditTitle": "Revisionsbevis",
    "auditHead": "Append-only hændelsesspor",
    "footnote": "Prøveværdier fra et referenceregister. Jeres institutions registre bærer de samme fire artefakter — genereret automatisk, fuldt ejet af jer.",
    "closing": "Et register er ikke længere en fil. Det er bevis.",
    "cta": "Dispatch-standarden"
  },
  "walkthrough": {
    "eyebrow": "Se et styret register",
    "title": "Se et dokument blive officielt.",
    "lead": "Følg én offentliggørelse gennem den styrede livscyklus — fra et almindeligt udkast til et certificeret, verificerbart officielt register. Et illustrativt eksempel; embederne, certifikaterne og beviskæden afspejler den virkelige motor.",
    "steps": [
      {
        "kicker": "01 · Udkast",
        "title": "Et dokument skrives."
      },
      {
        "kicker": "02 · Governance",
        "title": "Dets godkendelseskæde fastlægges."
      },
      {
        "kicker": "03 · Godkendelse",
        "title": "Embederne underskriver, i rækkefølge."
      },
      {
        "kicker": "04 · Offentliggørelse",
        "title": "Det bliver et officielt register."
      },
      {
        "kicker": "05 · Certificering",
        "title": "Dets bevis forsegles."
      },
      {
        "kicker": "06 · Bevis",
        "title": "Hvert trin registreres."
      },
      {
        "kicker": "07 · Verifikation",
        "title": "Enhver kan bekræfte det — for altid."
      }
    ],
    "back": "Tilbage",
    "next": "Næste",
    "replay": "Afspil igen",
    "sampleTitle": "National Børnevaccinationspolitik",
    "sampleInstitution": "Sundhedsministeriet",
    "sampleDocType": "Eksekutiv Politikbriefing",
    "draftLabel": "Udkast",
    "draftSections": [
      "Resumé",
      "Nøglevurderinger",
      "Analyse",
      "Anbefaling"
    ],
    "draftNote": "Et almindeligt udkast — på dette tidspunkt er det blot en fil. Den bærer endnu ingen autoritet. Governance er det, der vil gøre den officiel.",
    "policyLabel": "Fastlagt godkendelsespolitik",
    "policyBody": "For en Eksekutiv Politikbriefing ved denne institution kræver governancemotoren denne autoritetskæde — i rækkefølge. Intet offentliggøres, før hvert embede har handlet.",
    "chain": [
      {
        "office": "Politikanalytiker",
        "act": "Udarbejdet"
      },
      {
        "office": "Juridisk Rådgiver",
        "act": "Juridisk gennemgang"
      },
      {
        "office": "Direktør for Folkesundhed",
        "act": "Godkendt"
      },
      {
        "office": "Departementschef",
        "act": "Autoriseret"
      }
    ],
    "approvedLabel": "Autoritetskæden opfyldt",
    "approvedBody": "Hvert embede handler i rækkefølge. En indsender kan ikke godkende sit eget arbejde; hver signatur kan henføres til det embede, der bærer autoriteten.",
    "publishedLabel": "Offentliggjort — Officielt register",
    "recordIdLabel": "Permanent register-ID",
    "publishedBody": "Der tildeles en permanent identifikator — aldrig genbrugt. Herfra bærer hver kopi af filen dette id og peger tilbage på det ene autoritative register.",
    "govCertTitle": "Governancecertifikat",
    "govCertBody": "Bevis for, at godkendelseskæden blev opfyldt — embederne, i rækkefølge, som autoriserede offentliggørelsen.",
    "presCertTitle": "Bevaringscertifikat",
    "presCertBody": "Bevis for, at registret blev forseglet til varighed — med dets opbevaringshorisont ({year}) og en manipulationssikker hash.",
    "evidenceLabel": "Append-only beviskæde",
    "evidence": [
      {
        "t": "Indsendt",
        "d": "udkastet træder ind i governance"
      },
      {
        "t": "Styret",
        "d": "godkendelsespolitikken fastlægges for denne dokumenttype"
      },
      {
        "t": "Gennemgået",
        "d": "den Juridiske Rådgiver noterer sin gennemgang"
      },
      {
        "t": "Godkendt",
        "d": "Direktøren for Folkesundhed godkender"
      },
      {
        "t": "Autoriseret",
        "d": "Departementschefen autoriserer offentliggørelsen"
      },
      {
        "t": "Offentliggjort",
        "d": "registret modtager en permanent identifikator"
      },
      {
        "t": "Certificeret",
        "d": "Governance- og Bevaringscertifikaterne forsegles"
      },
      {
        "t": "Bevaret",
        "d": "forseglet i institutionens opbevaringshorisont"
      }
    ],
    "evidenceNote": "Enhver handling tidsstemples og kan ikke ændres i det stille.",
    "verifiedTitle": "Verificeret — Officielt register",
    "verifiedSub": "Enhver med en kopi kan bekræfte dette, uden konto.",
    "fRecordId": "Officielt register-ID",
    "fInstitution": "Institution",
    "fStatus": "Status",
    "fIntegrityHash": "Integritetshash",
    "ctaVerify": "Verificér et virkeligt register"
  },
  "notFound": {
    "eyebrow": "404 · Siden blev ikke fundet",
    "title": "Dette register er her ikke.",
    "lead": "Siden, du fulgte, er flyttet eller har aldrig eksisteret. Intet er gået tabt — hvert offentliggjort officielt register beholder en permanent adresse. Her er, hvor de fleste er på vej hen.",
    "dests": [
      {
        "label": "Viden",
        "sub": "Koncepterne bag styret offentliggørelse"
      },
      {
        "label": "Bibliotek",
        "sub": "Dybdegående vejledninger og referencer"
      },
      {
        "label": "Brancher",
        "sub": "Hvem Sovereign Dispatch er bygget til"
      },
      {
        "label": "Verificér et register",
        "sub": "Bekræft, at et officielt register er ægte"
      }
    ],
    "home": "Tilbage til forsiden"
  }
};
