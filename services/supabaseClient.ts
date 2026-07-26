import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jstxgbafcbnbzuxufhpd.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_g6-9RZtpwESP8IB2Ug8XZQ_KDp1TfZf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
