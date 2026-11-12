import { createClient } from '@supabase/supabase-js';

let client;

// Server-only client. The service role key never reaches the browser.
export function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi');
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const EXHIBITION_SLUG = process.env.EXHIBITION_SLUG || 'si-pemikir';

export async function currentExhibition() {
  const { data, error } = await db().from('exhibitions').select('*').eq('slug', EXHIBITION_SLUG).single();
  if (error) throw error;
  return data;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyndrome.id').replace(/\/$/, '');
}
