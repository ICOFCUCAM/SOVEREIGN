// Yhdistetty tekstiluettelo pienemmille markkinointisivuille (Trust, Platform,
// Standard) suomeksi. Yksi tiedosto kieltä kohden kääntää kaikki kolme.
// Rakenteellinen data (osioindeksit, kuvakkeet, reitit, koodinäytteet,
// tuotenimet) pysyy sivuilla.

import type { MarketingCopy } from "./marketing";

export const MARKETING_FI: MarketingCopy = {
  trust: {
    eyebrow: "Ota käyttöön luottavaisin mielin",
    titleA: "Sinun tietueesi. Sinun lainkäyttövaltasi.",
    titleB: "Sinun irtautumisesi, taattuna.",
    lead: "Sitoutuminen julkaisualustaan on suvereniteettipäätös. Sovereign Dispatch on rakennettu niin, että instituutio pysyy hallinnassa — datasta, käyttöönotosta ja kyvystä kävellä pois kaikki tallella.",
    ownership: {
      kicker: "Omistajuus", title: "Sinä omistat tietueesi — me olemme niiden tallettaja.",
      sub: "Alusta tallentaa ja hallitsee tietueitasi. Se ei koskaan omista niitä, ei käytä niitä uudelleen muuhun tarkoitukseen eikä kouluta mitään niillä.",
      cards: [
        { title: "Datasi on sinun", body: "Jokainen asiakirja, versio, artefakti ja sertifikaatti kuuluu instituutiollesi — ei alustalle." },
        { title: "Vuokralaisen eristys", body: "Rivitason tietoturva, jossa oletuksena evätään. Puuttuva vuokralaisväite evää; dataasi ei koskaan sekoiteta muuhun." },
        { title: "Ei toissijaista käyttöä", body: "Ei louhintaa, ei profilointia, ei mallien koulutusta, ei datan jakamiseen perustuvaa liiketoimintamallia. Ei koskaan." },
        { title: "Jokainen pääsy tarkastettu", body: "Toimitukset, päätökset, julkaisut ja haut tallennetaan vain liittävään, tiivisteleimattuun jäljitysketjuun." },
      ],
    },
    continuity: {
      kicker: "Jatkuvuus ja irtautuminen", title: "Voit lähteä milloin tahansa — kaiken kanssa.",
      sub: "Vahvin luottamussignaali, jonka alusta voi tarjota, on puhdas irtautuminen. Ei ole lukkiutumista, josta tarvitsisi suunnitella ulospääsy.",
      cards: [
        { title: "Ei suljettuja muotoja", body: "Strukturoidut tietueet, vakiomuotoiset PDF- / DOCX- / Markdown-artefaktit ja vakiomuotoinen PostgreSQL-varasto. Mitään ei jää loukkuun." },
        { title: "Täysi vienti pyydettäessä", body: "Vie tietueet, versiot, artefaktit sekä hallinto- ja säilytyssertifikaatit milloin tahansa haluat." },
        { title: "Siirrettävä käyttöönotto", body: "Sama alusta toimii hallinnoituna, sinun pilvessäsi, paikan päällä tai eristetyssä verkossa — siirrä kokonaisuutesi ilman alustan vaihtoa." },
        { title: "Jos tarjoaja katoaisi", body: "Säilytät jokaisen tietueen, artefaktin ja sertifikaatin avoimissa muodoissa ja voit ajaa tai migroida alustan itse. Jatkuvuus ei riipu meistä." },
      ],
    },
    accountability: {
      kicker: "Vastuuvelvollisuus", title: "Selkeä vastuun jakolinja.",
      sub: "Hankinta- ja riskitiimien on tiedettävä tarkalleen, kuka on vastuussa mistäkin. Tulkinnanvaraisuutta ei ole.",
      securesLabel: "Alusta turvaa",
      secures: ["Vuokralaisen eristyksen ja pääsynhallinnan", "Salauksen levossa ja siirrossa", "Vain liittävän tarkastuksen eheyden", "Säilytyksen eheyden (SHA-256-todisteet)", "Hallinnon valvonnan — moottoria ei voi ohittaa", "Palvelun käytettävyyden ja palautuksen"],
      controlsLabel: "Instituutiosi hallitsee",
      controls: ["Kuka pitää kutakin hallintovaltaa", "Hyväksyntäketjut, päätösvaltaisuudet ja käytännöt", "Tietueiden luokittelun ja selvityksen", "Säilytyshorisontit", "Kuka pitää tunnuksia ja niiden laajuudet", "Käyttöönottomallin ja datan sijainnin"],
    },
    evidence: {
      kicker: "Todiste", title: "Todistettavaa, ei luvattua.",
      sub: "Käyttöönoton luottamuksen tulisi nojata siihen, mikä on todennettavissa arvioinnin aikana — ei markkinointiväitteisiin.",
      ctaProcurement: "Hankinta-aineisto", ctaEvidence: "Todisteet ja kyvyt",
    },
  },
  platform: {
    overview: {
      kicker: "Yleiskatsaus", title: "Tiedosta tulee virallinen tietue.",
      sub: "Dispatch on institutionaalinen kerros luonnoksen ja julkaistun asiakirjan välissä. Jokainen artefakti — selvitys, hallitusaineisto, sääntelyilmoitus — toimitetaan strukturoituna datana, hallitaan hyväksynnän kautta, renderöidään tarkaksi PDF/DOCX-tiedostoksi ja julkaistaan pysyvällä, tarkastettavalla alkuperäjäljellä.",
      cards: [
        { title: "Ei tekstinkäsittelyohjelma", body: "Asiakirjat ovat strukturoitua dataa (DDM), tyyppikohtaisesti validoituja ja kehystettyjä — ei vapaamuotoisia tiedostoja. Muoto on sopimus." },
        { title: "Hallittu, ei vain tuotettu", body: "Submit → Approve → Render → Publish. Mikään ei pääse tietueeseen läpäisemättä hyväksyntäkäytäntöään." },
        { title: "Suvereeni rakenteeltaan", body: "Vuokralaiseristetty, sijaintitietoinen, vain liittävä tarkastus. Rakennettu instituutioille, jotka eivät voi epäonnistua." },
      ],
    },
    capabilities: {
      kicker: "Kyvyt", title: "Yksi putki, jokainen virallinen asiakirja.",
      sub: "Mallit ja validointi asiakirjatyypeittäin; deterministinen, luokitteluvyöhykkeinen renderöinti painolaatuiseksi tulosteeksi.",
      cards: [
        { title: "Asiakirjatyypit", body: "Johdon selvitykset, hallitusraportit, käytäntöasiakirjat, sääntelytoimitukset, operatiiviset paketit ja viralliset tietueet — kullakin oma vaadittu kehyksensä." },
        { title: "Monimuotorenderöinti", body: "Tarkka PDF (näkymätön moottori), DOCX ja Markdown yhdestä validoidusta lähteestä — palkit, sivunumerot, liitteet, allekirjoitukset." },
        { title: "Skeemavalidoitu", body: "Jokainen toimitus tarkistetaan DDM-skeemaa ja asiakirjatyyppikäytäntöä vastaan ennen renderöintiä — ei virheellisiä tietueita." },
        { title: "Mallit ja kehykset", body: "Tyyppitietoiset osioroolit ja lohkokäytännöt valvovat täydellisyyttä, jotta tuloste on yhdenmukainen koko instituutiossa." },
        { title: "Versioitu ja muuttumaton", body: "Jokainen versio säilytetään; julkaistut artefaktit ovat tiivisteleimattuja eikä niitä koskaan hiljaa muuteta." },
        { title: "Asynkroninen mittakaavassa", body: "Jonopohjainen renderöintikaista vaimentaa piikit ja suuret paketit estämättä toimittajia." },
      ],
    },
    workflow: {
      kicker: "Työnkulku", title: "Submit → Govern → Approve → Render → Publish → Retrieve.",
      sub: "Virallisen asiakirjan koko elinkaari, alustan valvomana.",
      steps: [
        { t: "Submit", b: "Strukturoitu DDM-hyötykuorma, validoitu sisääntulossa." },
        { t: "Govern", b: "Luokittelu + hyväksyntäkäytäntö ratkaistu." },
        { t: "Approve", b: "N-eyes-kuittaus; palvelukaistat hyväksyvät automaattisesti." },
        { t: "Render", b: "Tarkka PDF/DOCX tuotettu jonossa." },
        { t: "Publish", b: "Vapautettu tietueeseen; alkuperä sinetöity." },
        { t: "Retrieve", b: "Allekirjoitettu, pääsynhallittu artefaktin lataus." },
      ],
    },
    integrations: {
      kicker: "Integraatiot", title: "API, jonka päälle muut rakentavat.",
      sub: "Dispatch tarjoaa rajatun API-pääsyn kuluttajaa kohden ja ottaa asiakirjat vastaan vakaan REST-pinnan kautta.",
      apiTitle: "API:n provisiointi",
      apiBody: "Jokainen järjestelmä saa oman palveluasiakkaan — client_id + salaisuus eksplisiittisin laajuuksin (validate · render · read). Anna, rajaa ja peruuta kuluttajakohtaisesti.",
      estateTitle: "Rakennettu kokonaisuudelle",
      estateBody: "Kuluttajat toimittavat datansa ja Dispatch palauttaa virallisen tietueen — webhook-takaisinkutsuin renderöinnissä ja julkaisussa.",
      estateItems: ["Veritas — operatiiviset ja taloudelliset paketit", "ExitOS — hallituksen muistiot ja transaktioasiakirjat", "Sinun instituutiosi — saman REST-pinnan kautta"],
    },
  },
  standard: {
    eyebrow: "Kategorian määritelmä",
    title: "Sovereign Dispatch -standardi",
    lead: "Instituutio ei ota käyttöön julkaisutyökalua. Se ottaa käyttöön standardin sille, miten viralliset tietueet syntyvät, todistetaan ja säilytetään. Nämä ovat ne käsitteet, jotka standardi määrittää.",
    sectionKicker: "Standardi",
    sectionTitle: "Kuusi institutionaalista käsitettä.",
    sectionSub: "Jokainen on institutionaalisten tietueiden toimintastandardin rakennuspalikka — ei ominaisuus vaan määritelmä.",
    defs: [
      { term: "Virallinen tietue", one: "Hallittu, versioitu, luokiteltu institutionaalinen tietueasiakirja.", def: "Ei tiedosto. Virallinen teko, luotu valvotun hallintokäytännön nojalla, kuljetettu muuttumattoman elinkaaren läpi — Created → Governed → Approved → Published → Preserved — pysyvällä, todistettavalla identiteetillä.", props: ["Vakaa tietuenumero", "Luokittelu ja selvitys", "Muuttumattomat versiot", "Yksi kanoninen muoto"] },
      { term: "Hallintokäytäntö", one: "Toimeenpantava sääntö sille, miten tietueluokkaa hallitaan.", def: "Nimetty, versioitu käytäntö, joka on sidottu tietuetyyppiin: järjestetty valtaketju, vaihekohtainen päätösvaltaisuus, julkaisuvalta, säilytys ja vanheneminen. Käytäntö ei kuvaa työnkulkua — se hallitsee sitä.", props: ["Järjestetty hyväksyntäketju", "Vaihekohtainen päätösvaltaisuus", "Julkaisuvalta", "Versioitu ja valvottu"] },
      { term: "Julkaisuvalta", one: "Nimetty valta, jolla on oikeus vapauttaa tietuetietue.", def: "Julkaisu ei ole painike, jota kuka tahansa saa painaa. Se on varattu tietylle hallintoroolille, validoitu vapautushetkellä — eikä tietueen hyväksyjä saa koskaan olla sen julkaisija.", props: ["Roolisidonnainen", "Validoitu julkaisuhetkellä", "Vastuiden eriyttäminen"] },
      { term: "Hallintosertifikaatti", one: "Kryptografinen todiste siitä, että julkaisu täytti käytäntönsä.", def: "Sinetöity julkaisussa: käytäntö ja sen versio, vaadittu ketju verrattuna siihen, kuka sen tosiasiassa täytti järjestyksessä, käytetyt delegoinnit, julkaisuvalta ja eheystodiste — COMPLIANT-tuomio, joka voidaan todentaa riippumattomasti.", props: ["Vaadittu vs. toteutunut ketju", "Järjestetty hyväksyntäjärjestys", "Eheystodiste", "Vaatimustenmukaisuustuomio"] },
      { term: "Säilytyssertifikaatti", one: "Peukalointi paljastava todiste siitä, että tietue on pysyvästi sinetöity.", def: "Annettu, kun tietue arkistoidaan: säilytysaikaleima ja SHA-256-eheystodiste kanonisesta tietueesta. Arkistoitu tila on lopullinen — muokkaus, peruutus tai uudelleenjulkaisu ei ole mahdollista.", props: ["SHA-256-eheystodiste", "Säilytysaikaleima", "Lopullinen ja muuttumaton"] },
      { term: "Todisteketju", one: "Katkeamaton, vain liittävä jälki luomisesta säilytykseen.", def: "Jokainen teko — toimitus, kukin päätös, käytännön täyttyminen, julkaisu ja säilytys — tallennettuna muuttumattomaan, tiivisteleimattuun jälkeen. Instituutio voi todistaa, paitsi mitä tietue sanoo, myös tarkalleen miten se syntyi.", props: ["Vain liittävä", "Tiivisteleimattu", "Luominen → säilytys", "Riippumattomasti tarkastettavissa"] },
    ],
    closeTitleA: "Kun kategoria syntyy,",
    closeTitleB: "standardilla on enemmän merkitystä kuin ominaisuuksilla.",
    closeBody: "Sovereign Dispatch ei ole parempi tapa julkaista asiakirjoja. Se on institutionaalisten tietueiden toimintastandardi — ja instituutio, joka ottaa standardin käyttöön, omaksuu hallitsemisen tavan, joka kestää yhtäkään yksittäistä järjestelmää pidempään.",
    ctaArtifacts: "Katso artefaktit", ctaPath: "Löydä polkusi",
  },
};
