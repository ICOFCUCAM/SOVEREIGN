-- 0016 — FUTech university deployment tiers.
update ecosystem_products set tiers='[{"tier":"Core","price":"$80K","scope":"Single college","timeline":"4–8 weeks"},{"tier":"Professional","price":"$220K","scope":"Full university","timeline":"2–4 months"},{"tier":"Enterprise","price":"$600K","scope":"Multi-campus / national","timeline":"4–8 months"}]'::jsonb where slug='futech';
