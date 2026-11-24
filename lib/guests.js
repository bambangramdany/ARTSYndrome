export const GUEST_FILTERS = ['Semua', 'Undangan', 'Walk-in', 'Seniman', 'Penikmat seni', 'Baru mulai mengenal seni', 'Media / jurnalis', 'Izin undangan'];

export function filterGuests(rows, f, q) {
  let out = rows;
  if (f === 'Undangan' || f === 'Walk-in') out = out.filter((g) => g.path === f);
  else if (f === 'Izin undangan') out = out.filter((g) => g.consent);
  else if (f && f !== 'Semua') out = out.filter((g) => (g.roles || []).includes(f));
  if (q) {
    const s = q.toLowerCase();
    out = out.filter((g) => [g.name, g.email, g.city, g.instagram, g.whatsapp].some((v) => v && String(v).toLowerCase().includes(s)));
  }
  return out;
}

// Tanggal isi buku tamu menurut WIB (YYYY-MM-DD).
export function jakartaDate(ts) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(ts));
}

// Tamu yang mengisi selama masa pameran (starts_on s.d. ends_on, WIB). Data uji sebelum
// pameran dan isian setelah pameran selesai tidak ikut.
export function inPeriod(g, ex) {
  const d = jakartaDate(g.created_at);
  if (ex.starts_on && d < ex.starts_on) return false;
  if (ex.ends_on && d > ex.ends_on) return false;
  return true;
}

// Folder tamu di admin: ?ex=<slug> memilih pameran, ?w=semua menampilkan juga isian di luar masa pameran.
export async function resolveGuestFolder(searchParams, { allExhibitions, currentExhibition }) {
  const list = await allExhibitions();
  const want = typeof searchParams.get === 'function' ? searchParams.get('ex') : searchParams.ex;
  const ex = (want && list.find((e) => e.slug === want)) || await currentExhibition();
  const w = (typeof searchParams.get === 'function' ? searchParams.get('w') : searchParams.w) === 'semua' ? 'semua' : 'periode';
  return { list, ex, w };
}
