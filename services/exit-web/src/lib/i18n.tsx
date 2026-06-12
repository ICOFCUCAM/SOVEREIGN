import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// ── i18n — the exchange speaks the counterparty's language ──────────
// A deliberately small, dependency-free layer: dictionaries per locale,
// t(key) with English fallback, {placeholder} interpolation, and a
// persisted locale choice (localStorage → navigator.language → en).
// Marketing chrome + homepage narrative are fully translated; deep card
// micro-copy falls back to English until its catalog lands.

export type Locale = "en" | "fr" | "es";
export const LOCALES: ReadonlyArray<[Locale, string]> = [["en", "English"], ["fr", "Français"], ["es", "Español"]];

type Dict = Record<string, string>;

const en: Dict = {
  // chrome
  "nav.platform": "Platform",
  "nav.modules": "Modules",
  "nav.pricing": "Pricing",
  "nav.login": "Log in",
  "nav.access": "Access the Exchange",
  "nav.language": "Language",
  // hero
  "hero.eyebrow": "The Global Acquisition Exchange",
  "hero.h1": "INSTITUTIONAL\nACQUISITION\nINFRASTRUCTURE",
  "hero.sub": "Source acquirers. Coordinate diligence. Manage negotiations. Execute transactions.",
  "hero.body": "One system connecting founders, buyers, advisors and transaction data — from signal generation to closing.",
  "hero.deploy": "Deploy a Mandate",
  // proof ribbon
  "ribbon.deals": "Disclosed acquisitions indexed",
  "ribbon.mandates": "Verified acquirer mandates",
  "ribbon.value": "Transaction value tracked",
  "ribbon.deploying": "Mandates actively deploying",
  // trust strip
  "trust.network.m": "{n} Mandates",
  "trust.network.t": "Curated Acquirer Network",
  "trust.network.s": "{g} jurisdictions · {s} sectors",
  "trust.soc.t": "Compliant Infrastructure",
  "trust.soc.s": "security + data residency",
  "trust.control.t": "Founder Controlled",
  "trust.control.s": "you own every decision",
  "trust.audit.m": "Every Action",
  "trust.audit.t": "Auditable",
  "trust.audit.s": "every action, every artifact",
  // lifecycle rail
  "lifecycle.title": "The acquisition lifecycle · signal → closing",
  "lifecycle.live": "Live process",
  "lc.signal": "Signal",
  "lc.discovery": "Buyer Discovery",
  "lc.nda": "NDA",
  "lc.cim": "CIM",
  "lc.meetings": "Management Meetings",
  "lc.loi": "LOI",
  "lc.diligence": "Diligence",
  "lc.closing": "Closing",
  // market structure
  "ms.eyebrow": "Market structure · who trades on the exchange",
  "ms.strategic": "Strategic Acquirers",
  "ms.strategic.meta": "{n} mandates indexed",
  "ms.pe": "Private Equity & Growth",
  "ms.pe.meta": "{n} mandates indexed",
  "ms.fo": "Family Offices",
  "ms.fo.meta": "long-hold capital",
  "ms.advisors": "Advisors & Counsel",
  "ms.advisors.meta": "process & documentation",
  "ms.corpdev": "Corporate Development",
  "ms.corpdev.meta": "buy-side desks",
  // workflow
  "wf.eyebrow": "The exchange · founder → exit",
  "wf.h2": "Run your entire company sale from discovery to closing.",
  // buyer intelligence
  "bi.eyebrow": "Buyer intelligence",
  "bi.h2": "Real buyers.\nReal appetite.\nReal opportunities.",
  "bi.link": "View all buyers",
  // provenance
  "prov.eyebrow": "Data provenance",
  "prov.h2": "Sourced. Referenced.\nAuditable.",
  "prov.body": "Every figure on the exchange traces to a source on record. Transactions are indexed from public filings; mandates are curated and verified; estimates carry an explicit confidence tier backed by observation counts.",
  // data rooms
  "dr.eyebrow": "Diligence infrastructure",
  "dr.h2": "Institutional-grade\ndata rooms.",
  "dr.body": "Secure, permissioned, and built for high-stakes transactions.",
  "dr.link": "Inside the data room",
  // negotiation
  "neg.eyebrow": "The negotiation desk",
  "neg.h2": "Negotiate with clarity.\nClose with confidence.",
  "neg.body": "Every bid scored against your reservation lines — structure, certainty and counterparty record, not just headline price.",
  "neg.link": "See the negotiation desk",
  // marketplace
  "mp.eyebrow": "The listing protocol",
  "mp.h2": "The marketplace.\nAnonymous until NDA.",
  "mp.body": "Every listing trades under a codename with banded figures. Identity, exact financials and the asking range unlock only on an executed NDA — the protocol that lets serious companies come to market without market rumor.",
  "mp.link": "How the listing protocol works",
  // coverage
  "cov.eyebrow": "Coverage",
  "cov.h2": "Global reach.\nInstitutional network.",
  "cov.body": "ExitOS connects founders with acquirer mandates across {g} jurisdictions and every major industry.",
  // losses
  "loss.eyebrow": "The cost of running blind",
  "loss.h2": "Why founders lose millions on exit.",
  "loss.body": "Across the disclosed transactions we index, the median premium over reference is {p} and the median announce-to-close period is {d}. Preparation and leverage decide which side of the median you land on.",
  // transaction record
  "rec.eyebrow": "The transaction record",
  "rec.h2": "Disclosed acquisitions on the market we index.",
  "rec.body": "Public, source-referenced M&A events — the same record that prices matches and benchmarks every process on the exchange.",
  "rec.bridge": "Your company, priced against this record — the same engines run your valuation in the workspace.",
  "rec.run": "Run the valuation",
  // governance
  "gov.eyebrow": "Governance & controls",
  "gov.note": "The conditions under which a transaction is allowed to proceed",
  "gov.nda.t": "Anonymous until NDA",
  "gov.nda.b": "Identity, exact financials and the ask never leave the protocol unsigned.",
  "gov.verify.t": "Buyer verification",
  "gov.verify.b": "Identity, track record and funds clear four gates before the data room.",
  "gov.audit.t": "Full audit trail",
  "gov.audit.b": "Every view, download and signature on the record — admissible process history.",
  "gov.control.t": "Founder control",
  "gov.control.b": "Eight approval gates. Nothing moves to the next stage without your decision.",
  "gov.soc.t": "SOC 2 posture",
  "gov.soc.b": "Encrypted at rest and in transit; permissioned access; data residency respected.",
  // final CTA
  "cta.eyebrow": "When the decision is made",
  "cta.h2": "Bring your company to market.",
  "cta.body": "One confidential process — sourcing, diligence, negotiation and closing — executed on institutional infrastructure, under your control at every gate.",
  "cta.open": "Open Acquisition Workspace",
  "cta.brief": "Request a Private Briefing",
  "cta.foot": "Strictly confidential. Anonymous until NDA. Every action audited.",
  // footer
  "ft.tagline": "Institutional acquisition infrastructure — sourcing, diligence, negotiation and closing on one exchange.",
  "ft.exchange": "The exchange",
  "ft.founders": "For founders",
  "ft.acquirers": "For acquirers",
  "ft.list": "List confidentially",
  "ft.valuation": "Valuation & readiness",
  "ft.plans": "Founder plans",
  "ft.browse": "Browse the marketplace",
  "ft.buyeraccess": "Buyer access",
  "ft.requestnda": "Request an NDA",
  "ft.soc": "SOC 2 posture",
  "ft.audit": "Full audit trail",
  "ft.ndagated": "NDA-gated identity",
  "ft.legal": "Market data on this site is indexed from public filings and disclosures (SEC EDGAR, Wikidata, press) and from a curated registry of acquirer mandates. Figures are presented for information only and do not constitute investment, legal or tax advice. Listings trade anonymously; identity and detailed financials are disclosed only under executed NDA.",
};

