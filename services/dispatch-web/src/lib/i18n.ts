// Internationalization foundation. Real localized content — one version per
// language, not browser translation. A page exists in a locale only when a real
// translation exists (so hreflang never lies and there is no duplicate content).
//
// Strategy: locale-prefixed paths with a stable slug (`/fr/learn/<slug>`), the
// English default served at the root. This file owns the locale registry, the
// path helpers, the chrome dictionary, and the hreflang builder. Content
// translations live in lib/translations.*.ts.

export interface Locale { code: string; name: string; native: string; dir: "ltr" | "rtl"; }

// The full target set (mirrors services/content-engine LOCALES).
export const LOCALES: Locale[] = [
  { code: "en", name: "English", native: "English", dir: "ltr" },
  { code: "fr", name: "French", native: "Français", dir: "ltr" },
  { code: "es", name: "Spanish", native: "Español", dir: "ltr" },
  { code: "de", name: "German", native: "Deutsch", dir: "ltr" },
  { code: "ar", name: "Arabic", native: "العربية", dir: "rtl" },
  { code: "pt", name: "Portuguese", native: "Português", dir: "ltr" },
  { code: "no", name: "Norwegian", native: "Norsk", dir: "ltr" },
  { code: "nl", name: "Dutch", native: "Nederlands", dir: "ltr" },
  { code: "it", name: "Italian", native: "Italiano", dir: "ltr" },
  { code: "ja", name: "Japanese", native: "日本語", dir: "ltr" },
  { code: "zh", name: "Chinese", native: "中文", dir: "ltr" },
  { code: "pl", name: "Polish", native: "Polski", dir: "ltr" },
  { code: "sv", name: "Swedish", native: "Svenska", dir: "ltr" },
  { code: "da", name: "Danish", native: "Dansk", dir: "ltr" },
  { code: "fi", name: "Finnish", native: "Suomi", dir: "ltr" },
  { code: "el", name: "Greek", native: "Ελληνικά", dir: "ltr" },
];

export const DEFAULT_LOCALE = "en";
// Locales that are actually live (have real content). Activated as translations
// land — this is the only switch that exposes a language. hreflang & sitemaps
// derive from it, so nothing is advertised before it exists.
export const ACTIVE_LOCALES = ["en", "fr", "es", "de", "no", "pt", "it", "nl", "ar", "ja", "zh", "pl", "sv", "da", "fi", "el"];

// Derive the active locale from a path's first segment (en if none/inactive).
export const localeFromPath = (pathname: string): string => {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && ACTIVE_LOCALES.includes(seg) && seg !== DEFAULT_LOCALE ? seg : DEFAULT_LOCALE;
};

export const isLocale = (c?: string): boolean => !!c && LOCALES.some((l) => l.code === c);
export const isActiveLocale = (c?: string): boolean => !!c && ACTIVE_LOCALES.includes(c);
export const localeOf = (code: string): Locale => LOCALES.find((l) => l.code === code) || LOCALES[0];

