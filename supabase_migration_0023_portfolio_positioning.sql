-- Architecture alignment correction.
--
-- Public proposition: each flagship is presented as an independent
-- sovereign infrastructure. No subordination, no required hierarchy,
-- no "layer" framing in marketplace metrics. Internal composition
-- patterns are reserved for the gated /infrastructure/architecture
-- surface and for technical / investor material.
--
-- This migration:
--   1. Removes the "Layer" metric from every flagship row
--      (the marketplace must not telegraph stack position).
--   2. Rewrites taglines and descriptions where copy implied that
--      one flagship composes or governs another.
--
-- Touches only ecosystem_products. No schema change.

-- 1. Strip the "Layer" metric from every flagship.
update public.ecosystem_products
   set metrics = coalesce(
        (
          select jsonb_agg(elem)
            from jsonb_array_elements(metrics) as elem
           where lower(coalesce(elem->>'label','')) <> 'layer'
        ),
        '[]'::jsonb
      )
 where metrics is not null
   and metrics @? '$[*] ? (@.label == "Layer")';

-- 2. Reposition Veritas OS — independent knowledge infrastructure.
update public.ecosystem_products
   set tagline = 'Knowledge and organizational intelligence infrastructure — organisational memory, institutional knowledge, search, reference and knowledge governance for institutions at any scale.'
 where slug = 'veritas-os';

-- 3. Reposition Civicos — sovereign operating infrastructure on its own
--    merits. Remove "composes the other six infrastructures" framing.
update public.ecosystem_products
   set tagline = 'Sovereign operating infrastructure — a deployable national runtime for ministries, agencies, councils and public administration.'
 where slug = 'civicos';

-- 4. Reposition Sovereign Dispatch — independent publication infrastructure.
update public.ecosystem_products
   set tagline = 'Institutional publication infrastructure — PDF, DOCX, PPTX, briefing packages, board reports and regulatory submissions rendered with chain-of-custody preserved.',
       description = 'Sovereign Dispatch is institutional publication infrastructure. PDF, DOCX and PPTX rendering for board reports, policy documents, regulatory submissions and briefing packages — every artifact carrying chain-of-custody through one defensible audit log.'
 where slug = 'sovereign-dispatch';
