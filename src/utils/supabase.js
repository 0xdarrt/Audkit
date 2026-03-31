import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://okginqkraolbcbchekse.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZ2lucWtyYW9sYmNiY2hla3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTIwMzYsImV4cCI6MjA5MDE4ODAzNn0.RQo1o7YRuNlcaNnqJoN3wNkOBfN8qO6X0Vo-62kkyso';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
