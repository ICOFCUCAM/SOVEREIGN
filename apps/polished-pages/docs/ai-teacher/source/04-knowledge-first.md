# Source 04 — Knowledge-first, cost-minimised AI Teacher (verbatim)

Adopted by the owner on 28 October 2026 ("go phase 0"). Recorded verbatim; BLUEPRINT.md §12 implements it.

## The owner's message

> I think paying would not be the best part. maybe only when questions are asked by the student in line to the subject taught so that users would not abuse the tunnels and also that. the better way is even to wire it in such a way that when questions are asked, the system ai or teacher draws answer from the books and knowledge base or library to answer. with that there would be no need for api calls from other ai systems

## Forwarded design note: provider dependence and cost

Yes, your concern is valid. We should not design Polished Pages Academic Tutor so that every teaching activity depends on paid OpenAI or Anthropic API calls. If thousands of students use it regularly, uncontrolled API spending could consume your revenue.

But there is an important distinction:
- API keys are credentials that allow your server to access an AI provider.
- API usage is what costs money. Each request may incur charges based on the model, input tokens, output tokens and other services used.
- AI itself does not have to be hosted by OpenAI or Anthropic. You can run suitable open-weight models on infrastructure you control, or use a mixture of hosted and self-hosted models.

The statement from Claude indicates that your current AI Teacher implementation expects an OpenAI key for some functionality and an Anthropic key for other functionality, at least according to the description it gave you. It also says that without the OpenAI key, the tutor falls back to keyword search. We need to inspect the actual code to confirm precisely which functions use which provider.

That keyword-search fallback is not equivalent to a fully functioning AI lecturer: it can find relevant passages, but it cannot reliably replace explanation, adaptive teaching, reasoning and feedback.

### 1. The model I recommend: hybrid AI, not provider dependence

For Polished Pages, I would design three execution paths.

**Path A — No generative AI required** (lowest marginal cost). Search approved passages, retrieve chapter summaries, display saved explanations, run deterministic quizzes, track progress and schedule reviews. Generate reusable teaching materials once and reuse them.

**Path B — Self-hosted open-weight model** (infrastructure cost). Use a suitable model hosted on your own GPU server or a rented GPU service. This avoids per-token bills to OpenAI or Anthropic for those requests, although you still pay for compute, electricity, storage and operations. Tools such as vLLM can serve models through an API-compatible interface.

**Path C — Paid model API** (premium capability). Use a stronger hosted model only when the task justifies it: complex explanations, difficult reasoning, challenging feedback or carefully controlled fallback when the local model cannot handle a task.

The key is that students should use one tutor—not have to know which model answers them. The server chooses the execution path based on the task, quality requirements, availability and budget.

We can also make the architecture provider-independent. For example, vLLM offers an OpenAI-compatible server interface, so the application can communicate with a self-hosted model through a familiar API format without sending requests to OpenAI itself.

However, open-weight models are not automatically equal in teaching quality to stronger hosted models. We must evaluate candidate models on your actual books, terminology rules, citation tasks and assessment examples before selecting one.

### 2. What could thousands of students cost?

Let's use an illustrative scenario—not a prediction of your actual bill. Suppose you have 1,000 students, each making 100 tutor requests per month. That is 100,000 requests per month.

| Average cost per request | Monthly model cost |
|---|---|
| $0.001 | $100 |
| $0.005 | $500 |
| $0.01 | $1,000 |
| $0.03 | $3,000 |

These figures are arithmetic scenarios, not quoted provider prices. Actual API cost depends on the model, prompt length, answer length, caching and retries. Official provider pricing is token-based, and different models have different rates.

Notice the key point: at 100,000 requests, reducing average cost from three cents to half a cent changes monthly model expenditure from $3,000 to $500.

But don't optimize cost by making every answer worse. Instead, reduce unnecessary model calls, keep retrieved context focused, cache reusable material, use smaller models for simpler tasks and reserve expensive models for work that demonstrably benefits from them.

