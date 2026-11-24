import { PLACES } from './places';

// Pencarian dan pengenalan nama kabupaten/kota. Dipakai di browser (saran isian buku tamu)
// dan di server (laporan). Isian bebas tetap sah: tamu dari luar negeri atau nama yang
// tidak ada di daftar ditulis apa adanya.

const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[.,()]/g, ' ').replace(/\s+/g, ' ').trim();

// "Kota Bekasi" -> { type: 'kota', base: 'bekasi' }
const ENTRIES = PLACES.map(([name, province]) => {
  const m = name.match(/^(Kota|Kabupaten)\s+(.*)$/);
  const base = fold(m ? m[2] : name);
  return { name, province, type: m ? m[1].toLowerCase() : '', base, words: base.split(' ') };
});
const BY_NAME = new Map(ENTRIES.map((e) => [fold(e.name), e]));
const BY_BASE = new Map();
for (const e of ENTRIES) BY_BASE.set(e.base, [...(BY_BASE.get(e.base) || []), e]);

// Singkatan dan sebutan sehari-hari yang menunjuk satu kabupaten/kota dengan jelas.
const ALIAS = {
  jaksel: 'Kota Jakarta Selatan', jakpus: 'Kota Jakarta Pusat', jakbar: 'Kota Jakarta Barat',
  jaktim: 'Kota Jakarta Timur', jakut: 'Kota Jakarta Utara', tangsel: 'Kota Tangerang Selatan',
  jogja: 'Kota Yogyakarta', yogya: 'Kota Yogyakarta', jogjakarta: 'Kota Yogyakarta', yogyakarta: 'Kota Yogyakarta',
  solo: 'Kota Surakarta', bsd: 'Kota Tangerang Selatan'
};

// Pisahkan kata jenis wilayah dari kata kunci: "kab bekasi" -> { type: 'kabupaten', q: 'bekasi' }
function parseQuery(raw) {
  let q = fold(raw);
  let type = '';
  const m = q.match(/^(kota|kot|kabupaten|kab|kabu\w*)\b\s*(.*)$/);
  if (m) { type = m[1].startsWith('kab') ? 'kabupaten' : 'kota'; q = m[2]; }
  return { type, q };
}

export function searchPlaces(raw, limit = 8) {
  const { type, q } = parseQuery(raw);
  if (!q && !type) return [];
  const alias = ALIAS[fold(raw)];
  const scored = [];
  for (const e of ENTRIES) {
    if (type && e.type !== type) continue;
    let s = -1;
    if (!q) s = 3;
    else if (e.base === q) s = 0;
    else if (e.base.startsWith(q)) s = 1;
    else if (e.words.some((w) => w.startsWith(q))) s = 2;
    else if (q.length >= 3 && e.base.includes(q)) s = 4;
    if (alias === e.name) s = -1;
    else if (s < 0) continue;
    scored.push([s, e.type === 'kota' ? 0 : 1, e.name.length, e]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3].name.localeCompare(b[3].name));
  return scored.slice(0, limit).map(([, , , e]) => ({ name: e.name, province: e.province }));
}

// Kenali isian (lama maupun baru) sebagai kabupaten/kota resmi bila jelas.
// Hasil: { name, province } bila satu kabupaten/kota; { name: null, province } bila namanya
// menunjuk beberapa wilayah di provinsi yang sama (mis. "Bekasi"); null bila tidak dikenali.
export function resolvePlace(raw) {
  const f = fold(raw);
  if (!f) return null;
  const direct = BY_NAME.get(f) || (ALIAS[f] && BY_NAME.get(fold(ALIAS[f])));
  if (direct) return { name: direct.name, province: direct.province };
  const { type, q } = parseQuery(f);
  let list = BY_BASE.get(q) || [];
  if (type) list = list.filter((e) => e.type === type);
  if (list.length === 1) return { name: list[0].name, province: list[0].province };
  // "Jakarta", "Aceh": belum menunjuk satu wilayah, tetapi semua yang namanya diawali kata itu
  // berada di satu provinsi.
  if (!list.length && q) list = ENTRIES.filter((e) => e.base.startsWith(q + ' ') && (!type || e.type === type));
  const provinces = [...new Set(list.map((e) => e.province))];
  if (provinces.length === 1) return { name: null, province: provinces[0] };
  return null;
}
