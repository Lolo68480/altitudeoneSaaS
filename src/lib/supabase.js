import { createClient } from '@supabase/supabase-js';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dzgrocygycpsuajqcrwv.supabase.co';
const SUPA_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Z3JvY3lneWNwc3VhanFjcnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTU2MzgsImV4cCI6MjA5NjgzMTYzOH0.Z7DF_NMToIjsSpzZyqQ4U_vtO7ek5xwkoL30nRMiMAg';

export const db = createClient(SUPA_URL, SUPA_KEY);
