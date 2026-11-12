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

// Kunci server: JWT service_role lama (eyJ...) atau secret key baru (sb_secret_...).
function looksLikeServerKey(k) {
  return !!k && (k.startsWith('eyJ') || k.startsWith('sb_secret_'));
}

// URL dan kunci selalu diambil berpasangan dari sumber yang sama, supaya tidak
// tercampur antarproject. Urutan: isian manual, lalu integrasi Supabase–Vercel.
function credentials() {
  const sources = [
    ['manual', process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['integrasi', process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY]
  ];
  for (const [source, rawUrl, rawKey] of sources) {
    const url = cleanUrl(rawUrl);
    const key = cleanKey(rawKey);
    if (url && looksLikeServerKey(key)) return { source, url, key };
  }
  return null;
}

// Server-only client. The service role key never reaches the browser.
export function db() {
  if (!client) {
    const c = credentials();
    if (!c) throw new Error('Kredensial Supabase tidak lengkap: perlu SUPABASE_URL (https://xxxx.supabase.co) + SUPABASE_SERVICE_ROLE_KEY (eyJ... atau sb_secret_...)');
    // Hanya sumber + host yang dicatat; kunci tidak pernah ditulis ke log.
    console.info(`[db] Supabase via ${c.source}: ${new URL(c.url).host} (kunci ${c.key.startsWith('sb_secret_') ? 'secret' : 'service_role'})`);
    client = createClient(c.url, c.key, {
      auth: { persistSession: false },
      // Next.js menyimpan hasil fetch() di Data Cache Vercel (bertahan antar-deploy).
      // Data tamu/undangan harus selalu segar, jadi setiap query wajib no-store.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }
    });
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