const fr: Dict = {
  "nav.platform": "Plateforme",
  "nav.modules": "Modules",
  "nav.pricing": "Tarifs",
  "nav.login": "Connexion",
  "nav.access": "Accéder à la Bourse",
  "nav.language": "Langue",
  "hero.eyebrow": "La Bourse Mondiale des Acquisitions",
  "hero.h1": "INFRASTRUCTURE\nINSTITUTIONNELLE\nD'ACQUISITION",
  "hero.sub": "Identifiez les acquéreurs. Coordonnez la due diligence. Menez les négociations. Exécutez les transactions.",
  "hero.body": "Un seul système reliant fondateurs, acquéreurs, conseils et données de transaction — du signal initial jusqu'au closing.",
  "hero.deploy": "Déployer un mandat",
  "ribbon.deals": "Acquisitions publiées indexées",
  "ribbon.mandates": "Mandats d'acquéreurs vérifiés",
  "ribbon.value": "Valeur de transactions suivie",
  "ribbon.deploying": "Mandats en déploiement actif",
  "trust.network.m": "{n} mandats",
  "trust.network.t": "Réseau d'acquéreurs sélectionnés",
  "trust.network.s": "{g} juridictions · {s} secteurs",
  "trust.soc.t": "Infrastructure conforme",
  "trust.soc.s": "sécurité + résidence des données",
  "trust.control.t": "Contrôle au fondateur",
  "trust.control.s": "chaque décision vous appartient",
  "trust.audit.m": "Chaque action",
  "trust.audit.t": "Auditable",
  "trust.audit.s": "chaque action, chaque document",
  "lifecycle.title": "Le cycle d'acquisition · du signal au closing",
  "lifecycle.live": "Processus en direct",
  "lc.signal": "Signal",
  "lc.discovery": "Identification des acquéreurs",
  "lc.nda": "NDA",
  "lc.cim": "Mémorandum",
  "lc.meetings": "Présentations au management",
  "lc.loi": "Lettre d'intention",
  "lc.diligence": "Due diligence",
  "lc.closing": "Closing",
  "ms.eyebrow": "Structure de marché · qui opère sur la bourse",
  "ms.strategic": "Acquéreurs stratégiques",
  "ms.strategic.meta": "{n} mandats indexés",
  "ms.pe": "Private equity & croissance",
  "ms.pe.meta": "{n} mandats indexés",
  "ms.fo": "Family offices",
  "ms.fo.meta": "capital de long terme",
  "ms.advisors": "Conseils & avocats",
  "ms.advisors.meta": "processus & documentation",
  "ms.corpdev": "Développement corporate",
  "ms.corpdev.meta": "équipes acquisitions",
  "wf.eyebrow": "La bourse · du fondateur à la sortie",
  "wf.h2": "Menez l'intégralité de la vente de votre entreprise, de la découverte au closing.",
  "bi.eyebrow": "Intelligence acquéreurs",
  "bi.h2": "De vrais acquéreurs.\nUn appétit réel.\nDe vraies opportunités.",
  "bi.link": "Voir tous les acquéreurs",
  "prov.eyebrow": "Provenance des données",
  "prov.h2": "Sourcé. Référencé.\nAuditable.",
  "prov.body": "Chaque chiffre de la bourse renvoie à une source documentée. Les transactions sont indexées depuis les publications officielles ; les mandats sont sélectionnés et vérifiés ; les estimations portent un niveau de confiance explicite, étayé par le nombre d'observations.",
  "dr.eyebrow": "Infrastructure de due diligence",
  "dr.h2": "Data rooms de niveau\ninstitutionnel.",
  "dr.body": "Sécurisées, à accès contrôlé, conçues pour des transactions à enjeux élevés.",
  "dr.link": "À l'intérieur de la data room",
  "neg.eyebrow": "Le desk de négociation",
  "neg.h2": "Négociez avec lucidité.\nConcluez avec assurance.",
  "neg.body": "Chaque offre est notée contre vos lignes de réserve — structure, certitude et historique de la contrepartie, pas seulement le prix affiché.",
  "neg.link": "Voir le desk de négociation",
  "mp.eyebrow": "Le protocole de listing",
  "mp.h2": "La place de marché.\nAnonyme jusqu'au NDA.",
  "mp.body": "Chaque dossier s'échange sous nom de code avec des fourchettes de chiffres. L'identité, les états financiers exacts et la fourchette de prix ne se débloquent qu'après signature d'un NDA — le protocole qui permet aux entreprises sérieuses de venir au marché sans rumeur.",
  "mp.link": "Comment fonctionne le protocole de listing",
  "cov.eyebrow": "Couverture",
  "cov.h2": "Portée mondiale.\nRéseau institutionnel.",
  "cov.body": "ExitOS relie les fondateurs à des mandats d'acquéreurs dans {g} juridictions et tous les grands secteurs.",
  "loss.eyebrow": "Le coût de l'improvisation",
  "loss.h2": "Pourquoi les fondateurs perdent des millions à la sortie.",
  "loss.body": "Sur les transactions publiées que nous indexons, la prime médiane sur la valeur de référence est de {p} et le délai médian entre annonce et closing est de {d}. La préparation et le rapport de force décident de quel côté de la médiane vous terminez.",
  "rec.eyebrow": "Le registre des transactions",
  "rec.h2": "Acquisitions publiées sur le marché que nous indexons.",
  "rec.body": "Des opérations M&A publiques et sourcées — le registre même qui valorise les correspondances et étalonne chaque processus sur la bourse.",
  "rec.bridge": "Votre entreprise, valorisée contre ce registre — les mêmes moteurs calculent votre valorisation dans l'espace de travail.",
  "rec.run": "Lancer la valorisation",
  "gov.eyebrow": "Gouvernance & contrôles",
  "gov.note": "Les conditions sous lesquelles une transaction est autorisée à avancer",
  "gov.nda.t": "Anonyme jusqu'au NDA",
  "gov.nda.b": "L'identité, les chiffres exacts et le prix demandé ne sortent jamais du protocole sans signature.",
  "gov.verify.t": "Vérification des acquéreurs",
  "gov.verify.b": "Identité, historique et fonds franchissent quatre contrôles avant la data room.",
  "gov.audit.t": "Piste d'audit complète",
  "gov.audit.b": "Chaque consultation, téléchargement et signature au registre — un historique de processus opposable.",
  "gov.control.t": "Contrôle au fondateur",
  "gov.control.b": "Huit portes d'approbation. Rien ne passe à l'étape suivante sans votre décision.",
  "gov.soc.t": "Posture SOC 2",
  "gov.soc.b": "Chiffrement au repos et en transit ; accès contrôlés ; résidence des données respectée.",
  "cta.eyebrow": "Quand la décision est prise",
  "cta.h2": "Amenez votre entreprise au marché.",
  "cta.body": "Un processus confidentiel unique — sourcing, due diligence, négociation et closing — exécuté sur une infrastructure institutionnelle, sous votre contrôle à chaque porte.",
  "cta.open": "Ouvrir l'espace d'acquisition",
  "cta.brief": "Demander un briefing privé",
  "cta.foot": "Strictement confidentiel. Anonyme jusqu'au NDA. Chaque action auditée.",
  "ft.tagline": "Infrastructure institutionnelle d'acquisition — sourcing, due diligence, négociation et closing sur une seule bourse.",
  "ft.exchange": "La bourse",
  "ft.founders": "Pour les fondateurs",
  "ft.acquirers": "Pour les acquéreurs",
  "ft.list": "Lister en toute confidentialité",
  "ft.valuation": "Valorisation & préparation",
  "ft.plans": "Offres fondateurs",
  "ft.browse": "Parcourir la place de marché",
  "ft.buyeraccess": "Accès acquéreur",
  "ft.requestnda": "Demander un NDA",
  "ft.soc": "Posture SOC 2",
  "ft.audit": "Piste d'audit complète",
  "ft.ndagated": "Identité sous NDA",
  "ft.legal": "Les données de marché de ce site sont indexées depuis des publications officielles (SEC EDGAR, Wikidata, presse) et un registre sélectionné de mandats d'acquéreurs. Les chiffres sont fournis à titre d'information et ne constituent ni conseil en investissement, ni conseil juridique ou fiscal. Les dossiers s'échangent anonymement ; l'identité et les états financiers détaillés ne sont communiqués qu'après signature d'un NDA.",
};

