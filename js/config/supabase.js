// Supabase configuration
// Use environment variables in production, fallback to development values
const SUPABASE_URL = window.SUPABASE_URL || 'https://eytsgqtachrqlkngdtam.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5dHNncXRhY2hycWxrbmdkdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NzE0MzQsImV4cCI6MjA2OTI0NzQzNH0.SqDRmZROFv8nTf5HygzJBcanVQPON0mUnGx7Q06d7_8';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY }; 