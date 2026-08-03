import type { Marketing7Copy } from "./marketing7";

export const MARKETING7_SV: Marketing7Copy = {
  "journey": {
    "eyebrow": "Beredskapsresan",
    "title": "Var börjar er institution?",
    "lead": "Ange er institution och få på några sekunder en skräddarsydd startpunkt — drift, styrning och policy.",
    "profiles": [
      {
        "name": "Regering / Ministerium",
        "lede": "Register på kabinettsnivå under datalokaliserings-krav.",
        "deployment": "Suverän drift eller lokalt, inom jurisdiktionen",
        "governance": "Ministeriell kedja i flera steg — Direktör → Generalsekreterare → Chefssekreterare, med publiceringsbefogenhet för kommunikation",
        "policy": "Egna policyer per registertyp med lång lagring och klassificeringskontroll",
        "records": [
          "Kabinettspromemoria",
          "Ministerrapport",
          "Policydokument",
          "Regulatoriskt Svar"
        ]
      },
      {
        "name": "Universitet",
        "lede": "Senatsbeslut och akademiska register av bestående värde.",
        "deployment": "Privat moln i er egen miljö",
        "governance": "Senatsstyrning med Registrators publiceringsbefogenhet",
        "policy": "Besluts- och rapportpolicyer med permanent bevarande",
        "records": [
          "Akademiskt Senatsbeslut",
          "Styrelserapport",
          "Forskningsdossier",
          "White Paper"
        ]
      },
      {
        "name": "Sjukhus",
        "lede": "Kliniska direktiv som måste styras och kunna granskas.",
        "deployment": "Privat moln eller lokalt, kliniskt isolerat",
        "governance": "Klinisk styrning med den Medicinska Direktörens godkännande",
        "policy": "Direktivpolicyer med fullständig revisionslagring",
        "records": [
          "Kliniskt Direktiv",
          "Lägesrapport",
          "Riskrapport",
          "Styrelserapport"
        ]
      },
      {
        "name": "Tillsynsmyndighet",
        "lede": "Kungörelser som i sig är rättsligt bevis.",
        "deployment": "Suverän eller förvaltad, beviskvalitet",
        "governance": "Juridisk granskningskedja med Kommissionärens befogenhet",
        "policy": "Kungörelsepolicyer med lagstadgade lagringstider",
        "records": [
          "Regulatorisk Kungörelse",
          "Regulatoriskt Svar",
          "Policydokument",
          "Revisionsrapport"
        ]
      },
      {
        "name": "Företag",
        "lede": "Styrelse- och ledningsregister som kräver bevisbar styrning.",
        "deployment": "Förvaltat eller privat moln",
        "governance": "Styrelse-/ledningskedja med definierad publiceringsbefogenhet",
        "policy": "Styrelsebesluts- och efterlevnadspolicyer med revisionslagring",
        "records": [
          "Styrelserapport",
          "Strategisk Promemoria",
          "Due Diligence-rapport",
          "Investeraruppdatering"
        ]
      }
    ],
    "recommended": "Rekommenderad startpunkt",
    "labels": {
      "deployment": "Drift",
      "governance": "Styrning",
      "policy": "Policy",
      "records": "Registertyper att styra först"
    },
    "ctaPackage": "Bygg utvärderingspaketet",
    "ctaTrust": "Varför det är tryggt att införa",
    "selectHint": "Välj en institutionstyp ovan för att se dess rekommenderade startpunkt."
  },
  "gallery": {
    "eyebrow": "Artefakterna",
    "title": "Vad en institution faktiskt innehar.",
    "lead": "När ett register har passerat Sovereign Dispatch innehar institutionen fyra saker — inte en fil, utan bevis. Detta är de verkliga artefakttyper plattformen producerar.",
    "kicker": "Galleri",
    "sectionTitle": "Fyra artefakter, ett register.",
    "sectionSub": "Ett officiellt register och de tre bevis som följer med det.",
    "specimen": "Specimen",
    "officialTitle": "Officiellt register",
    "docTitle": "Finanspolitiskt läge Q3 — Ministeriell Briefing",
    "docSub": "Ministerrapport",
    "fRecordNo": "Register nr",
    "fClassification": "Klassificering",
    "fLifecycle": "Livscykel",
    "fVersion": "Version",
    "vLifecycle": "Publicerad · Bevarad",
    "govTitle": "Styrningscertifikat",
    "govPolicy": "Policy för Ministeriella Briefingar",
    "compliant": "UPPFYLLD",
    "chain": [
      "Direktör",
      "Generalsekreterare",
      "Kommunikationskontoret"
    ],
    "fApprovals": "Godkännanden",
    "vApprovals": "2 / 2 i ordning",
    "fSod": "Åtskillnad av uppgifter",
    "vSod": "Upprätthållen",
    "fIntegrity": "Integritetsbevis",
    "presTitle": "Bevarandecertifikat",
    "presHead": "Förseglad institutionell artefakt",
    "fRecordHash": "Register-hash",
    "fPublished": "Publicerad",
    "fArchived": "Arkiverad",
    "presNote": "Slutgiltig och oföränderlig — ingen redigering, återkallelse eller ompublicering.",
    "auditTitle": "Revisionsbevis",
    "auditHead": "Append-only-händelsespår",
    "footnote": "Specimenvärden från ett referensregister. Er institutions register bär samma fyra artefakter — genererade automatiskt, helt ägda av er.",
    "closing": "Ett register är inte längre en fil. Det är bevis.",
    "cta": "Dispatch-standarden"
  },
  "walkthrough": {
    "eyebrow": "Se ett styrt register",
    "title": "Se ett dokument bli officiellt.",
    "lead": "Följ en publicering genom den styrda livscykeln — från ett vanligt utkast till ett certifierat, verifierbart officiellt register. Ett illustrativt exempel; ämbetena, certifikaten och beviskedjan speglar den verkliga motorn.",
    "steps": [
      {
        "kicker": "01 · Utkast",
        "title": "Ett dokument skrivs."
      },
      {
        "kicker": "02 · Styrning",
        "title": "Dess godkännandekedja bestäms."
      },
      {
        "kicker": "03 · Godkännande",
        "title": "Ämbetena signerar, i ordning."
      },
      {
        "kicker": "04 · Publicering",
        "title": "Det blir ett officiellt register."
      },
      {
        "kicker": "05 · Certifiering",
        "title": "Dess bevis förseglas."
      },
      {
        "kicker": "06 · Bevis",
        "title": "Varje steg registreras."
      },
      {
        "kicker": "07 · Verifiering",
        "title": "Vem som helst kan bekräfta det — för alltid."
      }
    ],
    "back": "Tillbaka",
    "next": "Nästa",
    "replay": "Spela upp igen",
    "sampleTitle": "Nationell Barnvaccinationspolicy",
    "sampleInstitution": "Hälsoministeriet",
    "sampleDocType": "Exekutiv Policybriefing",
    "draftLabel": "Utkast",
    "draftSections": [
      "Sammanfattning",
      "Nyckelbedömningar",
      "Analys",
      "Rekommendation"
    ],
    "draftNote": "Ett vanligt utkast — vid denna punkt är det bara en fil. Den bär ännu ingen auktoritet. Styrningen är det som kommer att göra den officiell.",
    "policyLabel": "Bestämd godkännandepolicy",
    "policyBody": "För en Exekutiv Policybriefing vid denna institution kräver styrningsmotorn denna auktoritetskedja — i ordning. Inget publiceras förrän varje ämbete har agerat.",
    "chain": [
      {
        "office": "Policyanalytiker",
        "act": "Utarbetad"
      },
      {
        "office": "Juridisk Rådgivare",
        "act": "Juridisk granskning"
      },
      {
        "office": "Direktör för Folkhälsa",
        "act": "Godkänd"
      },
      {
        "office": "Statssekreterare",
        "act": "Auktoriserad"
      }
    ],
    "approvedLabel": "Auktoritetskedjan uppfylld",
    "approvedBody": "Varje ämbete agerar i tur och ordning. Den som lämnar in kan inte godkänna sitt eget arbete; varje signatur kan hänföras till det ämbete som bär auktoriteten.",
    "publishedLabel": "Publicerad — Officiellt register",
    "recordIdLabel": "Permanent register-ID",
    "publishedBody": "En permanent identifierare tilldelas — återanvänds aldrig. Härifrån bär varje kopia av filen detta id och pekar tillbaka till det enda auktoritativa registret.",
    "govCertTitle": "Styrningscertifikat",
    "govCertBody": "Bevis på att godkännandekedjan uppfylldes — ämbetena, i ordning, som auktoriserade publiceringen.",
    "presCertTitle": "Bevarandecertifikat",
    "presCertBody": "Bevis på att registret förseglades för beständighet — med dess lagringshorisont ({year}) och en manipulationssäker hash.",
    "evidenceLabel": "Append-only-beviskedja",
    "evidence": [
      {
        "t": "Inlämnad",
        "d": "utkastet träder in i styrningen"
      },
      {
        "t": "Styrd",
        "d": "godkännandepolicyn bestäms för denna dokumenttyp"
      },
      {
        "t": "Granskad",
        "d": "den Juridiska Rådgivaren antecknar sin granskning"
      },
      {
        "t": "Godkänd",
        "d": "Direktören för Folkhälsa godkänner"
      },
      {
        "t": "Auktoriserad",
        "d": "Statssekreteraren auktoriserar publiceringen"
      },
      {
        "t": "Publicerad",
        "d": "registret får en permanent identifierare"
      },
      {
        "t": "Certifierad",
        "d": "Styrnings- och Bevarandecertifikaten förseglas"
      },
      {
        "t": "Bevarad",
        "d": "förseglad för institutionens lagringshorisont"
      }
    ],
    "evidenceNote": "Varje handling tidsstämplas och kan inte ändras i tysthet.",
    "verifiedTitle": "Verifierad — Officiellt register",
    "verifiedSub": "Vem som helst med en kopia kan bekräfta detta, utan konto.",
    "fRecordId": "Officiellt register-ID",
    "fInstitution": "Institution",
    "fStatus": "Status",
    "fIntegrityHash": "Integritetshash",
    "ctaVerify": "Verifiera ett verkligt register"
  },
  "notFound": {
    "eyebrow": "404 · Sidan hittades inte",
    "title": "Det här registret finns inte här.",
    "lead": "Sidan ni följde har flyttats eller har aldrig funnits. Inget har gått förlorat — varje publicerat officiellt register behåller en permanent adress. Hit är de flesta på väg.",
    "dests": [
      {
        "label": "Kunskap",
        "sub": "Koncepten bakom styrd publicering"
      },
      {
        "label": "Bibliotek",
        "sub": "Djupgående guider och referenser"
      },
      {
        "label": "Branscher",
        "sub": "Vilka Sovereign Dispatch är byggt för"
      },
      {
        "label": "Verifiera ett register",
        "sub": "Bekräfta att ett officiellt register är äkta"
      }
    ],
    "home": "Tillbaka till startsidan"
  }
};
