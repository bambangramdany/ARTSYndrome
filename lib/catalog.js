import { db } from './db';

// Data publik ARTSYndrome: pameran dan seniman. Semua query toleran bila tabel/kolom
// baru belum dibuat (mengembalikan data kosong, bukan error).

export function todayJakarta() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

function addDays(d, n) {
  const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

// 'ongoing' | 'upcoming' | 'past'
export function statusOf(ex, today = todayJakarta()) {
  if (ex.starts_on && today < ex.starts_on) return 'upcoming';
  if (ex.ends_on && today > ex.ends_on) return 'past';
  return 'ongoing';
}

export const STATUS_LABEL = { ongoing: 'Sedang berlangsung', upcoming: 'Akan datang', past: 'Sudah selesai' };

// Buku tamu dibuka 7 hari sebelum pameran (untuk uji tim) sampai 1 hari setelah selesai.
export function guestbookOpen(ex, today = todayJakarta()) {
  if (ex.starts_on && today < addDays(ex.starts_on, -7)) return false;
  if (ex.ends_on && today > addDays(ex.ends_on, 1)) return false;
  return true;
}

export function paragraphs(text) {
  return String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

async function attachArtists(rows) {
  const ids = [...new Set(rows.map((r) => r.artist_id).filter(Boolean))];
  if (!ids.length) return rows.map((r) => ({ ...r, artistRow: null }));
  const { data } = await db().from('artists').select('*').in('id', ids);
  const map = Object.fromEntries((data || []).map((a) => [a.id, a]));
  return rows.map((r) => ({ ...r, artistRow: map[r.artist_id] || null }));
}

export async function listExhibitions() {
  const { data } = await db().from('exhibitions').select('*').order('starts_on', { ascending: false });
  const rows = (data || []).filter((e) => e.published !== false);
  const today = todayJakarta();
  return (await attachArtists(rows)).map((e) => ({ ...e, status: statusOf(e, today) }));
}

export async function getExhibition(slug) {
  const { data } = await db().from('exhibitions').select('*').eq('slug', slug).maybeSingle();
  if (!data || data.published === false) return null;
  const [ex] = await attachArtists([data]);
  return { ...ex, status: statusOf(ex) };
}

export async function listArtists() {
  const { data, error } = await db().from('artists').select('*').eq('published', true).order('sort_order').order('name');
  if (error) return [];
  return data || [];
}

export async function getArtist(slug) {
  const { data, error } = await db().from('artists').select('*').eq('slug', slug).maybeSingle();
  if (error || !data || data.published === false) return null;
  return data;
}

export async function listPress({ exhibitionId, limit } = {}) {
  let q = db().from('press_links').select('id,url,title,outlet,published_on,excerpt,image_url,exhibition_id,exhibitions(slug,title)').eq('hidden', false)
    .order('published_on', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  if (exhibitionId) q = q.eq('exhibition_id', exhibitionId);
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) return [];
  return data || [];
}