Self-hosting also has a break-even point. A GPU server that is underused can cost more than an API. A well-utilized server serving many students may be more economical. We need to benchmark throughput, latency, concurrency and answer quality before deciding.

### 3. What I would change in the current AI Teacher

Claude's message raises a concern beyond cost: the tutor may currently have a dependency on two providers instead of a properly replaceable model layer. We should verify that before changing anything.

(The forwarded "Provider Independence and Cost Audit" instruction followed; Claude's read-only audit answered it in the session of 28 October 2026.)

### 4. My recommended strategy for you

1. Audit the existing AI Teacher. Establish whether both keys are actually needed and which actions create costs.
2. Separate preparation from teaching. Generate and store chapter-level lessons, summaries and quizzes once per source version where appropriate, rather than regenerating them for every student.
3. Build a model-independent runtime. Provider choice becomes a configuration decision, not something deeply embedded in the application.
4. Benchmark a local model. Test it on real chapters and student questions. Start with a limited pilot before migrating general traffic.
5. Route intelligently. Use stored materials and retrieval whenever sufficient; use a local model for tasks it handles reliably; reserve paid APIs for tasks that justify their cost.
6. Set hard budget limits. An unexpected traffic spike must not create an uncontrolled bill.

One further point: your existing text-embedding-3-small embeddings may themselves depend on the OpenAI API if that is how they are currently generated. We should audit this too. Embeddings can often be computed in batches and reused, or generated with a suitable self-hosted embedding model, provided the index is rebuilt and retrieval quality is tested.

My position is clear: Polished Pages should own the teaching experience and the routing, retrieval, learner records and academic safeguards. It should not be locked into one model provider. We should use paid APIs where they create measurable value, not make every student interaction depend on them by default.

## Forwarded design note: knowledge-first architecture

I agree with the direction you are proposing. In fact, I would make it a central principle of the Polished Pages AI Teacher:

**The teacher should teach from the book and approved knowledge library, not depend on an external AI provider for every student question.**

There is one important technical distinction, however: books and a knowledge base contain information, but they do not automatically interpret questions, construct explanations or adapt teaching. We can eliminate many paid API calls through retrieval and precomputed teaching materials. To generate genuinely new explanations dynamically, we still need either a language model running on your own infrastructure or an external model API.

The good news is that we can design the system to minimize—and potentially eliminate—per-question payments to external AI providers.

### 1. How your AI Teacher should work

Student asks a question (for example: "What does Chapter 3 teach about this concept?")

1. Check scope and course permissions — is the question relevant to the assigned book, chapter or approved course materials?
2. Search the approved knowledge library — chapter headings, full text, keywords, relevant passages and precomputed embeddings.
   - Answer already exists: retrieve a prepared explanation, lesson, example or approved answer.
   - Evidence exists: retrieve relevant source passages and construct an evidence-based response.
3. Validate and present the answer — show source citations, preserve author rules, and acknowledge when the materials do not provide enough evidence.

The key is that the system first tries to answer using existing knowledge. It should not automatically call an expensive model simply because a student submitted a question.

### 2. What can work without external AI calls?

| Capability | Can it work without per-question AI API calls? |
|---|---|
| Search the book and find relevant passages | Yes |
| Display saved chapter summaries and lessons | Yes |
| Retrieve prewritten explanations and examples | Yes |
| Run stored multiple-choice quizzes | Yes |
| Mark multiple-choice answers | Yes |
| Track progress and schedule revision | Yes |
| Show source citations | Yes |
| Answer new questions using extracted passages | Sometimes, through retrieval and templates |
| Explain unfamiliar concepts naturally | Requires a capable local model or external model, unless an appropriate explanation already exists |
| Assess nuanced written answers | Usually benefits from a model or human marking |
| Adapt explanations conversationally | Requires a capable model or carefully designed, prewritten teaching pathways |

This is where I would focus: prepare the teaching materials once, then reuse them for many students.

For example, when you prepare Demonology One, the system can create and store chapter explanations, key terms, question banks, answer keys, examples, misconceptions and revision exercises. Those materials can serve thousands of students without regenerating them for each learner.

The initial preparation may have a cost if an external model is used. Alternatively, it can use a local model. But once the material is stored, serving it does not require another generation call.

### 3. Make the teacher strictly subject-bound

I support your idea that students should not be able to abuse the tutor as a free, unlimited general-purpose AI chatbot. The system should enforce the following rules:
- Course scope: answer questions related to the assigned book, chapter, course objectives and instructor-approved sources.
- Evidence requirement: ground substantive answers in the approved library.
- No evidence, no invented answer: explain when the available materials do not cover the question.
- Source citations: identify the book, chapter, section or page where available.
- Fair usage: limit request frequency, question length and computational work per account.
- No hidden provider fallback: if the configured teaching engine is unavailable, do not silently send the student's question to another paid provider.

A student asking an unrelated question should receive something like:

> I am your tutor for this course. I can help with the assigned readings and approved learning materials, but this question falls outside the subject I am teaching. Please ask me about a concept from the current course.

A student asking a relevant question that the book does not answer should receive a different response:

> I found related material in Chapter 3, but the approved sources do not provide enough information to establish a complete answer. Here are the relevant passages you can review.

These are different situations: one is outside the course; the other is within the course but unsupported by the evidence.

### 4. The architecture I recommend

- **Layer 1 — Academic Knowledge Engine**: your books, private lecture notes, chapters, source passages, summaries, glossary, approved examples, quizzes and answers. Use PostgreSQL full-text search and your existing vector retrieval where appropriate.
- **Layer 2 — Teaching Engine**: determines the student's learning objective, selects an explanation or teaching method, retrieves the evidence, checks the answer and updates learning progress. It should use stored materials and deterministic code first.
- **Layer 3 — Local Intelligence (optional but recommended)**: a self-hosted language model handles new explanations, conversational follow-ups and nuanced feedback when stored material and templates are insufficient. Your server or GPU provider bears the infrastructure cost instead of paying an external API for every answer.

Your existing Supabase and React architecture can remain the foundation. We would only add local inference infrastructure after benchmarking suitable models and estimating actual usage.

One caution: running a local model is not free. You pay for the server or GPU, and a model that is too small may produce weak explanations. The correct goal is not simply "zero API calls"; it is the lowest sustainable cost per student while preserving teaching quality and academic reliability.

### 5. The instruction (summary of the forwarded brief)

Polished Pages AI Teacher — Knowledge-First, Cost-Minimized Architecture. The tutor must teach from the assigned book and approved academic knowledge library. It must not behave as an unrestricted general-purpose chatbot or make a paid external model API call for every student question. Target pipeline: authenticate and verify permissions; check the question is within the assigned subject; retrieve existing approved teaching material; search relevant passages (keyword/full-text and vector as appropriate); determine whether the evidence is sufficient; return an approved answer or a structured, cited response; use deterministic teaching templates for supported tasks; make self-hosted inference an optional, replaceable capability; do not call an external model API automatically when the local engine is unavailable; record source versions, evidence identifiers, usage and errors without unnecessarily retaining sensitive student content. Required behaviour: answer only within the authorized scope; distinguish unsupported from unrelated questions; cite chapter, section, page or passage; never fabricate evidence, quotations or locations; preserve author terminology and interpretive rules; isolate private course materials; explain limitations; enforce request limits and bounded work. Cost requirements: precompute and cache chapter-level lessons, summaries, glossaries, examples, quizzes and approved answers; invalidate by source version; per-user, per-course and institution usage controls.

My recommendation: proceed with the knowledge-first architecture, keep the AI Teacher subject-bound, and postpone the merge until we have verified the implementation and costs.
