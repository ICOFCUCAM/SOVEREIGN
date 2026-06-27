// Yhdistetty tekstiluettelo toiselle markkinointierälle: Outcomes, Security,
// Compliance, suomeksi. Yksi tiedosto kieltä kohden kääntää kaikki kolme.
// Upotetut interaktiiviset komponentit (CapabilitiesDashboard, DeploymentMatrix)
// pitävät oman tekstinsä.

import type { Marketing2Copy } from "./marketing2";

export const MARKETING2_FI: Marketing2Copy = {
  outcomes: {
    eyebrow: "Institutionaalinen muutos",
    titleA: "Mikä muuttuu, kun instituutio",
    titleB: "ottaa käyttöön Sovereign Dispatchin.",
    lead: "Ei uusia ominaisuuksia. Uusi tapa, jolla viralliset tietueet ovat olemassa — luotuna hallinnon nojalla, sertifikaatilla todistettuna ja niiden tekijöitä pidempään säilytettynä.",
    baKicker: "Ennen ja jälkeen", baTitle: "Sama päätös — muutettuna.",
    baSub: "Miten virallinen teko siirtyy levyltä tiedostosta hallituksi institutionaaliseksi tietueeksi.",
    beforeLabel: "Ennen Dispatchia",
    before: ["Käytäntö-PDF jaetulla levyllä", "Sähköpostiketju hyväksyntöjä", "Versiosekaannus — mikä on lopullinen?", "Hyväksynnät, joita ei voi todistaa", "Tietueet, jotka katoavat hiljaa"],
    afterLabel: "Dispatchin jälkeen",
    after: ["Hallittu virallinen tietue", "Valvottu valtaketju", "Yksi kanoninen, muuttumaton versio", "Kryptografinen hyväksyntäsertifikaatti", "Pysyvä, todistettava haku"],
    scKicker: "Skenaariokirjasto", scTitle: "Sama hallittu matka, jokainen instituutio.",
    scSub: "Eri virallinen teko kussakin — sama valvottu polku laatimisesta pysyvään tietueeseen.",
    scenarios: [
      { who: "Ministeriö", what: "Hallituksen muistio", flow: ["Laadittu", "Käytännön hallitsema", "Johtaja → kansliapäällikkö -hyväksyntä", "Tietueeseen julkaistu", "Säilytetty todistein"] },
      { who: "Yliopisto", what: "Akateemisen senaatin päätös", flow: ["Ehdotettu", "Senaatin hallinto", "Rekisterinpitäjän valta", "Virallinen tietue", "Säilytetty pysyvästi"] },
      { who: "Sairaala", what: "Kliininen ohje", flow: ["Kirjoitettu", "Kliininen hallinto", "Ylilääkärin hyväksyntä", "Henkilöstölle julkaistu", "Täysi tarkastusjälki"] },
      { who: "Sääntelyviranomainen", what: "Sääntelyilmoitus", flow: ["Annettu", "Oikeudellinen tarkastusketju", "Komissaarin valta", "Todisteena julkaistu", "Säilytetty aikataulun mukaan"] },
    ],
    closeLine: "Jokainen matka päättyy samalla tavalla: tietue, jonka voit todistaa ja säilyttää.",
    closeCta: "Miksi käyttöönotto on turvallista",
  },
  security: {
    secKicker: "Tietoturva", secTitle: "Suvereeni suunnittelultaan.",
    secSub: "Rakennettu luokitellulle ja säännellylle aineistolle — eristys, selvitys ja muuttumaton tietue ytimessä, ei jälkikäteen kiinnitettyinä.",
    cards: [
      { title: "Vuokralaisen eristys (RLS)", body: "Rivitason tietoturva jokaisessa taulussa; puuttuva vuokralaisväite evää oletuksena — ei koskaan salli kaikkea." },
      { title: "Luokittelu ja selvitys", body: "Asiakirjat kantavat luokittelua; luennat ja hyväksynnät portitetaan päämiehen selvitystä vastaan." },
      { title: "Muuttumaton tarkastus", body: "Vain liittävä tapahtumajälki — jokainen toimitus, päätös ja julkaisu, tiivisteketjutuksin. Mitään ei voi hiljaa muokata." },
      { title: "Vähimmän oikeuden roolit", body: "Kirjoittaja, tarkastaja, hyväksyjä, julkaisija, tarkastaja, vuokralaisen ylläpitäjä — kukin rajattu tarkalleen siihen, mitä se saa tehdä." },
      { title: "Datan sijainti", body: "Toimii omaa tietokantaansa vasten valitsemassasi sijainnissa; riippumaton kaikista muista alustoista." },
      { title: "Asiakastunnusten todennus", body: "Konekuluttajat todentautuvat client_id + salaisuus -parilla lyhytikäisiä, rajattuja JWT-tunnuksia varten." },
      { title: "Toiminnallinen jatkuvuus", body: "Arkkitehtuuri varmuuskopiointia, palautusta, säilytystä ja jatkuvuusvaatimuksia varten — määriteltyinä käyttöönotoittain." },
    ],
    sovKicker: "Suvereniteetti", sovTitle: "Kykyjä, ei merkkejä.",
    sovSub: "Mitä alusta tosiasiassa tekee — käyttöönoton, tietoturvan ja hallinnon osalta. Jokainen kyky on saatavilla käyttöönottomallin mukaan ja todennettavissa arvioinnin aikana.",
    depKicker: "Käyttöönotto", depTitle: "Ota käyttöön siellä, missä suvereniteetti vaatii.",
    depSub: "Sovereign Dispatch on arkkitehtuuriltaan suunniteltu tukemaan pilvi-, yksityispilvi-, suvereenisti isännöityjä ja institutionaalisia käyttöönottomalleja.",
    models: [
      { t: "Pilvi", b: "Hallinnoitu käyttöönotto nopeaa omaksumista varten.", note: "" },
      { t: "Yksityinen pilvi", b: "Oma institutionaalinen ympäristö.", note: "" },
      { t: "Suvereeni isännöinti", b: "Isännöity hyväksyttyjen kansallisten tai alueellisten rajojen sisällä.", note: "" },
      { t: "Paikan päällä", b: "Saatavilla instituutioille, jotka vaativat paikallista hallintaa.", note: "" },
      { t: "Eristetty verkko", b: "Arkkitehtuuri suunniteltu tukemaan eristettyjä käyttöönottoja.", note: "Saatavuus riippuu toimeksiannon laajuudesta." },
    ],
    systemFlowLabel: "Järjestelmävirta",
    systemFlow: ["Instituutio", "Submit", "Govern", "Approve", "Render", "Publish", "Archive"],
    matrixLabel: "Kyky käyttöönotoittain",
  },
  compliance: {
    kicker: "Vaatimustenmukaisuus ja tietoturva", title: "Rakennettu modernien hallintokehysten ympärille.",
    sub: "Sovereign Dispatch on suunniteltu niiden valvontakehysten ympärille, joita vasten instituutioita arvioidaan — kuvattuna rehellisin termein, todisteet saatavilla arvioinnin aikana.",
    items: [
      { name: "ISO 27001", body: "Arkkitehtuuri linjattu laajalti omaksuttujen tietoturvavalvontojen kanssa." },
      { name: "SOC 2", body: "Suunniteltu auditoituja operatiivisen tietoturvan periaatteita käyttäen." },
      { name: "NIS2", body: "Tukee hallinto- ja riskienhallintatyönkulkuja." },
      { name: "GDPR", body: "Tukee datanhallinta- ja sijaintikäytäntöjä." },
      { name: "Tarkastettavuus", body: "Jokainen julkaisutapahtuma voidaan tallentaa, jäljittää ja tarkastaa." },
      { name: "Säilytyskäytännöt", body: "Instituution määrittelemät säilytysvalvonnat." },
    ],
    disclaimer: "Kehysten nimet kuvaavat valvontoja, joihin arkkitehtuuri on linjattu, eivät riippumattomia sertifiointeja. Sertifioinnin laajuus, datan sijainti ja säilytys määritellään käyttöönotoittain.",
    ctaProcurement: "Hankinta-aineisto", ctaEvidence: "Todistepaketti", ctaTrust: "Luottamuskeskus",
  },
};
