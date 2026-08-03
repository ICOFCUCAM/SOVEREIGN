import type { Marketing7Copy } from "./marketing7";

export const MARKETING7_NO: Marketing7Copy = {
  "journey": {
    "eyebrow": "Beredskapsreise",
    "title": "Hvor begynner deres institusjon?",
    "lead": "Angi institusjonen deres og motta et skreddersydd utgangspunkt — utrulling, styring og policy — i løpet av sekunder.",
    "profiles": [
      {
        "name": "Myndighet / departement",
        "lede": "Dokumenter på regjeringsnivå under krav om datalokalisering.",
        "deployment": "Suveren drift eller lokal installasjon, innenfor jurisdiksjonen",
        "governance": "Flertrinns ministeriell kjede — direktør → generalsekretær → departementsråd, med publiseringsmyndighet hos kommunikasjonsavdelingen",
        "policy": "Egne policyer per dokumenttype med lang oppbevaring og klassifiseringskontroll",
        "records": [
          "Regjeringsnotat",
          "Ministeriell rapport",
          "Policynotat",
          "Regulatorisk svar"
        ]
      },
      {
        "name": "Universitet",
        "lede": "Senatsvedtak og akademiske dokumenter av varig verdi.",
        "deployment": "Privat sky i deres eget miljø",
        "governance": "Senatsstyring med publiseringsmyndighet hos studiedirektøren",
        "policy": "Vedtaks- og rapportpolicyer med permanent bevaring",
        "records": [
          "Akademisk senatsvedtak",
          "Styrerapport",
          "Forskningsdossier",
          "Hvitbok"
        ]
      },
      {
        "name": "Sykehus",
        "lede": "Kliniske direktiver som må være styrt og etterprøvbare.",
        "deployment": "Privat sky eller lokal installasjon, klinisk isolert",
        "governance": "Klinisk styring med godkjenning fra medisinsk direktør",
        "policy": "Direktivpolicyer med full revisjonsoppbevaring",
        "records": [
          "Klinisk direktiv",
          "Situasjonsrapport",
          "Risikorapport",
          "Styrerapport"
        ]
      },
      {
        "name": "Tilsynsmyndighet",
        "lede": "Varsler som i seg selv er juridiske bevis.",
        "deployment": "Suveren eller administrert, med bevisverdi",
        "governance": "Juridisk gjennomgangskjede med kommissærens myndighet",
        "policy": "Varselspolicyer med lovpålagte oppbevaringsplaner",
        "records": [
          "Regulatorisk varsel",
          "Regulatorisk svar",
          "Policynotat",
          "Revisjonsrapport"
        ]
      },
      {
        "name": "Virksomhet",
        "lede": "Styre- og lederdokumenter som krever påviselig styring.",
        "deployment": "Administrert eller privat sky",
        "governance": "Styre-/lederkjede med en definert publiseringsmyndighet",
        "policy": "Styrevedtaks- og etterlevelsespolicyer med revisjonsoppbevaring",
        "records": [
          "Styrerapport",
          "Strategisk notat",
          "Due diligence-rapport",
          "Investoroppdatering"
        ]
      }
    ],
    "recommended": "Anbefalt utgangspunkt",
    "labels": {
      "deployment": "Utrulling",
      "governance": "Styring",
      "policy": "Policy",
      "records": "Dokumenttyper som bør styres først"
    },
    "ctaPackage": "Bygg evalueringspakken",
    "ctaTrust": "Hvorfor det er trygt å ta i bruk",
    "selectHint": "Velg en institusjonstype ovenfor for å se anbefalt utgangspunkt."
  },
  "gallery": {
    "eyebrow": "Artefaktene",
    "title": "Hva en institusjon faktisk besitter.",
    "lead": "Etter at et dokument har passert gjennom Sovereign Dispatch, besitter institusjonen fire ting — ikke en fil, men bevis. Dette er de faktiske artefakttypene plattformen produserer.",
    "kicker": "Galleri",
    "sectionTitle": "Fire artefakter, ett register.",
    "sectionSub": "Et offisielt register og de tre bevisene som følger med det.",
    "specimen": "Prøveeksemplar",
    "officialTitle": "Offisielt register",
    "docTitle": "Finansiell stilling for 3. kvartal — ministeriell orientering",
    "docSub": "Ministeriell rapport",
    "fRecordNo": "Registernr.",
    "fClassification": "Klassifisering",
    "fLifecycle": "Livssyklus",
    "fVersion": "Versjon",
    "vLifecycle": "Publisert · Bevart",
    "govTitle": "Styringssertifikat",
    "govPolicy": "Policy for ministerielle orienteringer",
    "compliant": "I SAMSVAR",
    "chain": [
      "Direktør",
      "Generalsekretær",
      "Kommunikasjonsavdelingen"
    ],
    "fApprovals": "Godkjenninger",
    "vApprovals": "2 / 2 i rekkefølge",
    "fSod": "Funksjonsdeling",
    "vSod": "Håndhevet",
    "fIntegrity": "Integritetsbevis",
    "presTitle": "Bevaringssertifikat",
    "presHead": "Forseglet institusjonell artefakt",
    "fRecordHash": "Registerhash",
    "fPublished": "Publisert",
    "fArchived": "Arkivert",
    "presNote": "Endelig og uforanderlig — ingen redigering, tilbaketrekking eller republisering.",
    "auditTitle": "Revisjonsbevis",
    "auditHead": "Hendelsesspor med kun tilføyelser",
    "footnote": "Prøveverdier fra et referanseregister. Deres institusjons registre bærer de samme fire artefaktene — generert automatisk, fullt ut eid av dere.",
    "closing": "Et register er ikke lenger en fil. Det er bevis.",
    "cta": "Dispatch-standarden"
  },
  "walkthrough": {
    "eyebrow": "Se et styrt register",
    "title": "Se et dokument bli offisielt.",
    "lead": "Følg én publisering gjennom den styrte livssyklusen — fra et ordinært utkast til et sertifisert, verifiserbart offisielt register. Et illustrerende eksempel; kontorene, sertifikatene og beviskjeden speiler den virkelige motoren.",
    "steps": [
      {
        "kicker": "01 · Utkast",
        "title": "Et dokument skrives."
      },
      {
        "kicker": "02 · Styring",
        "title": "Godkjenningskjeden fastsettes."
      },
      {
        "kicker": "03 · Godkjenning",
        "title": "Kontorene signerer, i rekkefølge."
      },
      {
        "kicker": "04 · Publisering",
        "title": "Det blir et offisielt register."
      },
      {
        "kicker": "05 · Sertifisering",
        "title": "Beviset forsegles."
      },
      {
        "kicker": "06 · Bevis",
        "title": "Hvert trinn registreres."
      },
      {
        "kicker": "07 · Verifisering",
        "title": "Hvem som helst kan bekrefte det — for alltid."
      }
    ],
    "back": "Tilbake",
    "next": "Neste",
    "replay": "Spill av igjen",
    "sampleTitle": "Nasjonal policy for barnevaksinasjon",
    "sampleInstitution": "Helsedepartementet",
    "sampleDocType": "Policyorientering for ledelsen",
    "draftLabel": "Utkast",
    "draftSections": [
      "Sammendrag",
      "Hovedvurderinger",
      "Analyse",
      "Anbefaling"
    ],
    "draftNote": "Et ordinært utkast — på dette tidspunktet er det bare en fil. Det bærer ennå ingen autoritet. Styring er det som vil gjøre det offisielt.",
    "policyLabel": "Fastsatt godkjenningspolicy",
    "policyBody": "For en policyorientering for ledelsen ved denne institusjonen krever styringsmotoren denne myndighetskjeden — i rekkefølge. Ingenting publiseres før hvert kontor har handlet.",
    "chain": [
      {
        "office": "Policyanalytiker",
        "act": "Utarbeidet"
      },
      {
        "office": "Juridisk rådgiver",
        "act": "Juridisk gjennomgang"
      },
      {
        "office": "Direktør for folkehelse",
        "act": "Godkjent"
      },
      {
        "office": "Departementsråd",
        "act": "Autorisert"
      }
    ],
    "approvedLabel": "Myndighetskjeden oppfylt",
    "approvedBody": "Hvert kontor handler i rekkefølge. En innsender kan ikke godkjenne sitt eget arbeid; hver signatur kan spores til kontoret som innehar myndigheten.",
    "publishedLabel": "Publisert — offisielt register",
    "recordIdLabel": "Permanent register-ID",
    "publishedBody": "En permanent identifikator tildeles — den gjenbrukes aldri. Fra nå av bærer hver kopi av filen denne ID-en og peker tilbake til det ene autoritative registeret.",
    "govCertTitle": "Styringssertifikat",
    "govCertBody": "Bevis på at godkjenningskjeden ble oppfylt — kontorene, i rekkefølge, som autoriserte publiseringen.",
    "presCertTitle": "Bevaringssertifikat",
    "presCertBody": "Bevis på at registeret ble forseglet for varig bevaring — med sin oppbevaringshorisont ({year}) og en manipulasjonssikker hash.",
    "evidenceLabel": "Beviskjede med kun tilføyelser",
    "evidence": [
      {
        "t": "Innsendt",
        "d": "utkastet går inn i styringen"
      },
      {
        "t": "Styrt",
        "d": "godkjenningspolicyen fastsettes for denne dokumenttypen"
      },
      {
        "t": "Gjennomgått",
        "d": "juridisk rådgiver registrerer sin gjennomgang"
      },
      {
        "t": "Godkjent",
        "d": "direktøren for folkehelse godkjenner"
      },
      {
        "t": "Autorisert",
        "d": "departementsråden autoriserer publisering"
      },
      {
        "t": "Publisert",
        "d": "registeret mottar en permanent identifikator"
      },
      {
        "t": "Sertifisert",
        "d": "styrings- og bevaringssertifikatene forsegles"
      },
      {
        "t": "Bevart",
        "d": "forseglet for institusjonens oppbevaringshorisont"
      }
    ],
    "evidenceNote": "Hver handling er tidsstemplet og kan ikke endres i det stille.",
    "verifiedTitle": "Verifisert — offisielt register",
    "verifiedSub": "Enhver som har en kopi kan bekrefte dette, uten konto.",
    "fRecordId": "Offisiell register-ID",
    "fInstitution": "Institusjon",
    "fStatus": "Status",
    "fIntegrityHash": "Integritetshash",
    "ctaVerify": "Verifiser et ekte register"
  },
  "notFound": {
    "eyebrow": "404 · Siden ble ikke funnet",
    "title": "Dette registeret finnes ikke her.",
    "lead": "Siden du fulgte er flyttet eller har aldri eksistert. Ingenting er tapt — hvert publiserte offisielle register beholder en permanent adresse. Her er hvor de fleste er på vei.",
    "dests": [
      {
        "label": "Kunnskap",
        "sub": "Konseptene bak styrt publisering"
      },
      {
        "label": "Bibliotek",
        "sub": "Dyptgående veiledninger og referanser"
      },
      {
        "label": "Bransjer",
        "sub": "Hvem Sovereign Dispatch er bygget for"
      },
      {
        "label": "Verifiser et register",
        "sub": "Bekreft at et offisielt register er ekte"
      }
    ],
    "home": "Tilbake til forsiden"
  }
};
