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

// Pameran aktif untuk admin dan QR /bukutamu. Bila env EXHIBITION_SLUG diisi, itu yang dipakai.
// Bila kosong, dipilih otomatis dari tanggal (Asia/Jakarta), termasuk pameran tersembunyi
// (published = false), supaya QR yang sudah tercetak ikut pindah ke pameran yang sedang berjalan
// tanpa deploy ulang:
//   1. pameran yang sedang berjalan (mulai paling akhir menang bila ada yang tumpang tindih),
//   2. pameran yang mulai dalam 7 hari ke depan (paling dekat),
//   3. pameran terakhir yang sudah selesai.
export const EXHIBITION_SLUG = (process.env.EXHIBITION_SLUG || '').trim() || null;

function jakartaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

function plusDays(d, n) {
  const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

export function pickActiveExhibition(rows, today = jakartaToday()) {
  const byStartDesc = (a, b) => String(b.starts_on || '').localeCompare(String(a.starts_on || ''));
  const ongoing = rows.filter((e) => (!e.starts_on || e.starts_on <= today) && (!e.ends_on || e.ends_on >= today)).sort(byStartDesc);
  if (ongoing.length) return ongoing[0];
  const soon = rows.filter((e) => e.starts_on && e.starts_on > today && e.starts_on <= plusDays(today, 7)).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  if (soon.length) return soon[0];
  const past = rows.filter((e) => e.ends_on && e.ends_on < today).sort((a, b) => b.ends_on.localeCompare(a.ends_on));
  return past[0] || rows[0] || null;
}

export async function currentExhibition() {
  if (EXHIBITION_SLUG) {
    const { data, error } = await db().from('exhibitions').select('*').eq('slug', EXHIBITION_SLUG).single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await db().from('exhibitions').select('*');
  if (error) throw error;
  const ex = pickActiveExhibition(data || []);
  if (!ex) throw new Error('Belum ada pameran di tabel exhibitions.');
  return ex;
}

// Semua pameran (termasuk yang tersembunyi), terbaru dulu. Untuk pilihan "folder" di admin.
export async function allExhibitions() {
  const { data, error } = await db().from('exhibitions').select('*').order('starts_on', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export function siteUrl() {
  return ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() || 'https://artsyndrome.id').replace(/\/$/, '');
}
