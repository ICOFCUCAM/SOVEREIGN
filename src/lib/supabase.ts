import { createClient } from '@supabase/supabase-js';


// Initialize database client (Supabase project: SOVEREIGN)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://qvjdivcdefuprnenedje.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };