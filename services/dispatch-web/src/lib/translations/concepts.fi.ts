// Aidot suomenkieliset käännökset käsitesivuista (kerros 3). Yksi versio kullekin
// kielelle — ei konekäännöstä ajon aikana. Vain täällä olevat slugit tarjoillaan
// osoitteesta /fi/learn/<slug>; kaikki muu pysyy englanninkielisenä käännökseen
// asti, jotta hreflang pysyy totuudenmukaisena. Yhteinen rakenne (kaavio,
// liittyvät linkit) on peräisin englanninkielisestä perustasta problems.ts-
// tiedostossa; nämä ovat lokalisoidut tekstikentät.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_FI: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Virallinen julkaisu",
    kicker: "Käsite",
    headline: "Mitä virallinen julkaisu on — ja mikä tekee siitä virallisen.",
    lead: "Kuka tahansa voi julkaista asiakirjan. Virallinen julkaisu on toista maata: se annetaan instituution vallan nojalla, ja sen aitous voidaan todistaa niin kauan kuin sillä on merkitystä.",
    definition: "Virallinen julkaisu on asiakirja, joka annetaan instituution — ei yksittäisen henkilön — vallan nojalla säädellyssä hyväksyntämenettelyssä ja tehdään pysyvästi todennettavaksi, niin että kuka tahansa voi varmistaa kyseessä olevan aidon, voimassa olevan version.",
    why: [
      "Sähköpostitse lähetetty PDF näyttää samalta riippumatta siitä, onko se hyväksytty lopullinen versio vai aikaisempi luonnos. Mikään tiedostossa ei osoita, kumpi niistä on kyseessä.",
      "Jos julkaisu riitautetaan vuosia myöhemmin — tuomioistuimessa, tarkastuksessa tai julkisuudessa — instituution on kyettävä todistamaan, kuka sen hyväksyi, missä järjestyksessä ja ettei tiedosto ole sen jälkeen muuttunut.",
      "Useimmat instituutiot eivät pysty tätä todistamaan: hyväksyntä eli sähköposteissa ja kokouksissa, ja julkaistu tiedosto on vain kopio, jolla ei ole pysyvää yhteyttä sen antaneeseen valtaan.",
    ],
    how: [
      { t: "Viraston antama, ei henkilön", d: "Sovereign Dispatch sitoo jokaisen julkaisun viran valtaan: se pysyy pätevänä, vaikka sen allekirjoittanut henkilö olisi siirtynyt pois." },
      { t: "Säädelty ennen julkaisua", d: "Ennen vapauttamista kulkee sitova hyväksyntäketju: virallinen versio on se, joka on käynyt hallinnon läpi, eikä mikään muu voi esiintyä virallisena." },
      { t: "Pysyvästi todennettavissa", d: "Jokainen julkaisu kantaa pysyvää tietuetunnusta ja eheystodistetta; kuka tahansa voi varmistaa sen olevan aito ja muuttumaton — ilman tiliä." },
    ],
    faqs: [
      { q: "Mikä on ero asiakirjan ja virallisen julkaisun välillä?", a: "Asiakirja on pelkkä tiedosto. Virallinen julkaisu annetaan instituution vallan nojalla säädellyssä menettelyssä ja on pysyvästi todennettavissa: voidaan todistaa, kuka sen antoi ja ettei se ole muuttunut." },
      { q: "Miten todistetaan, että julkaisu on virallinen?", a: "Vertaamalla sen pysyvää tietuetunnusta ja eheystodistetta antaneen instituution rekisteriin. Sovereign Dispatch tekee tämän mahdolliseksi kenelle tahansa ilman tiliä." },
      { q: "Tekevätkö allekirjoitus tai kirjelomake julkaisusta virallisen?", a: "Eivät. Allekirjoitus tai kirjelomake voidaan kopioida. Vasta viran valtaan sidottu valta yhdessä todennettavan eheystodisteen kanssa tekee julkaisusta todistettavasti virallisen." },
    ],
    metaTitle: "Mikä on virallinen julkaisu? Määritelmä ja todiste",
    metaDescription: "Virallinen julkaisu on asiakirja, joka annetaan instituution vallan nojalla säädellysti ja on pysyvästi todennettavissa. Lue, mikä tekee siitä virallisen.",
  },
  "evidence-chain": {
    term: "Todisteketju",
    kicker: "Eheys",
    headline: "Todisteketju, joka on olemassa ennen kuin kukaan sitä kysyy.",
    lead: "Todisteketju on katkeamaton todiste siitä, miten asiakirja hyväksyttiin ja annettiin — tallennettuna sitä mukaa kuin se tapahtuu, jotta siihen voi luottaa ratkaisevalla hetkellä.",
    definition: "Todisteketju on täydellinen, järjestetty ja peukaloinnilta suojattu todiste jokaisesta asiakirjan hyväksynnän ja julkaisun vaiheesta — kuka toimi, milloin ja missä versiossa — tallennettuna asiakirjan syntyessä eikä jälkikäteen rekonstruoituna.",
    why: [
      "Kun julkaisu kyseenalaistetaan, todisteen arvo riippuu täysin siitä, milloin se syntyi. Riitautuksen jälkeen kerätyt todisteet ovat heikkoja ja riitautettavissa.",
      "Useimmat organisaatiot luovat todisteen vasta, kun tarkastaja tai tuomioistuin sitä vaatii — ja kokoavat sähköposteja, hyväksyntöjä ja versioita aikapaineessa, aukkoineen.",
      "Jatkuvasti, oikeassa järjestyksessä ja muutosta vastaan sinetöitynä tallennettu todisteketju erottaa vallan todistamisen sen pelkästä väittämisestä.",
    ],
    how: [
      { t: "Tallennettu sitä mukaa kuin tapahtuu", d: "Jokainen hyväksyntävaihe tallennetaan sillä hetkellä, kun se tapahtuu, oikeassa järjestyksessä — ei koskaan myöhemmin rekonstruoituna." },
      { t: "Peukaloinnilta suojattu", d: "Ketju sinetöidään eheystodisteilla: jokainen myöhempi muutos on havaittavissa; todiste todentuu joko eheänä tai ei lainkaan." },
      { t: "Valmiina pyydettäessä", d: "Koska ketju on jo olemassa, vastaus tarkastukseen tai riitautukseen on haku, ei rekonstruktio." },
    ],
    faqs: [
      { q: "Mikä on todisteketju?", a: "Täydellinen, järjestetty ja peukaloinnilta suojattu todiste siitä, miten asiakirja hyväksyttiin ja annettiin — kuka toimi, milloin ja missä versiossa — tallennettuna sitä mukaa kuin se tapahtui." },
      { q: "Miksi todisteen ajankohdalla on merkitystä?", a: "Tapahtumien kuluessa syntynyt todiste on paljon kestävämpi kuin riitautuksen jälkeen koottu, joka on altis aukoille ja kiistalle." },
      { q: "Miten todisteketju pysyy peukaloinnilta suojattuna?", a: "Sinetöimällä jokainen vaihe kryptografisilla eheystodisteilla, niin että jokainen myöhempi muutos on todennettaessa havaittavissa." },
    ],
    metaTitle: "Mikä on todisteketju? Määritelmä ja ajankohdan merkitys",
    metaDescription: "Todisteketju on täydellinen, järjestetty ja peukaloinnilta suojattu todiste asiakirjan hyväksynnästä ja antamisesta, tallennettuna hetkessä. Miksi ajankohta ratkaisee.",
  },
  "document-authenticity": {
    term: "Asiakirjan aitous",
    kicker: "Eheys",
    headline: "Asiakirjan aitous, joka todistetaan, ei vain väitetä.",
    lead: "Asiakirjan aitous on ominaisuus olla todistettavasti aito — oikea asiakirja, antajansa antama, sen jälkeen muuttumaton. Useimmat asiakirjat vain väittävät niin.",
    definition: "Asiakirjan aitous on todennettava ominaisuus, että asiakirja on aito: ilmoitetun vallan antama ja julkaisun jälkeen muuttumaton, kenen tahansa todistettavissa eikä vain ulkoasun perusteella väitetty.",
    why: [
      "Kirjelomakkeet, allekirjoitukset ja sinetit voidaan kaikki kopioida. Ulkoasu ei ole todiste — vakuuttava väärennös näyttää aivan samalta kuin alkuperäinen.",
      "Kun asiakirjan aitoudella on eniten merkitystä — todistuskirja, lupa, päätös — vastaanottajalla ei usein ole riippumatonta tapaa varmistaa, että se on aito.",
      "Aitous, joka riippuu antajalle soittamisesta, ei skaalaudu ja pettää juuri silloin, kun antaja on vaikeimmin tavoitettavissa.",
    ],
    how: [
      { t: "Sidottu antavaan virkaan", d: "Jokainen julkaisu annetaan nimetyn vallan nojalla: sen alkuperä on osa todistetta eikä kirjelomakkeesta tehty oletus." },
      { t: "Eheystodiste asiakirjaa kohden", d: "Kryptografinen todiste sitoo täsmälleen tietyn tiedoston sen tietueeseen; yhdenkin tavun muuttaminen rikkoo todennuksen." },
      { t: "Kenen tahansa todennettavissa", d: "Pysyvä tietuetunnus antaa jokaisen vastaanottajan varmistaa aitouden itsenäisesti — ilman tiliä ja ilman antajalle soittamista." },
    ],
    faqs: [
      { q: "Mitä on asiakirjan aitous?", a: "Todennettava ominaisuus, että asiakirja on aito — ilmoitetun vallan antama ja julkaisun jälkeen muuttumaton — kenen tahansa todistettavissa eikä vain väitetty." },
      { q: "Miksei allekirjoitus tai sinetti riitä?", a: "Allekirjoitukset ja sinetit voidaan kopioida. Aito autenttisuus vaatii todennettavan eheystodisteen, joka on sidottu antavaan valtaan." },
      { q: "Miten varmistan, että asiakirja on aito?", a: "Vertaamalla sen pysyvää tietuetunnusta ja eheystodistetta antajan rekisteriin. Sovereign Dispatch tekee tämän mahdolliseksi kenelle tahansa ilman tiliä." },
    ],
    metaTitle: "Asiakirjan aitous — todista, että asiakirja on aito",
    metaDescription: "Asiakirjan aitous on todennettava ominaisuus olla aito ja muuttumaton. Miksei allekirjoitus ja sinetti riitä ja miten se todistetaan.",
  },
  "document-verification": {
    term: "Asiakirjan todentaminen",
    kicker: "Todentaminen",
    headline: "Asiakirjan todentaminen, jonka kuka tahansa voi tehdä — ilman tiliä.",
    lead: "Asiakirjan todentaminen tarkoittaa sen varmistamista, että asiakirja on aito ja muuttumaton. Paras todentaminen ei vaadi erityistä pääsyä — kuka tahansa voi tehdä sen.",
    definition: "Asiakirjan todentaminen on toimitus, jossa varmistetaan, että asiakirja on aito ja muuttumaton — ihanteellisesti vertaamalla pysyvää tunnistetta ja eheystodistetta antajan rekisteriin, itsenäisesti ja ilman etuoikeutettua pääsyä.",
    why: [
      "Todentaminen, joka vaatii soittoa antajalle tai kirjautumista portaaliin, pettää niiden kohdalla, jotka sitä kipeimmin tarvitsevat — vastaanottajien, yleisön, muiden instituutioiden.",
      "Jos todentaminen on vaikeaa, se jää tekemättä, ja väärennökset kiertävät riitauttamatta.",
      "Luottamus skaalautuu vain, jos jokainen asiakirjan haltija voi itse varmistaa sen sekunneissa totuuden lähdettä vastaan.",
    ],
    how: [
      { t: "Pysyvä tietuetunnus", d: "Jokainen julkaisu kantaa tunnistetta, joka viittaa sen sitovaan tietueeseen antavassa instituutiossa." },
      { t: "Täsmällisen tiedoston eheystarkistus", d: "Todentaminen vahvistaa, että kyseinen tiedosto vastaa tavu tavulta annettua versiota; jokainen muutos havaitaan." },
      { t: "Avoin kaikille", d: "Kuka tahansa voi tarkistaa tietueen ilman tiliä: luottamus ei riipu etuoikeutetusta pääsystä." },
    ],
    faqs: [
      { q: "Mitä on asiakirjan todentaminen?", a: "Sen varmistamista, että asiakirja on aito ja muuttumaton, ihanteellisesti vertaamalla pysyvää tunnistetta ja eheystodistetta antajan rekisteriin." },
      { q: "Tarvitsenko tilin asiakirjan todentamiseen?", a: "Sovereign Dispatchin kanssa et. Todentaminen on avoin kaikille, jottei luottamus riipu etuoikeutetusta pääsystä." },
      { q: "Mitä todentaminen oikeastaan tarkistaa?", a: "Että asiakirja vastaa aitoa annettua tietuetta ja että täsmällinen tiedosto on julkaisun jälkeen muuttumaton." },
    ],
    metaTitle: "Asiakirjan todentaminen — vahvista aitous ilman tiliä",
    metaDescription: "Asiakirjan todentaminen vahvistaa, että asiakirja on aito ja muuttumaton, pysyvän tietuetunnuksen ja eheystodisteen avulla — itsenäisesti, ilman tiliä.",
  },
};
