// Rzeczywiste polskie tłumaczenia stron koncepcyjnych (warstwa 3). Jedna wersja na język —
// żadnego tłumaczenia maszynowego w czasie działania. Tylko obecne tutaj slugi są wystawiane pod
// /pl/learn/<slug>; wszystko pozostałe pozostaje w języku angielskim do czasu przetłumaczenia,
// aby hreflang był zgodny z prawdą. Wspólna struktura (diagram, powiązane odnośniki)
// pochodzi z angielskiej podstawy w problems.ts; to są zlokalizowane pola tekstowe.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_PL: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Publikacja urzędowa",
    kicker: "Koncepcja",
    headline: "Czym jest publikacja urzędowa — i co czyni ją urzędową.",
    lead: "Dokument może opublikować każdy. Publikacja urzędowa jest czymś innym: wydawana jest z upoważnienia instytucji i można dowieść jej autentyczności tak długo, jak długo ma to znaczenie.",
    definition: "Publikacja urzędowa to dokument wydany z upoważnienia instytucji — a nie osoby fizycznej — w ramach uregulowanego procesu zatwierdzania oraz uczyniony trwale weryfikowalnym, tak aby każdy mógł potwierdzić, że jest to autentyczna, obowiązująca wersja.",
    why: [
      "Plik PDF rozsyłany w organizacji mailem wygląda identycznie niezależnie od tego, czy jest zatwierdzoną wersją ostateczną, czy wczesnym szkicem. Nic w samym pliku nie dowodzi, którą z nich jest.",
      "Gdy publikacja zostaje zakwestionowana po latach — przed sądem, podczas kontroli, przez opinię publiczną — instytucja musi być w stanie wykazać, kto ją zatwierdził, w jakiej kolejności i że plik od tamtej pory się nie zmienił.",
      "Większość instytucji nie potrafi tego wykazać: zatwierdzanie żyło w mailach i na spotkaniach, a opublikowany plik jest jedynie kopią bez trwałego powiązania z upoważnieniem, z którego został wydany.",
    ],
    how: [
      { t: "Wydawana przez urząd, nie przez osobę", d: "Sovereign Dispatch wiąże każdą publikację z upoważnieniem urzędu, dzięki czemu pozostaje ona ważna nawet wtedy, gdy osoba, która ją podpisała, odeszła." },
      { t: "Uregulowana przed publikacją", d: "Przed udostępnieniem dokumentu przebiega wymuszony łańcuch zatwierdzeń — wersją urzędową jest ta, która przeszła pełny proces zarządczy, i żadna inna nie może uchodzić za urzędową." },
      { t: "Trwale weryfikowalna", d: "Każda publikacja posiada trwały identyfikator rekordu i dowód integralności, dzięki czemu każdy może potwierdzić, że jest autentyczna i niezmieniona — bez konta." },
    ],
    faqs: [
      { q: "Jaka jest różnica między dokumentem a publikacją urzędową?", a: "Dokument to tylko plik. Publikacja urzędowa jest wydawana z upoważnienia instytucji w ramach uregulowanego procesu i jest trwale weryfikowalna — można dowieść, kto ją wydał i że się nie zmieniła." },
      { q: "Jak dowieść, że publikacja jest urzędowa?", a: "Weryfikując jej trwały identyfikator rekordu i dowód integralności względem rejestru instytucji wydającej. Sovereign Dispatch pozwala zrobić to każdemu bez konta." },
      { q: "Czy podpis lub papier firmowy czynią publikację urzędową?", a: "Nie. Podpis lub papier firmowy można skopiować. Dopiero upoważnienie powiązane z urzędem wraz z weryfikowalnym dowodem integralności czyni publikację dowodliwie urzędową." },
    ],
    metaTitle: "Czym jest publikacja urzędowa? Definicja i sposób dowiedzenia",
    metaDescription: "Publikacja urzędowa to dokument wydany z upoważnienia instytucji w ramach uregulowanego procesu i uczyniony trwale weryfikowalnym. Dowiedz się, co czyni ją urzędową i jak to dowieść.",
  },
  "evidence-chain": {
    term: "Łańcuch dowodowy",
    kicker: "Integralność",
    headline: "Łańcuch dowodowy, który istnieje, zanim ktokolwiek o niego zapyta.",
    lead: "Łańcuch dowodowy to nieprzerwany zapis tego, jak dokument został zatwierdzony i wydany — utrwalony w chwili, gdy się to działo, dzięki czemu można na nim polegać wtedy, gdy jest potrzebny.",
    definition: "Łańcuch dowodowy to kompletny, uporządkowany i odporny na manipulacje zapis każdego kroku zatwierdzania i publikacji dokumentu — kto, kiedy i na której wersji działał — utrwalany w trakcie tworzenia dokumentu, a nie odtwarzany później.",
    why: [
      "Gdy publikacja zostaje podana w wątpliwość, wartość dowodu zależy całkowicie od tego, kiedy powstał. Dowody zebrane po zakwestionowaniu są słabe i podważalne.",
      "Większość organizacji buduje ścieżkę dopiero wtedy, gdy zażąda jej audytor lub sąd — zbierając maile, akceptacje i wersje pod presją czasu, z lukami.",
      "Łańcuch dowodowy zapisywany na bieżąco, w odpowiedniej kolejności i zapieczętowany przed zmianą to różnica między dowodzeniem upoważnienia a jego zwykłym deklarowaniem.",
    ],
    how: [
      { t: "Utrwalany w chwili zdarzenia", d: "Każdy krok zatwierdzania jest zapisywany w momencie, gdy następuje, we właściwej kolejności — nigdy nie odtwarzany później." },
      { t: "Odporny na manipulacje", d: "Łańcuch jest pieczętowany dowodami integralności, dzięki czemu każda późniejsza zmiana jest wykrywalna; zapis weryfikuje się albo jako nienaruszony, albo wcale." },
      { t: "Gotowy na żądanie", d: "Ponieważ łańcuch już istnieje, odpowiedź na kontrolę lub spór prawny to pobranie, a nie odtwarzanie." },
    ],
    faqs: [
      { q: "Czym jest łańcuch dowodowy?", a: "To kompletny, uporządkowany i odporny na manipulacje zapis tego, jak dokument został zatwierdzony i wydany — kto, kiedy i na której wersji działał — utrwalony w chwili, gdy się to działo." },
      { q: "Dlaczego moment powstania dowodu ma znaczenie?", a: "Dowód powstający w trakcie zdarzeń jest znacznie mocniejszy niż dowód zbierany po zakwestionowaniu, który jest podatny na luki i spory." },
      { q: "Jak łańcuch dowodowy pozostaje odporny na manipulacje?", a: "Dzięki pieczętowaniu każdego kroku kryptograficznymi dowodami integralności, tak aby każda późniejsza zmiana była wykrywalna podczas weryfikacji." },
    ],
    metaTitle: "Czym jest łańcuch dowodowy? Definicja i znaczenie momentu",
    metaDescription: "Łańcuch dowodowy to kompletny, uporządkowany i odporny na manipulacje zapis zatwierdzania i wydania dokumentu, utrwalony w chwili zdarzenia. Dlaczego bije dowód odtwarzany po fakcie.",
  },
  "document-authenticity": {
    term: "Autentyczność dokumentu",
    kicker: "Integralność",
    headline: "Autentyczność dokumentu, którą można dowieść, a nie jedynie deklarować.",
    lead: "Autentyczność dokumentu to właściwość bycia dowodliwie prawdziwym — tym właściwym dokumentem, wydanym przez tego, kto rości sobie do tego prawo, niezmienionym od tamtej pory. Większość dokumentów jedynie ją deklaruje.",
    definition: "Autentyczność dokumentu to weryfikowalna właściwość, że dokument jest prawdziwy: wydany przez wskazane upoważnienie i niezmieniony od chwili publikacji, dowodliwa przez każdego, a nie jedynie deklarowana na podstawie wyglądu.",
    why: [
      "Papiery firmowe, podpisy i pieczęcie — wszystkie można skopiować. Wygląd nie jest dowodem — przekonujące fałszerstwo wygląda dokładnie tak samo jak oryginał.",
      "Gdy autentyczność dokumentu liczy się najbardziej — zaświadczenie, licencja, orzeczenie — odbiorca często nie ma niezależnego sposobu, by potwierdzić, że jest prawdziwy.",
      "Autentyczność zależna od dzwonienia do wydawcy w celu sprawdzenia nie skaluje się i zawodzi dokładnie wtedy, gdy wydawca jest najtrudniejszy do osiągnięcia.",
    ],
    how: [
      { t: "Powiązana z urzędem wydającym", d: "Każda publikacja jest wydawana pod wskazanym upoważnieniem, dzięki czemu jej pochodzenie jest częścią zapisu, a nie domysłem z papieru firmowego." },
      { t: "Dowód integralności na dokument", d: "Dowód kryptograficzny wiąże dokładny plik z jego rekordem; zmiana choćby jednego bajtu unieważnia weryfikację." },
      { t: "Może zweryfikować każdy", d: "Trwały identyfikator rekordu pozwala każdemu odbiorcy niezależnie potwierdzić autentyczność — bez konta i bez dzwonienia do wydawcy." },
    ],
    faqs: [
      { q: "Czym jest autentyczność dokumentu?", a: "To weryfikowalna właściwość, że dokument jest prawdziwy — wydany przez wskazane upoważnienie i niezmieniony od chwili publikacji — dowodliwa przez każdego, a nie jedynie deklarowana." },
      { q: "Dlaczego podpis lub pieczęć nie wystarczą?", a: "Podpisy i pieczęcie można skopiować. Prawdziwa autentyczność wymaga weryfikowalnego dowodu integralności powiązanego z upoważnieniem wydającym." },
      { q: "Jak mogę zweryfikować, że dokument jest autentyczny?", a: "Weryfikując jego trwały identyfikator rekordu i dowód integralności względem rejestru wydawcy. Sovereign Dispatch pozwala zrobić to każdemu bez konta." },
    ],
    metaTitle: "Autentyczność dokumentu — jak dowieść, że dokument jest prawdziwy",
    metaDescription: "Autentyczność dokumentu to weryfikowalna właściwość bycia prawdziwym i niezmienionym. Dlaczego podpisy i pieczęcie nie wystarczą i jak dowieść autentyczności dokumentu.",
  },
  "document-verification": {
    term: "Weryfikacja dokumentu",
    kicker: "Weryfikacja",
    headline: "Weryfikacja dokumentu, którą może przeprowadzić każdy — bez konta.",
    lead: "Weryfikacja dokumentu to potwierdzenie, że dokument jest prawdziwy i niezmieniony. Najlepsza weryfikacja nie wymaga szczególnego dostępu — może ją przeprowadzić każdy.",
    definition: "Weryfikacja dokumentu to proces potwierdzania, że dokument jest prawdziwy i niezmieniony — najlepiej poprzez sprawdzenie trwałego identyfikatora i dowodu integralności względem rejestru wydawcy, niezależnie i bez uprzywilejowanego dostępu.",
    why: [
      "Weryfikacja, która wymaga dzwonienia do wydawcy lub logowania się do portalu, zawodzi tych, którzy najbardziej jej potrzebują — odbiorców, opinię publiczną, inne instytucje.",
      "Jeśli weryfikacja jest trudna, nie odbywa się, a fałszerstwa krążą bez sprzeciwu.",
      "Zaufanie skaluje się tylko wtedy, gdy każdy, kto posiada dokument, może sam go potwierdzić w kilka sekund względem źródła prawdy.",
    ],
    how: [
      { t: "Trwały identyfikator rekordu", d: "Każda publikacja posiada identyfikator, który odsyła do jej miarodajnego rekordu w instytucji wydającej." },
      { t: "Kontrola integralności dokładnego pliku", d: "Weryfikacja potwierdza, że konkretny plik jest bajt po bajcie zgodny z wydaną wersją; każda zmiana zostaje wykryta." },
      { t: "Otwarta dla każdego", d: "Każdy może zweryfikować rekord bez konta, dzięki czemu zaufanie nie zależy od dostępu od wewnątrz." },
    ],
    faqs: [
      { q: "Czym jest weryfikacja dokumentu?", a: "To potwierdzenie, że dokument jest prawdziwy i niezmieniony, najlepiej poprzez sprawdzenie trwałego identyfikatora i dowodu integralności względem rejestru wydawcy." },
      { q: "Czy potrzebuję konta, aby zweryfikować dokument?", a: "W przypadku Sovereign Dispatch nie. Weryfikacja jest otwarta dla każdego, aby zaufanie nie zależało od uprzywilejowanego dostępu." },
      { q: "Co właściwie sprawdza weryfikacja?", a: "To, że dokument odpowiada prawdziwemu wydanemu rekordowi oraz że dokładny plik jest niezmieniony od chwili publikacji." },
    ],
    metaTitle: "Weryfikacja dokumentu — potwierdź autentyczność bez konta",
    metaDescription: "Weryfikacja dokumentu potwierdza, że dokument jest prawdziwy i niezmieniony, poprzez sprawdzenie trwałego identyfikatora rekordu i dowodu integralności względem wydawcy — niezależnie, bez konta.",
  },
};
