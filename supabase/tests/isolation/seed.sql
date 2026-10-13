-- founder A owns lst-a; buyer B made an offer / NDA request / deal on it; stranger C is unrelated
insert into public.exitos_listings (id, data, owner_account_id) values
 ('lst-a', '{"id":"lst-a","code":"Project Atlas","listedAt":"t","profile":{"name":"Acme Secret Co"},"publicView":{"sector":"AI","region":"North America","revenueUsd":37400000,"growthPct":0.43,"ebitdaMarginPct":0.2,"disclosed":true}}', '00000000-0000-0000-0000-00000000000a'),
 ('lst-demo-helios', '{"id":"lst-demo-helios","code":"Project Cipher","listedAt":"t","publicView":{"sector":"Logistics","region":"North America","revenueUsd":18000000,"growthPct":0.3,"ebitdaMarginPct":0.1}}', null),
 ('lst-sov-x', '{"id":"lst-sov-x","code":"X","listedAt":"t","publicView":{"sector":"AI","region":"North America","revenueUsd":0,"growthPct":0,"ebitdaMarginPct":0,"disclosed":false}}', 'admin');
insert into public.exitos_offers values ('o1','lst-a','00000000-0000-0000-0000-00000000000b','{"amountUsd":50000000}');
insert into public.exitos_nda_requests values ('n1','lst-a','00000000-0000-0000-0000-00000000000b','{"status":"requested"}');
insert into public.exitos_deals values ('d1','lst-a','00000000-0000-0000-0000-00000000000b','{}');
insert into public.exitos_documents values ('doc-pub','lst-a','{"visibility":"public"}'),('doc-nda','lst-a','{"visibility":"post_nda"}'),('doc-own','lst-a','{"visibility":"founder"}');
insert into public.exitos_deal_events values ('e1','00000000-0000-0000-0000-00000000000b','lst-a','{}');
