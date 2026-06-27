// Hinnoittelusivun tekstiluettelo (suomi). Rakenteellinen data (käyttöönotto-
// kuvakkeiden tyypit, CTA-reitit, mikä taso on korostettu) pysyy sivulla; jokainen
// ihmisen luettava merkkijono on täällä, jotta sivu on täysin käännettävissä.
// Hinnat säilyttävät valuuttatunnuksensa (US$299), mutta sanahinnat (Free,
// Custom, From …) käännetään.

import type { PricingCopy } from "./pricing";

export const PRICING_FI: PricingCopy = {
  eyebrow: "Hinnoittelu",
  title: "Hinnoiteltu kuin institutionaalinen infrastruktuuri — ei koskaan käyttäjäkohtaisesti.",
  lead: "Dispatch ei ole asiakirjavarasto eikä allekirjoitustyökalu, eikä sitä hinnoitella sellaisena. Maksat hallinnosta, vallasta, vaatimustenmukaisuudesta, suvereniteetista ja käyttöönotosta — kyvyistä, joissa instituutiolla ei ole varaa epäonnistua. Lisää jokainen olennainen työntekijä; arvo on infrastruktuurissa, ei kirjautumisten määrässä.",
  ctaStart: "Aloita ilmainen arviointi",
  ctaPackage: "Arviointipaketti",
  startNote: "Ei myyntipuhelua aloittamiseen · päivitä, kun otat käyttöön",
  payForLabel: "Maksat siitä, mitä on",
  neverForLabel: "Et koskaan maksa siitä, mitä on",
  chargeFor: ["Hallinto", "Institutionaalinen valta", "Vaatimustenmukaisuus", "Suvereniteetti", "Käyttöönottomalli", "Tukitaso", "API-integraatio"],
  neverFor: ["Käyttäjäpaikka", "Käyttäjä", "Tallennustila", "PDF-tiedostot", "Asiakirjat tiedostoina"],
  usersTitle: "Rajaton määrä institutionaalisia käyttäjiä.",
  usersBody: "Dispatch lisensioidaan instituutioille — ei yksittäisille työntekijöille. Lisää jokainen virkamies, tarkastaja, julkaisija ja ylläpitäjä ilman paikkakohtaista hinnoittelua. Kahdeksantuhannen hengen ministeriötä ei koskaan laskuteta 8 000 tilistä, joille harvoin kirjaudutaan. Tämä erottaa Dispatchin tuotteista Microsoft 365, Google Workspace ja Atlassian: sinua ei veroteta siitä, että annat ihmisten tehdä työnsä.",
  plansTitle: "Suunnitelmat",
  plansLead: "Polku on tarina: arvioi, pyöritä yhtä instituutiota, skaalaa moneen osastoon, integroi yritys ja omista sitten alusta oman lainkäyttövaltasi alla. Jokainen askel perii kaiken alapuolellaan olevan.",
  mostChosen: "Useimmin valittu",
  deploymentLabel: "Käyttöönotto",
  plansFootnote: "Jokainen suunnitelma sisältää rajattoman määrän institutionaalisia käyttäjiä — sinua ei koskaan laskuteta paikkakohtaisesti. Suunnitelmat eroavat hallinnon, käyttöönoton, identiteetti-integraation, API-läpäisyn ja tuen, eivät henkilömäärän tai tallennustilan mukaan. Enterprise ja Sovereign määritellään instituutiokohtaisesti; ”From” on lähtökohta, ei tarjous, ja SLA, sijainti ja toimeksiantoehdot sovitaan arvioinnin aikana.",
  tiers: [
    { name: "Arviointi", price: "Ilmainen", purpose: "Arvioi Dispatch alusta loppuun.", audience: "Tuotteen arviointi", deployment: ["Hallinnoitu pilvi"], includes: ["Enintään 5 käyttäjää", "10 hallittua julkaisua", "Vesileimattu — ei virallinen tietue"], ctaLabel: "Aloita ilmaiseksi" },
    { name: "Institutionaalinen", price: "US$299", cadence: "/kk", purpose: "Pyöritä yhtä instituutiota tuotantotason hallinnolla.", audience: "Kansalaisjärjestöt · kunnat · koulut · pienyritykset", deployment: ["Hallinnoitu pilvi"], includes: ["Rajaton määrä institutionaalisia käyttäjiä", "500 hallittua julkaisua / kk", "Yksi instituutio", "SSO-valmis", "Sähköpostituki"], ctaLabel: "Aloita ilmaiseksi" },
    { name: "Institutionaalinen Plus", price: "US$999", cadence: "/kk", purpose: "Operoi useita osastoja yritystason valvonnalla ja edistyneellä hallinnolla.", carry: "Kaikki Institutionaalisesta, ja lisäksi", audience: "Yliopistot · sairaalat · keskisuuret · virastot", deployment: ["Hallinnoitu pilvi", "Yksityinen pilvi"], includes: ["Rajaton määrä hallittuja julkaisuja", "Useita osastoja · toimistohierarkia", "Edistyneet hallintokäytännöt", "Analytiikka ja johdon kojelauta", "Etusijatuki"], ctaLabel: "Aloita ilmaiseksi" },
    { name: "Enterprise", price: "Alkaen US$3,500", cadence: "/kk", purpose: "Yhdistä Dispatch identiteetti-, infrastruktuuri- ja vaatimustenmukaisuusympäristöösi.", carry: "Kaikki Institutionaalinen Plus -tasosta, ja lisäksi", audience: "Ministeriöt · kansalliset virastot · suuret yritykset", deployment: ["Hallinnoitu", "Yksityinen", "Paikan päällä"], includes: ["SSO — Azure AD · Okta", "Tarkastusvientien", "Korkea käytettävyys ja SLA", "Yritystuki", "Oma käyttöönottoperehdytys"], ctaLabel: "Ota yhteyttä" },
    { name: "Sovereign", price: "Räätälöity", cadence: "toimeksianto", purpose: "Omista koko alusta lainkäyttövaltasi alla.", carry: "Kaikki Enterprise-tasosta, ja lisäksi", audience: "Valtiot · keskuspankit · puolustus · korkeimmat oikeudet · vaalilautakunnat", deployment: ["Suvereeni isännöinti", "Eristetty verkko", "Paikan päällä"], includes: ["Lähdekoodin talletus (jos neuvoteltu)", "Räätälöidyt integraatiot", "Migraatio ja koulutus", "Oma tuki", "Valkohansikaskäyttöönotto"], ctaLabel: "Ota yhteyttä" },
  ],
  includedTitle: "Jokainen maksullinen suunnitelma sisältää",
  includedLead: "Koko hallintoalusta ei ole koskaan lisäosa. Jokainen tuotantosuunnitelma kantaa täydellisen luottamusketjun — valvonnan, todisteen, sertifikaatit, eheyden ja tarkastuksen.",
  includedItems: ["Hallinnon valvonta", "Todisteketju", "Hallintosertifikaatit", "Säilytyssertifikaatit", "Kryptografinen eheys", "Täydellinen tarkastushistoria", "Rajaton määrä institutionaalisia käyttäjiä", "REST API", "Dokumentaatio"],
  apiTitle: "API on oma tuotteensa.",
  apiLead: "Hallinto, julkaisu, sertifiointi ja säilytys palveluina — integraatiolähtöiselle ostajalle, joka kuluttaa moottoria lisensoimatta konsolia. Alustasuunnitelmat sisältävät jo API:n kohtuukäytöllä.",
  apiTiers: [
    { name: "Kehittäjä", price: "Ilmainen", lines: ["Hiekkalaatikko", "500 API-kutsua / kk"] },
    { name: "API Professional", price: "US$199", cadence: "/kk", lines: ["50 000 API-kutsua", "OAuth · webhookit", "Tuki"] },
    { name: "API Enterprise", price: "Räätälöity", lines: ["Rajattomat kutsut", "Räätälöity hinta ja ehdot"] },
  ],
  apiDevLink: "Kehittäjäalusta",
  apiTalkLink: "Ota yhteyttä",
  implTitle: "Tarvitsetko käyttöönotto-, migraatio- tai hallintokonsultointia?",
  implBody: "Käyttöönottotiimimme auttaa instituutioita suunnittelemaan hallintomalleja, migroimaan olemassa olevia julkaisutyönkulkuja, integroimaan identiteetintarjoajia ja ottamaan Dispatchin käyttöön hallinnoiduissa, yksityisissä, paikan päällä toimivissa tai suvereeneissa ympäristöissä.",
  implCta: "Keskustele käyttöönottotiimimme kanssa",
  closeTitle: "Valmiina arvioimaan Dispatchin?",
  closeBody: "Lataa täydellinen hankintapaketti, tutustu tietoturva-arkkitehtuuriin, tutki käyttöönottovaihtoehtoja tai käynnistä arviointiympäristö minuuteissa.",
  closeLaunch: "Käynnistä arviointi",
  closePackage: "Lataa hankintapaketti",
  linkArchitecture: "Arkkitehtuuri",
  linkSecurity: "Tietoturva",
  linkDeployment: "Käyttöönottovaihtoehdot",
};
