import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://csmkvcjpuadxifqksjwy.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImQ0MTMyZjVhLWUxZDMtNDczNy05YzNjLTc5NzBkYmRkNjYxZiJ9.eyJwcm9qZWN0SWQiOiJjc21rdmNqcHVhZHhpZnFrc2p3eSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc5NTc2NDc5LCJleHAiOjIwOTQ5MzY0NzksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.TQNERfYIfrTL0w8L7LcFnT4i_qXm4EXCPh3DIgo-TEU';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };