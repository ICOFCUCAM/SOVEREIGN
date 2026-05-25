-- SOVEREIGN migration 0009 — ecosystem image storage
-- Applied to Supabase project qvjdivcdefuprnenedje.
-- Public 'ecosystem' Storage bucket for system cover images. Public read;
-- authenticated (admin) may upload/replace/remove. Wired to the ecosystem
-- editor's image uploader; image_url then drives the cinematic cards.
INSERT INTO storage.buckets (id, name, public) VALUES ('ecosystem', 'ecosystem', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "ecosystem objects read" ON storage.objects FOR SELECT USING (bucket_id = 'ecosystem');
CREATE POLICY "ecosystem objects insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ecosystem');
CREATE POLICY "ecosystem objects update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ecosystem') WITH CHECK (bucket_id = 'ecosystem');
CREATE POLICY "ecosystem objects delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ecosystem');
