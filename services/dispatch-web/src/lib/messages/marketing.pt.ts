import type { MarketingCopy } from "./marketing";

export const MARKETING_PT: MarketingCopy = {
  trust: {
    eyebrow: "Adote com confiança",
    titleA: "Os seus registos. A sua jurisdição.",
    titleB: "A sua saída, garantida.",
    lead: "Comprometer-se com uma plataforma de publicação é uma decisão de soberania. O Sovereign Dispatch foi concebido para que a instituição mantenha o controlo — dos dados, da implantação e da capacidade de se retirar com tudo intacto.",
    ownership: {
      kicker: "Propriedade", title: "Os registos são seus — nós somos o depositário.",
      sub: "A plataforma armazena e governa os seus registos. Nunca os possui, nunca os reaproveita e nunca treina nada com eles.",
      cards: [
        { title: "Os seus dados são seus", body: "Cada documento, versão, artefacto e certificado pertence à sua instituição — não à plataforma." },
        { title: "Isolamento de inquilino", body: "Segurança ao nível da linha com negação por predefinição. Uma reivindicação de inquilino em falta nega; os seus dados nunca são misturados." },
        { title: "Sem uso secundário", body: "Sem mineração, sem perfilagem, sem treino de modelos, sem modelo de negócio de partilha de dados. Nunca." },
        { title: "Todos os acessos auditados", body: "Submissões, decisões, publicações e recuperações são registadas num rasto apenas de adição, carimbado por hash." },
      ],
    },
    continuity: {
      kicker: "Continuidade e Saída", title: "Pode sair a qualquer momento — com tudo.",
      sub: "O sinal de confiança mais forte que uma plataforma pode oferecer é uma saída limpa. Não há aprisionamento de que se tenha de escapar à força.",
      cards: [
        { title: "Sem formatos proprietários", body: "Registos estruturados, artefactos PDF / DOCX / Markdown padrão e um armazenamento PostgreSQL padrão. Nada fica preso." },
        { title: "Exportação completa sob pedido", body: "Exporte registos, versões, artefactos e os certificados de governança + preservação sempre que quiser." },
        { title: "Implantação relocalizável", body: "A mesma plataforma corre gerida, na sua nuvem, nas suas instalações ou isolada da rede — mova o seu património sem reimplantar." },
        { title: "Se o fornecedor desaparecesse", body: "Mantém todos os registos, artefactos e certificados em formatos abertos e pode executar ou migrar a plataforma por si próprio. A continuidade não depende de nós." },
      ],
    },
    accountability: {
      kicker: "Responsabilização", title: "Uma linha clara de responsabilidade.",
      sub: "As equipas de aquisições e de risco precisam de saber exatamente quem é responsável por quê. Não há ambiguidade.",
      securesLabel: "A plataforma assegura",
      secures: ["Isolamento de inquilino e controlo de acesso", "Encriptação em repouso e em trânsito", "Integridade de auditoria apenas de adição", "Integridade de preservação (provas SHA-256)", "Aplicação de governança — o motor não pode ser contornado", "Disponibilidade e recuperação do serviço"],
      controlsLabel: "A sua instituição controla",
      controls: ["Quem detém cada autoridade de governança", "Cadeias de aprovação, quóruns e políticas", "Classificação e habilitação dos registos", "Horizontes de retenção", "Quem detém credenciais e os respetivos âmbitos", "Modelo de implantação e residência dos dados"],
    },
    evidence: {
      kicker: "Evidência", title: "Comprovável, não prometido.",
      sub: "A confiança na adoção deve assentar no que pode ser verificado durante a avaliação — e não em afirmações de marketing.",
      ctaProcurement: "Dossiê de aquisições", ctaEvidence: "Evidência e capacidades",
    },
  },
  platform: {
    overview: {
      kicker: "Visão geral", title: "A informação torna-se o registo oficial.",
      sub: "O Dispatch é a camada institucional entre um rascunho e um documento publicado. Cada artefacto — informação executiva, dossiê de conselho, submissão regulatória — é submetido como dados estruturados, governado através de aprovação, renderizado num PDF/DOCX fiel e publicado com um rasto de proveniência permanente e auditável.",
      cards: [
        { title: "Não é um processador de texto", body: "Os documentos são dados estruturados (DDM), validados e estruturados por tipo — não ficheiros de forma livre. O formato é o contrato." },
        { title: "Governado, não apenas gerado", body: "Submeter → Aprovar → Renderizar → Publicar. Nada chega ao registo sem cumprir a sua política de aprovação." },
        { title: "Soberano por construção", body: "Isolado por inquilino, ciente de residência, auditoria apenas de adição. Construído para instituições que não podem falhar." },
      ],
    },
    capabilities: {
      kicker: "Capacidades", title: "Um pipeline, todos os documentos oficiais.",
      sub: "Modelos e validação por tipo de documento; renderização determinística e classificada por faixa para resultado de qualidade de impressão.",
      cards: [
        { title: "Tipos de documento", body: "Informações executivas, relatórios de conselho, documentos de política, submissões regulatórias, pacotes operacionais e registos oficiais — cada um com a sua própria estrutura exigida." },
        { title: "Renderização multiformato", body: "PDF fiel (motor headless), DOCX e Markdown a partir de uma única fonte validada — faixas, números de página, anexos, assinaturas." },
        { title: "Validado por esquema", body: "Cada submissão é verificada face ao esquema DDM e à política do tipo de documento antes de poder renderizar — sem registos malformados." },
        { title: "Modelos e estruturas", body: "Os papéis de secção e as políticas de bloco cientes do tipo impõem completude para que o resultado seja consistente em toda a instituição." },
        { title: "Versionado e imutável", body: "Cada versão é preservada; os artefactos publicados são carimbados por hash e nunca alterados em silêncio." },
        { title: "Assíncrono em escala", body: "Uma via de renderização suportada por fila absorve picos e pacotes grandes sem bloquear os submissores." },
      ],
    },
    workflow: {
      kicker: "Fluxo de trabalho", title: "Submeter → Governar → Aprovar → Renderizar → Publicar → Recuperar.",
      sub: "O ciclo de vida completo de um documento oficial, imposto pela plataforma.",
      steps: [
        { t: "Submeter", b: "Carga DDM estruturada, validada à entrada." },
        { t: "Governar", b: "Classificação + política de aprovação resolvidas." },
        { t: "Aprovar", b: "Validação N-eyes; as vias de serviço aprovam automaticamente." },
        { t: "Renderizar", b: "PDF/DOCX fiel produzido na fila." },
        { t: "Publicar", b: "Lançado para o registo; proveniência selada." },
        { t: "Recuperar", b: "Descarregamento de artefacto assinado e com acesso controlado." },
      ],
    },
    integrations: {
      kicker: "Integrações", title: "Uma API sobre a qual outros constroem.",
      sub: "O Dispatch fornece acesso de API com âmbito definido por consumidor e aceita documentos através de uma superfície REST estável.",
      apiTitle: "Fornecimento de API",
      apiBody: "Cada sistema obtém o seu próprio cliente de serviço — um client_id + segredo com âmbitos explícitos (validar · renderizar · ler). Emita, defina o âmbito e revogue por consumidor.",
      estateTitle: "Construído para o património",
      estateBody: "Os consumidores submetem os seus dados e o Dispatch devolve o registo oficial — com retornos de chamada por webhook na renderização e na publicação.",
      estateItems: ["Veritas — pacotes operacionais e financeiros", "ExitOS — memorandos de conselho e documentos de transação", "A sua instituição — através da mesma superfície REST"],
    },
  },
  standard: {
    eyebrow: "Definição de categoria",
    title: "O Padrão Sovereign Dispatch",
    lead: "Uma instituição não adota uma ferramenta de publicação. Adota um padrão para a forma como os registos oficiais passam a existir, são provados e são preservados. Estes são os conceitos que esse padrão define.",
    sectionKicker: "O Padrão",
    sectionTitle: "Seis conceitos institucionais.",
    sectionSub: "Cada um é um bloco de construção do padrão operacional para registos institucionais — não uma funcionalidade, uma definição.",
    defs: [
      { term: "Registo Oficial", one: "Um documento institucional de registo governado, versionado e classificado.", def: "Não é um ficheiro. Um ato oficial, criado sob uma política de governança imposta, conduzido através de um ciclo de vida imutável — Criado → Governado → Aprovado → Publicado → Preservado — com uma identidade permanente e comprovável.", props: ["Número de registo estável", "Classificação e habilitação", "Versões imutáveis", "Uma única forma canónica"] },
      { term: "Política de Governança", one: "A regra executável para como uma classe de registos é governada.", def: "Uma política nomeada e versionada, vinculada a um tipo de registo: uma cadeia ordenada de autoridades, quórum por etapa, a autoridade de publicação, retenção e expiração. A política não descreve o fluxo de trabalho — controla-o.", props: ["Cadeia de aprovação ordenada", "Quórum por etapa", "Autoridade de publicação", "Versionada e imposta"] },
      { term: "Autoridade de Publicação", one: "A autoridade nomeada habilitada a lançar um registo de registo.", def: "A publicação não é um botão que qualquer pessoa possa premir. Está reservada a um papel de governança específico, validado no momento do lançamento — e um aprovador de um registo nunca pode ser o seu publicador.", props: ["Vinculada a papel", "Validada na publicação", "Separação de funções"] },
      { term: "Certificado de Governança", one: "Prova criptográfica de que uma publicação cumpriu a sua política.", def: "Selado na publicação: a política e a sua versão, a cadeia exigida face a quem efetivamente a cumpriu por ordem, as delegações usadas, a autoridade de publicação e uma prova de integridade — um veredicto COMPLIANT que pode ser verificado de forma independente.", props: ["Cadeia exigida vs. efetiva", "Sequência de aprovação ordenada", "Prova de integridade", "Veredicto de conformidade"] },
      { term: "Certificado de Preservação", one: "Prova à prova de adulteração de que um registo está selado permanentemente.", def: "Emitido quando um registo é arquivado: um carimbo temporal de preservação e uma prova de integridade SHA-256 sobre o registo canónico. O estado arquivado é terminal — nenhuma edição, retirada ou republicação é possível.", props: ["Prova de integridade SHA-256", "Carimbo temporal de preservação", "Terminal e imutável"] },
      { term: "Cadeia de Evidência", one: "O rasto ininterrupto e apenas de adição da criação à preservação.", def: "Cada ato — submissão, cada decisão, o cumprimento da política, publicação e preservação — registado num rasto imutável e carimbado por hash. A instituição consegue provar não apenas o que um registo diz, mas exatamente como passou a existir.", props: ["Apenas de adição", "Carimbado por hash", "Criação → preservação", "Auditável de forma independente"] },
    ],
    closeTitleA: "Quando uma categoria emerge,",
    closeTitleB: "o padrão importa mais do que as funcionalidades.",
    closeBody: "O Sovereign Dispatch não é uma melhor forma de publicar documentos. É o padrão operacional para registos institucionais — e uma instituição que adota o padrão adota uma forma de governar que sobrevive a qualquer sistema isolado.",
    ctaArtifacts: "Ver os artefactos", ctaPath: "Encontre o seu caminho",
  },
};
