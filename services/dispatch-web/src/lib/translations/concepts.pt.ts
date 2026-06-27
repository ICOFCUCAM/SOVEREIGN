// Traduções reais em português (pt) das páginas de conceitos (Layer 3). Uma versão por idioma —
// sem tradução automática em tempo de execução. Apenas os slugs aqui presentes são servidos em
// /pt/learn/<slug>; tudo o resto permanece em inglês até ser traduzido, para que o hreflang se
// mantenha verdadeiro. A estrutura comum (diagrama, ligações relacionadas) provém da base inglesa
// em problems.ts; estes são os campos de texto localizados.
import type { Problem } from "../problems";

export type ConceptTranslation = Pick<Problem,
  "term" | "kicker" | "headline" | "lead" | "definition" | "why" | "how" | "faqs" | "metaTitle" | "metaDescription">;

export const CONCEPTS_PT: Record<string, ConceptTranslation> = {
  "official-publication": {
    term: "Publicação oficial",
    kicker: "Conceito",
    headline: "O que é uma publicação oficial — e o que a torna oficial.",
    lead: "Qualquer pessoa pode publicar um documento. Uma publicação oficial é diferente: é emitida sob a autoridade de uma instituição e pode ser comprovada como genuína durante todo o tempo em que importa.",
    definition: "Uma publicação oficial é um documento emitido sob a autoridade de uma instituição — e não de um indivíduo — através de um processo de aprovação governado, e tornado permanentemente verificável, de modo que qualquer pessoa possa confirmar que se trata da versão genuína e em vigor.",
    why: [
      "Um PDF enviado por correio eletrónico dentro de uma organização parece idêntico quer seja a versão final aprovada quer um rascunho inicial. Nada no ficheiro prova qual delas é.",
      "Quando uma publicação é contestada anos mais tarde — em tribunal, numa auditoria, pelo público —, a instituição tem de conseguir provar quem a aprovou, por que ordem e que o ficheiro não foi alterado desde então.",
      "A maioria das instituições não consegue prová-lo. A aprovação viveu em mensagens de correio eletrónico e reuniões; o ficheiro publicado é apenas uma cópia, sem ligação duradoura à autoridade que o emitiu.",
    ],
    how: [
      { t: "Emitida por um cargo, não por uma pessoa", d: "O Sovereign Dispatch vincula cada publicação à autoridade de um cargo, pelo que esta permanece válida mesmo quando a pessoa que a assinou já saiu." },
      { t: "Governada antes de ser publicada", d: "Antes de o documento ser divulgado, corre uma cadeia de aprovação vinculativa — a versão oficial é aquela que concluiu a governação, e nenhuma outra se pode fazer passar por oficial." },
      { t: "Permanentemente verificável", d: "Cada publicação leva um identificador de registo permanente e uma prova de integridade, pelo que qualquer pessoa pode confirmar que é genuína e inalterada — sem conta." },
    ],
    faqs: [
      { q: "Qual é a diferença entre um documento e uma publicação oficial?", a: "Um documento é apenas um ficheiro. Uma publicação oficial é emitida sob a autoridade de uma instituição através de um processo governado e é permanentemente verificável — pode provar-se quem a emitiu e que não foi alterada." },
      { q: "Como se prova que uma publicação é oficial?", a: "Verificando o seu identificador de registo permanente e a sua prova de integridade contra o registo da instituição emissora. O Sovereign Dispatch permite que qualquer pessoa o faça sem conta." },
      { q: "Uma assinatura ou um timbre tornam uma publicação oficial?", a: "Não. Uma assinatura ou um timbre podem ser copiados. É a autoridade vinculada a um cargo, em conjunto com uma prova de integridade verificável, que torna uma publicação comprovadamente oficial." },
    ],
    metaTitle: "O que é uma publicação oficial? Definição e prova",
    metaDescription: "Uma publicação oficial é um documento emitido sob a autoridade de uma instituição, através de um processo governado, e permanentemente verificável. Saiba o que a torna oficial.",
  },
  "evidence-chain": {
    term: "Cadeia de prova",
    kicker: "Integridade",
    headline: "Uma cadeia de prova que existe antes de alguém a pedir.",
    lead: "Uma cadeia de prova é o registo ininterrupto de como um documento foi aprovado e emitido — captado à medida que aconteceu, para que seja fiável no momento em que é necessário.",
    definition: "Uma cadeia de prova é um registo completo, ordenado e à prova de adulteração de cada passo da aprovação e publicação de um documento — quem agiu, quando e sobre que versão —, captado enquanto o documento é elaborado, em vez de reconstruído à posteriori.",
    why: [
      "Quando uma publicação é posta em causa, o valor da prova depende inteiramente de quando foi criada. A prova reunida após a contestação é frágil e contestável.",
      "A maioria das organizações só constrói o rasto quando um auditor ou um tribunal o exige — juntando mensagens de correio eletrónico, aprovações e versões sob pressão de tempo, com lacunas.",
      "Uma cadeia de prova registada de forma contínua, por ordem e selada contra alterações é a diferença entre provar a autoridade e meramente afirmá-la.",
    ],
    how: [
      { t: "Captada à medida que acontece", d: "Cada passo de aprovação é registado no momento em que ocorre, por ordem — nunca reconstruído mais tarde." },
      { t: "À prova de adulteração", d: "A cadeia é selada com provas de integridade, pelo que qualquer alteração posterior é detetável; o registo ou se verifica intacto ou não se verifica de todo." },
      { t: "Pronta sob solicitação", d: "Como a cadeia já existe, responder a uma auditoria ou a uma contestação jurídica é uma consulta, não uma reconstrução." },
    ],
    faqs: [
      { q: "O que é uma cadeia de prova?", a: "Um registo completo, ordenado e à prova de adulteração de como um documento foi aprovado e emitido — quem agiu, quando e sobre que versão —, captado à medida que aconteceu." },
      { q: "Por que razão importa o momento em que a prova é criada?", a: "A prova criada à medida que os acontecimentos ocorrem é muito mais robusta do que a prova reunida após uma contestação, que é propensa a lacunas e a disputas." },
      { q: "Como se mantém uma cadeia de prova à prova de adulteração?", a: "Selando cada passo com provas de integridade criptográficas, de modo que qualquer alteração posterior seja detetável na verificação." },
    ],
    metaTitle: "O que é uma cadeia de prova? Definição e importância do momento",
    metaDescription: "Uma cadeia de prova é o registo completo, ordenado e à prova de adulteração da aprovação e emissão de um documento, captado no momento. Saiba por que o momento conta.",
  },
  "document-authenticity": {
    term: "Autenticidade documental",
    kicker: "Integridade",
    headline: "Uma autenticidade documental que se prova, não apenas se afirma.",
    lead: "A autenticidade documental é a propriedade de ser comprovadamente genuíno — o documento verdadeiro, emitido por quem afirma, inalterado desde então. A maioria dos documentos limita-se a afirmá-la.",
    definition: "A autenticidade documental é a propriedade verificável de que um documento é genuíno: emitido pela autoridade indicada e inalterado desde a publicação, comprovável por qualquer pessoa em vez de meramente afirmado pela aparência.",
    why: [
      "Timbres, assinaturas e selos podem todos ser copiados. A aparência não é prova — uma falsificação convincente é exatamente igual ao original.",
      "Quando a autenticidade de um documento mais importa — uma certidão, uma licença, uma decisão —, o destinatário muitas vezes não tem forma independente de confirmar que é genuíno.",
      "Uma autenticidade que depende de telefonar ao emissor para verificar não é escalável e falha precisamente quando o emissor é mais difícil de contactar.",
    ],
    how: [
      { t: "Vinculada ao cargo emissor", d: "Cada publicação é emitida sob uma autoridade nomeada, pelo que a sua origem faz parte do registo e não é uma inferência a partir de um timbre." },
      { t: "Prova de integridade por documento", d: "Uma prova criptográfica liga o ficheiro exato ao seu registo; alterar um único byte quebra a verificação." },
      { t: "Verificável por qualquer pessoa", d: "Um identificador de registo permanente permite a qualquer destinatário confirmar a autenticidade de forma independente — sem conta e sem telefonar ao emissor." },
    ],
    faqs: [
      { q: "O que é a autenticidade documental?", a: "A propriedade verificável de que um documento é genuíno — emitido pela autoridade indicada e inalterado desde a publicação —, comprovável por qualquer pessoa e não meramente afirmada." },
      { q: "Por que razão uma assinatura ou um selo não bastam?", a: "Assinaturas e selos podem ser copiados. A autenticidade real exige uma prova de integridade verificável, vinculada à autoridade emissora." },
      { q: "Como posso verificar se um documento é autêntico?", a: "Verificando o seu identificador de registo permanente e a sua prova de integridade contra o registo do emissor. O Sovereign Dispatch permite que qualquer pessoa o faça sem conta." },
    ],
    metaTitle: "Autenticidade documental — provar que um documento é genuíno",
    metaDescription: "A autenticidade documental é a propriedade verificável de ser genuíno e inalterado. Saiba por que assinaturas e selos não bastam e como provar a autenticidade.",
  },
  "document-verification": {
    term: "Verificação de documentos",
    kicker: "Verificação",
    headline: "Uma verificação de documentos que qualquer pessoa pode fazer, sem conta.",
    lead: "A verificação de documentos consiste em confirmar que um documento é genuíno e inalterado. A melhor verificação não exige acesso especial — qualquer pessoa a pode fazer.",
    definition: "A verificação de documentos é o processo de confirmar que um documento é genuíno e inalterado — idealmente conferindo um identificador permanente e uma prova de integridade contra o registo do emissor, de forma independente e sem acesso privilegiado.",
    why: [
      "Uma verificação que exija telefonar ao emissor ou iniciar sessão num portal falha as pessoas que dela mais precisam — destinatários, o público, outras instituições.",
      "Se a verificação for difícil, não acontece, e as falsificações circulam sem serem contestadas.",
      "A confiança só é escalável quando qualquer pessoa que detenha um documento o pode confirmar por si própria, em segundos, contra a fonte da verdade.",
    ],
    how: [
      { t: "Identificador de registo permanente", d: "Cada publicação leva um identificador que remete para o seu registo de referência na instituição emissora." },
      { t: "Verificação de integridade do ficheiro exato", d: "A verificação confirma que o ficheiro específico corresponde, byte a byte, à versão emitida; qualquer alteração é detetada." },
      { t: "Aberta a todos", d: "Qualquer pessoa pode verificar um registo sem conta, pelo que a confiança não depende de acesso privilegiado." },
    ],
    faqs: [
      { q: "O que é a verificação de documentos?", a: "Confirmar que um documento é genuíno e inalterado, idealmente conferindo um identificador permanente e uma prova de integridade contra o registo do emissor." },
      { q: "Preciso de uma conta para verificar um documento?", a: "Com o Sovereign Dispatch, não. A verificação está aberta a qualquer pessoa, para que a confiança não dependa de acesso privilegiado." },
      { q: "O que verifica realmente a verificação?", a: "Que o documento corresponde a um registo genuíno emitido e que o ficheiro exato está inalterado desde a publicação." },
    ],
    metaTitle: "Verificação de documentos — confirmar a autenticidade, sem conta",
    metaDescription: "A verificação de documentos confirma que um documento é genuíno e inalterado, através de um identificador de registo permanente e uma prova de integridade — sem conta.",
  },
};
