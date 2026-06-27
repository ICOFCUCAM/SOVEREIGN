// Echte Nederlandse vertalingen van de conceptpagina's (laag 3). Eén versie per taal —
// geen machinevertaling tijdens runtime. Alleen de hier aanwezige slugs worden onder
// /nl/learn/<slug> uitgeleverd; al het overige blijft Engelstalig totdat het is vertaald,
// zodat hreflang waarheidsgetrouw blijft. De gemeenschappelijke structuur (diagram, verwante
// links) komt uit de Engelse basis in problems.ts; dit zijn de gelokaliseerde tekstvelden.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_NL: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Officiële publicatie",
    kicker: "Concept",
    headline: "Wat een officiële publicatie is — en wat haar officieel maakt.",
    lead: "Iedereen kan een document publiceren. Een officiële publicatie is anders: zij wordt uitgevaardigd onder het gezag van een instelling en kan als echt worden bewezen, zolang het ertoe doet.",
    definition: "Een officiële publicatie is een document dat onder het gezag van een instelling — niet van een individu — via een beheerst goedkeuringsproces wordt uitgevaardigd en blijvend verifieerbaar wordt gemaakt, zodat iedereen kan bevestigen dat het de echte, geldende versie is.",
    why: [
      "Een per e-mail rondgestuurde pdf ziet er identiek uit, of het nu de goedgekeurde eindversie is of een vroeg concept. Niets aan het bestand bewijst welke van de twee het is.",
      "Wanneer een publicatie jaren later wordt aangevochten — voor de rechter, bij een audit, door het publiek — moet de instelling kunnen bewijzen wie haar heeft goedgekeurd, in welke volgorde, en dat het bestand sindsdien niet is gewijzigd.",
      "De meeste instellingen kunnen dit niet bewijzen. De goedkeuring leefde in e-mails en vergaderingen; het gepubliceerde bestand is slechts een kopie zonder duurzame band met het gezag dat het heeft uitgevaardigd.",
    ],
    how: [
      { t: "Uitgevaardigd door een ambt, niet door een persoon", d: "Sovereign Dispatch bindt elke publicatie aan het gezag van een ambt, zodat zij geldig blijft wanneer de persoon die haar ondertekende is vertrokken." },
      { t: "Beheerst voordat zij wordt gepubliceerd", d: "Vóór de vrijgave loopt een afgedwongen goedkeuringsketen — de officiële versie is degene die de governance heeft doorlopen, en geen andere kan zich als officieel voordoen." },
      { t: "Blijvend verifieerbaar", d: "Elke publicatie draagt een permanente Record-ID en een integriteitsbewijs, zodat iedereen kan bevestigen dat zij echt en ongewijzigd is — zonder account." },
    ],
    faqs: [
      { q: "Wat is het verschil tussen een document en een officiële publicatie?", a: "Een document is slechts een bestand. Een officiële publicatie wordt onder het gezag van een instelling via een beheerst proces uitgevaardigd en is blijvend verifieerbaar — u kunt bewijzen wie haar heeft uitgevaardigd en dat zij niet is gewijzigd." },
      { q: "Hoe bewijs je dat een publicatie officieel is?", a: "Door haar permanente Record-ID en integriteitsbewijs te toetsen aan het register van de uitvaardigende instelling. Met Sovereign Dispatch kan iedereen dit zonder account doen." },
      { q: "Maakt een handtekening of briefhoofd een publicatie officieel?", a: "Nee. Een handtekening of briefhoofd kan worden gekopieerd. Gezag dat aan een ambt is gebonden, samen met een verifieerbaar integriteitsbewijs, is wat een publicatie aantoonbaar officieel maakt." },
    ],
    metaTitle: "Wat is een officiële publicatie? Definitie en bewijs",
    metaDescription: "Een officiële publicatie is een document dat onder het gezag van een instelling via een beheerst proces wordt uitgevaardigd en blijvend verifieerbaar is. Ontdek wat haar officieel maakt.",
  },
  "evidence-chain": {
    term: "Bewijsketen",
    kicker: "Integriteit",
    headline: "Een bewijsketen die bestaat voordat iemand erom vraagt.",
    lead: "Een bewijsketen is het ononderbroken verslag van hoe een document is goedgekeurd en uitgevaardigd — vastgelegd terwijl het gebeurt, zodat erop kan worden vertrouwd wanneer het nodig is.",
    definition: "Een bewijsketen is een volledig, geordend en manipulatiebestendig verslag van elke stap in de goedkeuring en publicatie van een document — wie wanneer handelde en op welke versie — vastgelegd terwijl het document ontstaat in plaats van achteraf gereconstrueerd.",
    why: [
      "Wanneer een publicatie in twijfel wordt getrokken, hangt de waarde van het bewijs volledig af van wanneer het is ontstaan. Bewijs dat na de aanvechting wordt samengesteld, is zwak en betwistbaar.",
      "De meeste organisaties bouwen het spoor pas op wanneer een auditor of rechter erom vraagt — en verzamelen e-mails, goedkeuringen en versies onder tijdsdruk, met hiaten.",
      "Een bewijsketen die doorlopend, in de juiste volgorde en verzegeld tegen wijziging wordt vastgelegd, is het verschil tussen het bewijzen van gezag en het slechts beweren ervan.",
    ],
    how: [
      { t: "Vastgelegd terwijl het gebeurt", d: "Elke goedkeuringsstap wordt vastgelegd op het moment dat hij plaatsvindt, in de juiste volgorde — nooit later gereconstrueerd." },
      { t: "Manipulatiebestendig", d: "De keten wordt verzegeld met integriteitsbewijzen, zodat elke latere wijziging detecteerbaar is; het verslag verifieert ofwel ongeschonden, ofwel helemaal niet." },
      { t: "Klaar op afroep", d: "Omdat de keten al bestaat, is het reageren op een audit of juridische aanvechting een kwestie van ophalen, niet van reconstrueren." },
    ],
    faqs: [
      { q: "Wat is een bewijsketen?", a: "Een volledig, geordend en manipulatiebestendig verslag van hoe een document is goedgekeurd en uitgevaardigd — wie wanneer handelde en op welke versie — vastgelegd terwijl het gebeurde." },
      { q: "Waarom is het tijdstip van het bewijs van belang?", a: "Bewijs dat ontstaat terwijl de gebeurtenissen plaatsvinden, is veel sterker dan bewijs dat na een aanvechting wordt samengesteld, dat vatbaar is voor hiaten en geschillen." },
      { q: "Hoe blijft een bewijsketen manipulatiebestendig?", a: "Door elke stap te verzegelen met cryptografische integriteitsbewijzen, zodat elke latere wijziging bij verificatie detecteerbaar is." },
    ],
    metaTitle: "Wat is een bewijsketen? Definitie en waarom timing telt",
    metaDescription: "Een bewijsketen is het volledige, geordende en manipulatiebestendige verslag van goedkeuring en uitvaardiging van een document, vastgelegd op het moment zelf. Waarom timing telt.",
  },
  "document-authenticity": {
    term: "Documentechtheid",
    kicker: "Integriteit",
    headline: "Documentechtheid die u bewijst, niet slechts beweert.",
    lead: "Documentechtheid is de eigenschap aantoonbaar echt te zijn — het echte document, uitgevaardigd door wie het beweert, sindsdien ongewijzigd. De meeste documenten beweren het alleen maar.",
    definition: "Documentechtheid is de verifieerbare eigenschap dat een document echt is: uitgevaardigd door het opgegeven gezag en sinds de publicatie ongewijzigd, door iedereen aantoonbaar in plaats van louter op grond van de schijn beweerd.",
    why: [
      "Briefhoofden, handtekeningen en zegels kunnen allemaal worden gekopieerd. Schijn is geen bewijs — een overtuigende vervalsing ziet er precies zo uit als het origineel.",
      "Wanneer de echtheid van een document het zwaarst weegt — een akte, een vergunning, een uitspraak — heeft de ontvanger vaak geen onafhankelijke manier om te bevestigen dat het echt is.",
      "Echtheid die afhankelijk is van bellen met de uitvaardiger schaalt niet en faalt juist op het moment dat de uitvaardiger het moeilijkst te bereiken is.",
    ],
    how: [
      { t: "Gebonden aan het uitvaardigende ambt", d: "Elke publicatie wordt uitgevaardigd onder een benoemd gezag, zodat haar herkomst deel uitmaakt van het verslag en geen gevolgtrekking uit een briefhoofd is." },
      { t: "Integriteitsbewijs per document", d: "Een cryptografisch bewijs verbindt het exacte bestand met zijn verslag; het wijzigen van één enkele byte breekt de verificatie." },
      { t: "Door iedereen verifieerbaar", d: "Een permanente Record-ID laat elke ontvanger de echtheid onafhankelijk bevestigen — zonder account en zonder telefoontje naar de uitvaardiger." },
    ],
    faqs: [
      { q: "Wat is documentechtheid?", a: "De verifieerbare eigenschap dat een document echt is — uitgevaardigd door het opgegeven gezag en sinds de publicatie ongewijzigd — door iedereen aantoonbaar en niet slechts beweerd." },
      { q: "Waarom volstaat een handtekening of zegel niet?", a: "Handtekeningen en zegels kunnen worden gekopieerd. Echte authenticiteit vereist een verifieerbaar integriteitsbewijs dat aan het uitvaardigende gezag is gebonden." },
      { q: "Hoe verifieer ik of een document echt is?", a: "Door zijn permanente Record-ID en integriteitsbewijs te toetsen aan het register van de uitvaardiger. Met Sovereign Dispatch kan iedereen dit zonder account doen." },
    ],
    metaTitle: "Documentechtheid — bewijzen dat een document echt is",
    metaDescription: "Documentechtheid is de verifieerbare eigenschap echt en ongewijzigd te zijn. Waarom handtekeningen en zegels niet volstaan en hoe u het bewijst.",
  },
  "document-verification": {
    term: "Documentverificatie",
    kicker: "Verificatie",
    headline: "Documentverificatie die iedereen kan uitvoeren — zonder account.",
    lead: "Documentverificatie is het bevestigen dat een document echt en ongewijzigd is. De beste verificatie vereist geen bijzondere toegang — iedereen kan haar uitvoeren.",
    definition: "Documentverificatie is het proces van bevestigen dat een document echt en ongewijzigd is — bij voorkeur door een permanente identificatie en een integriteitsbewijs te toetsen aan het register van de uitvaardiger, onafhankelijk en zonder bevoorrechte toegang.",
    why: [
      "Verificatie die vereist dat men de uitvaardiger belt of zich op een portaal aanmeldt, faalt voor de mensen die haar het hardst nodig hebben — ontvangers, het publiek, andere instellingen.",
      "Als verificatie moeilijk is, gebeurt zij niet, en circuleren vervalsingen onbetwist.",
      "Vertrouwen schaalt alleen wanneer iedereen die een document bezit het zelf, in seconden, kan bevestigen tegen de bron van waarheid.",
    ],
    how: [
      { t: "Permanente Record-ID", d: "Elke publicatie draagt een identificatie die verwijst naar haar gezaghebbende verslag bij de uitvaardigende instelling." },
      { t: "Integriteitscontrole van het exacte bestand", d: "De verificatie bevestigt dat het specifieke bestand byte voor byte de uitgevaardigde versie is; elke wijziging wordt gedetecteerd." },
      { t: "Open voor iedereen", d: "Iedereen kan een verslag zonder account verifiëren, zodat vertrouwen niet afhangt van bevoorrechte toegang." },
    ],
    faqs: [
      { q: "Wat is documentverificatie?", a: "Het bevestigen dat een document echt en ongewijzigd is, bij voorkeur door een permanente identificatie en een integriteitsbewijs te toetsen aan het register van de uitvaardiger." },
      { q: "Heb ik een account nodig om een document te verifiëren?", a: "Met Sovereign Dispatch niet. Verificatie staat voor iedereen open, zodat vertrouwen niet afhangt van bevoorrechte toegang." },
      { q: "Wat controleert de verificatie eigenlijk?", a: "Dat het document overeenkomt met een echt uitgevaardigd verslag en dat het exacte bestand sinds de publicatie ongewijzigd is." },
    ],
    metaTitle: "Documentverificatie — echtheid bevestigen, zonder account",
    metaDescription: "Documentverificatie bevestigt dat een document echt en ongewijzigd is, via een permanente Record-ID en een integriteitsbewijs — onafhankelijk, zonder account.",
  },
};
