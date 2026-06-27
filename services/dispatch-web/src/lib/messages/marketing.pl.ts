import type { MarketingCopy } from "./marketing";

export const MARKETING_PL: MarketingCopy = {
  trust: {
    eyebrow: "Wdrażaj z pewnością",
    titleA: "Twoje rekordy. Twoja jurysdykcja.",
    titleB: "Twoje wyjście, gwarantowane.",
    lead: "Zobowiązanie się do platformy publikacyjnej to decyzja o suwerenności. Sovereign Dispatch zbudowano tak, by instytucja zachowała kontrolę — nad danymi, nad wdrożeniem i nad możliwością odejścia z całością nienaruszoną.",
    ownership: {
      kicker: "Własność", title: "Ty jesteś właścicielem swoich rekordów — my jesteśmy depozytariuszem.",
      sub: "Platforma przechowuje Twoje rekordy i nimi zarządza. Nigdy ich nie posiada, nigdy nie wykorzystuje ich ponownie i nigdy niczego na nich nie trenuje.",
      cards: [
        { title: "Twoje dane są Twoje", body: "Każdy dokument, wersja, artefakt i certyfikat należą do Twojej instytucji — nie do platformy." },
        { title: "Izolacja najemców", body: "Bezpieczeństwo na poziomie wiersza z domyślną odmową. Brak deklaracji najemcy oznacza odmowę; Twoje dane nigdy nie są mieszane." },
        { title: "Brak wtórnego użytku", body: "Żadnego eksplorowania, profilowania, trenowania modeli ani modelu biznesowego opartego na udostępnianiu danych. Nigdy." },
        { title: "Każdy dostęp audytowany", body: "Złożenia, decyzje, publikacje i pobrania są zapisywane w tylko-dopisywalnej, opieczętowanej skrótem ścieżce." },
      ],
    },
    continuity: {
      kicker: "Ciągłość i wyjście", title: "Możesz odejść w dowolnej chwili — z całością.",
      sub: "Najsilniejszym sygnałem zaufania, jaki może zaoferować platforma, jest czyste wyjście. Nie ma uwięzienia, z którego trzeba by się wytechniczać.",
      cards: [
        { title: "Brak zastrzeżonych formatów", body: "Ustrukturyzowane rekordy, standardowe artefakty PDF / DOCX / Markdown oraz standardowe repozytorium PostgreSQL. Nic nie jest uwięzione." },
        { title: "Pełny eksport na żądanie", body: "Eksportuj rekordy, wersje, artefakty oraz certyfikaty zarządcze i zachowania, kiedy tylko zechcesz." },
        { title: "Przenoszalne wdrożenie", body: "Ta sama platforma działa jako zarządzana, w Twojej chmurze, lokalnie lub odizolowana — przenieś swój zasób bez zmiany platformy." },
        { title: "Gdyby dostawca zniknął", body: "Zachowujesz każdy rekord, artefakt i certyfikat w otwartych formatach i możesz samodzielnie uruchomić lub zmigrować platformę. Ciągłość nie zależy od nas." },
      ],
    },
    accountability: {
      kicker: "Odpowiedzialność", title: "Jasna linia odpowiedzialności.",
      sub: "Zespoły ds. zamówień i ryzyka muszą dokładnie wiedzieć, kto za co odpowiada. Nie ma tu dwuznaczności.",
      securesLabel: "Platforma zabezpiecza",
      secures: ["Izolację najemców i kontrolę dostępu", "Szyfrowanie w spoczynku i w trakcie przesyłu", "Integralność tylko-dopisywalnego audytu", "Integralność zachowania (dowody SHA-256)", "Egzekwowanie zarządzania — silnika nie da się obejść", "Dostępność i odtwarzanie usługi"],
      controlsLabel: "Twoja instytucja kontroluje",
      controls: ["Kto sprawuje każde upoważnienie zarządcze", "Łańcuchy zatwierdzeń, kworum i polityki", "Klasyfikację i poświadczenia rekordów", "Horyzonty przechowywania", "Kto dysponuje poświadczeniami i ich zakresami", "Model wdrożenia i lokalizację danych"],
    },
    evidence: {
      kicker: "Dowód", title: "Dowodliwe, nie obiecywane.",
      sub: "Pewność wdrożenia powinna opierać się na tym, co można zweryfikować podczas oceny — a nie na hasłach marketingowych.",
      ctaProcurement: "Dokumentacja przetargowa", ctaEvidence: "Dowód i zdolności",
    },
  },
  platform: {
    overview: {
      kicker: "Przegląd", title: "Informacja staje się rekordem urzędowym.",
      sub: "Dispatch to warstwa instytucjonalna między szkicem a opublikowanym dokumentem. Każdy artefakt — notatka, materiały dla zarządu, dokument regulacyjny — jest składany jako ustrukturyzowane dane, regulowany w toku zatwierdzania, renderowany do wiernego PDF/DOCX i publikowany z trwałą, audytowalną ścieżką pochodzenia.",
      cards: [
        { title: "To nie edytor tekstu", body: "Dokumenty to ustrukturyzowane dane (DDM), walidowane i rusztowane według typu — nie dowolne pliki. Format jest umową." },
        { title: "Regulowany, nie tylko generowany", body: "Złóż → Zatwierdź → Renderuj → Opublikuj. Nic nie trafia do rekordu bez przejścia swojej polityki zatwierdzania." },
        { title: "Suwerenny z konstrukcji", body: "Izolacja najemców, świadomość lokalizacji, tylko-dopisywalny audyt. Zbudowany dla instytucji, które nie mogą zawieść." },
      ],
    },
    capabilities: {
      kicker: "Zdolności", title: "Jeden potok, każdy dokument urzędowy.",
      sub: "Szablony i walidacja na typ dokumentu; deterministyczne, pasmowane klasyfikacją renderowanie do wyniku klasy drukarskiej.",
      cards: [
        { title: "Typy dokumentów", body: "Notatki dla kierownictwa, raporty zarządu, dokumenty programowe, dokumenty regulacyjne, pakiety operacyjne i rekordy urzędowe — każdy z własnym wymaganym rusztowaniem." },
        { title: "Renderowanie wieloformatowe", body: "Wierny PDF (silnik headless), DOCX i Markdown z jednego zwalidowanego źródła — banery, numery stron, załączniki, podpisy." },
        { title: "Walidowane schematem", body: "Każde złożenie jest sprawdzane względem schematu DDM i polityki typu dokumentu, zanim będzie mogło się wyrenderować — żadnych zniekształconych rekordów." },
        { title: "Szablony i rusztowania", body: "Świadome typu role sekcji i polityki bloków wymuszają kompletność, dzięki czemu wynik jest spójny w całej instytucji." },
        { title: "Wersjonowane i niezmienne", body: "Każda wersja jest zachowywana; opublikowane artefakty są opieczętowane skrótem i nigdy po cichu zmieniane." },
        { title: "Asynchroniczne w skali", body: "Pas renderowania wsparty kolejką pochłania nagłe wzrosty i duże pakiety bez blokowania składających." },
      ],
    },
    workflow: {
      kicker: "Przepływ pracy", title: "Złóż → Reguluj → Zatwierdź → Renderuj → Opublikuj → Pobierz.",
      sub: "Pełny cykl życia dokumentu urzędowego, wymuszany przez platformę.",
      steps: [
        { t: "Złóż", b: "Ustrukturyzowany ładunek DDM, walidowany przy wejściu." },
        { t: "Reguluj", b: "Rozstrzygnięta klasyfikacja i polityka zatwierdzania." },
        { t: "Zatwierdź", b: "Akceptacja w trybie N-eyes; pasy usługowe zatwierdzają automatycznie." },
        { t: "Renderuj", b: "Wierny PDF/DOCX wytworzony w kolejce." },
        { t: "Opublikuj", b: "Udostępniony do rekordu; pochodzenie zapieczętowane." },
        { t: "Pobierz", b: "Podpisane, kontrolowane dostępem pobranie artefaktu." },
      ],
    },
    integrations: {
      kicker: "Integracje", title: "API, na którym budują inni.",
      sub: "Dispatch udostępnia zakresowy dostęp do API na konsumenta i przyjmuje dokumenty przez stabilną powierzchnię REST.",
      apiTitle: "Udostępnianie API",
      apiBody: "Każdy system otrzymuje własnego klienta usługowego — client_id + sekret z jawnymi zakresami (validate · render · read). Wydawaj, ograniczaj zakres i odwołuj na konsumenta.",
      estateTitle: "Zbudowane dla całego zasobu",
      estateBody: "Konsumenci składają swoje dane, a Dispatch zwraca rekord urzędowy — z wywołaniami webhook przy renderowaniu i publikacji.",
      estateItems: ["Veritas — pakiety operacyjne i finansowe", "ExitOS — memoranda zarządu i dokumenty transakcyjne", "Twoja instytucja — przez tę samą powierzchnię REST"],
    },
  },
  standard: {
    eyebrow: "Definicja kategorii",
    title: "Standard Sovereign Dispatch",
    lead: "Instytucja nie przyjmuje narzędzia do publikowania. Przyjmuje standard tego, jak rekordy urzędowe powstają, są dowodzone i zachowywane. Oto pojęcia, które ten standard definiuje.",
    sectionKicker: "Standard",
    sectionTitle: "Sześć pojęć instytucjonalnych.",
    sectionSub: "Każde jest elementem składowym standardu operacyjnego dla rekordów instytucjonalnych — nie funkcją, lecz definicją.",
    defs: [
      { term: "Rekord urzędowy", one: "Regulowany, wersjonowany, sklasyfikowany instytucjonalny dokument urzędowy.", def: "Nie plik. Akt urzędowy, utworzony w ramach wymuszonej polityki zarządzania, przeprowadzony przez niezmienny cykl życia — Utworzony → Regulowany → Zatwierdzony → Opublikowany → Zachowany — o trwałej, dowodliwej tożsamości.", props: ["Stabilny numer rekordu", "Klasyfikacja i poświadczenia", "Niezmienne wersje", "Jedna kanoniczna postać"] },
      { term: "Polityka zarządzania", one: "Wykonywalna reguła tego, jak regulowana jest klasa rekordów.", def: "Nazwana, wersjonowana polityka powiązana z typem rekordu: uporządkowany łańcuch upoważnień, kworum na każdym kroku, upoważnienie do publikacji, przechowywanie i wygaśnięcie. Polityka nie opisuje przepływu pracy — kontroluje go.", props: ["Uporządkowany łańcuch zatwierdzeń", "Kworum na każdym kroku", "Upoważnienie do publikacji", "Wersjonowana i wymuszana"] },
      { term: "Upoważnienie do publikacji", one: "Nazwane upoważnienie umocowane do udostępnienia rekordu urzędowego.", def: "Publikacja nie jest przyciskiem, który może nacisnąć każdy. Jest zarezerwowana dla określonej roli zarządczej, walidowanej w chwili udostępnienia — a zatwierdzający rekord nigdy nie może być jego publikującym.", props: ["Powiązane z rolą", "Walidowane przy publikacji", "Rozdział obowiązków"] },
      { term: "Certyfikat zarządczy", one: "Kryptograficzny dowód, że publikacja spełniła swoją politykę.", def: "Pieczętowany przy publikacji: polityka i jej wersja, wymagany łańcuch wobec tego, kto faktycznie go spełnił i w jakiej kolejności, użyte delegacje, upoważnienie do publikacji oraz dowód integralności — werdykt COMPLIANT, który można niezależnie zweryfikować.", props: ["Wymagany wobec faktycznego łańcucha", "Uporządkowana sekwencja zatwierdzeń", "Dowód integralności", "Werdykt zgodności"] },
      { term: "Certyfikat zachowania", one: "Odporny na manipulacje dowód, że rekord jest trwale zapieczętowany.", def: "Wydawany, gdy rekord jest archiwizowany: znacznik czasu zachowania i dowód integralności SHA-256 obejmujący rekord kanoniczny. Stan zarchiwizowany jest terminalny — żadna edycja, wycofanie ani ponowna publikacja nie są możliwe.", props: ["Dowód integralności SHA-256", "Znacznik czasu zachowania", "Terminalny i niezmienny"] },
      { term: "Łańcuch dowodowy", one: "Nieprzerwana, tylko-dopisywalna ścieżka od utworzenia do zachowania.", def: "Każdy akt — złożenie, każda decyzja, spełnienie polityki, publikacja i zachowanie — zapisany w niezmiennej, opieczętowanej skrótem ścieżce. Instytucja może dowieść nie tylko tego, co rekord mówi, ale dokładnie tego, jak powstał.", props: ["Tylko-dopisywalny", "Opieczętowany skrótem", "Utworzenie → zachowanie", "Niezależnie audytowalny"] },
    ],
    closeTitleA: "Gdy wyłania się kategoria,",
    closeTitleB: "standard liczy się bardziej niż funkcje.",
    closeBody: "Sovereign Dispatch to nie lepszy sposób publikowania dokumentów. To standard operacyjny dla rekordów instytucjonalnych — a instytucja, która przyjmuje ten standard, przyjmuje sposób zarządzania, który przetrwa każdy pojedynczy system.",
    ctaArtifacts: "Zobacz artefakty", ctaPath: "Znajdź swoją ścieżkę",
  },
};