const es: Dict = {
  "nav.platform": "Plataforma",
  "nav.modules": "Módulos",
  "nav.pricing": "Precios",
  "nav.login": "Iniciar sesión",
  "nav.access": "Acceder a la Bolsa",
  "nav.language": "Idioma",
  "hero.eyebrow": "La Bolsa Global de Adquisiciones",
  "hero.h1": "INFRAESTRUCTURA\nINSTITUCIONAL\nDE ADQUISICIONES",
  "hero.sub": "Identifique adquirentes. Coordine la due diligence. Dirija las negociaciones. Ejecute transacciones.",
  "hero.body": "Un solo sistema que conecta fundadores, compradores, asesores y datos de transacciones — desde la señal inicial hasta el cierre.",
  "hero.deploy": "Desplegar un mandato",
  "ribbon.deals": "Adquisiciones publicadas indexadas",
  "ribbon.mandates": "Mandatos de adquirentes verificados",
  "ribbon.value": "Valor de transacciones registrado",
  "ribbon.deploying": "Mandatos en despliegue activo",
  "trust.network.m": "{n} mandatos",
  "trust.network.t": "Red curada de adquirentes",
  "trust.network.s": "{g} jurisdicciones · {s} sectores",
  "trust.soc.t": "Infraestructura conforme",
  "trust.soc.s": "seguridad + residencia de datos",
  "trust.control.t": "Control del fundador",
  "trust.control.s": "cada decisión es suya",
  "trust.audit.m": "Cada acción",
  "trust.audit.t": "Auditable",
  "trust.audit.s": "cada acción, cada documento",
  "lifecycle.title": "El ciclo de adquisición · de la señal al cierre",
  "lifecycle.live": "Proceso en vivo",
  "lc.signal": "Señal",
  "lc.discovery": "Identificación de compradores",
  "lc.nda": "NDA",
  "lc.cim": "Memorando",
  "lc.meetings": "Reuniones con dirección",
  "lc.loi": "Carta de intenciones",
  "lc.diligence": "Due diligence",
  "lc.closing": "Cierre",
  "ms.eyebrow": "Estructura de mercado · quién opera en la bolsa",
  "ms.strategic": "Adquirentes estratégicos",
  "ms.strategic.meta": "{n} mandatos indexados",
  "ms.pe": "Private equity y growth",
  "ms.pe.meta": "{n} mandatos indexados",
  "ms.fo": "Family offices",
  "ms.fo.meta": "capital de largo plazo",
  "ms.advisors": "Asesores y abogados",
  "ms.advisors.meta": "proceso y documentación",
  "ms.corpdev": "Desarrollo corporativo",
  "ms.corpdev.meta": "equipos de adquisición",
  "wf.eyebrow": "La bolsa · del fundador a la salida",
  "wf.h2": "Dirija la venta completa de su empresa, del descubrimiento al cierre.",
  "bi.eyebrow": "Inteligencia de compradores",
  "bi.h2": "Compradores reales.\nApetito real.\nOportunidades reales.",
  "bi.link": "Ver todos los compradores",
  "prov.eyebrow": "Procedencia de los datos",
  "prov.h2": "Con fuente. Referenciado.\nAuditable.",
  "prov.body": "Cada cifra de la bolsa se remonta a una fuente registrada. Las transacciones se indexan desde registros públicos; los mandatos se curan y verifican; las estimaciones llevan un nivel de confianza explícito respaldado por el número de observaciones.",
  "dr.eyebrow": "Infraestructura de due diligence",
  "dr.h2": "Data rooms de nivel\ninstitucional.",
  "dr.body": "Seguras, con permisos, construidas para transacciones de alto riesgo.",
  "dr.link": "Dentro de la data room",
  "neg.eyebrow": "La mesa de negociación",
  "neg.h2": "Negocie con claridad.\nCierre con confianza.",
  "neg.body": "Cada oferta se puntúa contra sus líneas de reserva — estructura, certeza e historial de la contraparte, no solo el precio anunciado.",
  "neg.link": "Ver la mesa de negociación",
  "mp.eyebrow": "El protocolo de listado",
  "mp.h2": "El mercado.\nAnónimo hasta el NDA.",
  "mp.body": "Cada empresa cotiza bajo nombre en clave con cifras en bandas. La identidad, las finanzas exactas y el rango de precio solo se desbloquean con un NDA firmado — el protocolo que permite a empresas serias salir al mercado sin rumores.",
  "mp.link": "Cómo funciona el protocolo de listado",
  "cov.eyebrow": "Cobertura",
  "cov.h2": "Alcance global.\nRed institucional.",
  "cov.body": "ExitOS conecta a fundadores con mandatos de adquirentes en {g} jurisdicciones y todos los grandes sectores.",
  "loss.eyebrow": "El costo de operar a ciegas",
  "loss.h2": "Por qué los fundadores pierden millones al vender.",
  "loss.body": "En las transacciones publicadas que indexamos, la prima mediana sobre la referencia es {p} y el plazo mediano entre anuncio y cierre es {d}. La preparación y la posición negociadora deciden de qué lado de la mediana termina usted.",
  "rec.eyebrow": "El registro de transacciones",
  "rec.h2": "Adquisiciones publicadas en el mercado que indexamos.",
  "rec.body": "Operaciones de M&A públicas y con fuente — el mismo registro que valora las coincidencias y sirve de referencia a cada proceso en la bolsa.",
  "rec.bridge": "Su empresa, valorada contra este registro — los mismos motores calculan su valoración en el espacio de trabajo.",
  "rec.run": "Ejecutar la valoración",
  "gov.eyebrow": "Gobernanza y controles",
  "gov.note": "Las condiciones bajo las cuales una transacción puede avanzar",
  "gov.nda.t": "Anónimo hasta el NDA",
  "gov.nda.b": "La identidad, las cifras exactas y el precio nunca salen del protocolo sin firma.",
  "gov.verify.t": "Verificación de compradores",
  "gov.verify.b": "Identidad, historial y fondos superan cuatro controles antes de la data room.",
  "gov.audit.t": "Pista de auditoría completa",
  "gov.audit.b": "Cada vista, descarga y firma en el registro — un historial de proceso verificable.",
  "gov.control.t": "Control del fundador",
  "gov.control.b": "Ocho puertas de aprobación. Nada avanza a la siguiente etapa sin su decisión.",
  "gov.soc.t": "Postura SOC 2",
  "gov.soc.b": "Cifrado en reposo y en tránsito; acceso con permisos; residencia de datos respetada.",
  "cta.eyebrow": "Cuando la decisión está tomada",
  "cta.h2": "Lleve su empresa al mercado.",
  "cta.body": "Un único proceso confidencial — sourcing, due diligence, negociación y cierre — ejecutado sobre infraestructura institucional, bajo su control en cada puerta.",
  "cta.open": "Abrir el espacio de adquisición",
  "cta.brief": "Solicitar un briefing privado",
  "cta.foot": "Estrictamente confidencial. Anónimo hasta el NDA. Cada acción auditada.",
  "ft.tagline": "Infraestructura institucional de adquisiciones — sourcing, due diligence, negociación y cierre en una sola bolsa.",
  "ft.exchange": "La bolsa",
  "ft.founders": "Para fundadores",
  "ft.acquirers": "Para adquirentes",
  "ft.list": "Listar confidencialmente",
  "ft.valuation": "Valoración y preparación",
  "ft.plans": "Planes para fundadores",
  "ft.browse": "Explorar el mercado",
  "ft.buyeraccess": "Acceso comprador",
  "ft.requestnda": "Solicitar un NDA",
  "ft.soc": "Postura SOC 2",
  "ft.audit": "Pista de auditoría completa",
  "ft.ndagated": "Identidad bajo NDA",
  "ft.legal": "Los datos de mercado de este sitio se indexan desde registros públicos (SEC EDGAR, Wikidata, prensa) y desde un registro curado de mandatos de adquirentes. Las cifras se presentan solo a título informativo y no constituyen asesoramiento de inversión, legal ni fiscal. Las empresas cotizan de forma anónima; la identidad y las finanzas detalladas solo se revelan bajo NDA firmado.",
};

const DICTS: Record<Locale, Dict> = { en, fr, es };

/** Pure translation — the provider's t() delegates here; tests use it directly. */
export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[locale][key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

const STORAGE_KEY = "exitos.locale";

function initialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "fr" || saved === "es") return saved;
  const nav = (window.navigator.language || "en").slice(0, 2).toLowerCase();
  return nav === "fr" ? "fr" : nav === "es" ? "es" : "en";
}

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate; falls back to English, then the key. {x} placeholders interpolate. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({ locale: "en", setLocale: () => undefined, t: (k) => en[k] ?? k });

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch { /* private mode */ }
  }, []);

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string =>
    translate(locale, key, vars), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useI18n = (): I18nCtx => useContext(Ctx);

/** Render a translated string that contains \n line breaks. */
export const tLines = (s: string): React.ReactNode =>
  s.split("\n").map((line, i, arr) => (
    <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
  ));
