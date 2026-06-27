// Traducciones reales al español para las páginas de conceptos (capa 3). Una versión
// por idioma — no traducción automática en tiempo de petición. Solo los slugs presentes
// aquí se exponen en /es/learn/<slug>; el resto permanece únicamente en inglés hasta su
// traducción, de modo que hreflang siga siendo veraz. La estructura compartida (diagrama,
// enlaces relacionados) procede de la base en inglés de problems.ts; estos son los campos
// de texto localizados.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_ES: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Publicación oficial",
    kicker: "Concepto",
    headline: "Qué es una publicación oficial — y qué la hace oficial.",
    lead: "Cualquiera puede publicar un documento. Una publicación oficial es distinta: se emite bajo la autoridad de una institución y puede demostrarse auténtica durante todo el tiempo que importe.",
    definition: "Una publicación oficial es un documento emitido bajo la autoridad de una institución — no de un individuo — mediante un proceso de aprobación gobernado, y hecho verificable de forma permanente para que cualquiera pueda confirmar que es la versión auténtica y vigente.",
    why: [
      "Un PDF que circula por correo dentro de una organización parece idéntico tanto si es la versión final aprobada como si es un borrador inicial. Nada en el archivo demuestra cuál es.",
      "Cuando una publicación se impugna años después — ante un tribunal, en una auditoría, por la ciudadanía — la institución debe poder demostrar quién la aprobó, en qué orden, y que el archivo no ha cambiado desde entonces.",
      "La mayoría de las instituciones no pueden demostrarlo: la aprobación vivía en correos y reuniones, y el archivo publicado es solo una copia sin vínculo duradero con la autoridad que lo emitió.",
    ],
    how: [
      { t: "Emitida por una oficina, no por una persona", d: "Sovereign Dispatch vincula cada publicación a la autoridad de una oficina, de modo que sigue siendo válida cuando la persona que la firmó ha dejado el cargo." },
      { t: "Gobernada antes de publicarse", d: "Una cadena de aprobación obligatoria se ejecuta antes de difundir el documento: la versión oficial es la que completó la gobernanza, y ninguna otra puede hacerse pasar por oficial." },
      { t: "Verificable de forma permanente", d: "Cada publicación lleva un identificador de registro permanente y una prueba de integridad, de modo que cualquiera puede confirmar que es auténtica e inalterada — sin necesidad de cuenta." },
    ],
    faqs: [
      { q: "¿Cuál es la diferencia entre un documento y una publicación oficial?", a: "Un documento es solo un archivo. Una publicación oficial se emite bajo la autoridad de una institución mediante un proceso gobernado y es verificable de forma permanente: puede demostrarse quién la emitió y que no ha cambiado." },
      { q: "¿Cómo se demuestra que una publicación es oficial?", a: "Verificando su identificador de registro permanente y su prueba de integridad frente al registro de la institución emisora. Sovereign Dispatch permite a cualquiera hacerlo sin necesidad de cuenta." },
      { q: "¿Una firma o un membrete hacen oficial una publicación?", a: "No. Una firma o un membrete pueden copiarse. Es la autoridad vinculada a una oficina, junto con una prueba de integridad verificable, lo que hace que una publicación sea demostrablemente oficial." },
    ],
    metaTitle: "¿Qué es una publicación oficial? Definición y prueba",
    metaDescription: "Una publicación oficial es un documento emitido bajo la autoridad de una institución, gobernado antes de su difusión y verificable de forma permanente. Comprenda qué la hace oficial.",
  },
  "evidence-chain": {
    term: "Cadena de evidencias",
    kicker: "Integridad",
    headline: "Una cadena de evidencias que existe antes de que alguien la pida.",
    lead: "Una cadena de evidencias es el registro ininterrumpido de cómo se aprobó y emitió un documento — capturado a medida que ocurre, para poder confiar en él cuando se necesite.",
    definition: "Una cadena de evidencias es un registro completo, ordenado e inviolable de cada paso en la aprobación y publicación de un documento — quién actuó, cuándo y sobre qué versión — capturado en el momento en que se crea el documento, en lugar de reconstruirse después.",
    why: [
      "Cuando una publicación se cuestiona, el valor de la prueba depende por completo del momento en que se creó. Una evidencia reunida después de la impugnación es débil y discutible.",
      "La mayoría de las organizaciones solo construyen el rastro cuando un auditor o un tribunal lo exige — recopilando correos, aprobaciones y versiones a contrarreloj, con lagunas.",
      "Una cadena de evidencias registrada de forma continua, en orden y sellada contra cualquier cambio marca la diferencia entre demostrar la autoridad y simplemente afirmarla.",
    ],
    how: [
      { t: "Capturada a medida que ocurre", d: "Cada paso de aprobación se registra en el momento en que sucede, en orden — nunca se reconstruye después." },
      { t: "Inviolable", d: "La cadena se sella con pruebas de integridad, de modo que cualquier cambio posterior es detectable; el registro se verifica intacto o no se verifica." },
      { t: "Lista cuando se necesita", d: "Como la cadena ya existe, responder a una auditoría o a una impugnación legal es una cuestión de consulta, no de reconstrucción." },
    ],
    faqs: [
      { q: "¿Qué es una cadena de evidencias?", a: "Un registro completo, ordenado e inviolable de cómo se aprobó y emitió un documento — quién actuó, cuándo y sobre qué versión — capturado a medida que ocurre." },
      { q: "¿Por qué importa el momento de la evidencia?", a: "Una evidencia creada a medida que ocurren los hechos es mucho más sólida que una reunida tras una impugnación, propensa a lagunas y disputas." },
      { q: "¿Cómo se mantiene inviolable una cadena de evidencias?", a: "Sellando cada paso con pruebas de integridad criptográficas, de modo que cualquier alteración posterior sea detectable en la verificación." },
    ],
    metaTitle: "¿Qué es una cadena de evidencias? Definición",
    metaDescription: "Una cadena de evidencias es el registro completo, ordenado e inviolable de la aprobación y emisión de un documento, capturado a medida que ocurre. Por qué importa el momento.",
  },
  "document-authenticity": {
    term: "Autenticidad documental",
    kicker: "Integridad",
    headline: "Una autenticidad documental que se demuestra, no que se afirma.",
    lead: "La autenticidad documental es la propiedad de ser demostrablemente auténtico — el documento real, emitido por quien dice serlo, inalterado desde entonces. La mayoría de los documentos solo lo afirman.",
    definition: "La autenticidad documental es la propiedad verificable de que un documento es auténtico: emitido por la autoridad que se atribuye e inalterado desde su publicación, demostrable por cualquiera en lugar de meramente afirmado por su apariencia.",
    why: [
      "Membretes, firmas y sellos pueden copiarse todos. La apariencia no es prueba — una falsificación convincente luce exactamente como el original.",
      "Cuando la autenticidad de un documento más importa — un certificado, una licencia, una resolución — el destinatario a menudo no tiene forma independiente de confirmar que es auténtico.",
      "Una autenticidad que depende de llamar al emisor para comprobarla no escala y se viene abajo precisamente cuando el emisor es más difícil de localizar.",
    ],
    how: [
      { t: "Vinculada a la oficina emisora", d: "Cada publicación se emite bajo una autoridad nombrada, de modo que su origen forma parte del registro y no se infiere de un membrete." },
      { t: "Prueba de integridad por documento", d: "Una prueba criptográfica liga el archivo exacto a su registro; alterar un solo byte rompe la verificación." },
      { t: "Cualquiera puede verificar", d: "Un identificador de registro permanente permite a cualquier destinatario confirmar la autenticidad de forma independiente — sin cuenta y sin llamar al emisor." },
    ],
    faqs: [
      { q: "¿Qué es la autenticidad documental?", a: "La propiedad verificable de que un documento es auténtico — emitido por la autoridad que se atribuye e inalterado desde su publicación — demostrable por cualquiera, no solo afirmada." },
      { q: "¿Por qué no basta con una firma o un sello?", a: "Firmas y sellos pueden copiarse. La autenticidad real requiere una prueba de integridad verificable ligada a la autoridad emisora." },
      { q: "¿Cómo puedo verificar que un documento es auténtico?", a: "Verifique su identificador de registro permanente y su prueba de integridad frente al registro del emisor. Sovereign Dispatch permite a cualquiera hacerlo sin cuenta." },
    ],
    metaTitle: "Autenticidad documental — Demostrar que un documento es auténtico",
    metaDescription: "La autenticidad documental es la propiedad verificable de ser auténtico e inalterado. Por qué firmas y sellos no bastan y cómo demostrarla.",
  },
  "document-verification": {
    term: "Verificación de documentos",
    kicker: "Verificación",
    headline: "Una verificación de documentos al alcance de todos, sin cuenta.",
    lead: "La verificación de documentos consiste en confirmar que un documento es auténtico e inalterado. La mejor verificación no requiere acceso especial — cualquiera puede realizarla.",
    definition: "La verificación de documentos es el proceso de confirmar que un documento es auténtico e inalterado — idealmente comprobando un identificador permanente y una prueba de integridad frente al registro del emisor, de forma independiente y sin acceso privilegiado.",
    why: [
      "Una verificación que exige llamar al emisor o iniciar sesión en un portal falla precisamente a quienes más la necesitan — destinatarios, ciudadanía, otras instituciones.",
      "Si la verificación es difícil, no se hace, y las falsificaciones circulan sin ser cuestionadas.",
      "La confianza solo escala cuando cualquiera que tenga un documento puede confirmarlo por sí mismo, en segundos, frente a la fuente de verdad.",
    ],
    how: [
      { t: "Identificador de registro permanente", d: "Cada publicación lleva un identificador que remite a su registro autorizado en la institución emisora." },
      { t: "Comprobación de integridad del archivo exacto", d: "La verificación confirma que el archivo concreto es, byte a byte, la versión emitida; cualquier cambio se detecta." },
      { t: "Abierta a todos", d: "Cualquiera puede verificar un registro sin cuenta, de modo que la confianza no depende de un acceso privilegiado." },
    ],
    faqs: [
      { q: "¿Qué es la verificación de documentos?", a: "Confirmar que un documento es auténtico e inalterado, idealmente comprobando un identificador permanente y una prueba de integridad frente al registro del emisor." },
      { q: "¿Necesito una cuenta para verificar un documento?", a: "Con Sovereign Dispatch, no. La verificación está abierta a todos, de modo que la confianza no depende de un acceso privilegiado." },
      { q: "¿Qué comprueba realmente la verificación?", a: "Que el documento corresponde a un registro emitido auténtico y que el archivo exacto está inalterado desde su publicación." },
    ],
    metaTitle: "Verificación de documentos — Confirmar autenticidad, sin cuenta",
    metaDescription: "La verificación de documentos confirma que un documento es auténtico e inalterado mediante un identificador permanente y una prueba de integridad — de forma independiente, sin cuenta.",
  },
};
