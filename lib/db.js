import { createClient } from '@supabase/supabase-js';

let client;

// Rapikan nilai env yang ditempel manual: spasi, tanda kutip, tanpa https://,
// atau ikut tersalin /rest/v1. Kembalikan null bila tetap bukan URL Supabase.
function cleanUrl(raw) {
  if (!raw) return null;
  let v = String(raw).trim().replace(/^['"]|['"]$/g, '').trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  try {
    const u = new URL(v);
    if (!u.hostname.includes('.')) return null;
    return u.origin;
  } catch {
    return null;
  }
}

function cleanKey(raw) {
  if (!raw) return null;
  const v = String(raw).trim().replace(/^['"]|['"]$/g, '').trim();
  return v || null;
}

// Server-only client. The service role key never reaches the browser.
// Urutan: nilai yang diisi manual dulu, lalu nilai dari integrasi Supabase–Vercel.
export function db() {
  if (!client) {
    const url = cleanUrl(process.env.SUPABASE_URL) || cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const key = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY) || cleanKey(process.env.SUPABASE_SECRET_KEY);
    if (!url) throw new Error('SUPABASE_URL kosong atau bukan URL (format: https://xxxx.supabase.co)');
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY belum diisi');
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const EXHIBITION_SLUG = (process.env.EXHIBITION_SLUG || '').trim() || 'si-pemikir';

export async function currentExhibition() {
  const { data, error } = await db().from('exhibitions').select('*').eq('slug', EXHIBITION_SLUG).single();
  if (error) throw error;
  return data;
}

export function siteUrl() {
  return ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() || 'https://artsyndrome.id').replace(/\/$/, '');
}
