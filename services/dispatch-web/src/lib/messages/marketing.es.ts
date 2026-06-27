import type { MarketingCopy } from "./marketing";

export const MARKETING_ES: MarketingCopy = {
  trust: {
    eyebrow: "Adopte con confianza",
    titleA: "Sus registros. Su jurisdicción.",
    titleB: "Su salida, garantizada.",
    lead: "Comprometerse con una plataforma de publicación es una decisión de soberanía. Sovereign Dispatch está construido para que la institución mantenga el control: de los datos, del despliegue y de la capacidad de marcharse con todo intacto.",
    ownership: {
      kicker: "Propiedad", title: "Usted es dueño de sus registros; nosotros somos el custodio.",
      sub: "La plataforma almacena y gobierna sus registros. Nunca es dueña de ellos, nunca los reutiliza para otros fines y nunca entrena nada con ellos.",
      cards: [
        { title: "Sus datos son suyos", body: "Cada documento, versión, artefacto y certificado pertenece a su institución, no a la plataforma." },
        { title: "Aislamiento de inquilinos", body: "Seguridad a nivel de fila con denegación por defecto. Una reclamación de inquilino ausente deniega; sus datos nunca se mezclan con los de otros." },
        { title: "Sin uso secundario", body: "Sin minería de datos, sin perfilado, sin entrenamiento de modelos, sin un modelo de negocio basado en compartir datos. Jamás." },
        { title: "Cada acceso auditado", body: "Envíos, decisiones, publicaciones y recuperaciones quedan registrados en un rastro de solo anexión sellado con hash." },
      ],
    },
    continuity: {
      kicker: "Continuidad y salida", title: "Puede marcharse en cualquier momento, con todo.",
      sub: "La señal de confianza más sólida que una plataforma puede ofrecer es una salida limpia. No hay dependencia tecnológica de la que deba ingeniarse para escapar.",
      cards: [
        { title: "Sin formatos propietarios", body: "Registros estructurados, artefactos estándar en PDF / DOCX / Markdown y un almacén estándar en PostgreSQL. Nada queda atrapado." },
        { title: "Exportación completa cuando lo desee", body: "Exporte registros, versiones, artefactos y los certificados de gobernanza y preservación cuando usted elija." },
        { title: "Despliegue reubicable", body: "La misma plataforma se ejecuta gestionada, en su nube, en sus instalaciones o aislada de la red: traslade su patrimonio sin cambiar de plataforma." },
        { title: "Si el proveedor desapareciera", body: "Usted conserva cada registro, artefacto y certificado en formatos abiertos y puede ejecutar o migrar la plataforma por sí mismo. La continuidad no depende de nosotros." },
      ],
    },
    accountability: {
      kicker: "Responsabilidad", title: "Una línea clara de responsabilidad.",
      sub: "Los equipos de compras y de riesgos necesitan saber exactamente quién es responsable de qué. No hay ambigüedad.",
      securesLabel: "La plataforma asegura",
      secures: ["Aislamiento de inquilinos y control de acceso", "Cifrado en reposo y en tránsito", "Integridad de auditoría de solo anexión", "Integridad de preservación (pruebas SHA-256)", "Aplicación de la gobernanza: el motor no puede eludirse", "Disponibilidad y recuperación del servicio"],
      controlsLabel: "Su institución controla",
      controls: ["Quién ostenta cada autoridad de gobernanza", "Cadenas de aprobación, quórums y políticas", "Clasificación y habilitación de los registros", "Horizontes de retención", "Quién posee las credenciales y sus alcances", "Modelo de despliegue y residencia de datos"],
    },
    evidence: {
      kicker: "Evidencia", title: "Demostrable, no prometido.",
      sub: "La confianza en la adopción debe basarse en lo que puede verificarse durante la evaluación, no en afirmaciones de marketing.",
      ctaProcurement: "Dosier de compras", ctaEvidence: "Evidencia y capacidades",
    },
  },
  platform: {
    overview: {
      kicker: "Visión general", title: "La información se convierte en el registro oficial.",
      sub: "Dispatch es la capa institucional entre un borrador y un documento publicado. Cada artefacto (informe, dosier para el consejo, presentación regulatoria) se envía como datos estructurados, se gobierna mediante aprobación, se renderiza a un PDF/DOCX fiel y se publica con un rastro de procedencia permanente y auditable.",
      cards: [
        { title: "No es un procesador de textos", body: "Los documentos son datos estructurados (DDM), validados y estructurados por tipo, no archivos de formato libre. El formato es el contrato." },
        { title: "Gobernado, no solo generado", body: "Enviar → Aprobar → Renderizar → Publicar. Nada llega al registro sin superar su política de aprobación." },
        { title: "Soberano por construcción", body: "Aislado por inquilino, consciente de la residencia, auditoría de solo anexión. Construido para instituciones que no pueden fallar." },
      ],
    },
    capabilities: {
      kicker: "Capacidades", title: "Una sola canalización, todos los documentos oficiales.",
      sub: "Plantillas y validación por tipo de documento; renderizado determinista, por bandas de clasificación, a una salida de calidad de imprenta.",
      cards: [
        { title: "Tipos de documento", body: "Informes ejecutivos, informes para el consejo, documentos de política, presentaciones regulatorias, paquetes operativos y registros oficiales: cada uno con su propia estructura requerida." },
        { title: "Renderizado multiformato", body: "PDF fiel (motor sin interfaz), DOCX y Markdown a partir de una única fuente validada: encabezados, números de página, apéndices, firmas." },
        { title: "Validado por esquema", body: "Cada envío se comprueba contra el esquema DDM y la política del tipo de documento antes de poder renderizarse: ningún registro malformado." },
        { title: "Plantillas y estructuras", body: "Los roles de sección y las políticas de bloque según el tipo imponen la integridad para que la salida sea coherente en toda la institución." },
        { title: "Versionado e inmutable", body: "Cada versión se preserva; los artefactos publicados se sellan con hash y nunca se alteran de forma silenciosa." },
        { title: "Asíncrono a escala", body: "Un carril de renderizado respaldado por cola absorbe los picos y los paquetes grandes sin bloquear a quienes envían." },
      ],
    },
    workflow: {
      kicker: "Flujo de trabajo", title: "Enviar → Gobernar → Aprobar → Renderizar → Publicar → Recuperar.",
      sub: "El ciclo de vida completo de un documento oficial, impuesto por la plataforma.",
      steps: [
        { t: "Enviar", b: "Carga DDM estructurada, validada en la entrada." },
        { t: "Gobernar", b: "Clasificación y política de aprobación resueltas." },
        { t: "Aprobar", b: "Visto bueno N-eyes; los carriles de servicio se autoaprueban." },
        { t: "Renderizar", b: "PDF/DOCX fiel producido en la cola." },
        { t: "Publicar", b: "Liberado al registro; procedencia sellada." },
        { t: "Recuperar", b: "Descarga de artefactos firmada y con control de acceso." },
      ],
    },
    integrations: {
      kicker: "Integraciones", title: "Una API sobre la que otros construyen.",
      sub: "Dispatch aprovisiona acceso a la API con alcances por consumidor y acepta documentos a través de una superficie REST estable.",
      apiTitle: "Aprovisionamiento de API",
      apiBody: "Cada sistema obtiene su propio cliente de servicio: un client_id + secreto con alcances explícitos (validar · renderizar · leer). Emita, asigne alcances y revoque por consumidor.",
      estateTitle: "Construido para el patrimonio",
      estateBody: "Los consumidores envían sus datos y Dispatch devuelve el registro oficial, con llamadas de retorno por webhook al renderizar y al publicar.",
      estateItems: ["Veritas — paquetes operativos y financieros", "ExitOS — memorandos del consejo y documentos de transacción", "Su institución — sobre la misma superficie REST"],
    },
  },
  standard: {
    eyebrow: "Definición de categoría",
    title: "El Estándar Sovereign Dispatch",
    lead: "Una institución no adopta una herramienta de publicación. Adopta un estándar sobre cómo los registros oficiales llegan a existir, se demuestran y se preservan. Estos son los conceptos que ese estándar define.",
    sectionKicker: "El Estándar",
    sectionTitle: "Seis conceptos institucionales.",
    sectionSub: "Cada uno es un componente básico del estándar operativo para los registros institucionales: no una funcionalidad, una definición.",
    defs: [
      { term: "Registro Oficial", one: "Un documento institucional de registro gobernado, versionado y clasificado.", def: "No es un archivo. Es un acto oficial, creado bajo una política de gobernanza impuesta, llevado a través de un ciclo de vida inmutable — Creado → Gobernado → Aprobado → Publicado → Preservado — con una identidad permanente y demostrable.", props: ["Número de registro estable", "Clasificación y habilitación", "Versiones inmutables", "Una única forma canónica"] },
      { term: "Política de Gobernanza", one: "La regla ejecutable sobre cómo se gobierna una clase de registros.", def: "Una política nombrada y versionada vinculada a un tipo de registro: una cadena ordenada de autoridades, quórum por paso, la autoridad de publicación, la retención y la caducidad. La política no describe el flujo de trabajo: lo controla.", props: ["Cadena de aprobación ordenada", "Quórum por paso", "Autoridad de publicación", "Versionada e impuesta"] },
      { term: "Autoridad de Publicación", one: "La autoridad nombrada facultada para liberar un registro de registro.", def: "La publicación no es un botón que cualquiera pueda pulsar. Está reservada a un rol de gobernanza específico, validado en el momento de la liberación, y quien aprueba un registro nunca puede ser su publicador.", props: ["Vinculada a un rol", "Validada en la publicación", "Separación de funciones"] },
      { term: "Certificado de Gobernanza", one: "Prueba criptográfica de que una publicación cumplió su política.", def: "Sellado en la publicación: la política y su versión, la cadena requerida frente a quién la satisfizo realmente y en orden, las delegaciones utilizadas, la autoridad de publicación y una prueba de integridad: un veredicto COMPLIANT que puede verificarse de forma independiente.", props: ["Cadena requerida vs. real", "Secuencia de aprobación ordenada", "Prueba de integridad", "Veredicto de cumplimiento"] },
      { term: "Certificado de Preservación", one: "Prueba a prueba de manipulaciones de que un registro está sellado de forma permanente.", def: "Emitido cuando un registro se archiva: una marca de tiempo de preservación y una prueba de integridad SHA-256 sobre el registro canónico. El estado archivado es terminal: no es posible ninguna edición, retirada ni republicación.", props: ["Prueba de integridad SHA-256", "Marca de tiempo de preservación", "Terminal e inmutable"] },
      { term: "Cadena de Evidencia", one: "El rastro ininterrumpido, de solo anexión, desde la creación hasta la preservación.", def: "Cada acto — el envío, cada decisión, el cumplimiento de la política, la publicación y la preservación — registrado en un rastro inmutable y sellado con hash. La institución puede demostrar no solo lo que un registro dice, sino exactamente cómo llegó a existir.", props: ["Solo anexión", "Sellado con hash", "Creación → preservación", "Auditable de forma independiente"] },
    ],
    closeTitleA: "Cuando emerge una categoría,",
    closeTitleB: "el estándar importa más que las funcionalidades.",
    closeBody: "Sovereign Dispatch no es una mejor manera de publicar documentos. Es el estándar operativo para los registros institucionales, y una institución que adopta el estándar adopta una forma de gobernar que perdura más allá de cualquier sistema.",
    ctaArtifacts: "Ver los artefactos", ctaPath: "Encuentre su camino",
  },
};
