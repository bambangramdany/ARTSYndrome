// Normalise Indonesian phone numbers to 62xxxxxxxxxx so the same person matches across forms.
export function normalizePhone(input) {
  if (!input) return null;
  let d = String(input).replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d.length >= 9 ? d : null;
}

export function displayPhone(p) {
  if (!p) return '';
  return p.startsWith('62') ? '0' + p.slice(2) : p;
}

export function clean(v, max = 200) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().slice(0, max);
  return s || null;
}

export function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function fmtTime(ts) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date(ts));
}

export function fmtRange(start, end) {
  if (!start) return '';
  const f = (d, o) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...o }).format(new Date(d + 'T00:00:00+07:00'));
  if (!end) return f(start, { day: 'numeric', month: 'long', year: 'numeric' });
  return `${f(start, { day: 'numeric' })} – ${f(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export const ROLES = ['Seniman', 'Penikmat seni', 'Baru mulai mengenal seni', 'Media / jurnalis', 'Kurator / galeri', 'Kolektor', 'Mahasiswa seni'];
export const SOURCES = ['Instagram', 'Teman atau rekan', 'Senimannya langsung', 'Media atau berita', 'Lewat di depan galeri', 'Lainnya'];
export const COVERAGE = ['Tulisan', 'Foto', 'Video', 'Wawancara seniman'];

export function fmtDate(d) {
  if (!d) return '';
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d + 'T00:00:00+07:00'));
}