// Build a path for a locale: en stays at root, others are prefixed.
export const localePath = (locale: string, path: string): string => {
  const clean = "/" + path.replace(/^\/+/, "");
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean === "/" ? "" : clean}`;
};

// hreflang alternates for a page given the set of locales it exists in.
export const hreflangAlternates = (path: string, availableLocales: string[]): { hreflang: string; href: string }[] => {
  const origin = "https://dispatch.sovereigndo.com";
  const alts = availableLocales.filter(isActiveLocale).map((code) => ({ hreflang: code, href: origin + localePath(code, path) }));
  if (availableLocales.includes(DEFAULT_LOCALE)) alts.push({ hreflang: "x-default", href: origin + localePath(DEFAULT_LOCALE, path) });
  return alts;
};

// --- chrome dictionary (UI strings) ------------------------------------------
type Dict = Record<string, string>;
const CHROME: Record<string, Dict> = {
  en: {
    "cta.evaluate": "Begin your evaluation", "cta.verify": "Verify a record", "cta.procurement": "Procurement materials", "cta.seeInAction": "See it in action",
    "concept.definition": "Definition", "concept.why": "Why it matters", "concept.how": "How Sovereign Dispatch handles it",
    "concept.faq": "Common questions", "concept.related": "Related concepts", "concept.applies": "Where this applies",
    "nav.learn": "Learn", "lang.label": "Language", "lang.readIn": "Read this in",
    "nav.platform": "Platform", "nav.standard": "Standard", "nav.trust": "Trust",
    "nav.developers": "Developers", "nav.pricing": "Pricing", "nav.verify": "Verify",
    "nav.outcomes": "Outcomes", "cta.launch": "Launch Dispatch", "cta.launchShort": "Launch", "nav.menu": "Menu", "nav.procurement": "Procurement",
  },
  fr: {
    "cta.evaluate": "Commencer votre évaluation", "cta.verify": "Vérifier un acte", "cta.procurement": "Documents d'achat", "cta.seeInAction": "Voir en action",
    "concept.definition": "Définition", "concept.why": "Pourquoi c'est important", "concept.how": "Comment Sovereign Dispatch le gère",
    "concept.faq": "Questions fréquentes", "concept.related": "Concepts liés", "concept.applies": "Où cela s'applique",
    "nav.learn": "Comprendre", "lang.label": "Langue", "lang.readIn": "Lire ceci en",
    "nav.platform": "Plateforme", "nav.standard": "Norme", "nav.trust": "Confiance",
    "nav.developers": "Développeurs", "nav.pricing": "Tarifs", "nav.verify": "Vérifier",
    "nav.outcomes": "Résultats", "cta.launch": "Lancer Dispatch", "cta.launchShort": "Lancer", "nav.menu": "Menu", "nav.procurement": "Achats",
  },
  es: {
    "cta.evaluate": "Comience su evaluación", "cta.verify": "Verificar un registro", "cta.procurement": "Documentación de adquisición", "cta.seeInAction": "Véalo en acción",
    "concept.definition": "Definición", "concept.why": "Por qué es importante", "concept.how": "Cómo lo gestiona Sovereign Dispatch",
    "concept.faq": "Preguntas frecuentes", "concept.related": "Conceptos relacionados", "concept.applies": "Dónde se aplica",
    "nav.learn": "Aprender", "lang.label": "Idioma", "lang.readIn": "Leer esto en",
    "nav.platform": "Plataforma", "nav.standard": "Norma", "nav.trust": "Confianza",
    "nav.developers": "Desarrolladores", "nav.pricing": "Precios", "nav.verify": "Verificar",
    "nav.outcomes": "Resultados", "cta.launch": "Iniciar Dispatch", "cta.launchShort": "Iniciar", "nav.menu": "Menú", "nav.procurement": "Adquisición",
  },
  de: {
    "cta.evaluate": "Bewertung beginnen", "cta.verify": "Datensatz prüfen", "cta.procurement": "Beschaffungsunterlagen", "cta.seeInAction": "In Aktion sehen",
    "concept.definition": "Definition", "concept.why": "Warum es wichtig ist", "concept.how": "Wie Sovereign Dispatch dies handhabt",
    "concept.faq": "Häufige Fragen", "concept.related": "Verwandte Begriffe", "concept.applies": "Wo dies gilt",
    "nav.learn": "Wissen", "lang.label": "Sprache", "lang.readIn": "Lesen Sie dies auf",
    "nav.platform": "Plattform", "nav.standard": "Standard", "nav.trust": "Vertrauen",
    "nav.developers": "Entwickler", "nav.pricing": "Preise", "nav.verify": "Verifizieren",
    "nav.outcomes": "Ergebnisse", "cta.launch": "Dispatch starten", "cta.launchShort": "Starten", "nav.menu": "Menü", "nav.procurement": "Beschaffung",
  },
  no: {
    "cta.evaluate": "Start evalueringen", "cta.verify": "Verifiser en oppføring", "cta.procurement": "Anskaffelsesdokumenter", "cta.seeInAction": "Se det i bruk",
    "concept.definition": "Definisjon", "concept.why": "Hvorfor det er viktig", "concept.how": "Hvordan Sovereign Dispatch håndterer det",
    "concept.faq": "Vanlige spørsmål", "concept.related": "Relaterte begreper", "concept.applies": "Hvor dette gjelder",
    "nav.learn": "Kunnskap", "lang.label": "Språk", "lang.readIn": "Les dette på",
    "nav.platform": "Plattform", "nav.standard": "Standard", "nav.trust": "Tillit",
    "nav.developers": "Utviklere", "nav.pricing": "Priser", "nav.verify": "Verifiser",
    "nav.outcomes": "Resultater", "cta.launch": "Start Dispatch", "cta.launchShort": "Start", "nav.menu": "Meny", "nav.procurement": "Anskaffelse",
  },
  pt: {
    "cta.evaluate": "Comece a sua avaliação", "cta.verify": "Verificar um registo", "cta.procurement": "Documentos de aquisição", "cta.seeInAction": "Veja em ação",
    "concept.definition": "Definição", "concept.why": "Porque é importante", "concept.how": "Como o Sovereign Dispatch trata disto",
    "concept.faq": "Perguntas frequentes", "concept.related": "Conceitos relacionados", "concept.applies": "Onde se aplica",
    "nav.learn": "Aprender", "lang.label": "Idioma", "lang.readIn": "Ler isto em",
    "nav.platform": "Plataforma", "nav.standard": "Norma", "nav.trust": "Confiança",
    "nav.developers": "Programadores", "nav.pricing": "Preços", "nav.verify": "Verificar",
    "nav.outcomes": "Resultados", "cta.launch": "Iniciar o Dispatch", "cta.launchShort": "Iniciar", "nav.menu": "Menu", "nav.procurement": "Aquisição",
  },
  it: {
    "cta.evaluate": "Inizia la tua valutazione", "cta.verify": "Verifica un documento", "cta.procurement": "Documenti di approvvigionamento", "cta.seeInAction": "Guardalo in azione",
    "concept.definition": "Definizione", "concept.why": "Perché è importante", "concept.how": "Come lo gestisce Sovereign Dispatch",
    "concept.faq": "Domande frequenti", "concept.related": "Concetti correlati", "concept.applies": "Dove si applica",
    "nav.learn": "Conoscenza", "lang.label": "Lingua", "lang.readIn": "Leggilo in",
    "nav.platform": "Piattaforma", "nav.standard": "Standard", "nav.trust": "Fiducia",
    "nav.developers": "Sviluppatori", "nav.pricing": "Prezzi", "nav.verify": "Verifica",
    "nav.outcomes": "Risultati", "cta.launch": "Avvia Dispatch", "cta.launchShort": "Avvia", "nav.menu": "Menu", "nav.procurement": "Approvvigionamento",
  },
  nl: {
    "cta.evaluate": "Begin uw evaluatie", "cta.verify": "Verifieer een document", "cta.procurement": "Inkoopdocumentatie", "cta.seeInAction": "Zie het in actie",
    "concept.definition": "Definitie", "concept.why": "Waarom het belangrijk is", "concept.how": "Hoe Sovereign Dispatch dit aanpakt",
    "concept.faq": "Veelgestelde vragen", "concept.related": "Verwante begrippen", "concept.applies": "Waar dit van toepassing is",
    "nav.learn": "Kennis", "lang.label": "Taal", "lang.readIn": "Lees dit in het",
    "nav.platform": "Platform", "nav.standard": "Standaard", "nav.trust": "Vertrouwen",
    "nav.developers": "Ontwikkelaars", "nav.pricing": "Prijzen", "nav.verify": "Verifiëren",
    "nav.outcomes": "Resultaten", "cta.launch": "Dispatch starten", "cta.launchShort": "Starten", "nav.menu": "Menu", "nav.procurement": "Inkoop",
  },
  ar: {
    "cta.evaluate": "ابدأ تقييمك", "cta.verify": "تحقّق من سجل", "cta.procurement": "مستندات الشراء", "cta.seeInAction": "شاهده عمليًا",
    "concept.definition": "تعريف", "concept.why": "لماذا يهمّ", "concept.how": "كيف تتعامل Sovereign Dispatch مع ذلك",
    "concept.faq": "أسئلة شائعة", "concept.related": "مفاهيم ذات صلة", "concept.applies": "أين ينطبق ذلك",
    "nav.learn": "تعلَّم", "lang.label": "اللغة", "lang.readIn": "اقرأ هذا بـ",
    "nav.platform": "المنصّة", "nav.standard": "المعيار", "nav.trust": "الثقة",
    "nav.developers": "المطوّرون", "nav.pricing": "الأسعار", "nav.verify": "تحقّق",
    "nav.outcomes": "النتائج", "cta.launch": "تشغيل Dispatch", "cta.launchShort": "تشغيل", "nav.menu": "القائمة", "nav.procurement": "الشراء",
  },
  ja: {
    "cta.evaluate": "評価を始める", "cta.verify": "記録を検証する", "cta.procurement": "調達資料", "cta.seeInAction": "実際の動作を見る",
    "concept.definition": "定義", "concept.why": "なぜ重要か", "concept.how": "Sovereign Dispatch での扱い方",
    "concept.faq": "よくある質問", "concept.related": "関連する概念", "concept.applies": "適用される場面",
    "nav.learn": "ナレッジ", "lang.label": "言語", "lang.readIn": "この言語で読む",
    "nav.platform": "プラットフォーム", "nav.standard": "標準", "nav.trust": "信頼",
    "nav.developers": "開発者", "nav.pricing": "料金", "nav.verify": "検証",
    "nav.outcomes": "成果", "cta.launch": "Dispatch を起動", "cta.launchShort": "起動", "nav.menu": "メニュー", "nav.procurement": "調達",
  },
  zh: {
    "cta.evaluate": "开始评估", "cta.verify": "验证记录", "cta.procurement": "采购资料", "cta.seeInAction": "查看实际效果",
    "concept.definition": "定义", "concept.why": "为何重要", "concept.how": "Sovereign Dispatch 如何处理",
    "concept.faq": "常见问题", "concept.related": "相关概念", "concept.applies": "适用场景",
    "nav.learn": "知识", "lang.label": "语言", "lang.readIn": "以此语言阅读",
    "nav.platform": "平台", "nav.standard": "标准", "nav.trust": "信任",
    "nav.developers": "开发者", "nav.pricing": "价格", "nav.verify": "验证",
    "nav.outcomes": "成果", "cta.launch": "启动 Dispatch", "cta.launchShort": "启动", "nav.menu": "菜单", "nav.procurement": "采购",
  },
  pl: {
    "cta.evaluate": "Rozpocznij ocenę", "cta.verify": "Zweryfikuj rekord", "cta.procurement": "Materiały przetargowe", "cta.seeInAction": "Zobacz w działaniu",
    "concept.definition": "Definicja", "concept.why": "Dlaczego to ważne", "concept.how": "Jak obsługuje to Sovereign Dispatch",
    "concept.faq": "Najczęstsze pytania", "concept.related": "Powiązane pojęcia", "concept.applies": "Gdzie ma zastosowanie",
    "nav.learn": "Wiedza", "lang.label": "Język", "lang.readIn": "Przeczytaj to w",
    "nav.platform": "Platforma", "nav.standard": "Standard", "nav.trust": "Zaufanie",
    "nav.developers": "Deweloperzy", "nav.pricing": "Cennik", "nav.verify": "Weryfikuj",
    "nav.outcomes": "Rezultaty", "cta.launch": "Uruchom Dispatch", "cta.launchShort": "Uruchom", "nav.menu": "Menu", "nav.procurement": "Zakupy",
  },
  sv: {
    "cta.evaluate": "Påbörja din utvärdering", "cta.verify": "Verifiera en post", "cta.procurement": "Upphandlingsmaterial", "cta.seeInAction": "Se det i praktiken",
    "concept.definition": "Definition", "concept.why": "Varför det är viktigt", "concept.how": "Så hanterar Sovereign Dispatch det",
    "concept.faq": "Vanliga frågor", "concept.related": "Relaterade begrepp", "concept.applies": "Var det gäller",
    "nav.learn": "Kunskap", "lang.label": "Språk", "lang.readIn": "Läs detta på",
    "nav.platform": "Plattform", "nav.standard": "Standard", "nav.trust": "Förtroende",
    "nav.developers": "Utvecklare", "nav.pricing": "Priser", "nav.verify": "Verifiera",
    "nav.outcomes": "Resultat", "cta.launch": "Starta Dispatch", "cta.launchShort": "Starta", "nav.menu": "Meny", "nav.procurement": "Upphandling",
  },
  da: {
    "cta.evaluate": "Start din evaluering", "cta.verify": "Verificér en post", "cta.procurement": "Udbudsmateriale", "cta.seeInAction": "Se det i praksis",
    "concept.definition": "Definition", "concept.why": "Hvorfor det er vigtigt", "concept.how": "Sådan håndterer Sovereign Dispatch det",
    "concept.faq": "Hyppige spørgsmål", "concept.related": "Relaterede begreber", "concept.applies": "Hvor det gælder",
    "nav.learn": "Viden", "lang.label": "Sprog", "lang.readIn": "Læs dette på",
    "nav.platform": "Platform", "nav.standard": "Standard", "nav.trust": "Tillid",
    "nav.developers": "Udviklere", "nav.pricing": "Priser", "nav.verify": "Verificér",
    "nav.outcomes": "Resultater", "cta.launch": "Start Dispatch", "cta.launchShort": "Start", "nav.menu": "Menu", "nav.procurement": "Indkøb",
  },
  fi: {
    "cta.evaluate": "Aloita arviointi", "cta.verify": "Vahvista tietue", "cta.procurement": "Hankinta-aineisto", "cta.seeInAction": "Katso käytännössä",
    "concept.definition": "Määritelmä", "concept.why": "Miksi sillä on merkitystä", "concept.how": "Näin Sovereign Dispatch hoitaa sen",
    "concept.faq": "Usein kysytyt kysymykset", "concept.related": "Liittyvät käsitteet", "concept.applies": "Missä tätä sovelletaan",
    "nav.learn": "Tietämys", "lang.label": "Kieli", "lang.readIn": "Lue tämä kielellä",
    "nav.platform": "Alusta", "nav.standard": "Standardi", "nav.trust": "Luottamus",
    "nav.developers": "Kehittäjät", "nav.pricing": "Hinnoittelu", "nav.verify": "Vahvista",
    "nav.outcomes": "Tulokset", "cta.launch": "Käynnistä Dispatch", "cta.launchShort": "Käynnistä", "nav.menu": "Valikko", "nav.procurement": "Hankinta",
  },
  el: {
    "cta.evaluate": "Ξεκινήστε την αξιολόγηση", "cta.verify": "Επαληθεύστε μια εγγραφή", "cta.procurement": "Υλικό προμηθειών", "cta.seeInAction": "Δείτε το σε εφαρμογή",
    "concept.definition": "Ορισμός", "concept.why": "Γιατί έχει σημασία", "concept.how": "Πώς το διαχειρίζεται το Sovereign Dispatch",
    "concept.faq": "Συχνές ερωτήσεις", "concept.related": "Σχετικές έννοιες", "concept.applies": "Πού εφαρμόζεται",
    "nav.learn": "Γνώση", "lang.label": "Γλώσσα", "lang.readIn": "Διαβάστε το στα",
    "nav.platform": "Πλατφόρμα", "nav.standard": "Πρότυπο", "nav.trust": "Εμπιστοσύνη",
    "nav.developers": "Προγραμματιστές", "nav.pricing": "Τιμολόγηση", "nav.verify": "Επαλήθευση",
    "nav.outcomes": "Αποτελέσματα", "cta.launch": "Εκκίνηση Dispatch", "cta.launchShort": "Εκκίνηση", "nav.menu": "Μενού", "nav.procurement": "Προμήθειες",
  },
};
export const t = (locale: string, key: string): string => (CHROME[locale] && CHROME[locale][key]) || CHROME.en[key] || key;
